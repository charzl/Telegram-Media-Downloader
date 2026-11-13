<div align="center">

# Telegram Video Downloader / Telegram Media Downloader

**Unlock Telegram: Download Anything You Like.**

[![GitHub License](https://img.shields.io/github/license/Neet-Nestor/Telegram-Media-Downloader)](./LICENSE)
[![Greasy Fork Version](https://img.shields.io/greasyfork/v/446342-telegram-media-downloader)](https://greasyfork.org/scripts/446342-telegram-media-downloader)
[![Greasy Fork Downloads](https://img.shields.io/greasyfork/dt/446342-telegram-media-downloader)](https://greasyfork.org/scripts/446342-telegram-media-downloader)

</div>

## Overview
This user script unlocks and enables download of images, GIFs, audios, and videos in Telegram webapps from chats, stories, and even private channels where downloading is disabled or restricted.

(Note: some features are only available for specific Telegram webapp version. e.g. Audio message download is only available for the K webapp version.)

### What are user scripts?
User scripts put you in control of your  browsing experience. Once installed, they automatically make the sites you visit better by adding features, making them easier to use, or taking out the annoying bits. The user scripts on Greasy Fork were written by other users and posted to share with the world. They're free to install and easy to use.

## Installation
### Greasy Fork
1. install a user script manager

    To use user scripts you need to first install a user script manager. Which user script manager you can use depends on which browser you use.

    - Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Firefox: [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/), [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/), or [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/)
    - Safari: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
    - Microsoft Edge: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Opera: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Maxthon: [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)

    (Note, If you are using Tampermonkey extension in a Chrome-based browser, following [instructions](https://www.tampermonkey.net/faq.php#Q209) to enable Developer Mode.)

2. Install this script by visiting Greasy Fork:
    https://greasyfork.org/scripts/446342-telegram-media-downloader

### Manual Installation
1. install a user script manager

    To use user scripts you need to first install a user script manager. Which user script manager you can use depends on which browser you use.

    - Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Firefox: [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/), [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo), or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Safari: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
    - Microsoft Edge: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Opera: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)
    - Maxthon: [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)

    (Note, If you are using Tampermonkey extension in a Chrome-based browser, following [instructions](https://www.tampermonkey.net/faq.php#Q209) to enable Developer Mode.)
    
2. Open Tampermonkey Dashboard, drag & drop src/tel_download.js into it and clicks the "install" button

## How to Use
This script only works on Telegram Webapp.

For channels and chats that allow saving content, this script will have no effect. Please just use the official download button provided by the telegram webapp instead.

For channels and chats that disable downloading and restrict saving content, this script will add the download button back for images, GIFs and videos.

![Image Download](https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2VjNmU2ZDM0YTFlOWY4YTMzZDZmNjVlMDE2ODQ4OGY4N2E3MDFkNSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/lqCVcw0pCd2VA3zqoE/giphy.gif)
![GIF Download](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzYwMzM3ZTMzYmI1MzA4M2EyYmY0NTFlOTg4OWFhNjhjNDk5YTkzYiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/wnYzW4vwpPdeuo62nQ/giphy.gif)
![Video Download](https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXcxYnJxaXMxcW05YW5rZ2YzZzE0bTU4aTBwYXI1N3pmdnVzbDFrdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/EEPbblwmSpteAmwLls/giphy.gif)
![Story Download](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Z5Y2VzM2QzbW1xc3ZwNTQ2N3Q0a3lnanpxdW55c2Qzajl5NXZsaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xJFjBGi8isHPR5cuHl/giphy.gif)

Downloads started by this script appear in a task panel at the bottom-right, including videos, images, and audio. Telegram's own download controls continue to use Telegram's interface.

### Resume after a browser restart (this fork)

Downloads stream media into IndexedDB in binary blocks of at most 1 MiB. The progress checkpoint advances only after a complete response validates and all its blocks have been committed; incomplete blocks beyond that checkpoint are discarded when recovering. If the browser closes unexpectedly, reopen Telegram Web in the **same browser profile and on the same domain**. Unfinished tasks reappear in the download panel; click **Resume** (or **Retry** if no part completed yet). Restored tasks wait for this user action; active transfers retry temporary failures automatically as described below. Native save-file handles are remembered too: Resume reuses the original file, asking to renew access only when the browser requires it. **Change save location** explicitly selects another destination while keeping the same cached parts. Tasks created before version 2.1.1 have no remembered file handle and need one destination selection when first resumed.

Resume does not download completed parts from the network again. Direct file saving rebuilds the output locally from cached bytes, because an interrupted browser file writer may never have committed its temporary output. Only the missing parts and a small verification overlap are fetched. If the original file cannot be opened, the checkpoint is kept and the task offers a different save location instead of silently handing the file to another destination.

Only complete, validated responses count as checkpoints. Range requests ask for 4 MiB at a time, so an interrupted response is downloaded again. A small overlap check and any available HTTP validators guard against appending bytes from a changed source. If a Telegram link expires, open the original media and click its download button again: URLs carrying the same Telegram document identity reconnect to the saved task. Matching by filename alone is deliberately avoided.

### Automatic retries

An active transfer retries a failed request up to **three times**, normally after **1, 2, and 4 seconds** (four attempts including the initial request). This applies to network/read failures, inactivity timeouts, incomplete or empty responses, HTTP 408/429, and HTTP 5xx. Each successfully validated response resets the budget. The panel shows the attempt number and wait time; **Cancel** also cancels a pending retry. Resume overlap checks use the same bounded retry policy.

Retries keep completed parts. Before repeating an interrupted response, uncommitted cache blocks are removed and any partial file writes are truncated back to the saved offset. A browser file writer that cannot rewind safely stops instead of appending duplicate bytes. No save picker is reopened for an automatic retry.

Permission and disk errors, expired/forbidden URLs, changed media, and invalid ranges or MIME types require manual action. A server's `Retry-After` value is honored when it is no more than 60 seconds; a longer requested wait leaves the checkpoint for later manual continuation. When all automatic attempts fail, the existing **Resume/Retry** action remains available. Automatic retries do not restart a restored task without a user click.

Resume requires a source that still supports partial responses. A complete HTTP 200 response can be saved, but an interrupted non-range response must start again. Incomplete `blob:` URLs cannot survive a browser restart; fully cached media can still be saved without contacting the source.

Cached media occupies browser storage in addition to any destination file. The script requests persistent storage, but browser approval and available disk space determine whether it can be retained. Storage failures stop the task with an error while preserving earlier committed parts. Private browsing, clearing Telegram's site data, changing profiles/domains, or browser storage eviction can remove the cache. **Cancel** and removing an inactive task discard its saved parts; hiding a running card keeps its task. Successfully saved or handed-off downloads release their resume cache. Browser-download exports use temporary private disk files; those files remain available to the download manager and are cleaned up on a later visit once over 24 hours old. Unfinished resume tasks are never removed by this age-based export cleanup.

### Supported Webapp Versions
There are 2 different versions of telegram webapps:
- https://webk.telegram.org / https://web.telegram.org/k/ (**Recommended**)
- https://webz.telegram.org / https://web.telegram.org/a/

This script should work on both versions of webapp, but some features are only available in the /k/ version (such as voice message downloads). If certain features are not working, switching to the /k/ version is recommended.

### Check Downloading Progress
The task panel shows the filename, received size, and download speed. When the total size is known, it also shows a percentage. Up to two files download at once; additional files wait in the queue. Clicking the same media again focuses its active task.

- **Hide** collapses the panel. **×** hides a running task card without stopping it; removing an inactive task also deletes its saved parts.
- **Cancel** stops a queued or active download and discards both unfinished file writes and saved parts. Cancellation is disabled while the completed file is being committed.
- **Resume** continues an interrupted task from its last saved response. **Retry** starts again if there are no saved bytes. If the media URL has expired, reopen the media and use its download button again.
- **Completed** means direct file saving succeeded. **Sent to browser** means the file was handed to the browser's download manager; check that manager for the final save result.

Transfers run while Telegram is open; after a browser restart, resume them manually from the restored panel. Recovery requires IndexedDB and the Web Locks API in the browser. Direct file output and cache writes apply backpressure instead of accumulating the full response. Without direct saving, private disk storage is used to assemble the browser download. If private disk storage is unavailable, only files up to 8 MiB use the in-memory fallback; larger files keep their checkpoint and ask for a direct save location. These bounds cover the script's working buffers, not the browser's own network, database, media-player, or filesystem caches. Errors are also available in the [DevTools console](https://developer.chrome.com/docs/devtools/open/).

### Interface Language

The download UI supports English, Simplified Chinese, Traditional Chinese, Russian, and Burmese. It uses the first supported language in your browser's language preferences, falling back to English. Chinese script and regional variants are recognized, including Traditional Chinese for Taiwan, Hong Kong, and Macau.

Open the gear-shaped **Settings** button in the download panel, then use **Interface language** to choose a language or return to **Browser language**. Changes apply immediately to existing tasks, errors, and the script's download buttons without interrupting downloads. The preference is saved on the current Telegram web origin and shared across its tabs; if browser storage is blocked, it lasts for the current page only. Browser-provided dialogs and technical error details keep their original language.

## Contributing

We welcome contributions from the community! If you’d like to contribute to Telegram Media Downloader, follow these steps:

### Reporting Issues
If you find a bug, compatibility issue, or have a feature request, please:

1. Check if the issue has already been reported in the Issues tab.
2. If not, create a new issue with a clear title and description. Attach screenshots or logs if applicable.

### Submitting Pull Requests

1. **Fork the repository**: Click on the "Fork" button in the top-right of the repo.

2. **Clone your fork**:

    ```bash
    git clone https://github.com/YOUR-USERNAME/Telegram-Media-Downloader.git
    cd Telegram-Media-Downloader
    ```

3. **Create a new branch** for your feature or bugfix:

    ```bash
    git checkout -b feature-or-bugfix-name
    ```

    Make your changes and ensure the script still works correctly on supported Telegram webapps.

4. **Make your changes** and ensure the script still works correctly on supported Telegram webapps.

5. **Commit your changes** with a descriptive message:

    ```bash
    git commit -m "Add feature/fix issue: Brief description"
    ```

6. **Push to your fork:**

    ```bash
    git push origin feature-or-bugfix-name
    ```

7. **Submit a Pull Request (PR):**

    - Go to the original repository: [Neet-Nestor/Telegram-Media-Downloader](https://github.com/Neet-Nestor/Telegram-Media-Downloader).

    - Click "New Pull Request" and select your branch.

    - Add a description of your changes and submit.

### Development Guidelines
- Keep your code clean and well-documented.
- Follow the existing coding style.
- Test your changes on both Telegram WebK and WebZ versions.
- Ensure compatibility with major user script managers like Tampermonkey and Violentmonkey.

### Automated Tests

Use Node.js 22 or newer to run the regression tests:

```bash
npm ci
npx playwright-core install chromium
npm run check
npm test
```

To use an existing Chromium/Chrome installation, set `TEL_TEST_BROWSER` to its executable path instead of installing Chromium. Tests run in an isolated browser profile with simulated Telegram pages and network responses; no Telegram account is needed. The userscript itself has no npm runtime dependencies.

GitHub Actions runs these checks on every push and pull request. Browser fixtures cover download behavior and known failure cases, while live `/a/` and `/k/` checks remain useful when Telegram changes its markup.

To compare memory usage against version 2.1.1 on macOS/Linux, run `node scripts/benchmark-memory.cjs d62c266 256` (and set `TEL_TEST_BROWSER` if needed). It streams a synthetic 256 MiB HTTP 200 response to an isolated browser file, deliberately ignoring Range. The report samples aggregate browser-process RSS, JavaScript heap, and array-buffer backing storage. RSS includes mapped/shared pages and browser-managed buffers; results vary with browser version and garbage collection and are not a universal memory limit.

### Help with Translations
We want Telegram Media Downloader to be accessible to users worldwide! If you’d like to help translate the script’s Greasy Fork page, follow these steps:

For the download UI, add the language's native name to `UI_LANGUAGES` and its messages to `UI_MESSAGES` in [`src/tel_download.js`](src/tel_download.js). Keep every English message key and its `{placeholders}`; add regional or script matching to `matchLanguage` if needed. Keep translations as plain text. Run `npm test` to check message coverage, placeholders, language switching, and download regressions. Missing messages fall back to English.

#### How to Contribute a Translation

Check for existing translations in the [`docs/greasyfork`](/docs/greasyfork/) folder of the repository.

Add a new file in docs/<language-code>.md, using the appropriate language code (e.g., docs/fr-FR.md for French, docs/de-DE.md for German).

Translate the content from [`docs/greasyfork/en-US.md`](/docs/greasyfork/en-US.md) into your language while keeping the formatting intact. Submit a Pull Request following the steps in the [Submitting Pull Requests](#submitting-pull-requests) section above.

#### Language Codes
Use standard IETF Language Tag (e.g., `es-ES` for Spanish, `ja-JP` for Japanese). You can find a full list of codes [here](https://docs.dyspatch.io/localization/supported_languages/).

## Support Author
If you like this script, you can support me via [Venmo](https://venmo.com/u/NeetNestor) or [buy me a coffee](https://ko-fi.com/neetnestor) :)
