const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser;
let context;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await context?.close(); context = null; });

const inspectCache = page => page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('tel-media-downloader-resume', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const read = store => new Promise(resolve => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
  });
  const tasks = await read('tasks');
  const chunks = await read('chunks');
  db.close();
  return { offsets: tasks.map(task => task.offset), chunks: chunks.map(chunk => ({ offset: chunk.offset,
    size: chunk.data?.byteLength ?? chunk.blob.size })) };
});

const interruptedDownload = async page => {
  await page.evaluate(async () => {
    fetch = async (url, options) => {
      requests.push(options.headers.Range);
      if (requests.length === 1) return response('video/mp4', 'bytes 0-2/9', 'abc');
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode('d'));
      } }), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-5/9' } });
    };
    window.done = downloads.video('https://test.invalid/movie.mp4');
  });
  await page.waitForFunction(() => requests.length === 2);
};

const finishResumedDownload = async page => {
  await page.evaluate(() => {
    fetch = async (url, options) => {
      const range = options.headers.Range;
      requests.push(range);
      if (range === 'bytes=0-2') return response('video/mp4', 'bytes 0-2/9', 'abc');
      if (range.startsWith('bytes=3-')) return response('video/mp4', 'bytes 3-5/9', 'def');
      if (range.startsWith('bytes=6-')) return response('video/mp4', 'bytes 6-8/9', 'ghi');
      throw new Error('Unexpected range: ' + range);
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await page.waitForFunction(() => ['handedOff', 'failed'].includes(document.querySelector('.tel-task').dataset.state));
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'handedOff',
    await page.locator('.tel-task-error').textContent());
};

test('a new page restores only committed chunks and resumes without duplicating a partial response', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  assert.deepEqual(await inspectCache(first), { offsets: [3], chunks: [{ offset: 0, size: 3 }] });
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  assert.equal(await second.locator('.tel-task').getAttribute('data-state'), 'paused');
  assert.match(await second.locator('.tel-task-details').textContent(), /3 B \/ 9 B/);
  assert.deepEqual(await second.evaluate(() => requests), []);
  await finishResumedDownload(second);
  assert.deepEqual(await second.evaluate(async () => ({ body: await blobs[0].text(), requests, errors })), {
    body: 'abcdefghi', requests: ['bytes=0-2', 'bytes=3-4194306', 'bytes=6-4194309'], errors: [],
  });
  assert.deepEqual(await inspectCache(second), { offsets: [], chunks: [] });
});

test('a changed media response cannot be appended to cached bytes', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(() => {
    fetch = async () => { requests.push('probe'); return response('video/mp4', 'bytes 0-2/9', 'XYZ'); };
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.deepEqual(await second.evaluate(() => ({ requests, saved: saved.length })), { requests: ['probe'], saved: 0 });
  assert.match(await second.locator('.tel-task-error').textContent(), /media changed/);
  assert.deepEqual(await inspectCache(second), { offsets: [3], chunks: [{ offset: 0, size: 3 }] });
});

test('storage failure does not advance the checkpoint and retry rebuilds the complete file', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  const failed = await page.evaluate(async () => {
    window.originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === 'chunks' && value.offset === 3) throw new DOMException('Cache full', 'QuotaExceededError');
      return originalPut.call(this, value, ...args);
    };
    fetch = async (url, options) => options.headers.Range.startsWith('bytes=0-')
      ? response('video/mp4', 'bytes 0-2/9', 'abc') : response('video/mp4', 'bytes 3-5/9', 'def');
    return await downloads.video('https://test.invalid/movie.mp4');
  });
  assert.equal(failed.state, 'failed');
  assert.equal(failed.received, 3);
  assert.match(await page.locator('.tel-task-error').textContent(), /Cannot save resume data/);
  assert.deepEqual(await inspectCache(page), { offsets: [3], chunks: [{ offset: 0, size: 3 }] });
  await page.evaluate(() => { IDBObjectStore.prototype.put = originalPut; });
  await finishResumedDownload(page);
  assert.equal(await page.evaluate(() => blobs[0].text()), 'abcdefghi');
});

test('another tab cannot resume or delete an active download', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  const second = await openPage(browser, '', '/k/', { context });
  await second.locator('[data-action="retry"]').click();
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.match(await second.locator('.tel-task-error').textContent(), /another tab/);
  // Await the asynchronous handler, not just dispatching its click. Otherwise
  // the first tab could close before the delete attempt checks its lock.
  await second.evaluate(() => document.querySelector('[data-action="dismiss"]').onclick());
  assert.equal(await second.locator('.tel-task').count(), 1);
  assert.deepEqual(await inspectCache(first), { offsets: [3], chunks: [{ offset: 0, size: 3 }] });
  assert.deepEqual(await second.evaluate(() => requests), []);
  await first.close();
  // Closing a page and the browser process releasing its locks are separate
  // events. Wait for the latter before simulating the next user attempt.
  await second.waitForFunction(async () => {
    const { held } = await navigator.locks.query();
    return !held.some(lock => lock.name.startsWith('tel-media-download:'));
  });
  await finishResumedDownload(second);
  assert.equal(await second.evaluate(() => blobs[0].text()), 'abcdefghi');
});

