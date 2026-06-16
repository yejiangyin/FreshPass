// utils/storage.js
// chrome.storage.local 封装：用户设置 + 复制记录。

const DEFAULT_SETTINGS = {
  passwordLength: 16,
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  useSymbols: true,
  symbolMode: "common", // common | full | custom
  customSymbols: "",
  excludeSimilar: true,
  customExcludeChars: "",
  requireEachType: true,
  noRepeatChars: false,
  noSequentialChars: false,
  capitalizeFirst: false,
  autoRefresh: true,
  refreshInterval: 60,
  lockAfterCopy: false,
  saveCopyHistory: true,
  historyLimit: 20, // 数字或 "unlimited"
  historyRetentionDays: 30, // 数字或 "never"
  maskHistoryByDefault: true,
  theme: "system", // system | light | dark
  language: "zh", // zh | en
};

const KEYS = {
  settings: "settings",
  history: "copyHistory",
};

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
}

function storageGet(keys) {
  return new Promise((resolve) => {
    if (!hasChromeStorage()) {
      // 开发态降级到 localStorage
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
        const raw = localStorage.getItem("fp_" + k);
        if (raw != null) out[k] = JSON.parse(raw);
      });
      resolve(out);
      return;
    }
    chrome.storage.local.get(keys, (res) => resolve(res || {}));
  });
}

function storageSet(obj) {
  return new Promise((resolve, reject) => {
    if (!hasChromeStorage()) {
      try {
        Object.entries(obj).forEach(([k, v]) => localStorage.setItem("fp_" + k, JSON.stringify(v)));
        resolve();
      } catch (e) {
        reject(e);
      }
      return;
    }
    chrome.storage.local.set(obj, () => {
      if (chrome.runtime && chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

async function getSettings() {
  const res = await storageGet(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(res[KEYS.settings] || {}) };
}

async function saveSettings(settings) {
  await storageSet({ [KEYS.settings]: settings });
}

async function resetSettings() {
  await storageSet({ [KEYS.settings]: { ...DEFAULT_SETTINGS } });
  return { ...DEFAULT_SETTINGS };
}

async function getHistory() {
  const res = await storageGet(KEYS.history);
  return res[KEYS.history] || [];
}

async function saveHistory(history) {
  await storageSet({ [KEYS.history]: history });
}

// 应用保留周期与数量上限，返回清理后的列表
function pruneHistory(history, settings) {
  let list = history.slice();

  // 按保留天数清理
  if (settings.historyRetentionDays !== "never") {
    const days = Number(settings.historyRetentionDays);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    list = list.filter((item) => (item.lastCopiedAt || item.createdAt) >= cutoff);
  }

  // 按数量上限清理（保留最近复制的）
  if (settings.historyLimit !== "unlimited") {
    const limit = Number(settings.historyLimit);
    list.sort((a, b) => (b.lastCopiedAt || b.createdAt) - (a.lastCopiedAt || a.createdAt));
    if (list.length > limit) list = list.slice(0, limit);
  }

  return list;
}

// 简易 UUID
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

window.FreshPass = window.FreshPass || {};
window.FreshPass.storage = {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  resetSettings,
  getHistory,
  saveHistory,
  pruneHistory,
  uuid,
};
