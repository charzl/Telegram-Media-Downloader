const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser, context;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await context?.close(); context = null; });

// Seed the same durable checkpoint a previous browser session would leave.
const seedTask = async ({ native = true, complete = false } = {}) => {
  window.testUrl = 'https://web.telegram.org/k/stream/' + encodeURIComponent(JSON.stringify({
    dcId: 2, location: { _: 'inputDocumentFileLocation', id: '1234', file_reference: 'old-reference' },
    fileName: 'movie.mp4', size: 9,
  }));
  const fileHandle = native ? await (await navigator.storage.getDirectory()).getFileHandle('original.mp4', { create: true }) : undefined;
  await new Promise((resolve, reject) => {
    const request = indexedDB.open('tel-media-downloader-resume', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('tasks', { keyPath: 'id' });
      request.result.createObjectStore('chunks', { keyPath: ['id', 'offset'] });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['tasks', 'chunks'], 'readwrite');
      tx.objectStore('tasks').put({ id: 'progress1', key: JSON.stringify(['video', 2, 'inputDocumentFileLocation', '1234', '']),
        url: testUrl, kind: 'video', fileName: 'movie.mp4', offset: complete ? 9 : 6, total: 9,
        mime: 'video/mp4', validator: null, fileHandle });
      for (const [offset, text] of [[0, 'abc'], [3, 'def'], ...(complete ? [[6, 'ghi']] : [])]) {
        tx.objectStore('chunks').put({ id: 'progress1', offset, data: new TextEncoder().encode(text) });
      }
      tx.onabort = () => reject(tx.error);
      tx.oncomplete = () => { db.close(); resolve(); };
    };
  });
};
const restoredPage = async options => {
  context = await browser.newContext();
  return openPage(browser, '', '/k/', { context, beforeScript: `(${seedTask.toString()})(${JSON.stringify(options || {})})` });
};
const cache = page => page.evaluate(() => new Promise(resolve => {
  const request = indexedDB.open('tel-media-downloader-resume', 1);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(['tasks', 'chunks']);
    const task = tx.objectStore('tasks').get('progress1');
    const chunks = tx.objectStore('chunks').getAll();
    tx.oncomplete = () => { db.close(); resolve({ offset: task.result?.offset,
      chunks: chunks.result.map(chunk => chunk.offset) }); };
  };
}));

test('resume shows local reconstruction progress, source verification, and waiting for the next bytes', async () => {
  const page = await restoredPage();
  await page.evaluate(() => {
    window.pickerCalls = 0;
    showSaveFilePicker = () => { pickerCalls++; throw new Error('Must reuse original file'); };
    const write = FileSystemWritableFileStream.prototype.write;
    let writes = 0;
    FileSystemWritableFileStream.prototype.write = async function (...args) {
      if (++writes === 2) await new Promise(resolve => { window.releaseWrite = resolve; });
      return write.apply(this, args);
    };
    fetch = (url, options) => {
      requests.push(options.headers.Range);
      return new Promise(resolve => {
        if (requests.length === 1) window.releaseProbe = () => resolve(response('video/mp4', 'bytes 3-5/9', 'def'));
        else window.releaseTail = () => resolve(response('video/mp4', 'bytes 6-8/9', 'ghi'));
      });
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await page.waitForFunction(() => typeof releaseWrite === 'function');
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'restoring');
  assert.equal(await page.locator('.progress').getAttribute('aria-valuenow'), '50');
  assert.equal(await page.locator('.progress p').textContent(), 'Restoring saved data · 50%');
  assert.match(await page.locator('.tel-task-details').textContent(), /3 B \/ 6 B processed/);
  assert.equal(await page.evaluate(() => requests.length), 0);
  await page.evaluate(() => releaseWrite());
  await page.waitForFunction(() => typeof releaseProbe === 'function');
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'verifying');
  assert.match(await page.locator('.tel-task-details').textContent(), /30 seconds/);
  await page.evaluate(() => releaseProbe());
  await page.waitForFunction(() => typeof releaseTail === 'function');
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'waiting');
  await page.evaluate(() => releaseTail());
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.deepEqual(await page.evaluate(async () => ({ pickerCalls, requests, errors,
    body: await (await (await (await navigator.storage.getDirectory()).getFileHandle('original.mp4')).getFile()).text() })),
  { pickerCalls: 0, requests: ['bytes=3-5', 'bytes=6-4194309'], errors: [], body: 'abcdefghi' });
});

