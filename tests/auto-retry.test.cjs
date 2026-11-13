const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser, page, context;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await page?.close(); await context?.close(); context = null; });

test('temporary network errors retry automatically with backoff and visible attempt counts', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let calls = 0;
    fetch = async () => {
      if (++calls <= 2) throw new TypeError('Connection lost');
      return response('video/mp4', 'bytes 0-2/3');
    };
    const task = await downloads.video('https://test.invalid/video');
    return { state: task.state, calls, body: await blobs[0].text(), retryDelays, retryLabels, errors };
  });
  assert.deepEqual(result, { state: 'handedOff', calls: 3, body: 'abc', retryDelays: [1000, 2000],
    retryLabels: ['Retrying (1/3)', 'Retrying (2/3)'], errors: [] });
});

test('successful chunks reset the retry budget and completed bytes are not fetched again', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const attempts = {};
    fetch = async (url, options) => {
      const offset = Number(options.headers.Range.match(/bytes=(\d+)-/)[1]);
      requests.push(offset);
      attempts[offset] = (attempts[offset] || 0) + 1;
      if (offset === 3 && attempts[offset] < 3) return response('video/mp4', null, 'busy', 503);
      if (offset === 6 && attempts[offset] < 3) throw new TypeError('Offline');
      return response('video/mp4', `bytes ${offset}-${offset + 2}/9`, ['abc', 'def', 'ghi'][offset / 3]);
    };
    await downloads.video('https://test.invalid/video');
    return { requests, body: await blobs[0].text(), retryDelays, errors };
  });
  assert.deepEqual(result, { requests: [0, 3, 3, 3, 6, 6, 6], body: 'abcdefghi',
    retryDelays: [1000, 2000, 1000, 2000], errors: [] });
});

test('an interrupted disk response is rewound to the committed offset before retrying', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let pickerCalls = 0, tailCalls = 0;
    window.showSaveFilePicker = async () => {
      pickerCalls++;
      return (await navigator.storage.getDirectory()).getFileHandle('retry.mp4', { create: true });
    };
    fetch = async (url, options) => {
      const offset = Number(options.headers.Range.match(/bytes=(\d+)-/)[1]);
      requests.push(offset);
      if (offset === 0) return response('video/mp4', 'bytes 0-2/6', 'abc');
      if (++tailCalls === 1) return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode('X'));
        setTimeout(() => controller.error(new TypeError('Connection reset')), 0);
      } }), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-5/6' } });
      return response('video/mp4', 'bytes 3-5/6', 'def');
    };
    const task = await downloads.video('https://test.invalid/video');
    const file = await (await (await navigator.storage.getDirectory()).getFileHandle('retry.mp4')).getFile();
    return { state: task.state, body: await file.text(), pickerCalls, requests, retryDelays, errors };
  });
  assert.deepEqual(result, { state: 'completed', body: 'abcdef', pickerCalls: 1,
    requests: [0, 3, 3], retryDelays: [1000], errors: [] });
});

test('three automatic retries are the limit before the manual retry action appears', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let calls = 0;
    fetch = async () => { calls++; return response('video/mp4', null, 'busy', 503); };
    const task = await downloads.video('https://test.invalid/video');
    return { state: task.state, calls, retryDelays, saved: saved.length,
      retryVisible: !document.querySelector('[data-action="retry"]').hidden,
      hint: document.querySelector('.tel-task-resume-hint').textContent, errors: errors.length };
  });
  assert.equal(result.state, 'failed');
  assert.equal(result.calls, 4);
  assert.deepEqual(result.retryDelays, [1000, 2000, 4000]);
  assert.equal(result.saved, 0);
  assert.equal(result.retryVisible, true);
  assert.match(result.hint, /Automatic retries failed/);
  assert.equal(result.errors, 1);
});

test('permanent HTTP and media-integrity errors do not trigger automatic retries', async () => {
  for (const failure of ['forbidden', 'expired', 'mime', 'range']) {
    page = await openPage(browser);
    const result = await page.evaluate(async failure => {
      let calls = 0;
      fetch = async () => {
        calls++;
        if (failure === 'forbidden') return response('video/mp4', null, 'denied', 403);
        if (failure === 'expired') return response('video/mp4', null, 'expired', 404);
        if (failure === 'mime') return response('text/html', null, 'login', 200);
        return response('video/mp4', 'bytes 9-11/12', 'abc');
      };
      const task = await downloads.video('https://test.invalid/video');
      return { state: task.state, calls, retryDelays, saved: saved.length };
    }, failure);
    assert.deepEqual(result, { state: 'failed', calls: 1, retryDelays: [], saved: 0 }, failure);
    await page.close();
  }
});

