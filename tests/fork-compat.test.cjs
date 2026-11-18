const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser;
let page;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await page?.close(); });

test('stream metadata survives URL suffixes and concurrent downloads keep their own filenames', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const names = ['first.clip.mp4', 'second.clip.mp4'];
    await Promise.all(names.map(fileName => downloads.video(
      'https://test.invalid/stream/' + encodeURIComponent(JSON.stringify({ fileName })) + '?download=1'
    )));
    return { names: saved.map(file => file.name).sort(), errors };
  });
  assert.deepEqual(result, { names: ['first.clip.mp4', 'second.clip.mp4'], errors: [] });
});

test('binary media responses use metadata types and wildcard ranges use the known media size', async () => {
  for (const kind of ['video', 'audio']) {
    page = await openPage(browser);
    const result = await page.evaluate(async kind => {
      let count = 0;
      fetch = async () => response('application/octet-stream',
        count++ === 0 ? 'BYTES  0-2/*' : 'bytes 3-5/*', count === 1 ? 'abc' : 'def');
      const mimeType = kind === 'video' ? 'video/webm' : 'audio/mpeg';
      await downloads[kind]('https://test.invalid/stream/' + encodeURIComponent(JSON.stringify({
        mimeType, size: 6, fileName: 'original.name',
      })));
      return { count, body: await blobs[0]?.text(), mime: blobs[0]?.type, name: saved[0]?.name, errors };
    }, kind);
    assert.deepEqual(result, { count: 2, body: 'abcdef', mime: kind === 'video' ? 'video/webm' : 'audio/mpeg',
      name: kind === 'video' ? 'original.webm' : 'original.mp3', errors: [] });
    await page.close();
  }
});

test('blob media fetches omit range headers and complete through the task lifecycle', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    fetch = async (url, options) => {
      requests.push(options.headers);
      return response('video/mp4', null, 'blob-data', 200);
    };
    const task = await downloads.video('blob:https://web.telegram.org/test-media');
    return { headers: requests, body: await blobs[0]?.text(), state: task.state, errors };
  });
  assert.deepEqual(result, { headers: [{}], body: 'blob-data', state: 'handedOff', errors: [] });
});

test('picker errors fall back to the browser for synchronous and asynchronous failures', async () => {
  for (const synchronous of [false, true]) {
    page = await openPage(browser);
    const result = await page.evaluate(async synchronous => {
      window.showSaveFilePicker = synchronous
        ? () => { throw new Error('Picker unavailable'); }
        : async () => { throw new Error('Permission denied'); };
      const task = await downloads.video('https://test.invalid/video');
      return { saved: saved.length, state: task.state, errors };
    }, synchronous);
    assert.deepEqual(result, { saved: 1, state: 'handedOff', errors: [] });
    await page.close();
  }
});

test('concurrent file handles retain user-selected names when disk creation falls back to the browser', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let index = 0;
    window.showSaveFilePicker = async () => ({
      name: `chosen-${++index}.mp4`,
      createWritable: async () => { throw new Error('Permission denied'); },
    });
    const tasks = await Promise.all([
      downloads.video('https://test.invalid/first'), downloads.video('https://test.invalid/second'),
    ]);
    return { names: saved.map(file => file.name).sort(), states: tasks.map(task => task.state), errors };
  });
  assert.deepEqual(result, { names: ['chosen-1.mp4', 'chosen-2.mp4'],
    states: ['handedOff', 'handedOff'], errors: [] });
});