test('disk export of a fully cached file also displays local save progress', async () => {
  const page = await restoredPage({ native: false, complete: true });
  await page.evaluate(() => {
    const write = FileSystemWritableFileStream.prototype.write;
    let writes = 0;
    FileSystemWritableFileStream.prototype.write = async function (...args) {
      if (++writes === 2) await new Promise(resolve => { window.releaseWrite = resolve; });
      return write.apply(this, args);
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await page.waitForFunction(() => typeof releaseWrite === 'function');
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'saving');
  assert.equal(await page.locator('.progress').getAttribute('aria-valuenow'), '33');
  assert.equal(await page.locator('.progress p').textContent(), 'Saving · 33%');
  assert.match(await page.locator('.tel-task-details').textContent(), /3 B \/ 9 B processed/);
  await page.evaluate(() => releaseWrite());
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'handedOff');
  assert.deepEqual(await page.evaluate(async () => ({ body: await blobs[0].text(), requests, errors })),
    { body: 'abcdefghi', requests: [], errors: [] });
});

test('resume uses a refreshed mounted URL only when its document identity matches', async () => {
  const page = await restoredPage();
  await page.evaluate(() => {
    const other = document.createElement('video');
    other.src = testUrl.replace('1234', '9999').replace('old-reference', 'unrelated');
    document.body.appendChild(other);
    const current = document.createElement('video');
    current.src = testUrl.replace('old-reference', 'new-reference');
    document.body.appendChild(current);
    fetch = async (url, options) => {
      requests.push(url);
      if (!url.includes('new-reference')) throw new TypeError('Expired reference');
      return options.headers.Range === 'bytes=3-5'
        ? response('video/mp4', 'bytes 3-5/9', 'def') : response('video/mp4', 'bytes 6-8/9', 'ghi');
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.equal(await page.evaluate(() => requests.length), 2);
  assert.equal(await page.evaluate(() => requests.every(url => url.includes('new-reference'))), true);
});

test('start-over discards the checkpoint, fetches byte zero, and reuses the remembered destination', async () => {
  const page = await restoredPage();
  await page.evaluate(() => {
    window.pickerCalls = 0;
    showSaveFilePicker = () => { pickerCalls++; throw new Error('Unexpected picker'); };
    fetch = async (url, options) => {
      requests.push(options.headers.Range);
      return response('video/mp4', null, '123456789', 200);
    };
    document.querySelector('[data-action="restart"]').click();
  });
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.deepEqual(await page.evaluate(async () => ({ pickerCalls, requests, errors,
    body: await (await (await (await navigator.storage.getDirectory()).getFileHandle('original.mp4')).getFile()).text() })),
  { pickerCalls: 0, requests: ['bytes=0-4194303'], errors: [], body: '123456789' });
  assert.deepEqual(await cache(page), { offset: undefined, chunks: [] });
});

test('a denied start-over permission request leaves saved parts intact', async () => {
  const page = await restoredPage();
  await page.evaluate(() => {
    FileSystemHandle.prototype.queryPermission = async () => 'prompt';
    FileSystemHandle.prototype.requestPermission = async () => 'denied';
    document.querySelector('[data-action="restart"]').click();
  });
  await page.waitForFunction(() => !document.querySelector('.tel-task-error').hidden);
  assert.deepEqual(await cache(page), { offset: 6, chunks: [0, 3] });
  assert.equal(await page.evaluate(() => requests.length), 0);
});

test('start-over cannot delete a checkpoint owned by another tab', async () => {
  const page = await restoredPage();
  await page.evaluate(() => {
    window.owner = navigator.locks.request('tel-media-download:progress1', () => new Promise(resolve => {
      window.releaseOwner = resolve;
    }));
  });
  await page.waitForFunction(() => typeof releaseOwner === 'function');
  await page.locator('[data-action="restart"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.match(await page.locator('.tel-task-error').textContent(), /another tab/);
  assert.deepEqual(await cache(page), { offset: 6, chunks: [0, 3] });
  assert.equal(await page.evaluate(() => requests.length), 0);
  await page.evaluate(async () => { releaseOwner(); await owner; });
});
