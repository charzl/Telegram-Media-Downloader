const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage } = require('./helpers.cjs');
let browser;
let page;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });
afterEach(async () => { await page?.close(); });

test('duplicate clicks share one active download', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let respond, calls = 0;
    fetch = () => { calls++; return new Promise(resolve => { respond = resolve; }); };
    const first = downloads.video('https://test.invalid/video');
    const second = downloads.video('https://test.invalid/video');
    const cards = document.querySelectorAll('.tel-task').length;
    await waitUntil(() => typeof respond === 'function');
    respond(response('video/mp4', 'bytes 0-2/3'));
    await first;
    return { same: first === second, calls, cards, saved: saved.length, errors };
  });
  assert.deepEqual(result, { same: true, calls: 1, cards: 1, saved: 1, errors: [] });
});

test('cancelling a streamed download aborts the request and unfinished file', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let stream, aborted = 0, closed = 0, cancelledBody = 0;
    window.showSaveFilePicker = async () => ({ createWritable: async () => ({
      write: async () => {}, close: async () => { closed++; }, abort: async () => { aborted++; },
    }) });
    fetch = async () => new Response(new ReadableStream({
      start(controller) { stream = controller; }, cancel() { cancelledBody++; },
    }), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-5/6' } });
    const done = downloads.video('https://test.invalid/video');
    await waitUntil(() => typeof stream !== 'undefined');
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await waitUntil(() => document.querySelector('.tel-task-details').textContent.startsWith('3 B'));
    document.querySelector('[data-action="cancel"]').click();
    await done;
    return { aborted, closed, cancelledBody, saved: saved.length, state: document.querySelector('.tel-task').dataset.state, errors };
  });
  assert.deepEqual(result, { aborted: 1, closed: 0, cancelledBody: 1, saved: 0, state: 'cancelled', errors: [] });
});

test('only two downloads run at once and completing one starts the next', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const responders = [];
    fetch = (url) => { requests.push(url); return new Promise(resolve => responders.push(resolve)); };
    const done = [1, 2, 3].map(id => downloads.video(`https://test.invalid/${id}.mp4`));
    await waitUntil(() => responders.length === 2);
    const initial = { requests: requests.length, queued: document.querySelectorAll('[data-state="queued"]').length };
    responders[0](response('video/mp4', 'bytes 0-2/3'));
    await waitUntil(() => responders.length === 3);
    const afterFirst = requests.length;
    responders[1](response('video/mp4', 'bytes 0-2/3'));
    responders[2](response('video/mp4', 'bytes 0-2/3'));
    await Promise.all(done);
    return { initial, afterFirst, saved: saved.length, errors };
  });
  assert.deepEqual(result, { initial: { requests: 2, queued: 1 }, afterFirst: 3, saved: 3, errors: [] });
});

test('queued tasks can be cancelled without starting a request', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const responders = [];
    fetch = url => { requests.push(url); return new Promise(resolve => responders.push(resolve)); };
    const done = [1, 2, 3].map(id => downloads.video(`https://test.invalid/${id}.mp4`));
    document.querySelector('[data-state="queued"] [data-action="cancel"]').click();
    await waitUntil(() => responders.length === 2);
    responders.forEach(resolve => resolve(response('video/mp4', 'bytes 0-2/3')));
    await Promise.all(done);
    return { requests: requests.length, saved: saved.length, cancelled: document.querySelectorAll('[data-state="cancelled"]').length, errors };
  });
  assert.deepEqual(result, { requests: 2, saved: 2, cancelled: 1, errors: [] });
});

test('exhausted automatic retries expose an error and manual retry can succeed', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let calls = 0, recover = false;
    fetch = async () => { calls++; return recover ? response('video/mp4', 'bytes 0-2/3') : response('video/mp4', null, 'error', 500); };
    await downloads.video('https://test.invalid/video');
    const error = document.querySelector('.tel-task-error').textContent;
    recover = true;
    document.querySelector('[data-action="retry"]').click();
    await waitUntil(() => document.querySelector('.tel-task').dataset.state === 'handedOff');
    return { calls, error, saved: saved.length, state: document.querySelector('.tel-task').dataset.state };
  });
  assert.equal(result.calls, 12);
  assert.match(result.error, /HTTP 500/);
  assert.equal(result.saved, 1);
  assert.equal(result.state, 'handedOff');
});

test('unknown totals show indeterminate progress and hiding the panel keeps downloading', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    let stream;
    fetch = async () => new Response(new ReadableStream({ start(controller) { stream = controller; } }), { headers: { 'Content-Type': 'video/mp4' } });
    const done = downloads.video('https://test.invalid/video');
    await waitUntil(() => typeof stream !== 'undefined');
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await settle();
    const progress = document.querySelector('.progress');
    const partial = { percent: progress.getAttribute('aria-valuenow'), details: document.querySelector('.tel-task-details').textContent };
    document.querySelector('.tel-panel-toggle').click();
    const hidden = document.querySelector('.tel-task-list').hidden;
    stream.close();
    await done;
    return { partial, hidden, saved: saved.length, state: document.querySelector('.tel-task').dataset.state, errors };
  });
  assert.equal(result.partial.percent, null);
  assert.match(result.partial.details, /3 B/);
  assert.equal(result.hidden, true);
  assert.equal(result.saved, 1);
  assert.equal(result.state, 'handedOff');
  assert.deepEqual(result.errors, []);
});

