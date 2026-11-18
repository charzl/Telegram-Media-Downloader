const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { openPage } = require('./helpers.cjs');

test('an abruptly killed browser restores checkpoints from its profile and finishes the exact disk file', { timeout: 30000 }, async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'tel-resume-browser-'));
  let context;
  const launch = () => chromium.launchPersistentContext(profile, {
    headless: true,
    ...(process.env.TEL_TEST_BROWSER ? { executablePath: process.env.TEL_TEST_BROWSER } : {}),
  });
  const picker = async () => {
    window.pickerCalls = 0;
    window.showSaveFilePicker = async () => {
      pickerCalls++;
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle('chosen.mp4', { create: true });
    };
  };
  try {
    context = await launch();
    const first = await openPage(null, '', '/k/', { context, beforeScript: picker });
    await first.evaluate(() => {
      fetch = async (url, options) => {
        requests.push(options.headers.Range);
        if (requests.length === 1) return response('video/mp4', 'bytes 0-2/9', 'abc');
        return new Response(new ReadableStream({ start(controller) {
          controller.enqueue(new TextEncoder().encode('d'));
        } }), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 3-5/9' } });
      };
      downloads.video('https://test.invalid/movie.mp4');
    });
    await first.waitForFunction(() => requests.length === 2);
    const ownBrowser = context.browser();
    const session = await ownBrowser.newBrowserCDPSession();
    const { processInfo } = await session.send('SystemInfo.getProcessInfo');
    const browserPid = processInfo.find(info => info.type === 'browser').id;
    assert.ok(Number.isInteger(browserPid) && browserPid !== process.pid);
    const disconnected = new Promise(resolve => ownBrowser.once('disconnected', resolve));
    // Kill only the test browser launched with the temporary profile above.
    process.kill(browserPid, 'SIGKILL');
    await disconnected;
    context = await launch();
    const second = await openPage(null, '', '/k/', { context, beforeScript: picker });
    assert.equal(await second.locator('.tel-task').getAttribute('data-state'), 'paused');
    assert.match(await second.locator('.tel-task-details').textContent(), /3 B \/ 9 B/);
    assert.deepEqual(await second.evaluate(() => requests), []);
    await second.evaluate(() => {
      fetch = async (url, options) => {
        const range = options.headers.Range;
        requests.push(range);
        if (range === 'bytes=0-2') return response('video/mp4', 'bytes 0-2/9', 'abc');
        if (range.startsWith('bytes=3-')) return response('video/mp4', 'bytes 3-5/9', 'def');
        if (range.startsWith('bytes=6-')) return response('video/mp4', 'bytes 6-8/9', 'ghi');
        throw new Error('Unexpected range ' + range);
      };
      document.querySelector('[data-action="retry"]').click();
    });
    await second.waitForFunction(() => document.querySelector('.tel-task').dataset.state === 'completed');
    assert.deepEqual(await second.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle('chosen.mp4');
      return { body: await (await handle.getFile()).text(), requests, saved: saved.length, errors, pickerCalls,
        displayedName: document.querySelector('.filename').textContent };
    }), { body: 'abcdefghi', requests: ['bytes=0-2', 'bytes=3-4194306', 'bytes=6-4194309'],
      saved: 0, errors: [], pickerCalls: 0, displayedName: 'chosen.mp4' });
  } finally {
    await context?.close().catch(() => {});
    await fs.rm(profile, { recursive: true, force: true });
  }
});
