// ==UserScript==
// @name         Telegram Media Downloader
// @name:en      Telegram Media Downloader
// @name:zh-CN   Telegram 受限图片视频下载器
// @name:zh-TW   Telegram 受限圖片影片下載器
// @name:ru      Telegram: загрузчик медиафайлов
// @version      2.1.3
// @namespace    https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @updateURL    https://raw.githubusercontent.com/charzl/Telegram-Media-Downloader/main/src/tel_download.js
// @downloadURL  https://raw.githubusercontent.com/charzl/Telegram-Media-Downloader/main/src/tel_download.js
// @description  Download images, GIFs, videos, and voice messages on the Telegram webapp from private channels that disable downloading and restrict saving content
// @description:en  Download images, GIFs, videos, and voice messages on the Telegram webapp from private channels that disable downloading and restrict saving content
// @description:ru Загружайте изображения, GIF-файлы, видео и голосовые сообщения в веб-приложении Telegram из частных каналов, которые отключили загрузку и ограничили сохранение контента
// @description:zh-CN 从禁止下载的Telegram频道中下载图片、视频及语音消息
// @description:zh-TW 從禁止下載的 Telegram 頻道中下載圖片、影片及語音訊息
// @author       Nestor Qin
// @license      GNU GPLv3
// @website      https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @match        https://web.telegram.org/*
// @match        https://webk.telegram.org/*
// @match        https://webz.telegram.org/*
// @icon         https://img.icons8.com/color/452/telegram-app--v5.png
// ==/UserScript==


