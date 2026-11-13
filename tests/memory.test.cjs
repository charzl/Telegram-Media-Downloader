const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
const MiB = 1024 * 1024;
let browser;
let context;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await context?.close(); context = null; });

const guardBuffers = () => {
  window.maxBlob = 0;
  window.maxStoredBlock = 0;
  window.Blob = new Proxy(Blob, { construct(target, [parts, options], newTarget) {
    const size = parts.reduce((sum, part) => sum + (part.byteLength ?? part.size ?? part.length), 0);
    maxBlob = Math.max(maxBlob, size);
    if (size > 1024 * 1024) throw new Error('A whole response was retained in memory');
    return Reflect.construct(target, [parts, options], newTarget);
  } });
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, ...args) {
    if (this.name === 'chunks') {
      const size = value.data?.byteLength ?? value.blob.size;
      maxStoredBlock = Math.max(maxStoredBlock, size);
      if (size > 1024 * 1024) throw new Error('An oversized cache block was stored');
      if (value.data && value.data.buffer.byteLength !== size) throw new Error('A tail retained an oversized backing buffer');
    }
    return put.call(this, value, ...args);
  };
  window.mediaBody = (size, prefix = '', pattern = false) => {
    let sent = 0;
    return new ReadableStream({ pull(controller) {
      if (sent === size) { controller.close(); return; }
      const value = new Uint8Array(Math.min(256 * 1024, size - sent))
        .fill(pattern ? 37 + Math.floor(sent / (1024 * 1024)) : 37);
      if (sent === 0 && prefix) value.set(new TextEncoder().encode(prefix));
      sent += value.length;
      controller.enqueue(value);
    } });
  };
};

test('an ignored Range header streams a full response to disk using bounded cache blocks', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  await page.evaluate(guardBuffers);
  const result = await page.evaluate(async () => {
    window.showSaveFilePicker = async () => {
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle('bounded.mp4', { create: true });
    };
    const size = 16 * 1024 * 1024 + 37;
    fetch = async () => new Response(mediaBody(size, '', true), {
      status: 200, headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) },
    });
    const task = await downloads.video('https://test.invalid/video');
    const root = await navigator.storage.getDirectory();
    const file = await (await root.getFileHandle('bounded.mp4')).getFile();
    return { state: task.state, size: file.size, tail: [...new Uint8Array(await file.slice(-37).arrayBuffer())],
      maxBlob, maxStoredBlock, errors };
  });
  assert.equal(result.state, 'completed');
  assert.equal(result.size, 16 * MiB + 37);
  assert.deepEqual(result.tail, Array(37).fill(53));
  assert.ok(result.maxBlob <= MiB);
  assert.equal(result.maxStoredBlock, MiB);
  assert.deepEqual(result.errors, []);
});

test('browser-download fallback exports a disk-backed file without concatenating the complete media', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  await page.evaluate(guardBuffers);
  const result = await page.evaluate(async () => {
    const size = 10 * 1024 * 1024 + 7;
    fetch = async () => new Response(mediaBody(size, '', true), {
      status: 200, headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) },
    });
    const task = await downloads.video('https://test.invalid/video');
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('tel-media-downloader-exports');
    const exports = [];
    for await (const handle of directory.values()) exports.push((await handle.getFile()).size);
    const samples = [];
    for (const offset of [0, 1024 * 1024, 9 * 1024 * 1024, 10 * 1024 * 1024]) {
      samples.push(new Uint8Array(await blobs[0].slice(offset, offset + 1).arrayBuffer())[0]);
    }
    return { state: task.state, size: blobs[0].size, type: blobs[0].type, samples, exports, maxBlob, maxStoredBlock, errors };
  });
  assert.deepEqual(result, { state: 'handedOff', size: 10 * MiB + 7, type: 'video/mp4',
    samples: [37, 38, 46, 47], exports: [10 * MiB + 7], maxBlob: 0, maxStoredBlock: MiB, errors: [] });
});

