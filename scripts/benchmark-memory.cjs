// Compare an isolated test browser's aggregate RSS against a Git revision.
// Example: TEL_TEST_BROWSER=/path/to/chrome node scripts/benchmark-memory.cjs d62c266 256
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright-core');
const baselineRef = process.argv[2] || 'd62c266'; // Version 2.1.1, before bounded binary caching.
const megabytes = Number(process.argv[3] || 256);
if (!Number.isSafeInteger(megabytes) || megabytes < 1) throw new Error('Payload size must be a positive integer in MiB');
const baseline = execFileSync('git', ['show', `${baselineRef}:src/tel_download.js`], { encoding: 'utf8' });
const current = fs.readFileSync('src/tel_download.js', 'utf8');

const run = async (label, source) => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.TEL_TEST_BROWSER ? { executablePath: process.env.TEL_TEST_BROWSER } : {}),
  });
  try {
    const session = await browser.newBrowserCDPSession();
    const page = await browser.newPage();
    const pageSession = await page.context().newCDPSession(page);
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<html><head></head><body></body></html>' }));
    await page.goto('https://web.telegram.org/k/');
    await page.evaluate(megabytes => {
      window.unsafeWindow = window;
      window.showSaveFilePicker = async () => (await navigator.storage.getDirectory())
        .getFileHandle('memory-benchmark.mp4', { create: true });
      window.fetch = async () => {
        const size = megabytes * 1024 * 1024;
        let remaining = size;
        return new Response(new ReadableStream({ async pull(controller) {
          if (!remaining) { controller.close(); return; }
          await new Promise(resolve => setTimeout(resolve, 2));
          const value = new Uint8Array(Math.min(256 * 1024, remaining)).fill(37);
          remaining -= value.length;
          controller.enqueue(value);
        } }), { status: 200, headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) } });
      };
    }, megabytes);
    await page.addScriptTag({ content: source.replace('logger.info("Completed script setup.");',
      'window.startBenchmark = () => tel_download_video("https://test.invalid/large.mp4");') });
    const rss = async () => {
      const { processInfo } = await session.send('SystemInfo.getProcessInfo');
      const pids = processInfo.map(info => info.id).join(',');
      return execFileSync('ps', ['-o', 'rss=', '-p', pids], { encoding: 'utf8' }).trim()
        .split(/\s+/).reduce((sum, value) => sum + Number(value), 0) / 1024;
    };
    const beforeMiB = await rss();
    const beforeHeap = await pageSession.send('Runtime.getHeapUsage');
    let peakMiB = beforeMiB;
    let peakHeapMiB = beforeHeap.usedSize / 1024 / 1024;
    let peakBackingMiB = typeof beforeHeap.backingStorageSize === 'number' ? beforeHeap.backingStorageSize / 1024 / 1024 : null;
    const sample = async () => {
      peakMiB = Math.max(peakMiB, await rss());
      const usage = await pageSession.send('Runtime.getHeapUsage');
      peakHeapMiB = Math.max(peakHeapMiB, usage.usedSize / 1024 / 1024);
      if (peakBackingMiB !== null) peakBackingMiB = Math.max(peakBackingMiB, usage.backingStorageSize / 1024 / 1024);
    };
    const started = Date.now();
    await page.evaluate(() => { startBenchmark().then(result => { window.benchmarkResult = result; }); });
    while (!await page.evaluate(() => Boolean(window.benchmarkResult))) {
      await sample();
      if (Date.now() - started > 180000) throw new Error('Benchmark timed out');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await sample();
    const result = await page.evaluate(() => benchmarkResult);
    if (result.state !== 'completed') throw new Error('Benchmark did not complete: ' + JSON.stringify(result));
    return { label, payloadMiB: megabytes, beforeMiB: Math.round(beforeMiB), peakMiB: Math.round(peakMiB),
      growthMiB: Math.round(peakMiB - beforeMiB), peakHeapMiB: Math.round(peakHeapMiB),
      peakBackingMiB: peakBackingMiB === null ? null : Math.round(peakBackingMiB),
      seconds: Math.round((Date.now() - started) / 100) / 10 };
  } finally { await browser.close(); }
};

(async () => {
  // RSS includes browser-managed buffers and mapped/shared pages; it is not
  // JavaScript heap usage or a universal upper bound for a real Telegram tab.
  for (const [label, source] of [[baselineRef, baseline], ['working-tree', current]]) {
    console.log(JSON.stringify(await run(label, source)));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