(function () {
  // Keep translations in the userscript so installation needs no extra files.
  const UI_LANGUAGES = {
    en: "English", "zh-CN": "简体中文", "zh-TW": "繁體中文", ru: "Русский", my: "မြန်မာ",
  };
  const UI_MESSAGES = {
    en: {
      retrying: "Retrying ({attempt}/{max})", retryWait: "Waiting {seconds}s before next attempt",
      retryExhausted: "Automatic retries failed. Resume manually when ready.", retryLater: "The server requested a longer wait. Please resume later.",
      errorNetwork: "Network request failed: {message}",
      errorMemorySave: "This browser cannot save large files with low memory use. Choose a save location or use a browser with direct file saving.",
      changeLocation: "Change save location", errorFilePermission: "Allow access to the original file to resume, or choose another save location.",
      errorDestination: "Cannot reopen the original file: {message}. Choose another save location to continue.",
      paused: "Ready to resume", resume: "Resume", resumeHint: "Saved parts survive browser restarts. If the link expired, open the original media and click Download again.",
      errorStorage: "Cannot save resume data: {message}", errorCache: "Saved download data is missing or damaged. Remove this task and start again.",
      errorBusy: "This download is active in another tab. Try again when it stops.", errorSourceChanged: "The media changed. Remove this task and start again to avoid a corrupt file.",
      downloads: "Downloads", downloadsCount: "Downloads ({count})", mediaDownloads: "Media downloads",
      download: "Download", loadingMedia: "Media is loading", hide: "Hide", show: "Show",
      dismiss: "Dismiss download", progress: "Download progress", cancel: "Cancel", retry: "Retry",
      settings: "Settings", language: "Interface language", automatic: "Browser language",
      preparing: "Preparing", queued: "Queued", downloading: "Downloading", saving: "Saving",
      completed: "Completed", handedOff: "Sent to browser", failed: "Failed", cancelled: "Cancelled",
      rate: "{speed}/s", video: "video", audio: "audio", image: "image", unknownType: "an unknown file type",
      errorHttp: "Download request failed (HTTP {status})",
      errorMime: "Expected {kind}, received {mime}",
      errorRangeMissing: "Missing or invalid Content-Range",
      errorRangeInconsistent: "Inconsistent media range; download stopped to avoid a corrupt file",
      errorRangeUnsupported: "Server stopped supporting partial downloads",
      errorLength: "Invalid Content-Length", errorEmpty: "Empty media response",
      errorTooLarge: "Media response exceeds the expected size",
      errorIncomplete: "Incomplete media response; received byte count does not match",
      errorTimeout: "No data received for 30 seconds. Please retry.",
      errorUnexpected: "Download failed: {message}",
    },
    "zh-CN": {
      retrying: "自动重试（{attempt}/{max}）", retryWait: "等待 {seconds} 秒后重试",
      retryExhausted: "自动重试后仍未成功，请稍后手动继续。", retryLater: "服务器要求等待较长时间，请稍后手动继续。",
      errorNetwork: "网络请求失败：{message}",
      errorMemorySave: "当前浏览器无法以低内存方式保存大文件。请选择保存位置，或使用支持直接保存文件的浏览器。",
      changeLocation: "更换保存位置", errorFilePermission: "请允许访问原文件以继续下载，或选择其他保存位置。",
      errorDestination: "无法重新打开原文件：{message}。请选择其他保存位置以继续下载。",
      paused: "可继续下载", resume: "继续下载", resumeHint: "已保存的分段可在浏览器重启后继续。链接过期时，请打开原媒体并再次点击下载。",
      errorStorage: "无法保存续传数据：{message}", errorCache: "已保存的下载数据缺失或损坏，请移除此任务后重新下载。",
      errorBusy: "另一个标签页正在处理此下载，请稍后重试。", errorSourceChanged: "媒体内容已改变，请移除此任务后重新下载，避免文件损坏。",
      downloads: "下载", downloadsCount: "下载（{count}）", mediaDownloads: "媒体下载",
      download: "下载", loadingMedia: "媒体正在加载", hide: "收起", show: "展开",
      dismiss: "移除下载卡片", progress: "下载进度", cancel: "取消", retry: "重试",
      settings: "设置", language: "界面语言", automatic: "跟随浏览器",
      preparing: "准备中", queued: "排队中", downloading: "下载中", saving: "保存中",
      completed: "已完成", handedOff: "已交给浏览器", failed: "失败", cancelled: "已取消",
      rate: "{speed}/秒", video: "视频", audio: "音频", image: "图片", unknownType: "未知文件类型",
      errorHttp: "下载请求失败（HTTP {status}）",
      errorMime: "预期为{kind}，实际收到 {mime}",
      errorRangeMissing: "缺少 Content-Range，或其格式无效",
      errorRangeInconsistent: "媒体数据范围不一致；已停止下载，避免保存损坏的文件",
      errorRangeUnsupported: "服务器不再支持分段下载",
      errorLength: "Content-Length 无效", errorEmpty: "媒体响应为空",
      errorTooLarge: "收到的媒体数据超出预期大小",
      errorIncomplete: "媒体数据不完整；收到的字节数与预期不符",
      errorTimeout: "已连续 30 秒未收到数据，请重试。",
      errorUnexpected: "下载失败：{message}",
    },
    "zh-TW": {
      retrying: "自動重試（{attempt}/{max}）", retryWait: "等待 {seconds} 秒後重試",
      retryExhausted: "自動重試後仍未成功，請稍後手動繼續。", retryLater: "伺服器要求等待較長時間，請稍後手動繼續。",
      errorNetwork: "網路請求失敗：{message}",
      errorMemorySave: "目前瀏覽器無法以低記憶體方式儲存大檔案。請選擇儲存位置，或使用支援直接儲存檔案的瀏覽器。",
      changeLocation: "更換儲存位置", errorFilePermission: "請允許存取原檔案以繼續下載，或選擇其他儲存位置。",
      errorDestination: "無法重新開啟原檔案：{message}。請選擇其他儲存位置以繼續下載。",
      paused: "可繼續下載", resume: "繼續下載", resumeHint: "已儲存的分段可在瀏覽器重新啟動後繼續。連結過期時，請開啟原媒體並再次點擊下載。",
      errorStorage: "無法儲存續傳資料：{message}", errorCache: "已儲存的下載資料遺失或損壞，請移除此工作後重新下載。",
      errorBusy: "另一個分頁正在處理此下載，請稍後重試。", errorSourceChanged: "媒體內容已變更，請移除此工作後重新下載，避免檔案損壞。",
      downloads: "下載", downloadsCount: "下載（{count}）", mediaDownloads: "媒體下載",
      download: "下載", loadingMedia: "媒體正在載入", hide: "收合", show: "展開",
      dismiss: "移除下載卡片", progress: "下載進度", cancel: "取消", retry: "重試",
      settings: "設定", language: "介面語言", automatic: "跟隨瀏覽器",
      preparing: "準備中", queued: "排隊中", downloading: "下載中", saving: "儲存中",
      completed: "已完成", handedOff: "已交給瀏覽器", failed: "失敗", cancelled: "已取消",
      rate: "{speed}/秒", video: "影片", audio: "音訊", image: "圖片", unknownType: "未知檔案類型",
      errorHttp: "下載請求失敗（HTTP {status}）",
      errorMime: "預期為{kind}，實際收到 {mime}",
      errorRangeMissing: "缺少 Content-Range，或其格式無效",
      errorRangeInconsistent: "媒體資料範圍不一致；已停止下載，避免儲存損壞的檔案",
      errorRangeUnsupported: "伺服器不再支援分段下載",
      errorLength: "Content-Length 無效", errorEmpty: "媒體回應為空",
      errorTooLarge: "收到的媒體資料超出預期大小",
      errorIncomplete: "媒體資料不完整；收到的位元組數與預期不符",
      errorTimeout: "已連續 30 秒未收到資料，請重試。",
      errorUnexpected: "下載失敗：{message}",
    },
    ru: {
      retrying: "Повтор ({attempt}/{max})", retryWait: "Следующая попытка через {seconds} с",
      retryExhausted: "Автоматические попытки исчерпаны. Продолжите вручную позже.", retryLater: "Сервер просит подождать дольше. Продолжите позже.",
      errorNetwork: "Ошибка сети: {message}",
      errorMemorySave: "Браузер не может сохранять большие файлы с малым расходом памяти. Выберите место сохранения или браузер с прямой записью файлов.",
      changeLocation: "Изменить место сохранения", errorFilePermission: "Разрешите доступ к исходному файлу или выберите другое место сохранения.",
      errorDestination: "Не удалось открыть исходный файл: {message}. Выберите другое место сохранения.",
      paused: "Можно продолжить", resume: "Продолжить", resumeHint: "Сохранённые части доступны после перезапуска браузера. Если ссылка устарела, откройте исходное медиа и снова нажмите «Скачать».",
      errorStorage: "Не удалось сохранить данные: {message}", errorCache: "Сохранённые данные отсутствуют или повреждены. Удалите задачу и начните заново.",
      errorBusy: "Загрузка выполняется в другой вкладке. Повторите позже.", errorSourceChanged: "Медиа изменилось. Удалите задачу и начните заново, чтобы избежать повреждения файла.",
      downloads: "Загрузки", downloadsCount: "Загрузки ({count})", mediaDownloads: "Загрузка медиа",
      download: "Скачать", loadingMedia: "Медиа загружается", hide: "Свернуть", show: "Развернуть",
      dismiss: "Убрать карточку загрузки", progress: "Ход загрузки", cancel: "Отменить", retry: "Повторить",
      settings: "Настройки", language: "Язык интерфейса", automatic: "Язык браузера",
      preparing: "Подготовка", queued: "В очереди", downloading: "Загрузка", saving: "Сохранение",
      completed: "Завершено", handedOff: "Передано браузеру", failed: "Ошибка", cancelled: "Отменено",
      rate: "{speed}/с", video: "видео", audio: "аудио", image: "изображение", unknownType: "неизвестный тип файла",
      errorHttp: "Ошибка запроса загрузки (HTTP {status})",
      errorMime: "Ожидалось: {kind}. Получено: {mime}",
      errorRangeMissing: "Заголовок Content-Range отсутствует или некорректен",
      errorRangeInconsistent: "Диапазоны данных не совпадают; загрузка остановлена во избежание повреждения файла",
      errorRangeUnsupported: "Сервер больше не поддерживает загрузку по частям",
      errorLength: "Некорректный Content-Length", errorEmpty: "Получен пустой ответ с медиа",
      errorTooLarge: "Размер полученных данных превышает ожидаемый",
      errorIncomplete: "Данные неполные; число полученных байтов не совпадает с ожидаемым",
      errorTimeout: "Нет данных в течение 30 секунд. Повторите попытку.",
      errorUnexpected: "Не удалось скачать: {message}",
    },
    my: {
      retrying: "အလိုအလျောက် ထပ်စမ်းနေသည် ({attempt}/{max})", retryWait: "{seconds} စက္ကန့်နောက် ထပ်စမ်းမည်",
      retryExhausted: "အလိုအလျောက် ထပ်စမ်းခြင်း မအောင်မြင်ပါ။ နောက်မှ ကိုယ်တိုင် ဆက်လုပ်ပါ။", retryLater: "ဆာဗာက ပိုကြာကြာစောင့်ရန် တောင်းဆိုထားသည်။ နောက်မှ ဆက်လုပ်ပါ။",
      errorNetwork: "ကွန်ရက် တောင်းဆိုမှု မအောင်မြင်ပါ: {message}",
      errorMemorySave: "ဤဘရောက်ဇာတွင် ဖိုင်ကြီးများကို မမ်မိုရီနည်းနည်းဖြင့် မသိမ်းနိုင်ပါ။ သိမ်းဆည်းမည့်နေရာ ရွေးပါ သို့မဟုတ် ဖိုင်တိုက်ရိုက်သိမ်းနိုင်သော ဘရောက်ဇာကို သုံးပါ။",
      changeLocation: "သိမ်းဆည်းမည့်နေရာ ပြောင်းရန်", errorFilePermission: "ဆက်လုပ်ရန် မူရင်းဖိုင်ကို ဝင်ရောက်ခွင့်ပြုပါ သို့မဟုတ် အခြားသိမ်းဆည်းမည့်နေရာကို ရွေးပါ။",
      errorDestination: "မူရင်းဖိုင်ကို ပြန်မဖွင့်နိုင်ပါ: {message}။ အခြားသိမ်းဆည်းမည့်နေရာကို ရွေးပါ။",
      paused: "ဆက်လက်ဒေါင်းလုဒ်လုပ်နိုင်သည်", resume: "ဆက်လုပ်ရန်", resumeHint: "ဘရောက်ဇာကို ပြန်ဖွင့်ပြီးနောက် သိမ်းထားသောအပိုင်းများမှ ဆက်လုပ်နိုင်သည်။ လင့်ခ်သက်တမ်းကုန်ပါက မူရင်းမီဒီယာကိုဖွင့်ပြီး ဒေါင်းလုဒ်ကို ထပ်နှိပ်ပါ။",
      errorStorage: "ဆက်လုပ်ရန်ဒေတာကို မသိမ်းနိုင်ပါ: {message}", errorCache: "သိမ်းထားသောဒေတာ ပျောက်နေသည် သို့မဟုတ် ပျက်စီးနေသည်။ ဤလုပ်ငန်းကို ဖယ်ရှားပြီး ပြန်စပါ။",
      errorBusy: "ဤဒေါင်းလုဒ်ကို အခြားတဘ်တွင် လုပ်ဆောင်နေသည်။ နောက်မှ ထပ်စမ်းပါ။", errorSourceChanged: "မီဒီယာ ပြောင်းလဲသွားသည်။ ဖိုင်မပျက်စီးစေရန် ဤလုပ်ငန်းကို ဖယ်ရှားပြီး ပြန်စပါ။",
      downloads: "ဒေါင်းလုဒ်များ", downloadsCount: "ဒေါင်းလုဒ်များ ({count})", mediaDownloads: "မီဒီယာဒေါင်းလုဒ်များ",
      download: "ဒေါင်းလုဒ်လုပ်ရန်", loadingMedia: "မီဒီယာကို ဖွင့်နေသည်", hide: "ဖျောက်ရန်", show: "ပြရန်",
      dismiss: "ဒေါင်းလုဒ်ကတ်ကို ဖယ်ရှားရန်", progress: "ဒေါင်းလုဒ်တိုးတက်မှု", cancel: "ပယ်ဖျက်ရန်", retry: "ထပ်စမ်းရန်",
      settings: "ဆက်တင်များ", language: "မျက်နှာပြင်ဘာသာစကား", automatic: "ဘရောက်ဇာဘာသာစကား",
      preparing: "ပြင်ဆင်နေသည်", queued: "စောင့်ဆိုင်းနေသည်", downloading: "ဒေါင်းလုဒ်လုပ်နေသည်", saving: "သိမ်းဆည်းနေသည်",
      completed: "ပြီးစီးပြီ", handedOff: "ဘရောက်ဇာသို့ လွှဲပေးပြီး", failed: "မအောင်မြင်ပါ", cancelled: "ပယ်ဖျက်ပြီး",
      rate: "{speed}/စက္ကန့်", video: "ဗီဒီယို", audio: "အသံ", image: "ပုံ", unknownType: "အမည်မသိ ဖိုင်အမျိုးအစား",
      errorHttp: "ဒေါင်းလုဒ်တောင်းဆိုမှု မအောင်မြင်ပါ (HTTP {status})",
      errorMime: "မျှော်လင့်ထားသည်မှာ {kind}၊ ရရှိသည်မှာ {mime}",
      errorRangeMissing: "Content-Range မရှိပါ သို့မဟုတ် မမှန်ကန်ပါ",
      errorRangeInconsistent: "မီဒီယာဒေတာအပိုင်းများ မကိုက်ညီပါ။ ဖိုင်မပျက်စီးစေရန် ဒေါင်းလုဒ်ကို ရပ်လိုက်သည်",
      errorRangeUnsupported: "ဆာဗာသည် အပိုင်းလိုက်ဒေါင်းလုဒ်ကို မပံ့ပိုးတော့ပါ",
      errorLength: "Content-Length မမှန်ကန်ပါ", errorEmpty: "မီဒီယာတုံ့ပြန်မှုတွင် ဒေတာမပါပါ",
      errorTooLarge: "ရရှိသော မီဒီယာဒေတာသည် မျှော်လင့်ထားသည့် ပမာဏထက် ကျော်လွန်နေသည်",
      errorIncomplete: "မီဒီယာဒေတာ မပြည့်စုံပါ။ ရရှိသော ဘိုက်အရေအတွက် မကိုက်ညီပါ",
      errorTimeout: "စက္ကန့် ၃၀ ကြာ ဒေတာမရရှိပါ။ ထပ်စမ်းပါ။",
      errorUnexpected: "ဒေါင်းလုဒ် မအောင်မြင်ပါ: {message}",
    },
  };
  const LANGUAGE_STORAGE_KEY = "tel-media-downloader-language";
  const matchLanguage = (tag) => {
    const parts = String(tag || "").toLowerCase().replace(/_/g, "-").split("-");
    if (parts[0] === "zh") {
      if (parts.includes("hant")) return "zh-TW";
      if (parts.includes("hans")) return "zh-CN";
      return parts.some(part => ["tw", "hk", "mo"].includes(part)) ? "zh-TW" : "zh-CN";
    }
    return Object.hasOwn(UI_LANGUAGES, parts[0]) ? parts[0] : null;
  };
  const readLanguagePreference = () => {
    try {
      const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return Object.hasOwn(UI_LANGUAGES, value) ? value : "auto";
    } catch {
      return "auto";
    }
  };
  let languagePreference = readLanguagePreference();
  const resolveLanguage = () => languagePreference !== "auto" ? languagePreference :
    (navigator.languages || [navigator.language]).map(matchLanguage).find(Boolean) || "en";
  let uiLanguage = resolveLanguage();
  const translate = (language, key, params = {}) =>
    (UI_MESSAGES[language]?.[key] ?? UI_MESSAGES.en[key] ?? key).replace(
      /\{(\w+)\}/g, (placeholder, name) => Object.hasOwn(params, name) ? String(params[name]) : placeholder
    );
  const t = (key, params) => translate(uiLanguage, key, params);
  let integerFormat = new Intl.NumberFormat(uiLanguage, { maximumFractionDigits: 0 });
  let decimalFormat = new Intl.NumberFormat(uiLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const downloadError = (key, params = {}, name = "Error") => {
    // Keep diagnostic messages stable; render the structured error in the current UI language.
    const diagnostic = { ...params };
    if (key === "errorMime") {
      diagnostic.kind = translate("en", params.kind);
      diagnostic.mime ||= translate("en", "unknownType");
    }
    return Object.assign(new Error(translate("en", key, diagnostic)), { name, translationKey: key, params });
  };
  const formatDownloadError = (error) => {
    if (!error) return "";
    if (!error.translationKey) return t("errorUnexpected", { message: error.message || String(error) });
    const params = { ...error.params };
    if (error.translationKey === "errorMime") {
      params.kind = t(params.kind);
      params.mime ||= t("unknownType");
    }
    return t(error.translationKey, params);
  };
  const localizeDownloadButton = (button, loading = false) => {
    const label = t(loading ? "loadingMedia" : "download");
    if (button.title !== label) button.title = label;
    if (button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);
    if (button.lang !== uiLanguage) button.lang = uiLanguage;
  };
  const logger = {
    info: (message, fileName = null) => {
      console.log(
        `[Tel Download] ${fileName ? `${fileName}: ` : ""}${message}`
      );
    },
    error: (message, fileName = null) => {
      console.error(
        `[Tel Download] ${fileName ? `${fileName}: ` : ""}${message}`
      );
    },
  };
  // WebK's icon font code points change between releases. Only learn the
  // download glyph from native buttons in this page, never from our own buttons.
  const WEB_K_DOWNLOAD_BUTTON_SELECTOR = [
    "button.quality-download-options-button-menu",
    "button.tgico-download",
    'button[aria-label="Download"]',
    'button[title="Download"]',
  ].join(", ");
  const getWebKDownloadButtons = (container) =>
    Array.from(container.querySelectorAll(WEB_K_DOWNLOAD_BUTTON_SELECTOR)).filter(
      (button) =>
        !button.matches(".tel-download, ._tel_download_button_pinned_container")
    );
  const isUsableDownloadButton = (button) => {
    if (button.disabled || button.getAttribute("aria-disabled") === "true" ||
        button.hidden || button.classList.contains("hide") || button.closest("[inert]")) {
      return false;
    }
    const style = getComputedStyle(button);
    return style.visibility !== "hidden" && style.visibility !== "collapse" &&
      button.getClientRects().length > 0;
  };
  let webKDownloadGlyph = "";
  const createWebKDownloadIcon = (buttonIcon = false) =>
    `<span class="tgico tel-download-icon${buttonIcon ? " button-icon" : ""}" aria-hidden="true">${
      webKDownloadGlyph ||
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/></svg>'
    }</span>`;
  const refreshWebKDownloadIcon = () => {
    for (const button of getWebKDownloadButtons(document)) {
      const glyph = button.querySelector(":scope > .tgico")?.textContent.trim();
      // Ignore labels or menu contents; the icon must be one private-use glyph.
      if (!glyph || !/^[\uE000-\uF8FF]$/.test(glyph)) continue;
      if (glyph !== webKDownloadGlyph) {
        // Keep this in memory only: a new page load may use a different font.
        webKDownloadGlyph = glyph;
        document.querySelectorAll(".tel-download-icon").forEach((icon) => {
          icon.textContent = glyph;
        });
      }
      return;
    }
  };
  const contentRangeRegex = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i;
  const REFRESH_DELAY = 2000;
  const DOWNLOAD_CHUNK_SIZE = 4 * 1024 * 1024;
  const CACHE_BLOCK_SIZE = 1024 * 1024;
  const MEMORY_EXPORT_LIMIT = 8 * 1024 * 1024;
  const MAX_AUTO_RETRIES = 3;
  const AUTO_RETRY_BASE_DELAY = 1000;
  const MAX_AUTO_RETRY_DELAY = 60000;
  const fetchMediaPart = async (url, offset, total, kind, options = {}) => {
    const controller = new AbortController();
    const abort = () => controller.abort(options.signal.reason);
    let timer;
    let reader;
    const resetTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => controller.abort(
        downloadError("errorTimeout", {}, "TimeoutError")
      ), 30000);
    };
    const checkAborted = () => {
      if (controller.signal.aborted) throw controller.signal.reason;
    };
    const networkRequest = async operation => {
      try { return await operation(); }
      catch (error) {
        checkAborted();
        throw Object.assign(downloadError("errorNetwork", { message: error.message || String(error) }), { retryable: true });
      }
    };
    if (options.signal?.aborted) abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    resetTimeout();
    try {
      checkAborted();
      const res = await networkRequest(() => fetch(url, {
        headers: url.startsWith("blob:") ? {} : {
          Range: `bytes=${offset}-${options.end ?? offset + DOWNLOAD_CHUNK_SIZE - 1}`,
          ...(options.validator ? { "If-Range": options.validator.value } : {}),
        },
        signal: controller.signal,
      }));
      if (res.status !== 200 && res.status !== 206) {
        const error = downloadError("errorHttp", { status: res.status });
        error.retryable = [408, 429].includes(res.status) || (res.status >= 500 && res.status <= 599);
        const after = res.headers.get("Retry-After")?.trim();
        const wait = after && (/^\d+$/.test(after) ? Number(after) * 1000 : Date.parse(after) - Date.now());
        if (Number.isFinite(wait) && wait >= 0) error.retryAfterMs = wait;
        throw error;
      }
      let mime = res.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
      if (kind !== "image" && (!mime || mime === "application/octet-stream")) {
        const metadataMime = getMediaMetadata(url)?.mimeType?.toLowerCase?.();
        mime = metadataMime?.startsWith(`${kind}/`) ? metadataMime
          : options.mime || (kind === "video" ? "video/mp4" : "audio/ogg");
      }
      if (!mime?.startsWith(`${kind}/`)) {
        throw downloadError("errorMime", { kind, mime });
      }
      if (options.mime && options.mime !== mime) throw downloadError("errorSourceChanged");
      const etag = res.headers.get("ETag");
      const modified = res.headers.get("Last-Modified");
      const validator = etag && !etag.startsWith("W/") ? { header: "ETag", value: etag }
        : modified ? { header: "Last-Modified", value: modified } : null;
      if (options.validator && res.headers.get(options.validator.header) !== null &&
          res.headers.get(options.validator.header) !== options.validator.value) {
        throw downloadError("errorSourceChanged");
      }
      let expectedSize;
      let totalSize;
      if (res.status === 206) {
        const match = res.headers.get("Content-Range")?.match(contentRangeRegex);
        if (!match) throw downloadError("errorRangeMissing");
        const start = Number(match[1]);
        const end = Number(match[2]);
        const size = match[3] === "*" ? total ?? getMediaMetadata(url)?.size : Number(match[3]);
        if (![start, end, size].every(Number.isSafeInteger) ||
            start !== offset || end < start || size <= end ||
            (total !== null && total !== size)) {
          throw downloadError("errorRangeInconsistent");
        }
        expectedSize = end - start + 1;
        totalSize = size;
      } else {
        if (offset !== 0) throw downloadError("errorRangeUnsupported");
        const length = res.headers.get("Content-Length");
        if (length !== null && !res.headers.has("Content-Encoding")) {
          if (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length))) {
            throw downloadError("errorLength");
          }
          expectedSize = Number(length);
          totalSize = expectedSize;
        }
      }
      if (!res.body) throw downloadError("errorEmpty");
      reader = res.body.getReader();
      controller.signal.addEventListener("abort", () => {
        reader.cancel().catch(() => {});
      }, { once: true });
      const sample = options.sampleSize ? new Uint8Array(options.sampleSize) : null;
      let sampled = 0;
      const buffer = options.stage ? new Uint8Array(CACHE_BLOCK_SIZE) : null;
      let buffered = 0;
      let staged = 0;
      const flush = async () => {
        if (!buffered) return;
        // A short typed-array view would clone its entire backing buffer into
        // IndexedDB. Copy only the tail; full blocks can reuse the fixed buffer.
        const bytes = buffered === buffer.byteLength ? buffer : buffer.slice(0, buffered);
        await options.stage(offset + staged, bytes);
        staged += buffered;
        buffered = 0;
      };
      let received = 0;
      options.onProgress?.(offset, totalSize ?? null);
      while (true) {
        checkAborted();
        const { value, done } = await networkRequest(() => reader.read());
        checkAborted();
        if (done) break;
        received += value.byteLength;
        if (expectedSize !== undefined && received > expectedSize) {
          throw downloadError("errorTooLarge");
        }
        // Wait for disk writes before reading more data, so slow disks do not
        // cause an unbounded queue of writes or large in-memory responses.
        clearTimeout(timer);
        if (options.write) for (let position = 0; position < value.byteLength; position += CACHE_BLOCK_SIZE) {
          await options.write(value.subarray(position, position + CACHE_BLOCK_SIZE));
        }
        if (options.sampleSize) {
          const size = Math.min(value.byteLength, options.sampleSize - sampled);
          sample.set(value.subarray(0, size), sampled);
          sampled += size;
        } else if (options.stage) {
          for (let position = 0; position < value.byteLength;) {
            const size = Math.min(CACHE_BLOCK_SIZE - buffered, value.byteLength - position);
            buffer.set(value.subarray(position, position + size), buffered);
            buffered += size;
            position += size;
            if (buffered === CACHE_BLOCK_SIZE) await flush();
          }
        }
        checkAborted();
        resetTimeout();
        options.onProgress?.(offset + received, totalSize ?? null);
        if (options.sampleSize && sampled >= options.sampleSize) break;
      }
      if (!received || (options.sampleSize ? sampled < options.sampleSize
        : expectedSize !== undefined && received !== expectedSize)) {
        throw downloadError("errorIncomplete");
      }
      clearTimeout(timer);
      if (options.stage) await flush();
      return {
        sample,
        mime, validator, totalSize: totalSize ?? received, nextOffset: offset + received,
      };
    } catch (error) {
      controller.abort(error);
      throw controller.signal.reason || error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      if (reader) {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
  };
  const hashCode = (s) => {
    var h = 0,
      l = s.length,
      i = 0;
    if (l > 0) {
      while (i < l) {
        h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
      }
    }
    return h >>> 0;
  };

  const getMediaMetadata = (url) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const firstBrace = decodedUrl.indexOf("{");
      const lastBrace = decodedUrl.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(decodedUrl.slice(firstBrace, lastBrace + 1));
      }
      return {};
    } catch {
      return {};
    }
  };
  const getDownloadFileName = (url, mime, kind) => {
    const extensions = {
      "video/mp4": ["mp4", "m4v"], "video/webm": ["webm"],
      "video/quicktime": ["mov"], "video/x-matroska": ["mkv"],
      "audio/ogg": ["ogg", "oga", "opus"], "audio/mpeg": ["mp3"],
      "audio/mp4": ["m4a"], "audio/webm": ["webm"], "audio/aac": ["aac"],
      "audio/wav": ["wav"], "audio/x-wav": ["wav"],
      "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"],
      "image/webp": ["webp"], "image/gif": ["gif"], "image/avif": ["avif"],
      "image/heic": ["heic"], "image/bmp": ["bmp"], "image/svg+xml": ["svg"],
    };
    const metadata = getMediaMetadata(url);
    let name = typeof metadata?.fileName === "string" ? metadata.fileName : "";
    if (!name) {
      try {
        const basename = decodeURIComponent(new URL(url, location.href).pathname.split("/").pop());
        if (/\.[a-z0-9]{2,5}$/i.test(basename)) name = basename;
      } catch {
        // Some blob URLs do not carry a filename.
      }
    }
    name = (name || hashCode(url).toString(36)).replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "_");
    const allowed = extensions[mime?.toLowerCase()] || (mime ? null :
      (kind === "video" ? ["mp4"] : kind === "audio" ? ["ogg"] : ["jpg"]));
    const dot = name.lastIndexOf(".");
    if (!allowed) return dot > 0 ? name : name + ".bin";
    if (dot > 0 && allowed.includes(name.slice(dot + 1).toLowerCase())) return name;
    return (dot > 0 ? name.slice(0, dot) : name) + "." + allowed[0];
  };
  const saveMediaBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Let the browser consume the URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const downloadTasks = new Map();
  const activeDownloads = new Map();
  const downloadQueue = [];
  const MAX_CONCURRENT_DOWNLOADS = 2;
  let runningDownloads = 0;

  // Stage fixed-size blocks on disk, then advance the checkpoint only after the
  // full response validates. Orphaned blocks beyond that offset are disposable.
  const RESUME_DATABASE = "tel-media-downloader-resume";
  let resumeDatabase;
  const openResumeDatabase = () => {
    if (!resumeDatabase) resumeDatabase = new Promise((resolve, reject) => {
      const request = indexedDB.open(RESUME_DATABASE, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("tasks", { keyPath: "id" });
        request.result.createObjectStore("chunks", { keyPath: ["id", "offset"] });
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Download storage is blocked by another tab"));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); resumeDatabase = null; };
        resolve(db);
      };
    }).catch(error => { resumeDatabase = null; throw error; });
    return resumeDatabase;
  };
  const resumeTransaction = async (stores, mode, work) => {
    try {
      const db = await openResumeDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(stores, mode, { durability: "strict" });
        let result;
        const release = () => { result = null; transaction.onabort = null; transaction.oncomplete = null; };
        transaction.onabort = () => {
          const error = transaction.error || new Error("Download storage transaction aborted");
          release();
          reject(error);
        };
        transaction.oncomplete = () => {
          const value = result?.result;
          release();
          resolve(value);
        };
        try { result = work(transaction); work = null; }
        catch (error) { transaction.abort(); reject(error); }
      });
    } catch (error) {
      throw downloadError("errorStorage", { message: error.message });
    }
  };
  const readResumeRecord = (id) => resumeTransaction(["tasks"], "readonly", tx => tx.objectStore("tasks").get(id));
  const readResumeChunk = (id, offset) => resumeTransaction(["chunks"], "readonly", tx => tx.objectStore("chunks").get([id, offset]));
  const resumeRecord = task => ({
    id: task.id, key: task.key, url: task.url, kind: task.kind, fileName: task.fileName, preferredName: task.preferredName,
    // Native handles are serializable; picker shims may return plain objects
    // with functions, which must not break checkpoint storage.
    fileHandle: task.fileHandle?.kind === "file" && typeof task.fileHandle.isSameEntry === "function"
      ? task.fileHandle : undefined,
    offset: task.offset, total: task.total, mime: task.mime, validator: task.validator, updatedAt: Date.now(),
  });
  const saveResumeRecord = task => resumeTransaction(["tasks"], "readwrite", tx => tx.objectStore("tasks").put(resumeRecord(task)));
  const refreshResumeRecord = async task => {
    const record = await readResumeRecord(task.id);
    if (!record || record.key !== task.key) throw downloadError("errorCache");
    Object.assign(task, { offset: record.offset, received: record.offset, total: record.total,
      mime: record.mime, validator: record.validator });
    await saveResumeRecord(task);
  };
  const stageResumeChunk = (task, offset, data) => resumeTransaction(["chunks"], "readwrite", tx =>
    tx.objectStore("chunks").put({ id: task.id, offset, data }));
  const discardUncommittedChunks = task => resumeTransaction(["chunks"], "readwrite", tx =>
    tx.objectStore("chunks").delete(IDBKeyRange.bound([task.id, task.offset], [task.id, Number.MAX_SAFE_INTEGER])));
  const saveResumePart = (task, part) => resumeTransaction(["tasks"], "readwrite", tx => {
    tx.objectStore("tasks").put({ ...resumeRecord(task), offset: part.nextOffset,
      total: part.totalSize, mime: part.mime, validator: task.validator || part.validator });
  });
  const deleteResumeRecord = task => resumeTransaction(["tasks", "chunks"], "readwrite", tx => {
    tx.objectStore("tasks").delete(task.id);
    tx.objectStore("chunks").delete(IDBKeyRange.bound([task.id, 0], [task.id, Number.MAX_SAFE_INTEGER]));
  });
  const withResumeLock = async (task, work) => {
    if (!navigator.locks) throw downloadError("errorStorage", { message: "Web Locks are unavailable in this browser" });
    const acquisition = new AbortController();
    // Browser processes can release an old lock slightly after its caller's
    // promise settles. Queue a brief handover instead of racing ifAvailable.
    const timer = setTimeout(() => acquisition.abort(downloadError("errorBusy")), 1000);
    try {
      return await navigator.locks.request(`tel-media-download:${task.id}`, { signal: acquisition.signal }, () => {
        clearTimeout(timer);
        return work();
      });
    } catch (error) {
      throw acquisition.signal.aborted ? acquisition.signal.reason : error;
    } finally { clearTimeout(timer); }
  };
  const getDownloadKey = (url, kind) => {
    const metadata = getMediaMetadata(url);
    const source = metadata?.location;
    // file_reference may expire; the immutable Telegram document ID lets a fresh
    // URL reconnect to its task without matching unrelated media by filename.
    return source?.id && metadata.dcId ? JSON.stringify([
      kind, metadata.dcId, source._, String(source.id), source.thumb_size || "",
    ]) : `${kind}:${url}`;
  };

  const visitCachedMedia = async (task, write) => {
    let offset = 0;
    let sample;
    while (offset < task.offset) {
      if (task.controller.signal.aborted) throw task.controller.signal.reason;
      const chunk = await readResumeChunk(task.id, offset);
      // Older checkpoints used Blobs. Read them without converting new binary
      // blocks into Blob objects that the browser may keep in memory until GC.
      const data = chunk?.data instanceof Uint8Array ? chunk.data : chunk?.blob;
      const size = data instanceof Uint8Array ? data.byteLength : data instanceof Blob ? data.size : 0;
      if (!size || offset + size > task.offset) {
        throw downloadError("errorCache");
      }
      if (write) for (let position = 0; position < size; position += CACHE_BLOCK_SIZE) {
        if (task.controller.signal.aborted) throw task.controller.signal.reason;
        await write(data instanceof Uint8Array ? data.subarray(position, position + CACHE_BLOCK_SIZE)
          : data.slice(position, position + CACHE_BLOCK_SIZE));
      }
      sample = data instanceof Uint8Array ? data.slice(-Math.min(1024, size))
        : new Uint8Array(await data.slice(-Math.min(1024, size)).arrayBuffer());
      offset += size;
    }
    return sample;
  };
  const EXPORT_DIRECTORY = "tel-media-downloader-exports";
  const openExportDirectory = async () => {
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(EXPORT_DIRECTORY, { create: true });
  };
  const cleanOldExports = async () => {
    try {
      const directory = await openExportDirectory();
      for await (const [name] of directory.entries()) {
        const timestamp = /^(\d{13})-[a-z0-9]+$/.exec(name)?.[1];
        // Keep exports alive while the browser download manager consumes them.
        // Unfinished resume checkpoints are separate and are never age-evicted.
        if (timestamp && Date.now() - Number(timestamp) > 24 * 60 * 60 * 1000) await directory.removeEntry(name);
      }
    } catch { /* Private disk storage is optional for small-file fallback. */ }
  };
  const saveCachedMedia = async task => {
    let directory;
    try { directory = await openExportDirectory(); }
    catch {
      if (task.offset > MEMORY_EXPORT_LIMIT) throw downloadError("errorMemorySave");
      const parts = [];
      await visitCachedMedia(task, data => { parts.push(data); });
      saveMediaBlob(new Blob(parts, { type: task.mime }), task.fileName);
      return;
    }
    const name = `${Date.now()}-${task.id}`;
    let writable;
    try {
      const handle = await directory.getFileHandle(name, { create: true });
      writable = await handle.createWritable();
      await visitCachedMedia(task, data => writable.write(data));
      await writable.close();
      writable = null;
      // A file-backed Blob avoids assembling the entire media in RAM.
      const file = await handle.getFile();
      saveMediaBlob(file.slice(0, file.size, task.mime), task.fileName);
    } catch (error) {
      if (writable) try { await writable.abort(); } catch { /* Already closed. */ }
      await directory.removeEntry(name).catch(() => {});
      throw error;
    }
  };

  const formatBytes = (bytes) => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
    return `${(index ? decimalFormat : integerFormat).format(bytes / (1024 ** index))} ${units[index]}`;
  };
  const updateTaskPanel = () => {
    const panel = document.getElementById("tel-downloader-progress-bar-container");
    if (!panel) return;
    panel.hidden = !panel.querySelector(".tel-task");
    if (panel.hidden) setSettingsOpen(false);
    panel.querySelector(".tel-panel-title").textContent = activeDownloads.size
      ? t("downloadsCount", { count: integerFormat.format(activeDownloads.size) }) : t("downloads");
  };
  const dismissTask = async (task) => {
    if (task.finished && task.persisted) {
      try {
        await withResumeLock(task, () => deleteResumeRecord(task));
        task.persisted = false;
      } catch (error) { task.error = error; renderTask(task); return; }
    }
    document.getElementById("tel-downloader-progress-" + task.id)?.remove();
    if (task.finished) downloadTasks.delete(task.id);
    updateTaskPanel();
  };
  const showTask = (task) => {
    const panel = document.getElementById("tel-downloader-progress-bar-container");
    const list = panel.querySelector(".tel-task-list");
    list.hidden = false;
    const toggle = panel.querySelector(".tel-panel-toggle");
    toggle.textContent = t("hide");
    toggle.setAttribute("aria-expanded", "true");
    let card = document.getElementById("tel-downloader-progress-" + task.id);
    if (!card) {
      card = document.createElement("div");
      card.id = "tel-downloader-progress-" + task.id;
      card.className = "tel-task";
      card.tabIndex = -1;
      card.innerHTML = `
        <div class="tel-task-heading"><p class="filename" dir="auto"></p><button type="button" data-action="dismiss">&times;</button></div>
        <span class="tel-task-state" role="status" aria-live="polite"></span>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div></div><p></p></div>
        <p class="tel-task-details"></p><p class="tel-task-error"></p><p class="tel-task-resume-hint"></p>
        <div class="tel-task-actions"><button type="button" data-action="cancel"></button><button type="button" data-action="retry" hidden></button><button type="button" data-action="location" hidden></button></div>`;
      card.querySelector('[data-action="dismiss"]').onclick = () => dismissTask(task);
      card.querySelector('[data-action="cancel"]').onclick = async () => {
        if (task.finished || task.state === "saving") return;
        task.controller.abort(new DOMException("Download cancelled", "AbortError"));
        if (!task.running) {
          task.cancelling = true;
          try {
            await task.registration;
            if (task.persisted) await withResumeLock(task, () => deleteResumeRecord(task));
            task.persisted = false;
            finishTask(task, "cancelled");
          } catch (error) { finishTask(task, "failed", error); }
        }
      };
      card.querySelector('[data-action="retry"]').onclick = () => {
        if (task.persisted) startTask(task);
        else { dismissTask(task); downloadMedia(task.url, task.kind); }
      };
      card.querySelector('[data-action="location"]').onclick = () => startTask(task, true);
      list.prepend(card);
    }
    renderTask(task);
    return card;
  };
  const renderTask = (task) => {
    const card = document.getElementById("tel-downloader-progress-" + task.id);
    if (!card) return;
    const label = t(task.state, { attempt: task.retryAttempt, max: MAX_AUTO_RETRIES });
    card.dataset.state = task.state;
    const title = card.querySelector(".filename");
    title.textContent = task.fileName;
    title.title = task.fileName;
    const state = card.querySelector(".tel-task-state");
    if (state.textContent !== label) state.textContent = label;
    const progress = card.querySelector(".progress");
    progress.setAttribute("aria-label", t("progress"));
    card.querySelector('[data-action="dismiss"]').setAttribute("aria-label", t("dismiss"));
    const percent = task.total ? Math.min(100, Math.floor(task.received * 100 / task.total)) : null;
    progress.classList.toggle("tel-indeterminate", task.state === "downloading" && percent === null);
    if (percent === null) progress.removeAttribute("aria-valuenow");
    else progress.setAttribute("aria-valuenow", percent);
    progress.setAttribute("aria-valuetext", label);
    progress.querySelector("div").style.width = (percent ?? 0) + "%";
    progress.querySelector("p").textContent = task.state === "downloading" && percent !== null ? `${integerFormat.format(percent)}%` : label;
    const speed = Math.max(0, task.received - (task.startedOffset || 0)) /
      Math.max((performance.now() - task.startedAt) / 1000, 0.1);
    card.querySelector(".tel-task-details").textContent =
      formatBytes(task.received) + (task.total !== null ? ` / ${formatBytes(task.total)}` : "") +
      (task.state === "downloading" && task.received ? ` · ${t("rate", { speed: formatBytes(speed) })}` : "") +
      (task.state === "retrying" ? ` · ${t("retryWait", { seconds: Math.ceil(task.retryDelay / 1000) })}` : "");
    const error = card.querySelector(".tel-task-error");
    error.textContent = formatDownloadError(task.error);
    error.hidden = !task.error;
    const hint = card.querySelector(".tel-task-resume-hint");
    hint.textContent = t("resumeHint");
    if (task.retryExhausted) hint.textContent += " " + t("retryExhausted");
    else if (task.error?.retryAfterMs > MAX_AUTO_RETRY_DELAY) hint.textContent += " " + t("retryLater");
    hint.hidden = !task.persisted || !["paused", "failed"].includes(task.state);
    const cancel = card.querySelector('[data-action="cancel"]');
    cancel.textContent = t("cancel");
    cancel.hidden = task.finished;
    cancel.disabled = task.state === "saving";
    const retry = card.querySelector('[data-action="retry"]');
    retry.textContent = t(task.persisted && task.offset ? "resume" : "retry");
    retry.hidden = !["paused", "failed", "cancelled"].includes(task.state);
    const locationButton = card.querySelector('[data-action="location"]');
    locationButton.textContent = t("changeLocation");
    const pageWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
    locationButton.hidden = !task.finished || !task.persisted || task.kind === "image" ||
      typeof pageWindow.showSaveFilePicker !== "function";
    task.renderedAt = performance.now();
    task.renderedBytes = task.received;
    updateTaskPanel();
  };
  const waitForRetry = (task, delay) => new Promise((resolve, reject) => {
    const signal = task.controller.signal;
    let timer;
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
    };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, delay);
  });
  const retryMediaRequest = async (task, request, reset) => {
    const committedTotal = task.total;
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await request();
        task.retryAttempt = 0;
        task.retryExhausted = false;
        return result;
      } catch (error) {
        if (task.controller.signal.aborted) throw task.controller.signal.reason;
        const retryable = error.retryable || ["errorTimeout", "errorIncomplete", "errorEmpty"].includes(error.translationKey);
        const delay = Math.max(AUTO_RETRY_BASE_DELAY * 2 ** attempt, error.retryAfterMs || 0);
        if (!retryable || attempt >= MAX_AUTO_RETRIES || delay > MAX_AUTO_RETRY_DELAY) {
          task.retryExhausted = Boolean(retryable && attempt >= MAX_AUTO_RETRIES);
          throw error;
        }
        await reset?.();
        if (task.controller.signal.aborted) throw task.controller.signal.reason;
        clearTimeout(task.progressTimer);
        task.progressTimer = null;
        Object.assign(task, { state: "retrying", received: task.offset, total: committedTotal,
          retryAttempt: attempt + 1, retryDelay: delay, error });
        logger.info(`Retry ${attempt + 1}/${MAX_AUTO_RETRIES} after ${delay}ms: ${error.message}`, task.fileName);
        renderTask(task);
        await waitForRetry(task, delay);
        Object.assign(task, { state: "downloading", error: null, startedAt: performance.now(), startedOffset: task.offset });
        renderTask(task);
      }
    }
  };
  const finishTask = (task, state, error) => {
    if (task.finished) return;
    task.finished = true;
    clearTimeout(task.progressTimer);
    task.progressTimer = null;
    task.state = state;
    task.error = error;
    if (activeDownloads.get(task.key) === task) activeDownloads.delete(task.key);
    if (error) logger.error(error, task.fileName);
    renderTask(task);
    if (!task.persisted && !document.getElementById("tel-downloader-progress-" + task.id)) downloadTasks.delete(task.id);
    updateTaskPanel();
    task.result = { state, fileName: task.fileName, received: task.received };
    if (!task.running) task.resolve?.(task.result);
  };
  const runTask = async (task) => {
    let writable;
    const checkCancelled = () => {
      if (task.controller.signal.aborted) throw task.controller.signal.reason;
    };
    try {
      checkCancelled();
      task.state = "preparing";
      renderTask(task);
      await refreshResumeRecord(task);
      await discardUncommittedChunks(task);
      checkCancelled();
      if (task.handle) {
        try {
          writable = await task.handle.createWritable();
        } catch (error) {
          if (error.name === "AbortError") throw error;
          if (task.reusingDestination) throw downloadError("errorDestination", { message: error.message });
          // A denied file handle can still use the browser's download flow.
          logger.info(`Cannot open file; using browser download: ${error.message}`, task.fileName);
        }
      }
      checkCancelled();
      // A writable is a temporary file until close(). Rebuild it from durable
      // chunks after a crash rather than trusting an uncommitted destination.
      const sample = await visitCachedMedia(task, writable ? data => writable.write(data) : undefined);
      checkCancelled();
      task.state = "downloading";
      task.startedAt = performance.now();
      task.startedOffset = task.offset;
      renderTask(task);
      // Telegram does not always supply validators. Also compare a saved suffix
      // before appending any new bytes, including after a URL was refreshed.
      if (task.offset && task.offset < task.total) {
        const probe = await retryMediaRequest(task, () => fetchMediaPart(task.url, task.offset - sample.byteLength, task.total, task.kind, {
          signal: task.controller.signal, end: task.offset - 1, mime: task.mime, validator: task.validator,
          sampleSize: sample.byteLength,
        }));
        if (probe.sample.length !== sample.length || probe.sample.some((byte, index) => byte !== sample[index])) {
          throw downloadError("errorSourceChanged");
        }
      }
      while (!task.total || task.offset < task.total) {
        let written = 0;
        const part = await retryMediaRequest(task, () => fetchMediaPart(task.url, task.offset, task.total, task.kind, {
          signal: task.controller.signal,
          stage: (offset, data) => stageResumeChunk(task, offset, data), mime: task.mime, validator: task.validator,
          write: writable ? async chunk => { await writable.write(chunk); written += chunk.byteLength; } : undefined,
          onProgress: (received, size) => {
            task.received = received;
            task.total = size;
            if ((!task.renderedBytes && received) || performance.now() - task.renderedAt >= 100 || received === size) {
              renderTask(task);
            } else if (!task.progressTimer) {
              task.progressTimer = setTimeout(() => {
                task.progressTimer = null;
                renderTask(task);
              }, 100);
            }
          },
        }), async () => {
          await discardUncommittedChunks(task);
          if (writable && written) {
            if (typeof writable.truncate !== "function" || typeof writable.seek !== "function") {
              throw downloadError("errorDestination", { message: "Cannot rewind the interrupted file write" });
            }
            await writable.truncate(task.offset);
            await writable.seek(task.offset);
          }
          written = 0;
        });
        checkCancelled();
        task.fileName = task.preferredName || getDownloadFileName(task.url, part.mime, task.kind);
        await saveResumePart(task, part);
        task.offset = part.nextOffset;
        task.total = part.totalSize;
        task.mime = part.mime;
        task.validator ||= part.validator;
        task.received = task.offset;
        renderTask(task);
      }
      checkCancelled();
      task.state = "saving";
      renderTask(task);
      if (writable) await writable.close();
      else await saveCachedMedia(task);
      await deleteResumeRecord(task);
      task.persisted = false;
      finishTask(task, writable ? "completed" : "handedOff");
    } catch (error) {
      if (writable) {
        try { await writable.abort(); } catch { /* Already closed or errored. */ }
      }
      task.received = task.offset;
      if (task.controller.signal.aborted || error.name === "AbortError") {
        try { await deleteResumeRecord(task); task.persisted = false; }
        catch (storageError) { finishTask(task, "failed", storageError); return; }
        finishTask(task, "cancelled");
      } else {
        try { await discardUncommittedChunks(task); } catch { /* Retried on resume. */ }
        finishTask(task, "failed", error);
      }
    } finally {
      task.handle = null;
    }
  };
  const pumpDownloads = () => {
    while (runningDownloads < MAX_CONCURRENT_DOWNLOADS && downloadQueue.length) {
      const task = downloadQueue.shift();
      if (task.finished || task.cancelling) continue;
      runningDownloads++;
      task.running = true;
      withResumeLock(task, () => runTask(task)).catch(error => {
        finishTask(task, "failed", error);
      }).finally(() => {
        task.running = false;
        if (task.finished) task.resolve?.(task.result);
        runningDownloads--;
        pumpDownloads();
      });
    }
  };
  const downloadMedia = (url, kind) => {
    if (typeof url !== "string" || !url) return Promise.resolve();
    const key = getDownloadKey(url, kind);
    const existing = activeDownloads.get(key);
    if (existing) {
      const card = showTask(existing);
      card.scrollIntoView({ block: "nearest" });
      card.focus({ preventScroll: true });
      return existing.promise;
    }
    const resumable = Array.from(downloadTasks.values()).find(task =>
      task.key === key && task.persisted && task.finished && ["paused", "failed"].includes(task.state)
    );
    if (resumable) { resumable.url = url; return startTask(resumable); }
    // Retain a small history without retaining media buffers.
    for (const previous of downloadTasks.values()) {
      if (downloadTasks.size < 20) break;
      if (previous.finished && !previous.persisted) dismissTask(previous);
    }
    const task = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      key, url, kind, fileName: getDownloadFileName(url, getMediaMetadata(url)?.mimeType, kind),
      offset: 0, total: null, mime: null, validator: null,
    };
    downloadTasks.set(task.id, task);
    return startTask(task);
  };
  const startTask = (task, chooseLocation = false) => {
    if (task.running) return task.promise;
    if (activeDownloads.has(task.key)) return activeDownloads.get(task.key).promise;
    Object.assign(task, {
      state: "preparing", received: task.offset, controller: new AbortController(), error: null, cancelling: false,
      reusingDestination: false, registration: null,
      retryAttempt: 0, retryDelay: 0, retryExhausted: false,
      startedAt: performance.now(), renderedAt: 0, finished: false,
    });
    task.promise = new Promise(resolve => { task.resolve = resolve; });
    activeDownloads.set(task.key, task);
    showTask(task);
    navigator.storage?.persist?.().catch(() => {});
    const enqueue = async (handle) => {
      if (task.finished) return;
      task.handle = handle;
      task.fileHandle = handle || undefined;
      task.preferredName = handle?.name || task.preferredName;
      task.fileName = handle?.name || task.fileName;
      task.state = "queued";
      renderTask(task);
      try {
        // Remember a newly selected destination before waiting in the queue,
        // without replacing a newer checkpoint written by another tab.
        task.registration = task.persisted
          ? withResumeLock(task, () => refreshResumeRecord(task)) : saveResumeRecord(task);
        await task.registration;
        task.persisted = true;
        if (task.cancelling) return;
        if (task.finished) { await deleteResumeRecord(task); task.persisted = false; return; }
        renderTask(task);
        downloadQueue.push(task);
        pumpDownloads();
      } catch (error) { finishTask(task, "failed", error); }
    };
    if (task.persisted && task.fileHandle && !chooseLocation) {
      task.reusingDestination = true;
      const originalHandle = task.fileHandle;
      const authorize = async () => {
        const options = { mode: "readwrite" };
        if (typeof originalHandle.queryPermission === "function" &&
            await originalHandle.queryPermission(options) !== "granted") {
          if (typeof originalHandle.requestPermission !== "function" ||
              await originalHandle.requestPermission(options) !== "granted") {
            throw downloadError("errorFilePermission");
          }
        }
        await enqueue(originalHandle);
      };
      // Called directly by Resume's click handler so requestPermission can use
      // the user gesture. A permission prompt does not select a new destination.
      authorize().catch(error => finishTask(task, "paused",
        error.translationKey ? error : downloadError("errorFilePermission")));
      return task.promise;
    }
    try {
      const pageWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
      if (task.kind !== "image" && typeof pageWindow.showSaveFilePicker === "function" &&
          pageWindow.self === pageWindow.top) {
        // Keep the picker inside the original click, before queueing or fetching.
        Promise.resolve(pageWindow.showSaveFilePicker({ suggestedName: task.fileName }))
          .then(enqueue, (error) => {
            if (error.name === "AbortError") finishTask(task, task.persisted ? "paused" : "cancelled");
            else enqueue(null);
          });
      } else enqueue(null);
    } catch (error) {
      if (error.name === "AbortError") finishTask(task, task.persisted ? "paused" : "cancelled");
      else enqueue(null);
    }
    return task.promise;
  };
  const restoreResumeTasks = async () => {
    try {
      const records = await resumeTransaction(["tasks"], "readonly", tx => tx.objectStore("tasks").getAll());
      for (const record of records) {
        if (typeof record.id !== "string" || typeof record.url !== "string" ||
            !["video", "audio", "image"].includes(record.kind) ||
            !Number.isSafeInteger(record.offset) || record.offset < 0 ||
            (record.total !== null && (!Number.isSafeInteger(record.total) || record.total < record.offset)) ||
            record.key !== getDownloadKey(record.url, record.kind) || downloadTasks.has(record.id)) continue;
        const task = { ...record, persisted: true, finished: true, state: "paused",
          received: record.offset, startedAt: performance.now(), renderedAt: 0 };
        downloadTasks.set(task.id, task);
        showTask(task);
      }
    } catch (error) { logger.error(error); }
  };
  const tel_download_video = (url) => downloadMedia(url, "video");
  const tel_download_audio = (url) => downloadMedia(url, "audio");
  const tel_download_image = (url) => downloadMedia(url, "image");

  const getMediaSource = (media) =>
    media?.getAttribute("src") ? media.src :
      media?.currentSrc || media?.querySelector("source")?.src;

  const getPinnedMedia = () => {
    const pinned = document.querySelector(".pinned-audio");
    const mid = pinned?.getAttribute("data-mid");
    if (!mid) return null;
    const peer = pinned.getAttribute("data-peer-id");
    const candidates = Array.from(document.querySelectorAll("audio-element")).filter(
      (element) => element.closest(".bubble") && element.getAttribute("data-mid") === mid &&
        (!peer || element.closest("[data-peer-id]")?.getAttribute("data-peer-id") === peer)
    );
    const element = candidates.length === 1 ? candidates[0] :
      candidates.find((candidate) => candidate.audio && !candidate.audio.paused);
    const url = getMediaSource(element?.audio);
    return url ? { url, kind: element.audio.tagName === "AUDIO" ? "audio" : "video" } : null;
  };

  const downloadCurrentWebKMedia = () => {
    // The toolbar can outlive its media node. Resolve both at click time.
    const viewer = document.querySelector(".media-viewer-whole");
    if (!viewer) return;
    const buttons = viewer.querySelector(".media-viewer-topbar .media-viewer-buttons");
    const nativeDownload = buttons && getWebKDownloadButtons(buttons).find(
      (button) => isUsableDownloadButton(button) && !button.matches(
        '.quality-download-options-button-menu, .btn-menu-toggle, [aria-haspopup="menu"], [aria-haspopup="true"]'
      )
    );
    if (nativeDownload) {
      nativeDownload.click();
      return;
    }
    const media = viewer.querySelector(".media-viewer-movers .media-viewer-aspecter");
    const videoUrl = getMediaSource(media?.querySelector("video"));
    const imageUrl = getMediaSource(media?.querySelector("img.thumbnail"));
    if (videoUrl) tel_download_video(videoUrl);
    else if (imageUrl) tel_download_image(imageUrl);
  };

  logger.info("Initialized");

  const createDownloadButton = (className, iconHTML, onClick) => {
    const button = document.createElement("button");
    button.className = className;
    button.innerHTML = iconHTML;
    button.type = "button";
    localizeDownloadButton(button);
    button.onclick = onClick;
    return button;
  };
  const getWebADownloadButtons = (container) =>
    Array.from(container.querySelectorAll("button")).filter((button) =>
      !button.classList.contains("tel-download") &&
      (button.querySelector(".icon-download") || button.title === "Download" ||
        button.getAttribute("aria-label") === "Download") && isUsableDownloadButton(button)
    );
  const downloadCurrentWebAMedia = () => {
    const media = document.querySelector("#MediaViewer .MediaViewerSlide--active");
    const videoUrl = getMediaSource(media?.querySelector(".VideoPlayer video"));
    const imageUrl = getMediaSource(media?.querySelector(".MediaViewerContent > div > img"));
    if (videoUrl) tel_download_video(videoUrl);
    else if (imageUrl) tel_download_image(imageUrl);
  };

  // WebA owns only media discovery and button placement.
  const refreshWebA = () => {
    const story = document.getElementById("StoryViewer");
    if (story) {
      const header = story.querySelector(".GrsJNw3y") || story.querySelector(".DropdownMenu")?.parentNode;
      if (header && !header.querySelector(".tel-download") && !getWebADownloadButtons(header).length) {
        header.prepend(createDownloadButton(
          "Button TkphaPyQ tiny translucent-white round tel-download",
          '<i class="icon icon-download" aria-hidden="true"></i>',
          () => {
            const current = document.getElementById("StoryViewer");
            const videoUrl = getMediaSource(current?.querySelector("video"));
            const images = current?.querySelectorAll("img.PVZ8TOWS");
            const imageUrl = getMediaSource(images?.[images.length - 1]);
            if (videoUrl) tel_download_video(videoUrl);
            else if (imageUrl) tel_download_image(imageUrl);
          }
        ));
      }
    }
    const media = document.querySelector("#MediaViewer .MediaViewerSlide--active");
    const actions = document.querySelector("#MediaViewer .MediaViewerActions");
    if (!media || !actions) return;
    const video = media.querySelector(".VideoPlayer video");
    const image = media.querySelector(".MediaViewerContent > div > img");
    if (!getMediaSource(video) && !getMediaSource(image)) return;
    const makeButton = () => createDownloadButton(
      "Button smaller translucent-white round tel-download",
      '<i class="icon icon-download" aria-hidden="true"></i>',
      downloadCurrentWebAMedia
    );
    if (getWebADownloadButtons(actions).length) {
      actions.querySelectorAll("button.tel-download").forEach((button) => button.remove());
    } else if (!actions.querySelector("button.tel-download")) {
      actions.prepend(makeButton());
    }
    const controls = media.querySelector(".VideoPlayerControls .buttons");
    if (video && controls && !controls.querySelector("button.tel-download")) {
      const spacer = controls.querySelector(".spacer");
      if (spacer) spacer.after(makeButton());
      else controls.appendChild(makeButton());
    }
  };

  // WebK owns only media discovery and button placement.
  const refreshWebK = () => {
    refreshWebKDownloadIcon();

    // Resolve the pinned media again on every click: its source may load after
    // the pinned message changes, and message IDs can repeat across chats.
    const pinnedAudio = document.querySelector(".pinned-audio");
    const pinnedUtils = pinnedAudio?.querySelector(".pinned-container-wrapper-utils");
    if (pinnedUtils) {
      let button = pinnedUtils.querySelector("._tel_download_button_pinned_container");
      if (!button) {
        button = document.createElement("button");
        button.className = "btn-icon tgico-download _tel_download_button_pinned_container";
        button.innerHTML = createWebKDownloadIcon(true);
        button.type = "button";
        button.onclick = (event) => {
          event.stopPropagation();
          const media = getPinnedMedia();
          if (!media) return;
          if (media.kind === "audio") tel_download_audio(media.url);
          else tel_download_video(media.url);
        };
        pinnedUtils.appendChild(button);
      }
      const disabled = !getPinnedMedia();
      if (button.disabled !== disabled) button.disabled = disabled;
      localizeDownloadButton(button, disabled);
    }

    // Stories
    const storiesContainer = document.getElementById("stories-viewer");
    if (storiesContainer) {
      const createDownloadButton = () => {
        const downloadButton = document.createElement("button");
        downloadButton.className = "btn-icon rp tel-download";
        downloadButton.innerHTML = `${createWebKDownloadIcon()}<div class="c-ripple"></div>`;
        downloadButton.setAttribute("type", "button");
        localizeDownloadButton(downloadButton);
        downloadButton.onclick = () => {
          // 1. Story with video
          const video = storiesContainer.querySelector("video.media-video");
          const videoSrc =
            video?.src ||
            video?.currentSrc ||
            video?.querySelector("source")?.src;
          if (videoSrc) {
            tel_download_video(videoSrc);
          } else {
            // 2. Story with image
            const imageSrc =
              storiesContainer.querySelector("img.media-photo")?.src;
            if (imageSrc) tel_download_image(imageSrc);
          }
        };
        return downloadButton;
      };

      const storyHeader = storiesContainer.querySelector(
        "[class*='_ViewerStoryHeaderRight']"
      );
      if (storyHeader && !storyHeader.querySelector(".tel-download")) {
        storyHeader.prepend(createDownloadButton());
      }

      const storyFooter = storiesContainer.querySelector(
        "[class*='_ViewerStoryFooterRight']"
      );
      if (storyFooter && !storyFooter.querySelector(".tel-download")) {
        storyFooter.prepend(createDownloadButton());
      }
    }

    // All media opened are located in .media-viewer-movers > .media-viewer-aspecter
    const mediaContainer = document.querySelector(".media-viewer-whole");
    if (!mediaContainer) return;
    const mediaAspecter = mediaContainer.querySelector(
      ".media-viewer-movers .media-viewer-aspecter"
    );
    const mediaButtons = mediaContainer.querySelector(
      ".media-viewer-topbar .media-viewer-buttons"
    );
    if (!mediaAspecter || !mediaButtons) return;

    // Restore only identified download controls. Other hidden actions may be
    // unavailable for this media and should remain under Telegram's control.
    for (const button of getWebKDownloadButtons(mediaButtons)) {
      if (!button.disabled && button.getAttribute("aria-disabled") !== "true") {
        button.classList.remove("hide");
      }
    }

    // Recognize native downloads by their purpose, not their font code point.
    const nativeDownloadButtons = getWebKDownloadButtons(mediaButtons).filter(isUsableDownloadButton);
    if (nativeDownloadButtons.length > 0) {
      mediaButtons.querySelectorAll("button.tel-download").forEach((button) => {
        button.remove();
      });
    }
    const hasDownloadButton =
      nativeDownloadButtons.length > 0 ||
      mediaButtons.querySelector("button.tel-download");

    if (mediaAspecter.querySelector(".ckin__player")) {
      // 1. Video player detected - Video and it has finished initial loading
      // container > .ckin__player > video[src]

      // add download button to videos
      const controls = mediaAspecter.querySelector(
        ".default__controls.ckin__controls"
      );
      if (controls && !controls.querySelector(".tel-download")) {
        const brControls = controls.querySelector(
          ".bottom-controls .right-controls"
        );
        const downloadButton = document.createElement("button");
        downloadButton.className =
          "btn-icon default__button tgico-download tel-download";
        downloadButton.innerHTML = createWebKDownloadIcon();
        downloadButton.setAttribute("type", "button");
        localizeDownloadButton(downloadButton);
        downloadButton.onclick = downloadCurrentWebKMedia;
        brControls?.prepend(downloadButton);
      }
    } else if (
      mediaAspecter.querySelector("video") &&
      !hasDownloadButton
    ) {
      // 2. Video HTML element detected, could be either GIF or unloaded video
      // container > video[src]
      const downloadButton = document.createElement("button");
      downloadButton.className = "btn-icon tgico-download tel-download";
      downloadButton.innerHTML = createWebKDownloadIcon(true);
      downloadButton.setAttribute("type", "button");
      localizeDownloadButton(downloadButton);
      downloadButton.onclick = downloadCurrentWebKMedia;
      mediaButtons.prepend(downloadButton);
    } else if (!hasDownloadButton) {
      // 3. Image without download button detected
      // container > img.thumbnail
      if (
        !mediaAspecter.querySelector("img.thumbnail") ||
        !mediaAspecter.querySelector("img.thumbnail").src
      ) {
        return;
      }
      const downloadButton = document.createElement("button");
      downloadButton.className = "btn-icon tgico-download tel-download";
      downloadButton.innerHTML = createWebKDownloadIcon(true);
      downloadButton.setAttribute("type", "button");
      localizeDownloadButton(downloadButton);
      downloadButton.onclick = downloadCurrentWebKMedia;
      mediaButtons.prepend(downloadButton);
    }
  };

  // The task panel is independent of Telegram's viewer and survives media changes.
  const panel = document.createElement("section");
  panel.id = "tel-downloader-progress-bar-container";
  panel.dir = "ltr";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="tel-panel-heading">
      <strong class="tel-panel-title"></strong>
      <div class="tel-panel-tools">
        <button class="tel-settings-toggle" type="button" aria-expanded="false" aria-controls="tel-download-settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 2h4l.6 3 2 1.2 2.9-.9 2 3.4-2.3 2v2.6l2.3 2-2 3.4-2.9-.9-2 1.2L14 22h-4l-.6-3-2-1.2-2.9.9-2-3.4 2.3-2v-2.6l-2.3-2 2-3.4 2.9.9 2-1.2Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="tel-panel-toggle" type="button" aria-expanded="true" aria-controls="tel-task-list"></button>
      </div>
    </div>
    <div id="tel-download-settings" class="tel-language-setting" hidden><label for="tel-download-language"></label><select id="tel-download-language"></select></div>
    <div id="tel-task-list" class="tel-task-list"></div>`;
  const languageSelect = panel.querySelector("select");
  const settings = panel.querySelector("#tel-download-settings");
  const settingsToggle = panel.querySelector(".tel-settings-toggle");
  const setSettingsOpen = (open) => {
    const returnFocus = !open && settings.contains(document.activeElement);
    settings.hidden = !open;
    settingsToggle.setAttribute("aria-expanded", String(open));
    if (open) languageSelect.focus();
    else if (returnFocus && !panel.hidden) settingsToggle.focus();
  };
  settingsToggle.onclick = () => setSettingsOpen(settings.hidden);
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape" && !settings.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setSettingsOpen(false);
    }
  });
  // Wait for the click: closing settings moves this bottom-anchored panel,
  // which must not move a control between pointer-down and pointer-up.
  document.addEventListener("click", event => {
    if (!settings.hidden && !settings.contains(event.target) && !settingsToggle.contains(event.target)) {
      setSettingsOpen(false);
    }
  });
  for (const [value, label] of [["auto", ""], ...Object.entries(UI_LANGUAGES)]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if (value !== "auto") option.lang = value;
    languageSelect.appendChild(option);
  }
  const refreshLanguage = () => {
    uiLanguage = resolveLanguage();
    integerFormat = new Intl.NumberFormat(uiLanguage, { maximumFractionDigits: 0 });
    decimalFormat = new Intl.NumberFormat(uiLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    panel.lang = uiLanguage;
    panel.setAttribute("aria-label", t("mediaDownloads"));
    settingsToggle.title = t("settings");
    settingsToggle.setAttribute("aria-label", t("settings"));
    panel.querySelector("label").textContent = t("language");
    languageSelect.querySelector('[value="auto"]').textContent = t("automatic");
    languageSelect.value = languagePreference;
    panel.querySelector(".tel-panel-toggle").textContent = t(panel.querySelector(".tel-task-list").hidden ? "show" : "hide");
    for (const task of downloadTasks.values()) renderTask(task);
    updateTaskPanel();
    document.querySelectorAll("button.tel-download, button._tel_download_button_pinned_container").forEach(button => {
      localizeDownloadButton(button, button.matches("._tel_download_button_pinned_container:disabled"));
    });
  };
  languageSelect.onchange = () => {
    languagePreference = Object.hasOwn(UI_LANGUAGES, languageSelect.value) ? languageSelect.value : "auto";
    try {
      if (languagePreference === "auto") localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      else localStorage.setItem(LANGUAGE_STORAGE_KEY, languagePreference);
    } catch {
      // Storage can be disabled; the selected language still works for this tab.
    }
    refreshLanguage();
  };
  window.addEventListener("languagechange", () => {
    if (languagePreference === "auto") refreshLanguage();
  });
  window.addEventListener("storage", event => {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
      languagePreference = readLanguagePreference();
      refreshLanguage();
    }
  });
  panel.querySelector(".tel-panel-toggle").onclick = () => {
    const list = panel.querySelector(".tel-task-list");
    list.hidden = !list.hidden;
    if (list.hidden) setSettingsOpen(false);
    const toggle = panel.querySelector(".tel-panel-toggle");
    toggle.textContent = t(list.hidden ? "show" : "hide");
    toggle.setAttribute("aria-expanded", String(!list.hidden));
  };
  const style = document.createElement("style");
  style.textContent = `
    #tel-downloader-progress-bar-container {
      --tel-bg: #fff; --tel-fg: #202b36; --tel-muted: #556472; --tel-line: #d9e1e8;
      --tel-track: #e9eef3; --tel-accent: #1967b3; --tel-error: #b42318;
      box-sizing: border-box; position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom));
      width: min(340px, calc(100vw - 24px)); max-height: calc(100vh - 24px); z-index: 2147483646;
      background: var(--tel-bg); color: var(--tel-fg); border: 1px solid var(--tel-line); border-radius: 12px;
      box-shadow: 0 6px 28px #0003; font: 13px/1.4 system-ui, sans-serif; overflow: hidden;
      display: flex; flex-direction: column; text-align: start;
    }
    html.night #tel-downloader-progress-bar-container, html.theme-dark #tel-downloader-progress-bar-container {
      --tel-bg: #202a35; --tel-fg: #f2f5f8; --tel-muted: #b0bdca; --tel-line: #455361;
      --tel-track: #394754; --tel-accent: #73b7ff; --tel-error: #ff9f97;
    }
    #tel-downloader-progress-bar-container [hidden], #tel-downloader-progress-bar-container[hidden] { display: none !important; }
    #tel-downloader-progress-bar-container * { box-sizing: border-box; }
    #tel-downloader-progress-bar-container p { margin: 0; }
    #tel-downloader-progress-bar-container .tel-panel-heading, #tel-downloader-progress-bar-container .tel-task-heading {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    #tel-downloader-progress-bar-container .tel-panel-heading { padding: 10px 12px; flex-shrink: 0; }
    #tel-downloader-progress-bar-container .tel-panel-title { min-width: 0; overflow-wrap: anywhere; }
    #tel-downloader-progress-bar-container .tel-panel-tools { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    #tel-downloader-progress-bar-container .tel-language-setting { display: flex; align-items: center; gap: 8px; padding: 0 12px 10px; flex-shrink: 0; }
    #tel-downloader-progress-bar-container .tel-language-setting label { flex: 1; min-width: 0; color: var(--tel-muted); overflow-wrap: anywhere; }
    #tel-downloader-progress-bar-container select { width: 150px; max-width: 55%; min-width: 0; min-height: 32px; font: inherit; color: var(--tel-fg); background: var(--tel-bg); border: 1px solid var(--tel-line); border-radius: 6px; padding: 4px; }
    #tel-downloader-progress-bar-container .tel-task-list { min-height: 0; overflow-y: auto; max-height: 440px; overscroll-behavior: contain; }
    #tel-downloader-progress-bar-container .tel-task { padding: 12px; border-top: 1px solid var(--tel-line); }
    #tel-downloader-progress-bar-container .filename { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    #tel-downloader-progress-bar-container button {
      appearance: none; background: transparent; color: var(--tel-accent); border: 1px solid transparent;
      font: inherit; border-radius: 6px; padding: 5px 8px; min-height: 32px; cursor: pointer; flex-shrink: 0;
    }
    #tel-downloader-progress-bar-container button:hover { background: var(--tel-track); }
    #tel-downloader-progress-bar-container .tel-settings-toggle { display: inline-flex; align-items: center; justify-content: center; width: 32px; padding: 5px; color: var(--tel-muted); }
    #tel-downloader-progress-bar-container .tel-settings-toggle:hover, #tel-downloader-progress-bar-container .tel-settings-toggle[aria-expanded="true"] { color: var(--tel-fg); background: var(--tel-track); }
    #tel-downloader-progress-bar-container button:focus-visible, #tel-downloader-progress-bar-container select:focus-visible, #tel-downloader-progress-bar-container .tel-task:focus-visible { outline: 2px solid var(--tel-accent); outline-offset: -2px; }
    #tel-downloader-progress-bar-container button:disabled { opacity: .5; cursor: default; }
    #tel-downloader-progress-bar-container [data-action="dismiss"] { color: var(--tel-muted); font-size: 20px; }
    #tel-downloader-progress-bar-container .progress { position: relative; min-height: 24px; margin: 8px 0; background: var(--tel-track); border-radius: 6px; overflow: hidden; }
    #tel-downloader-progress-bar-container .progress > div { position: absolute; height: 100%; background: var(--tel-accent); opacity: .35; }
    #tel-downloader-progress-bar-container .progress > p { position: relative; text-align: center; line-height: 1.5; padding: 3px 8px; overflow-wrap: anywhere; color: var(--tel-fg); }
    #tel-downloader-progress-bar-container .tel-task-details { color: var(--tel-muted); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
    #tel-downloader-progress-bar-container .tel-task-resume-hint { color: var(--tel-muted); margin-top: 8px; overflow-wrap: anywhere; }
    #tel-downloader-progress-bar-container .tel-task-error { color: var(--tel-error); margin-top: 8px; overflow-wrap: anywhere; }
    #tel-downloader-progress-bar-container .tel-task-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; margin-top: 4px; }
    #tel-downloader-progress-bar-container .tel-task-state { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    #tel-downloader-progress-bar-container [data-state="failed"] .progress > div { background: var(--tel-error); }
    #tel-downloader-progress-bar-container .tel-indeterminate > div { width: 35% !important; animation: tel-download-progress 1.4s infinite ease-in-out; }
    @keyframes tel-download-progress { from { left: -35%; } to { left: 100%; } }
    @media (prefers-reduced-motion: reduce) { #tel-downloader-progress-bar-container .tel-indeterminate > div { animation: none; left: 32%; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);
  refreshLanguage();
  const resumeTasksReady = restoreResumeTasks();
  void cleanOldExports();

  const isWebK = location.hostname === "webk.telegram.org" || location.pathname.startsWith("/k/");
  const isWebA = location.hostname === "webz.telegram.org" || location.pathname.startsWith("/a/");
  const refreshApp = isWebK ? refreshWebK : isWebA ? refreshWebA : null;
  if (refreshApp) {
    const roots = isWebK
      ? ".media-viewer-whole, #stories-viewer, .pinned-audio, audio-element"
      : "#MediaViewer, #StoryViewer";
    let pending;
    const scheduleRefresh = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        refreshApp();
      }, 100);
    };
    const observer = new MutationObserver((records) => {
      if (records.some((record) => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        if (target?.closest("#tel-downloader-progress-bar-container, .tel-download, ._tel_download_button_pinned_container")) return false;
        return target?.closest(roots) || Array.from(record.addedNodes).some((node) =>
          node instanceof Element && (node.matches(roots) || node.querySelector(roots))
        );
      })) scheduleRefresh();
    });
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["class", "src", "data-mid", "data-peer-id", "disabled", "aria-disabled", "hidden"],
    });
    // A fallback handles media source properties changed outside the DOM.
    setInterval(() => { if (!document.hidden) refreshApp(); }, REFRESH_DELAY);
    document.addEventListener("visibilitychange", scheduleRefresh);
    refreshApp();
  }

  logger.info("Completed script setup.");
})();
