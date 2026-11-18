const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser;
let context;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await context?.close(); context = null; });

const saveInterruptedTask = async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(async () => {
    window.showSaveFilePicker = async () => {
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle('original.mp4', { create: true });
    };
    fetch = async (url, options) => options.headers.Range.startsWith('bytes=0-')
      ? response('video/mp4', 'bytes 0-2/6', 'abc') : response('video/mp4', null, 'failed', 500);
    await downloads.video('https://test.invalid/movie.mp4');
  });
  await first.close();
};

const configureRestoredPage = async (permission, missing = false) => {
  const page = await openPage(browser, '', '/k/', { context, beforeScript: () => {
    window.pickerCalls = 0;
    window.showSaveFilePicker = async () => {
      pickerCalls++;
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle('alternative.mp4', { create: true });
    };
  } });
  await page.evaluate(({ permission, missing }) => {
    window.permissionRequests = [];
    FileSystemHandle.prototype.queryPermission = async () => permission === 'granted' ? 'granted' : 'prompt';
    FileSystemHandle.prototype.requestPermission = async options => {
      permissionRequests.push(options.mode);
      return permission;
    };
    const createWritable = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = function (...args) {
      if (missing && this.name === 'original.mp4') throw new DOMException('File moved', 'NotFoundError');
      return createWritable.apply(this, args);
    };
    fetch = async (url, options) => {
      const range = options.headers.Range;
      requests.push(range);
      return range === 'bytes=0-2'
        ? response('video/mp4', 'bytes 0-2/6', 'abc') : response('video/mp4', 'bytes 3-5/6', 'def');
    };
  }, { permission, missing });
  return page;
};

test('a remembered file with permission resumes without opening any picker or permission prompt', async () => {
  await saveInterruptedTask();
  const page = await configureRestoredPage('granted');
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.deepEqual(await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const file = await (await root.getFileHandle('original.mp4')).getFile();
    return { body: await file.text(), pickerCalls, permissionRequests, requests, saved: saved.length, errors };
  }), { body: 'abcdef', pickerCalls: 0, permissionRequests: [],
    requests: ['bytes=0-2', 'bytes=3-4194306'], saved: 0, errors: [] });
});

test('a remembered file can request renewed access without choosing a new save location', async () => {
  await saveInterruptedTask();
  const page = await configureRestoredPage('granted');
  await page.evaluate(() => { FileSystemHandle.prototype.queryPermission = async () => 'prompt'; });
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.deepEqual(await page.evaluate(() => ({ pickerCalls, permissionRequests, errors })), {
    pickerCalls: 0, permissionRequests: ['readwrite'], errors: [],
  });
});

test('denied original-file access preserves the checkpoint and allows an explicit new destination', async () => {
  await saveInterruptedTask();
  const page = await configureRestoredPage('denied');
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'paused');
  assert.match(await page.locator('.tel-task-error').textContent(), /Allow access to the original file/);
  assert.deepEqual(await page.evaluate(() => ({ requests, pickerCalls, permissionRequests })), {
    requests: [], pickerCalls: 0, permissionRequests: ['readwrite'],
  });
  assert.match(await page.locator('.tel-task-details').textContent(), /3 B \/ 6 B/);
  await page.locator('[data-action="location"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.deepEqual(await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const original = await (await root.getFileHandle('original.mp4')).getFile();
    const alternative = await (await root.getFileHandle('alternative.mp4')).getFile();
    return { originalSize: original.size, body: await alternative.text(), pickerCalls, requests };
  }), { originalSize: 0, body: 'abcdef', pickerCalls: 1, requests: ['bytes=0-2', 'bytes=3-4194306'] });
});

test('an unavailable original file reports an error instead of silently saving elsewhere', async () => {
  await saveInterruptedTask();
  const page = await configureRestoredPage('granted', true);
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'failed');
  assert.match(await page.locator('.tel-task-error').textContent(), /Cannot reopen the original file/);
  assert.deepEqual(await page.evaluate(() => ({ requests, pickerCalls, saved: saved.length })), {
    requests: [], pickerCalls: 0, saved: 0,
  });
  await page.locator('[data-action="location"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.equal(await page.evaluate(() => pickerCalls), 1);
});

test('a changed destination is remembered while the resumed task is still queued', async () => {
  await saveInterruptedTask();
  const page = await configureRestoredPage('granted');
  await page.evaluate(() => {
    const originalFetch = fetch;
    window.blockedRequests = 0;
    fetch = (url, options) => {
      if (url.includes('blocked')) { blockedRequests++; return new Promise(() => {}); }
      return originalFetch(url, options);
    };
    downloads.image('https://test.invalid/blocked-1.jpg');
    downloads.image('https://test.invalid/blocked-2.jpg');
  });
  await page.waitForFunction(() => blockedRequests === 2);
  await page.locator('[data-action="location"]:visible').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.tel-task')].some(card =>
    card.querySelector('.filename').textContent === 'alternative.mp4' && card.dataset.state === 'queued'));
  const savedDestination = await page.waitForFunction(() => new Promise(resolve => {
    const request = indexedDB.open('tel-media-downloader-resume', 1);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('tasks').objectStore('tasks').getAll();
      read.onsuccess = () => {
        const task = read.result.find(task => task.kind === 'video');
        db.close();
        resolve(task?.fileHandle?.name === 'alternative.mp4'
          ? { name: task.fileHandle.name, offset: task.offset } : false);
      };
    };
  }));
  assert.deepEqual(await savedDestination.jsonValue(), { name: 'alternative.mp4', offset: 3 });
});
