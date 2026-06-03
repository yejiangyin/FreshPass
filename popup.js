// popup.js — FreshPass 主控制器
(function () {
  "use strict";

  const FP = window.FreshPass;
  const { storage, generatePassword, evaluateStrength, PasswordError, constants } = FP;

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
          showToast("请至少选择一种字符类型", true);
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
      showHomeError(e instanceof PasswordError ? e.message : "生成失败，请检查规则");
      stopCountdown();
      setRefreshStatus("error");
    }
  }

  function renderPassword() {
    el.pwdDisplay.classList.remove("is-error");
    el.pwdDisplay.textContent = state.currentPassword;
    const s = state.strength;
    el.strengthBadge.textContent = s.label;
    el.strengthBadge.className = "strength-badge " + s.level;
    el.strengthFill.className = s.level;
    el.strengthFill.style.width = s.score + "%";
    el.metaLen.textContent = "长度 " + state.currentPassword.length + " 位";
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
      showToast("复制失败，请手动复制", true);
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
      label.textContent = "已复制";
      el.copyBtn.classList.add("success");
    } else if (stateName === "error") {
      label.textContent = "复制失败";
    }
    state.copyResetTimer = setTimeout(() => {
      label.textContent = "复制密码";
      el.copyBtn.classList.remove("success");
      if (state.activeView === "home") setRefreshStatus(currentRefreshStatus());
    }, 1500);
  }

  // ---- 锁定 ----
  function toggleLock() { state.isLocked ? unlock() : lock(); }

  function lock() {
    state.isLocked = true;
    stopCountdown();
    el.lockLabel.textContent = "解除锁定";
    el.lockBtn.classList.add("is-locked");
    setRefreshStatus("locked");
  }

  function unlock() {
    state.isLocked = false;
    el.lockLabel.textContent = "锁定";
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
      normal: `将在 ${state.remaining} 秒后自动刷新`,
      locked: "当前密码已锁定",
      disabled: "自动刷新已关闭",
      error: "当前规则错误，无法生成",
      copied: "已复制到剪贴板",
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
        ? "完整符号：" + constants.SYMBOLS_FULL
        : "常用符号：" + constants.SYMBOLS_COMMON;
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
    if (s.passwordLength < 8) return showToast("密码长度不能小于 8 位", true);
    if (s.passwordLength > 64) return showToast("密码长度不能超过 64 位", true);

    s.refreshInterval = clampInterval(s.refreshInterval);

    if (!s.useUppercase && !s.useLowercase && !s.useNumbers && !s.useSymbols) {
      return showToast("请至少选择一种字符类型", true);
    }
    if (s.useSymbols && s.symbolMode === "custom" && !(s.customSymbols || "").trim()) {
      return showToast("请填写自定义符号或切换符号模式", true);
    }

    // 试生成，校验规则可用
    try {
      generatePassword(s);
    } catch (e) {
      return showToast(e instanceof PasswordError ? e.message : "规则无效", true);
    }

    await storage.saveSettings(s);
    syncQuickRules();
    showToast("设置已保存");
    generateNew(true);
    switchView("home");
  }

  async function onResetSettings() {
    openModal({
      title: "恢复默认设置",
      body: "确认恢复默认设置？复制记录不会被删除。",
      confirmText: "恢复",
      onConfirm: async () => {
        state.settings = await storage.resetSettings();
        syncSettingsForm();
        syncQuickRules();
        showToast("已恢复默认设置");
        generateNew(true);
      },
    });
  }

  function maybeOfferClearHistory() {
    storage.getHistory().then((h) => {
      if (h.length === 0) return;
      openModal({
        title: "关闭复制记录",
        body: "关闭后新的复制密码将不再保存。是否同时清空已有复制记录？",
        confirmText: "清空",
        cancelText: "保留",
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
        title: "清空全部记录",
        body: "确认清空所有复制记录？该操作不可恢复。",
        confirmText: "清空",
        onConfirm: async () => {
          await storage.saveHistory([]);
          renderHistory();
          showToast("已清空");
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
      showToast("密码已复制，但记录保存失败", true);
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

    el.historyCount.textContent = history.length + " 条记录";
    el.historyList.innerHTML = "";

    if (history.length === 0) {
      el.historyEmpty.hidden = false;
      el.clearAllBtn.style.visibility = "hidden";
      return;
    }
    el.historyEmpty.hidden = true;
    el.clearAllBtn.style.visibility = "visible";

    const labels = { weak: "弱", medium: "中", strong: "强", veryStrong: "极强" };

    history.forEach((item) => {
      const card = document.createElement("div");
      card.className = "h-item";

      const masked = maskPassword(item.password);
      const strengthLevel = item.strength || "strong";

      card.innerHTML = `
        <div class="h-pwd" data-masked="${escapeHtml(masked)}" data-full="${escapeHtml(item.password)}" data-shown="0">${escapeHtml(state.settings.maskHistoryByDefault ? masked : item.password)}</div>
        <div class="h-info">
          <span class="h-badge ${strengthLevel}">${labels[strengthLevel] || "强"}</span>
          <span>${item.length} 位</span>
          <span class="dot"></span>
          <span>${formatTime(item.lastCopiedAt || item.createdAt)}</span>
          <span class="dot"></span>
          <span>复制 ${item.copyCount || 1} 次</span>
        </div>
        <div class="h-actions">
          <button class="toggle">${state.settings.maskHistoryByDefault ? "显示" : "隐藏"}</button>
          <button class="copy">复制</button>
          <button class="del">删除</button>
        </div>`;

      const pwdEl = card.querySelector(".h-pwd");
      const toggleBtn = card.querySelector(".toggle");
      let shown = !state.settings.maskHistoryByDefault;
      let autoHideTimer = null;

      const setShown = (val) => {
        shown = val;
        pwdEl.textContent = val ? item.password : masked;
        toggleBtn.textContent = val ? "隐藏" : "显示";
        clearTimeout(autoHideTimer);
        if (val) autoHideTimer = setTimeout(() => setShown(false), 10000);
      };

      toggleBtn.addEventListener("click", () => {
        if (shown) { setShown(false); return; }
        openModal({
          title: "显示完整密码",
          body: "该内容为敏感信息，确认显示完整密码？",
          confirmText: "显示",
          onConfirm: () => setShown(true),
        });
      });

      card.querySelector(".copy").addEventListener("click", async () => {
        try {
          await copyToClipboard(item.password);
          await bumpCopy(item.id);
          showToast("已复制");
          renderHistory();
        } catch (e) {
          showToast("复制失败，请手动复制", true);
        }
      });

      card.querySelector(".del").addEventListener("click", () => {
        openModal({
          title: "删除记录",
          body: "确认删除这条复制记录？",
          confirmText: "删除",
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

  function openModal({ title, body, confirmText = "确认", cancelText = "取消", onConfirm }) {
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
    if (sameDay) return "今天 " + hm;
    if (d.toDateString() === yesterday.toDateString()) return "昨天 " + hm;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
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