test('unvalidated staged blocks are discarded after closing the page and before resuming', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(() => {
    let calls = 0;
    fetch = async () => {
      if (++calls === 1) return response('video/mp4', 'bytes 0-2/6291459', 'abc');
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new Uint8Array(2 * 1024 * 1024).fill(1));
      } }), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-6291458/6291459' } });
    };
    downloads.video('https://test.invalid/video');
  });
  const cache = () => new Promise(resolve => {
    const request = indexedDB.open('tel-media-downloader-resume', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tasks = db.transaction('tasks').objectStore('tasks').getAll();
      tasks.onsuccess = () => {
        const chunks = db.transaction('chunks').objectStore('chunks').getAll();
        chunks.onsuccess = () => { db.close(); resolve({ offset: tasks.result[0]?.offset,
          chunks: chunks.result.map(chunk => chunk.offset) }); };
      };
    };
  });
  await first.waitForFunction(async cacheSource => {
    const value = await (0, eval)('(' + cacheSource + ')')();
    return value.offset === 3 && value.chunks.length === 3;
  }, cache.toString());
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(guardBuffers);
  await second.evaluate(() => {
    fetch = async (url, options) => {
      if (options.headers.Range === 'bytes=0-2') return new Promise(resolve => { window.probe = resolve; });
      return new Response(mediaBody(6 * 1024 * 1024), { status: 206,
        headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-6291458/6291459' } });
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => typeof probe === 'function');
  assert.deepEqual(await second.evaluate(cache), { offset: 3, chunks: [0] });
  await second.evaluate(() => probe(response('video/mp4', 'bytes 0-2/6291459', 'abc')));
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'handedOff');
  assert.deepEqual(await second.evaluate(async () => ({ size: blobs[0].size,
    prefix: await blobs[0].slice(0, 3).text(), tail: [...new Uint8Array(await blobs[0].slice(-3).arrayBuffer())], errors })),
  { size: 6 * MiB + 3, prefix: 'abc', tail: [37, 37, 37], errors: [] });
});

test('a probe stops reading once its overlap is available even if the server ignores the range end', async () => {
  context = await browser.newContext();
  const first = await openPage(browser, '', '/k/', { context });
  await first.evaluate(async () => {
    let calls = 0;
    fetch = async () => ++calls === 1 ? response('video/mp4', 'bytes 0-2/6291459', 'abc')
      : response('video/mp4', null, 'failed', 500);
    await downloads.video('https://test.invalid/video');
  });
  await first.close();
  const second = await openPage(browser, '', '/k/', { context });
  await second.evaluate(guardBuffers);
  await second.evaluate(() => {
    window.probeBytes = 0;
    window.probeCancelled = 0;
    fetch = async (url, options) => {
      if (options.headers.Range !== 'bytes=0-2') return new Response(mediaBody(6 * 1024 * 1024), {
        status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-6291458/6291459' },
      });
      return new Response(new ReadableStream({ pull(controller) {
        const value = new Uint8Array(256 * 1024).fill(37);
        if (probeBytes === 0) value.set(new TextEncoder().encode('abc'));
        probeBytes += value.length;
        controller.enqueue(value);
      }, cancel() { probeCancelled++; } }), { status: 206,
        headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-6291458/6291459' } });
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'handedOff');
  const result = await second.evaluate(() => ({ probeBytes, probeCancelled, errors }));
  assert.ok(result.probeBytes <= MiB);
  assert.equal(result.probeCancelled, 1);
  assert.deepEqual(result.errors, []);
});

test('large files never fall back to unbounded RAM when private disk export is unavailable', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  await page.evaluate(guardBuffers);
  const result = await page.evaluate(async () => {
    window.getDirectory = navigator.storage.getDirectory.bind(navigator.storage);
    navigator.storage.getDirectory = async () => { throw new DOMException('Blocked', 'SecurityError'); };
    fetch = async () => new Response(mediaBody(9 * 1024 * 1024), {
      status: 200, headers: { 'Content-Type': 'video/mp4' },
    });
    const task = await downloads.video('https://test.invalid/video');
    return { state: task.state, received: task.received, saved: saved.length };
  });
  assert.deepEqual(result, { state: 'failed', received: 9 * MiB, saved: 0 });
  assert.match(await page.locator('.tel-task-error').textContent(), /low memory use/);
  await page.evaluate(() => {
    navigator.storage.getDirectory = getDirectory;
    fetch = () => { throw new Error('A cached file must not be downloaded again'); };
    window.showSaveFilePicker = async () => (await getDirectory()).getFileHandle('recovered.mp4', { create: true });
    // Re-render after the test provides the browser's native picker capability.
    document.querySelector('.tel-language-setting select').dispatchEvent(new Event('change'));
    document.querySelector('[data-action="location"]').click();
  });
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
  assert.equal(await page.evaluate(async () =>
    (await (await (await getDirectory()).getFileHandle('recovered.mp4')).getFile()).size), 9 * MiB);
});

test('small files still save with the bounded fallback when private disk storage is blocked', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context });
  const result = await page.evaluate(async () => {
    navigator.storage.getDirectory = async () => { throw new DOMException('Blocked', 'SecurityError'); };
    await downloads.video('https://test.invalid/video');
    return { body: await blobs[0].text(), errors };
  });
  assert.deepEqual(result, { body: 'abc', errors: [] });
});

test('legacy Blob checkpoints resume without constructing a whole-file memory buffer', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context, beforeScript: () => new Promise(resolve => {
    const request = indexedDB.open('tel-media-downloader-resume', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('tasks', { keyPath: 'id' });
      request.result.createObjectStore('chunks', { keyPath: ['id', 'offset'] });
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['tasks', 'chunks'], 'readwrite');
      const url = 'https://test.invalid/legacy.mp4';
      const size = 2 * 1024 * 1024 + 3;
      tx.objectStore('tasks').put({ id: 'legacy1', key: 'video:' + url, url, kind: 'video',
        fileName: 'legacy.mp4', offset: size, total: size, mime: 'video/mp4', validator: null });
      tx.objectStore('chunks').put({ id: 'legacy1', offset: 0, blob: new Blob([new Uint8Array(size).fill(42)]) });
      tx.oncomplete = () => { db.close(); resolve(); };
    };
  }) });
  await page.evaluate(guardBuffers);
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'handedOff');
  assert.deepEqual(await page.evaluate(async () => ({ size: blobs[0].size,
    tail: [...new Uint8Array(await blobs[0].slice(-3).arrayBuffer())], requests, maxBlob, errors })),
  { size: 2 * MiB + 3, tail: [42, 42, 42], requests: [], maxBlob: 0, errors: [] });
});

test('export cleanup removes only expired export files and keeps recent or unrelated entries', async () => {
  context = await browser.newContext();
  const page = await openPage(browser, '', '/k/', { context, beforeScript: async () => {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('tel-media-downloader-exports', { create: true });
    window.oldExport = `${Date.now() - 25 * 60 * 60 * 1000}-old`;
    window.newExport = `${Date.now()}-new`;
    for (const name of [oldExport, newExport, 'unrelated.txt']) {
      const writable = await (await directory.getFileHandle(name, { create: true })).createWritable();
      await writable.write('abc');
      await writable.close();
    }
  } });
  await page.waitForFunction(async () => {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('tel-media-downloader-exports');
    const names = [];
    for await (const name of directory.keys()) names.push(name);
    return !names.includes(oldExport) && names.includes(newExport) && names.includes('unrelated.txt');
  });
  assert.deepEqual(await page.evaluate(() => errors), []);
});