test('disk write errors are not misclassified as retryable network TypeErrors', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let calls = 0, writes = 0, aborted = 0;
    window.showSaveFilePicker = async () => ({ createWritable: async () => ({
      write: async () => { writes++; throw new TypeError('Disk unavailable'); },
      close: async () => {}, abort: async () => { aborted++; },
    }) });
    fetch = async () => { calls++; return response('video/mp4', 'bytes 0-2/3'); };
    const task = await downloads.video('https://test.invalid/video');
    return { state: task.state, calls, writes, aborted, retryDelays };
  });
  assert.deepEqual(result, { state: 'failed', calls: 1, writes: 1, aborted: 1, retryDelays: [] });
});

test('cancelling during retry backoff prevents another request', async () => {
  page = await openPage(browser);
  await page.evaluate(() => {
    accelerateRetries = false;
    window.calls = 0;
    fetch = async () => { calls++; throw new TypeError('Offline'); };
    window.done = downloads.video('https://test.invalid/video');
  });
  await page.waitForSelector('[data-state="retrying"]');
  await page.locator('[data-action="cancel"]').click();
  const result = await page.evaluate(async () => {
    const task = await done;
    await new Promise(resolve => setTimeout(resolve, 1100));
    return { state: task.state, calls, saved: saved.length, errors };
  });
  assert.deepEqual(result, { state: 'cancelled', calls: 1, saved: 0, errors: [] });
});

test('Retry-After is respected and a long server wait requires manual continuation', async () => {
  for (const seconds of [3, 120]) {
    page = await openPage(browser);
    const result = await page.evaluate(async seconds => {
      let calls = 0;
      fetch = async () => {
        if (++calls > 1) return response('video/mp4', 'bytes 0-2/3');
        const res = response('video/mp4', null, 'limited', 429);
        res.headers.set('Retry-After', String(seconds));
        return res;
      };
      const task = await downloads.video('https://test.invalid/video');
      return { state: task.state, calls, retryDelays, hint: document.querySelector('.tel-task-resume-hint').textContent };
    }, seconds);
    if (seconds === 3) {
      assert.equal(result.state, 'handedOff');
      assert.equal(result.calls, 2);
      assert.deepEqual(result.retryDelays, [3000]);
    } else {
      assert.equal(result.state, 'failed');
      assert.equal(result.calls, 1);
      assert.deepEqual(result.retryDelays, []);
      assert.match(result.hint, /longer wait/);
    }
    await page.close();
  }
});

test('a stalled response can time out and recover automatically', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const timeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => timeout(callback, delay === 30000 ? 10 : delay, ...args);
    let calls = 0;
    fetch = async () => ++calls === 1
      ? new Response(new ReadableStream({ start() {} }), { headers: { 'Content-Type': 'video/mp4' } })
      : response('video/mp4', 'bytes 0-2/3');
    const task = await downloads.video('https://test.invalid/video');
    return { state: task.state, calls, retryDelays, body: await blobs[0].text(), errors };
  });
  assert.deepEqual(result, { state: 'handedOff', calls: 2, retryDelays: [1000], body: 'abc', errors: [] });
});

test('a resumed task also retries a temporary overlap-probe error', async () => {
  context = await browser.newContext();
  page = await openPage(browser, '', '/k/', { context });
  await page.evaluate(async () => {
    fetch = async (url, options) => options.headers.Range.startsWith('bytes=0-')
      ? response('video/mp4', 'bytes 0-2/6', 'abc') : response('video/mp4', null, 'expired', 403);
    await downloads.video('https://test.invalid/video');
  });
  await page.close();
  page = await openPage(browser, '', '/k/', { context });
  await page.evaluate(() => {
    let probes = 0;
    fetch = async (url, options) => {
      requests.push(options.headers.Range);
      if (options.headers.Range === 'bytes=0-2') {
        if (++probes === 1) throw new TypeError('Temporary probe failure');
        return response('video/mp4', 'bytes 0-2/6', 'abc');
      }
      return response('video/mp4', 'bytes 3-5/6', 'def');
    };
    document.querySelector('[data-action="retry"]').click();
  });
  await page.waitForSelector('[data-state="handedOff"]');
  assert.deepEqual(await page.evaluate(async () => ({ requests, retryDelays, body: await blobs[0].text(), errors })), {
    requests: ['bytes=0-2', 'bytes=0-2', 'bytes=3-4194306'], retryDelays: [1000], body: 'abcdef', errors: [],
  });
});
