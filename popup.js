// popup.js — FreshPass 主控制器
(function () {
  "use strict";

  const FP = window.FreshPass;
  const { storage, generatePassword, evaluateStrength, PasswordError, constants } = FP;

  const I18N = {
    zh: {
      navHome: "首页",
      navSettings: "设置",
      navHistory: "记录",
      selectPasswordTitle: "点击选中密码",
      copyPassword: "复制密码",
      copied: "已复制",
      copyFailed: "复制失败",
      copyFailedManual: "复制失败，请手动复制",
      copiedToClipboard: "已复制到剪贴板",
      recordSaveFailed: "密码已复制，但记录保存失败",
      regenerate: "重新生成",
      lock: "锁定",
      unlock: "解除锁定",
      quickSettings: "快捷设置",
      appearance: "外观",
      theme: "主题",
      themeSystem: "跟随系统",
      themeLight: "亮色",
      themeDark: "暗色",
      language: "语言",
      passwordRules: "密码规则",
      passwordLength: "密码长度",
      includeUppercase: "包含大写字母 (A-Z)",
      includeLowercase: "包含小写字母 (a-z)",
      includeNumbers: "包含数字 (0-9)",
      includeSymbols: "包含特殊符号",
      symbolMode: "特殊符号模式",
      symbolCommon: "常用",
      symbolFull: "完整",
      symbolCustom: "自定义",
      customSymbolsPlaceholder: "输入允许使用的符号，如 !@#_-",
      requireEachType: "每类字符至少出现一次",
      excludeSimilar: "排除易混淆字符 (O0Il1)",
      customExcludeChars: "自定义排除字符",
      customExcludePlaceholder: "这些字符不会出现，如 \"'\\|/",
      noRepeatChars: "禁止重复字符",
      noSequentialChars: "禁止连续字符 (abc/123)",
      capitalizeFirst: "首字母大写",
      autoRefresh: "自动刷新",
      enableAutoRefresh: "开启自动刷新",
      refreshInterval: "刷新间隔",
      custom: "自定义",
      seconds: "秒",
      lockAfterCopy: "复制后锁定密码",
      copyHistory: "复制记录",
      saveCopyHistory: "保存复制记录",
      historyLimit: "最大保存条数",
      historyLimit10: "10 条",
      historyLimit20: "20 条",
      historyLimit50: "50 条",
      historyLimit100: "100 条",
      unlimited: "不限制",
      historyRetentionDays: "自动清理周期",
      retention1: "1 天",
      retention7: "7 天",
      retention30: "30 天",
      retention90: "90 天",
      neverClean: "永不清理",
      maskHistoryByDefault: "记录默认遮罩显示",
      securityPrivacy: "安全与隐私",
      privacyText: "本插件不会上传、同步或分享你的密码。生成的密码仅在本地浏览器中处理。复制记录仅保存你主动点击复制的密码。请勿在公共电脑或他人设备上启用复制记录功能。",
      resetDefaults: "恢复默认设置",
      saveSettings: "保存规则设置",
      clearAll: "清空全部",
      emptyHistoryTitle: "暂无复制记录",
      emptyHistoryDesc: "点击首页的「复制密码」后，会在这里看到记录。",
      strength_weak: "弱",
      strength_medium: "中",
      strength_strong: "强",
      strength_veryStrong: "极强",
      lengthMeta: "长度 {length} 位",
      refreshNormal: "将在 {seconds} 秒后自动刷新",
      refreshLocked: "当前密码已锁定",
      refreshDisabled: "自动刷新已关闭",
      refreshError: "当前规则错误，无法生成",
      generateFailed: "生成失败，请检查规则",
      noCharType: "请至少选择一种字符类型",
      minLength: "密码长度不能小于 8 位",
      maxLength: "密码长度不能超过 64 位",
      customSymbolsRequired: "请填写自定义符号或切换符号模式",
      invalidRules: "规则无效",
      settingsSaved: "设置已保存",
      resetSettingsTitle: "恢复默认设置",
      resetSettingsBody: "确认恢复默认设置？复制记录不会被删除。",
      resetSettingsConfirm: "恢复",
      settingsReset: "已恢复默认设置",
      disableHistoryTitle: "关闭复制记录",
      disableHistoryBody: "关闭后新的复制密码将不再保存。是否同时清空已有复制记录？",
      clear: "清空",
      keep: "保留",
      clearAllTitle: "清空全部记录",
      clearAllBody: "确认清空所有复制记录？该操作不可恢复。",
      cleared: "已清空",
      historyCount: "{count} 条记录",
      itemLength: "{length} 位",
      copyCount: "复制 {count} 次",
      show: "显示",
      hide: "隐藏",
      copy: "复制",
      delete: "删除",
      showPasswordTitle: "显示完整密码",
      showPasswordBody: "该内容为敏感信息，确认显示完整密码？",
      deleteRecordTitle: "删除记录",
      deleteRecordBody: "确认删除这条复制记录？",
      confirm: "确认",
      cancel: "取消",
      today: "今天",
      yesterday: "昨天",
      dateFormat: "{month}月{day}日 {time}",
      symbolHintCommon: "常用符号：{symbols}",
      symbolHintFull: "完整符号：{symbols}",
    },
    en: {
      navHome: "Home",
      navSettings: "Settings",
      navHistory: "History",
      selectPasswordTitle: "Click to select password",
      copyPassword: "Copy password",
      copied: "Copied",
      copyFailed: "Copy failed",
      copyFailedManual: "Copy failed. Please copy manually.",
      copiedToClipboard: "Copied to clipboard",
      recordSaveFailed: "Password copied, but history could not be saved.",
      regenerate: "Regenerate",
      lock: "Lock",
      unlock: "Unlock",
      quickSettings: "Quick Settings",
      appearance: "Appearance",
      theme: "Theme",
      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      language: "Language",
      passwordRules: "Password Rules",
      passwordLength: "Password length",
      includeUppercase: "Include uppercase (A-Z)",
      includeLowercase: "Include lowercase (a-z)",
      includeNumbers: "Include numbers (0-9)",
      includeSymbols: "Include symbols",
      symbolMode: "Symbol mode",
      symbolCommon: "Common",
      symbolFull: "Full",
      symbolCustom: "Custom",
      customSymbolsPlaceholder: "Allowed symbols, e.g. !@#_-",
      requireEachType: "Require each selected type",
      excludeSimilar: "Exclude ambiguous characters (O0Il1)",
      customExcludeChars: "Custom excluded characters",
      customExcludePlaceholder: "Characters to exclude, e.g. \"'\\|/",
      noRepeatChars: "Disallow repeated characters",
      noSequentialChars: "Disallow sequences (abc/123)",
      capitalizeFirst: "Uppercase first character",
      autoRefresh: "Auto Refresh",
      enableAutoRefresh: "Enable auto refresh",
      refreshInterval: "Refresh interval",
      custom: "Custom",
      seconds: "sec",
      lockAfterCopy: "Lock after copy",
      copyHistory: "Copy History",
      saveCopyHistory: "Save copy history",
      historyLimit: "Maximum entries",
      historyLimit10: "10 entries",
      historyLimit20: "20 entries",
      historyLimit50: "50 entries",
      historyLimit100: "100 entries",
      unlimited: "Unlimited",
      historyRetentionDays: "Auto cleanup",
      retention1: "1 day",
      retention7: "7 days",
      retention30: "30 days",
      retention90: "90 days",
      neverClean: "Never",
      maskHistoryByDefault: "Mask history by default",
      securityPrivacy: "Security & Privacy",
      privacyText: "FreshPass does not upload, sync, or share your passwords. Generated passwords are processed locally in your browser. Copy history stores only passwords you explicitly copy. Avoid enabling copy history on public or shared devices.",
      resetDefaults: "Reset defaults",
      saveSettings: "Save rules",
      clearAll: "Clear all",
      emptyHistoryTitle: "No copy history",
      emptyHistoryDesc: "Copied passwords will appear here after you click Copy password.",
      strength_weak: "Weak",
      strength_medium: "Medium",
      strength_strong: "Strong",
      strength_veryStrong: "Very strong",
      lengthMeta: "{length} chars",
      refreshNormal: "Auto-refresh in {seconds}s",
      refreshLocked: "Password is locked",
      refreshDisabled: "Auto refresh is off",
      refreshError: "Current rules cannot generate a password",
      generateFailed: "Generation failed. Check your rules.",
      noCharType: "Select at least one character type",
      minLength: "Password length cannot be less than 8",
      maxLength: "Password length cannot exceed 64",
      customSymbolsRequired: "Enter custom symbols or switch symbol mode",
      invalidRules: "Invalid rules",
      settingsSaved: "Settings saved",
      resetSettingsTitle: "Reset defaults",
      resetSettingsBody: "Reset to default settings? Copy history will not be deleted.",
      resetSettingsConfirm: "Reset",
      settingsReset: "Defaults restored",
      disableHistoryTitle: "Disable copy history",
      disableHistoryBody: "New copied passwords will no longer be saved. Clear existing copy history too?",
      clear: "Clear",
      keep: "Keep",
      clearAllTitle: "Clear all history",
      clearAllBody: "Clear all copy history? This cannot be undone.",
      cleared: "Cleared",
      historyCount: "{count} records",
      itemLength: "{length} chars",
      copyCount: "Copied {count} times",
      show: "Show",
      hide: "Hide",
      copy: "Copy",
      delete: "Delete",
      showPasswordTitle: "Show full password",
      showPasswordBody: "This is sensitive information. Show the full password?",
      deleteRecordTitle: "Delete record",
      deleteRecordBody: "Delete this copy history record?",
      confirm: "Confirm",
      cancel: "Cancel",
      today: "Today",
      yesterday: "Yesterday",
      dateFormat: "{month}/{day} {time}",
      symbolHintCommon: "Common symbols: {symbols}",
      symbolHintFull: "Full symbols: {symbols}",
    },
  };

  const ERROR_TRANSLATIONS = {
    "请至少选择一种字符类型": "noCharType",
    "当前规则下没有可用字符，请调整排除字符": "noAvailableChars",
    "开启「首字母大写」需要可用的大写字母，请调整排除字符": "capitalizeNeedsUpper",
    "当前可用字符数量不足，请减少密码长度或关闭禁止重复字符": "notEnoughChars",
    "当前规则过于严格，无法生成密码，请放宽限制": "rulesTooStrict",
    "生成失败，请检查规则": "generateFailed",
    "规则无效": "invalidRules",
  };

  I18N.zh.noAvailableChars = "当前规则下没有可用字符，请调整排除字符";
  I18N.en.noAvailableChars = "No characters are available under the current rules. Adjust excluded characters.";
  I18N.zh.capitalizeNeedsUpper = "开启「首字母大写」需要可用的大写字母，请调整排除字符";
  I18N.en.capitalizeNeedsUpper = "Uppercase first character requires available uppercase letters. Adjust excluded characters.";
  I18N.zh.notEnoughChars = "当前可用字符数量不足，请减少密码长度或关闭禁止重复字符";
  I18N.en.notEnoughChars = "Not enough available characters. Reduce length or disable disallow repeated characters.";
  I18N.zh.rulesTooStrict = "当前规则过于严格，无法生成密码，请放宽限制";
  I18N.en.rulesTooStrict = "Current rules are too strict to generate a password. Relax the rules.";

  // ---- 运行时状态（仅内存） ----
  const state = {
    settings: null,
    currentPassword: "",
    strength: null,
    isLocked: false,
    remaining: 0,
    timer: null,
    copyResetTimer: null,
    activeView: "home",
  };

  // ---- DOM 缓存 ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const el = {};

  function lang() {
    return (state.settings && state.settings.language) || "zh";
  }

  function t(key, vars) {
    const dict = I18N[lang()] || I18N.zh;
    let text = dict[key] || I18N.zh[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replaceAll("{" + name + "}", String(value));
      });
    }
    return text;
  }

  function translateError(message) {
    const raw = String(message || "");
    const lengthMatch = raw.match(/^当前密码长度不足，至少需要 (\d+) 位以满足所选规则$/);
    if (lengthMatch) {
      return lang() === "en"
        ? `Password length is too short. At least ${lengthMatch[1]} characters are required for the selected rules.`
        : raw;
    }
    const key = ERROR_TRANSLATIONS[raw];
    return key ? t(key) : raw;
  }

  function applyLanguage(refreshViews) {
    const currentLang = lang();
    document.documentElement.lang = currentLang === "en" ? "en" : "zh-CN";
    $$("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    $$("[data-i18n-title]").forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
    });
    if (state.settings) {
      $$("#languageMode button").forEach((b) => b.classList.toggle("active", b.dataset.val === currentLang));
      el.lockLabel.textContent = state.isLocked ? t("unlock") : t("lock");
      syncSymbolMode();
      if (state.currentPassword) renderPassword();
      setRefreshStatus(currentRefreshStatus());
      if (state.activeView === "history" && refreshViews) renderHistory();
    }
  }

  // ================= 初始化 =================
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    bindNav();
    bindHome();
    bindSettings();
    bindHistory();
    bindModal();

    state.settings = await storage.getSettings();
    applyTheme(state.settings.theme);
    applyLanguage(false);
    syncQuickRules();
    syncSettingsForm();
    await cleanupHistoryOnOpen();

    generateNew(true); // 打开即生成
  }

  function cacheDom() {
    el.views = $$(".view");
    el.tabs = $$(".tab");
    el.pwdDisplay = $("#pwdDisplay");
    el.strengthBadge = $("#strengthBadge");
    el.strengthFill = $("#strengthFill");
    el.metaLen = $("#metaLen");
    el.refreshText = $("#refreshText");
    el.refreshDot = $("#refreshDot");
    el.homeError = $("#homeError");
    el.copyBtn = $("#copyBtn");
    el.regenBtn = $("#regenBtn");
    el.lockBtn = $("#lockBtn");
    el.lockLabel = $("#lockLabel");
    el.toast = $("#toast");
    // quick rules
    el.qrLength = $("#qrLength");
    el.qrLenValue = $("#qrLenValue");
    el.chips = $$(".chip");
    // history
    el.historyList = $("#historyList");
    el.historyEmpty = $("#historyEmpty");
    el.historyCount = $("#historyCount");
    el.clearAllBtn = $("#clearAllBtn");
    // modal
    el.modal = $("#modal");
    el.modalTitle = $("#modalTitle");
    el.modalBody = $("#modalBody");
    el.modalConfirm = $("#modalConfirm");
    el.modalCancel = $("#modalCancel");
  }

  // ================= 导航 =================
  function bindNav() {
    el.tabs.forEach((tab) => {
      tab.addEventListener("click", () => switchView(tab.dataset.view));
    });
  }

  function switchView(view) {
    state.activeView = view;
    el.tabs.forEach((t) => t.classList.toggle("active", t.dataset.view === view));
    el.views.forEach((v) => v.classList.toggle("active", v.dataset.view === view));
    if (view === "history") renderHistory();
    if (view === "settings") syncSettingsForm();
  }

  // ================= 首页 =================
  function bindHome() {
    el.copyBtn.addEventListener("click", onCopy);
    el.regenBtn.addEventListener("click", () => generateNew(true));
    el.lockBtn.addEventListener("click", toggleLock);
    el.pwdDisplay.addEventListener("click", () => {
      if (!el.pwdDisplay.classList.contains("is-error")) selectText(el.pwdDisplay);
    });

    // 快捷长度
    el.qrLength.addEventListener("input", () => {
      el.qrLenValue.textContent = el.qrLength.value;
    });
    el.qrLength.addEventListener("change", async () => {
      state.settings.passwordLength = Number(el.qrLength.value);
      await storage.saveSettings(state.settings);
      generateNew(true);
    });

    // 快捷字符开关
    el.chips.forEach((chip) => {
      chip.addEventListener("click", async () => {
        const flag = chip.dataset.flag;
        // 不允许关闭最后一个字符类型
        const activeChips = el.chips.filter((c) => c.classList.contains("active"));
        if (chip.classList.contains("active") && activeChips.length === 1) {
          showToast(t("noCharType"), true);
          return;
        }
        chip.classList.toggle("active");
        state.settings[flag] = chip.classList.contains("active");
        await storage.saveSettings(state.settings);
        generateNew(true);
      });
    });
  }

  function syncQuickRules() {
    el.qrLength.value = state.settings.passwordLength;
    el.qrLenValue.textContent = state.settings.passwordLength;
    const map = {
      useUppercase: "useUppercase",
      useLowercase: "useLowercase",
      useNumbers: "useNumbers",
      useSymbols: "useSymbols",
    };
    el.chips.forEach((chip) => {
      chip.classList.toggle("active", !!state.settings[map[chip.dataset.flag]]);
    });
  }

  // ---- 生成密码 ----
  function generateNew(resetCountdown) {
    try {
      const pwd = generatePassword(state.settings);
      state.currentPassword = pwd;
      state.strength = evaluateStrength(pwd);
      renderPassword();
      hideHomeError();
      if (resetCountdown) restartCountdown();
    } catch (e) {
      showHomeError(e instanceof PasswordError ? translateError(e.message) : t("generateFailed"));
      stopCountdown();
      setRefreshStatus("error");
    }
  }

  function renderPassword() {
    el.pwdDisplay.classList.remove("is-error");
    el.pwdDisplay.textContent = state.currentPassword;
    const s = state.strength;
    el.strengthBadge.textContent = t("strength_" + s.level);
    el.strengthBadge.className = "strength-badge " + s.level;
    el.strengthFill.className = s.level;
    el.strengthFill.style.width = s.score + "%";
    el.metaLen.textContent = t("lengthMeta", { length: state.currentPassword.length });
  }

  function showHomeError(msg) {
    el.pwdDisplay.classList.add("is-error");
    el.pwdDisplay.textContent = "—";
    el.homeError.textContent = msg;
    el.homeError.hidden = false;
    el.strengthBadge.textContent = "—";
    el.strengthBadge.className = "strength-badge";
    el.strengthFill.style.width = "0%";
    el.metaLen.textContent = "";
  }
  function hideHomeError() { el.homeError.hidden = true; }

  // ---- 复制 ----
  async function onCopy() {
    if (el.pwdDisplay.classList.contains("is-error")) return;
    const pwd = state.currentPassword;
    try {
      await copyToClipboard(pwd);
      setCopyBtnState("success");
      await recordCopy(pwd);
      if (state.settings.lockAfterCopy && !state.isLocked) lock();
      setRefreshStatus("copied");
    } catch (e) {
      setCopyBtnState("error");
      selectText(el.pwdDisplay);
      showToast(t("copyFailedManual"), true);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("execCommand failed"));
      } catch (e) { reject(e); }
    });
  }

  function setCopyBtnState(stateName) {
    clearTimeout(state.copyResetTimer);
    const label = el.copyBtn.querySelector("span");
    el.copyBtn.classList.remove("success");
    if (stateName === "success") {
      label.textContent = t("copied");
      el.copyBtn.classList.add("success");
    } else if (stateName === "error") {
      label.textContent = t("copyFailed");
    }
    state.copyResetTimer = setTimeout(() => {
      label.textContent = t("copyPassword");
      el.copyBtn.classList.remove("success");
      if (state.activeView === "home") setRefreshStatus(currentRefreshStatus());
    }, 1500);
  }

  // ---- 锁定 ----
  function toggleLock() { state.isLocked ? unlock() : lock(); }

  function lock() {
    state.isLocked = true;
    stopCountdown();
    el.lockLabel.textContent = t("unlock");
    el.lockBtn.classList.add("is-locked");
    setRefreshStatus("locked");
  }

  function unlock() {
    state.isLocked = false;
    el.lockLabel.textContent = t("lock");
    el.lockBtn.classList.remove("is-locked");
    restartCountdown();
  }

  // ---- 自动刷新倒计时 ----
  function restartCountdown() {
    stopCountdown();
    if (state.isLocked) { setRefreshStatus("locked"); return; }
    if (!state.settings.autoRefresh) { setRefreshStatus("disabled"); return; }
    state.remaining = clampInterval(state.settings.refreshInterval);
    setRefreshStatus("normal");
    state.timer = setInterval(tick, 1000);
  }

  function tick() {
    state.remaining -= 1;
    if (state.remaining <= 0) {
      generateNew(false);
      state.remaining = clampInterval(state.settings.refreshInterval);
    }
    setRefreshStatus("normal");
  }

  function stopCountdown() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  function clampInterval(v) {
    const n = Number(v) || 60;
    return Math.max(10, Math.min(3600, n));
  }

  function currentRefreshStatus() {
    if (el.pwdDisplay.classList.contains("is-error")) return "error";
    if (state.isLocked) return "locked";
    if (!state.settings.autoRefresh) return "disabled";
    return "normal";
  }

  function setRefreshStatus(status) {
    el.refreshDot.className = "refresh-dot " + (status === "normal" || status === "copied" ? "" : status);
    const texts = {
      normal: t("refreshNormal", { seconds: state.remaining }),
      locked: t("refreshLocked"),
      disabled: t("refreshDisabled"),
      error: t("refreshError"),
      copied: t("copiedToClipboard"),
    };
    el.refreshText.textContent = texts[status] || texts.normal;
  }

  // ================= 设置页 =================
  function bindSettings() {
    // 主题
    $$("#themeMode button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        state.settings.theme = btn.dataset.val;
        applyTheme(state.settings.theme);
        markActive("#themeMode", btn);
        await storage.saveSettings(state.settings);
      });
    });

    // 语言
    $$("#languageMode button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        state.settings.language = btn.dataset.val;
        applyLanguage(true);
        await storage.saveSettings(state.settings);
      });
    });

    // 长度
    const setLength = $("#setLength");
    const setLenValue = $("#setLenValue");
    setLength.addEventListener("input", () => { setLenValue.textContent = setLength.value; });
    setLength.addEventListener("change", () => { state.settings.passwordLength = Number(setLength.value); });

    // 开关类
    $$('[data-setting]').forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.dataset.setting;
        state.settings[key] = input.checked;
        if (key === "useSymbols") updateSymbolFieldVisibility();
        if (key === "autoRefresh") updateIntervalFieldVisibility();
        if (key === "saveCopyHistory" && !input.checked) maybeOfferClearHistory();
      });
    });

    // 符号模式
    $$("#symbolMode button").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.settings.symbolMode = btn.dataset.val;
        syncSymbolMode();
      });
    });
    $("#customSymbols").addEventListener("input", (e) => { state.settings.customSymbols = e.target.value; });
    $("#customExcludeChars").addEventListener("input", (e) => { state.settings.customExcludeChars = e.target.value; });

    // 刷新间隔预设
    $$("#intervalPreset button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.val === "custom") {
          $("#customIntervalWrap").hidden = false;
          markActive("#intervalPreset", btn);
        } else {
          state.settings.refreshInterval = Number(btn.dataset.val);
          $("#customIntervalWrap").hidden = true;
          markActive("#intervalPreset", btn);
        }
      });
    });
    $("#customInterval").addEventListener("input", (e) => {
      let v = Number(e.target.value);
      if (!Number.isNaN(v)) state.settings.refreshInterval = v;
    });

    // 历史选择
    $("#historyLimit").addEventListener("change", (e) => {
      const v = e.target.value;
      state.settings.historyLimit = v === "unlimited" ? "unlimited" : Number(v);
    });
    $("#historyRetentionDays").addEventListener("change", (e) => {
      const v = e.target.value;
      state.settings.historyRetentionDays = v === "never" ? "never" : Number(v);
    });

    $("#saveBtn").addEventListener("click", onSaveSettings);
    $("#resetBtn").addEventListener("click", onResetSettings);
  }

  function syncSettingsForm() {
    const s = state.settings;
    $$("#themeMode button").forEach((b) => b.classList.toggle("active", b.dataset.val === (s.theme || "system")));
    $$("#languageMode button").forEach((b) => b.classList.toggle("active", b.dataset.val === (s.language || "zh")));
    $("#setLength").value = s.passwordLength;
    $("#setLenValue").textContent = s.passwordLength;

    $$('[data-setting]').forEach((input) => {
      input.checked = !!s[input.dataset.setting];
    });

    syncSymbolMode();
    updateSymbolFieldVisibility();

    // interval
    const presetVals = ["15", "30", "60", "120", "300"];
    const isPreset = presetVals.includes(String(s.refreshInterval));
    $$("#intervalPreset button").forEach((b) => {
      b.classList.toggle("active", isPreset ? b.dataset.val === String(s.refreshInterval) : b.dataset.val === "custom");
    });
    if (!isPreset) {
      $("#customIntervalWrap").hidden = false;
      $("#customInterval").value = s.refreshInterval;
    } else {
      $("#customIntervalWrap").hidden = true;
    }
    updateIntervalFieldVisibility();

    $("#historyLimit").value = String(s.historyLimit);
    $("#historyRetentionDays").value = String(s.historyRetentionDays);
  }

  function syncSymbolMode() {
    $$("#symbolMode button").forEach((b) => b.classList.toggle("active", b.dataset.val === state.settings.symbolMode));
    const custom = $("#customSymbols");
    const hint = $("#symbolHint");
    if (state.settings.symbolMode === "custom") {
      custom.hidden = false;
      custom.value = state.settings.customSymbols || "";
      hint.hidden = true;
    } else {
      custom.hidden = true;
      hint.hidden = false;
      hint.textContent = state.settings.symbolMode === "full"
        ? t("symbolHintFull", { symbols: constants.SYMBOLS_FULL })
        : t("symbolHintCommon", { symbols: constants.SYMBOLS_COMMON });
    }
  }

  function updateSymbolFieldVisibility() {
    $("#symbolModeField").style.display = state.settings.useSymbols ? "" : "none";
  }
  function updateIntervalFieldVisibility() {
    $("#intervalField").style.opacity = state.settings.autoRefresh ? "1" : "0.45";
    $("#intervalField").style.pointerEvents = state.settings.autoRefresh ? "" : "none";
  }

  function markActive(container, btn) {
    $$(container + " button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  // ---- 保存设置 ----
  async function onSaveSettings() {
    const s = state.settings;

    // 校验
    if (s.passwordLength < 8) return showToast(t("minLength"), true);
    if (s.passwordLength > 64) return showToast(t("maxLength"), true);

    s.refreshInterval = clampInterval(s.refreshInterval);

    if (!s.useUppercase && !s.useLowercase && !s.useNumbers && !s.useSymbols) {
      return showToast(t("noCharType"), true);
    }
    if (s.useSymbols && s.symbolMode === "custom" && !(s.customSymbols || "").trim()) {
      return showToast(t("customSymbolsRequired"), true);
    }

    // 试生成，校验规则可用
    try {
      generatePassword(s);
    } catch (e) {
      return showToast(e instanceof PasswordError ? translateError(e.message) : t("invalidRules"), true);
    }

    await storage.saveSettings(s);
    syncQuickRules();
    showToast(t("settingsSaved"));
    generateNew(true);
    switchView("home");
  }

  async function onResetSettings() {
    openModal({
      title: t("resetSettingsTitle"),
      body: t("resetSettingsBody"),
      confirmText: t("resetSettingsConfirm"),
      onConfirm: async () => {
        state.settings = await storage.resetSettings();
        applyLanguage(true);
        syncSettingsForm();
        syncQuickRules();
        showToast(t("settingsReset"));
        generateNew(true);
      },
    });
  }

  function maybeOfferClearHistory() {
    storage.getHistory().then((h) => {
      if (h.length === 0) return;
      openModal({
        title: t("disableHistoryTitle"),
        body: t("disableHistoryBody"),
        confirmText: t("clear"),
        cancelText: t("keep"),
        onConfirm: async () => {
          await storage.saveHistory([]);
          if (state.activeView === "history") renderHistory();
        },
      });
    });
  }

  // ================= 复制记录 =================
  function bindHistory() {
    el.clearAllBtn.addEventListener("click", () => {
      openModal({
        title: t("clearAllTitle"),
        body: t("clearAllBody"),
        confirmText: t("clear"),
        onConfirm: async () => {
          await storage.saveHistory([]);
          renderHistory();
          showToast(t("cleared"));
        },
      });
    });
  }

  async function recordCopy(pwd) {
    if (!state.settings.saveCopyHistory) return;
    try {
      let history = await storage.getHistory();
      const now = Date.now();
      const existing = history.find((h) => h.password === pwd);
      if (existing) {
        existing.lastCopiedAt = now;
        existing.copyCount = (existing.copyCount || 1) + 1;
      } else {
        history.unshift({
          id: storage.uuid(),
          password: pwd,
          length: pwd.length,
          strength: state.strength.level,
          createdAt: now,
          lastCopiedAt: now,
          copyCount: 1,
          ruleSnapshot: snapshotRule(),
          domain: "",
          note: "",
        });
      }
      history = storage.pruneHistory(history, state.settings);
      await storage.saveHistory(history);
    } catch (e) {
      showToast(t("recordSaveFailed"), true);
    }
  }

  function snapshotRule() {
    const s = state.settings;
    return {
      passwordLength: s.passwordLength,
      useUppercase: s.useUppercase,
      useLowercase: s.useLowercase,
      useNumbers: s.useNumbers,
      useSymbols: s.useSymbols,
      symbolMode: s.symbolMode,
      excludeSimilar: s.excludeSimilar,
      requireEachType: s.requireEachType,
      capitalizeFirst: s.capitalizeFirst,
    };
  }

  async function cleanupHistoryOnOpen() {
    try {
      const history = await storage.getHistory();
      const pruned = storage.pruneHistory(history, state.settings);
      if (pruned.length !== history.length) await storage.saveHistory(pruned);
    } catch (e) { /* ignore */ }
  }

  async function renderHistory() {
    const history = await storage.getHistory();
    history.sort((a, b) => (b.lastCopiedAt || b.createdAt) - (a.lastCopiedAt || a.createdAt));

    el.historyCount.textContent = t("historyCount", { count: history.length });
    el.historyList.innerHTML = "";

    if (history.length === 0) {
      el.historyEmpty.hidden = false;
      el.clearAllBtn.style.visibility = "hidden";
      return;
    }
    el.historyEmpty.hidden = true;
    el.clearAllBtn.style.visibility = "visible";

    history.forEach((item) => {
      const card = document.createElement("div");
      card.className = "h-item";

      const masked = maskPassword(item.password);
      const strengthLevel = item.strength || "strong";
      const strengthLabel = I18N[lang()]["strength_" + strengthLevel] ? t("strength_" + strengthLevel) : t("strength_strong");

      card.innerHTML = `
        <div class="h-pwd" data-masked="${escapeHtml(masked)}" data-full="${escapeHtml(item.password)}" data-shown="0">${escapeHtml(state.settings.maskHistoryByDefault ? masked : item.password)}</div>
        <div class="h-info">
          <span class="h-badge ${strengthLevel}">${escapeHtml(strengthLabel)}</span>
          <span>${escapeHtml(t("itemLength", { length: item.length }))}</span>
          <span class="dot"></span>
          <span>${escapeHtml(formatTime(item.lastCopiedAt || item.createdAt))}</span>
          <span class="dot"></span>
          <span>${escapeHtml(t("copyCount", { count: item.copyCount || 1 }))}</span>
        </div>
        <div class="h-actions">
          <button class="toggle">${state.settings.maskHistoryByDefault ? escapeHtml(t("show")) : escapeHtml(t("hide"))}</button>
          <button class="copy">${escapeHtml(t("copy"))}</button>
          <button class="del">${escapeHtml(t("delete"))}</button>
        </div>`;

      const pwdEl = card.querySelector(".h-pwd");
      const toggleBtn = card.querySelector(".toggle");
      let shown = !state.settings.maskHistoryByDefault;
      let autoHideTimer = null;

      const setShown = (val) => {
        shown = val;
        pwdEl.textContent = val ? item.password : masked;
        toggleBtn.textContent = val ? t("hide") : t("show");
        clearTimeout(autoHideTimer);
        if (val) autoHideTimer = setTimeout(() => setShown(false), 10000);
      };

      toggleBtn.addEventListener("click", () => {
        if (shown) { setShown(false); return; }
        openModal({
          title: t("showPasswordTitle"),
          body: t("showPasswordBody"),
          confirmText: t("show"),
          onConfirm: () => setShown(true),
        });
      });

      card.querySelector(".copy").addEventListener("click", async () => {
        try {
          await copyToClipboard(item.password);
          await bumpCopy(item.id);
          showToast(t("copied"));
          renderHistory();
        } catch (e) {
          showToast(t("copyFailedManual"), true);
        }
      });

      card.querySelector(".del").addEventListener("click", () => {
        openModal({
          title: t("deleteRecordTitle"),
          body: t("deleteRecordBody"),
          confirmText: t("delete"),
          onConfirm: async () => {
            const list = (await storage.getHistory()).filter((h) => h.id !== item.id);
            await storage.saveHistory(list);
            renderHistory();
          },
        });
      });

      el.historyList.appendChild(card);
    });
  }

  async function bumpCopy(id) {
    const list = await storage.getHistory();
    const item = list.find((h) => h.id === id);
    if (item) {
      item.lastCopiedAt = Date.now();
      item.copyCount = (item.copyCount || 1) + 1;
      await storage.saveHistory(storage.pruneHistory(list, state.settings));
    }
  }

  function maskPassword(pwd) {
    if (pwd.length <= 4) return pwd[0] + "•".repeat(Math.max(pwd.length - 1, 0));
    const visible = pwd.slice(0, 4);
    return visible + "•".repeat(Math.min(pwd.length - 4, 12));
  }

  // ================= 弹窗 =================
  let modalConfirmHandler = null;
  function bindModal() {
    el.modalCancel.addEventListener("click", closeModal);
    el.modalConfirm.addEventListener("click", async () => {
      const handler = modalConfirmHandler;
      closeModal();
      if (handler) await handler();
    });
    el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeModal(); });
  }

  function openModal({ title, body, confirmText = t("confirm"), cancelText = t("cancel"), onConfirm }) {
    el.modalTitle.textContent = title;
    el.modalBody.textContent = body;
    el.modalConfirm.textContent = confirmText;
    el.modalCancel.textContent = cancelText;
    modalConfirmHandler = onConfirm;
    el.modal.hidden = false;
  }
  function closeModal() {
    el.modal.hidden = true;
    modalConfirmHandler = null;
  }

  // ================= 工具 =================
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme || "system";
  }

  let toastTimer = null;
  function showToast(msg, isError) {
    clearTimeout(toastTimer);
    el.toast.textContent = msg;
    el.toast.className = "toast show" + (isError ? " error" : "");
    el.toast.hidden = false;
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 1800);
  }

  function selectText(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (sameDay) return t("today") + " " + hm;
    if (d.toDateString() === yesterday.toDateString()) return t("yesterday") + " " + hm;
    return t("dateFormat", { month: d.getMonth() + 1, day: d.getDate(), time: hm });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