test('retry waits release slots to queued files and retries reacquire slots before fetching', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    accelerateRetries = false;
    const timeout = window.setTimeout;
    const retries = [];
    window.setTimeout = (callback, delay, ...args) => {
      if (String(callback).includes('signal.removeEventListener("abort", abort); resolve();')) {
        retries.push(() => callback(...args));
        return 0;
      }
      return timeout(callback, delay, ...args);
    };
    const attempts = {}, responders = {};
    fetch = async url => {
      requests.push(url);
      attempts[url] = (attempts[url] || 0) + 1;
      if (/[12]\.mp4$/.test(url) && attempts[url] === 1) throw new TypeError('Offline');
      if (/[34]\.mp4$/.test(url)) return new Promise(resolve => { responders[url] = resolve; });
      return response('video/mp4', 'bytes 0-2/3');
    };
    const done = [1, 2, 3, 4].map(id => downloads.video(`https://test.invalid/${id}.mp4`));
    await waitUntil(() => Object.keys(responders).length === 2 && retries.length === 2);
    retries.forEach(retry => retry());
    await waitUntil(() => document.querySelectorAll('[data-state="queued"]').length === 2);
    // The retries cannot fetch while both healthy transfers hold their slots.
    const beforeRelease = requests.map(url => url.split('/').pop());
    Object.values(responders).forEach(resolve => resolve(response('video/mp4', 'bytes 0-2/3')));
    await Promise.all(done);
    return { beforeRelease, counts: Object.values(attempts).sort(), saved: saved.length, errors };
  });
  assert.deepEqual(result, { beforeRelease: ['1.mp4', '2.mp4', '3.mp4', '4.mp4'],
    counts: [1, 1, 2, 2], saved: 4, errors: [] });
});


test('queued cards identify slot owners and update after an owner is cancelled', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    const responders = {};
    fetch = (url, options) => new Promise((resolve, reject) => {
      responders[url] = resolve;
      options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
    });
    const done = [1, 2, 3, 4].map(id => downloads.video(`https://test.invalid/${id}.mp4`));
    const card = id => [...document.querySelectorAll('.tel-task')].find(el => el.querySelector('.filename').textContent === `${id}.mp4`);
    await waitUntil(() => Object.keys(responders).length === 2 && card(4)?.dataset.state === 'queued');
    const initial = card(4).querySelector('.tel-task-details').textContent;
    card(2).querySelector('[data-action="cancel"]').click();
    await waitUntil(() => responders['https://test.invalid/3.mp4'] && card(3).dataset.state === 'downloading');
    const updated = card(4).querySelector('.tel-task-details').textContent;
    for (const id of [1, 3]) responders[`https://test.invalid/${id}.mp4`](response('video/mp4', 'bytes 0-2/3'));
    await waitUntil(() => responders['https://test.invalid/4.mp4']);
    responders['https://test.invalid/4.mp4'](response('video/mp4', 'bytes 0-2/3'));
    await Promise.all(done);
    return { initial, updated, saved: saved.length, errors };
  });
  assert.match(result.initial, /Queue position: 2/);
  assert.match(result.initial, /Slots occupied by:.*1\.mp4.*2\.mp4/);
  assert.match(result.updated, /Queue position: 1/);
  assert.match(result.updated, /Slots occupied by:.*1\.mp4.*3\.mp4/);
  assert.doesNotMatch(result.updated, /2\.mp4/);
  assert.equal(result.saved, 3);
  assert.deepEqual(result.errors, []);
});

test('a retry queued behind active downloads can be cancelled without leaking a slot', async () => {
  page = await openPage(browser);
  const result = await page.evaluate(async () => {
    accelerateRetries = false;
    const timeout = window.setTimeout;
    let retry;
    window.setTimeout = (callback, delay, ...args) => {
      if (String(callback).includes('signal.removeEventListener("abort", abort); resolve();')) {
        retry = () => callback(...args); return 0;
      }
      return timeout(callback, delay, ...args);
    };
    const responders = {};
    fetch = async url => {
      requests.push(url);
      if (url.endsWith('/1.mp4')) throw new TypeError('Offline');
      return new Promise(resolve => { responders[url] = resolve; });
    };
    const done = [1, 2, 3].map(id => downloads.video(`https://test.invalid/${id}.mp4`));
    await waitUntil(() => retry && Object.keys(responders).length === 2);
    retry();
    const first = [...document.querySelectorAll('.tel-task')].find(el => el.querySelector('.filename').textContent === '1.mp4');
    await waitUntil(() => first.dataset.state === 'queued');
    first.querySelector('[data-action="cancel"]').click();
    Object.values(responders).forEach(resolve => resolve(response('video/mp4', 'bytes 0-2/3')));
    await Promise.all(done);
    const extra = downloads.video('https://test.invalid/4.mp4');
    await waitUntil(() => responders['https://test.invalid/4.mp4']);
    responders['https://test.invalid/4.mp4'](response('video/mp4', 'bytes 0-2/3'));
    await extra;
    return { cancelled: first.dataset.state, firstRequests: requests.filter(url => url.endsWith('/1.mp4')).length,
      saved: saved.length, errors };
  });
  assert.deepEqual(result, { cancelled: 'cancelled', firstRequests: 1, saved: 3, errors: [] });
});