test('removing an interrupted task deletes its saved bytes and it is not restored', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.locator('[data-action="dismiss"]').click();
  await second.waitForFunction(() => !document.querySelector('.tel-task'));
  assert.deepEqual(await inspectCache(second), { offsets: [], chunks: [] });
  await second.close();
  const third = await openPage(browser, '', '/k/', { context });
  assert.equal(await third.locator('.tel-task').count(), 0);
});

test('a refreshed Telegram file reference reconnects to the same document checkpoint', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(async () => {
    fetch = async (url, options) => options.headers.Range.startsWith('bytes=0-')
      ? response('video/mp4', 'bytes 0-2/6', 'abc') : response('video/mp4', null, 'expired', 404);
    const metadata = { dcId: 5, location: { _: 'inputDocumentFileLocation', id: '42', file_reference: 'old' }, fileName: 'movie.mp4' };
    await downloads.video('https://test.invalid/stream/' + encodeURIComponent(JSON.stringify(metadata)));
  });
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  const result = await second.evaluate(async () => {
    const metadata = { dcId: 5, location: { _: 'inputDocumentFileLocation', id: '42', file_reference: 'fresh' }, fileName: 'movie.mp4' };
    const url = 'https://test.invalid/stream/' + encodeURIComponent(JSON.stringify(metadata));
    fetch = async (requestedUrl, options) => {
      requests.push(requestedUrl === url);
      return options.headers.Range === 'bytes=0-2'
        ? response('video/mp4', 'bytes 0-2/6', 'abc') : response('video/mp4', 'bytes 3-5/6', 'def');
    };
    await downloads.video(url);
    return { cards: document.querySelectorAll('.tel-task').length, requests, body: await blobs[0]?.text(), errors };
  });
  assert.deepEqual(result, { cards: 1, requests: [true, true], body: 'abcdef', errors: [] });
});

test('fully cached media can be saved after a restart without fetching the source again', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(() => {
    window.showSaveFilePicker = async () => ({ name: 'chosen.mp4', createWritable: async () => ({
      write: async () => {}, close: () => new Promise(() => {}), abort: async () => {},
    }) });
    downloads.video('https://test.invalid/movie.mp4');
  });
  await first.waitForFunction(() => document.querySelector('.tel-task')?.dataset.state === 'saving');
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.locator('[data-action="retry"]').click();
  await second.waitForFunction(() => saved.length === 1);
  assert.deepEqual(await second.evaluate(async () => ({ body: await blobs[0].text(), requests, name: saved[0].name })), {
    body: 'abc', requests: [], name: 'chosen.mp4',
  });
});

test('cancelling an active download discards committed chunks', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(page);
  await page.locator('[data-action="cancel"]').click();
  await page.evaluate(() => done);
  assert.equal(await page.locator('.tel-task').getAttribute('data-state'), 'cancelled');
  assert.deepEqual(await inspectCache(page), { offsets: [], chunks: [] });
});

test('cancelling the resume save picker keeps the checkpoint for later', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(() => {
    window.showSaveFilePicker = async () => { throw new DOMException('Cancelled', 'AbortError'); };
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'paused');
  assert.deepEqual(await inspectCache(second), { offsets: [3], chunks: [{ offset: 0, size: 3 }] });
  assert.deepEqual(await second.evaluate(() => ({ requests, errors })), { requests: [], errors: [] });
});

test('a missing cached chunk stops recovery before any network request or saved file', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await interruptedDownload(first);
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('tel-media-downloader-resume', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('chunks', 'readwrite');
        tx.objectStore('chunks').clear();
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => reject(tx.error);
      };
    });
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.match(await second.locator('.tel-task-error').textContent(), /missing or damaged/);
  assert.deepEqual(await second.evaluate(() => ({ requests, saved: saved.length })), { requests: [], saved: 0 });
});

test('a changed strong ETag prevents continuation even when the overlap bytes match', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(async () => {
    fetch = async (url, options) => {
      if (!options.headers.Range.startsWith('bytes=0-')) return response('video/mp4', null, 'failed', 500);
      const res = response('video/mp4', 'bytes 0-2/6', 'abc');
      res.headers.set('ETag', '"original"');
      return res;
    };
    await downloads.video('https://test.invalid/movie.mp4');
  });
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(() => {
    fetch = async (url, options) => {
      requests.push(options.headers['If-Range']);
      const res = response('video/mp4', 'bytes 0-2/6', 'abc');
      res.headers.set('ETag', '"changed"');
      return res;
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.match(await second.locator('.tel-task-error').textContent(), /media changed/);
  assert.deepEqual(await second.evaluate(() => ({ requests, saved: saved.length })), { requests: ['"original"'], saved: 0 });
});
