// utils/passwordGenerator.js
// 本地密码生成：使用 Web Crypto API 加密级随机数，严格遵循用户规则。

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
};

const SYMBOLS_COMMON = "!@#$%^&*";
const SYMBOLS_FULL = "!@#$%^&*()-_=+[]{};:,.<>?/|~";
const SIMILAR_CHARS = "O0Il1";

class PasswordError extends Error {}

// 加密级随机整数 [0, max)
function secureRandomInt(max) {
  if (max <= 0) throw new PasswordError("随机范围无效");
  // 拒绝采样，避免取模偏差
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

function secureRandomChar(chars) {
  return chars[secureRandomInt(chars.length)];
}

// Fisher–Yates 加密级洗牌
function shuffleSecure(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function removeChars(source, toRemove) {
  if (!toRemove) return source;
  const set = new Set(toRemove.split(""));
  return source
    .split("")
    .filter((c) => !set.has(c))
    .join("");
}

function getSymbolChars(symbolMode, customSymbols) {
  if (symbolMode === "full") return SYMBOLS_FULL;
  if (symbolMode === "custom") return (customSymbols || "").trim();
  return SYMBOLS_COMMON;
}

// 构建过滤后的字符组
function buildGroups(settings) {
  const groups = [];
  if (settings.useUppercase) groups.push({ type: "uppercase", chars: CHAR_SETS.uppercase });
  if (settings.useLowercase) groups.push({ type: "lowercase", chars: CHAR_SETS.lowercase });
  if (settings.useNumbers) groups.push({ type: "numbers", chars: CHAR_SETS.numbers });
  if (settings.useSymbols) {
    groups.push({ type: "symbols", chars: getSymbolChars(settings.symbolMode, settings.customSymbols) });
  }

  if (groups.length === 0) {
    throw new PasswordError("请至少选择一种字符类型");
  }

  const filtered = groups
    .map((g) => {
      let chars = g.chars;
      if (settings.excludeSimilar) chars = removeChars(chars, SIMILAR_CHARS);
      if (settings.customExcludeChars) chars = removeChars(chars, settings.customExcludeChars);
      // 去重，避免自定义符号重复
      chars = Array.from(new Set(chars.split(""))).join("");
      return { ...g, chars };
    })
    .filter((g) => g.chars.length > 0);

  if (filtered.length === 0) {
    throw new PasswordError("当前规则下没有可用字符，请调整排除字符");
  }
  return filtered;
}

function generatePassword(settings) {
  const length = settings.passwordLength;
  const groups = buildGroups(settings);

  if (settings.requireEachType && length < groups.length) {
    throw new PasswordError(`当前密码长度不足，至少需要 ${groups.length} 位以满足所选规则`);
  }

  const allChars = Array.from(new Set(groups.map((g) => g.chars).join("").split(""))).join("");

  // 首字母大写：构建可用的大写字母池（独立于是否启用大写类型）
  let upperPool = CHAR_SETS.uppercase;
  if (settings.excludeSimilar) upperPool = removeChars(upperPool, SIMILAR_CHARS);
  if (settings.customExcludeChars) upperPool = removeChars(upperPool, settings.customExcludeChars);
  if (settings.capitalizeFirst && upperPool.length === 0) {
    throw new PasswordError("开启「首字母大写」需要可用的大写字母，请调整排除字符");
  }

  // 禁止重复时的可用容量（首字母大写可额外贡献一个大写字符）
  const capacityChars = settings.capitalizeFirst
    ? Array.from(new Set((allChars + upperPool).split(""))).join("")
    : allChars;
  if (settings.noRepeatChars && length > capacityChars.length) {
    throw new PasswordError("当前可用字符数量不足，请减少密码长度或关闭禁止重复字符");
  }

  // 多次尝试，避免连续/重复约束下偶发失败
  const MAX_ATTEMPTS = 600;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const password = buildOnce(settings, groups, allChars, length, upperPool);
      if (password) return password;
    } catch (e) {
      if (e instanceof PasswordError) throw e;
    }
  }
  throw new PasswordError("当前规则过于严格，无法生成密码，请放宽限制");
}

function buildOnce(settings, groups, allChars, length, upperPool) {
  const result = [];
  const used = new Set();

  // 注意：连续字符与首字母约束需在最终洗牌后处理，因为洗牌会重排相邻关系。
  const tryPush = (char) => {
    if (settings.noRepeatChars && used.has(char)) return false;
    result.push(char);
    used.add(char);
    return true;
  };

  // 每类至少一个
  if (settings.requireEachType) {
    for (const group of groups) {
      let placed = false;
      for (let i = 0; i < 80 && !placed; i++) {
        placed = tryPush(secureRandomChar(group.chars));
      }
      if (!placed) return null; // 本次尝试失败，外层重试
    }
  }

  // 补齐剩余长度
  let guard = 0;
  while (result.length < length) {
    if (guard++ > length * 60) return null;
    tryPush(secureRandomChar(allChars));
  }

  let password = shuffleSecure(result).join("");

  // 首字母大写
  if (settings.capitalizeFirst) {
    password = applyCapitalizeFirst(password, upperPool, settings.noRepeatChars);
    if (password === null) return null;
    // 替换首字符可能破坏「每类至少一次」，需复核
    if (settings.requireEachType && !satisfiesEachType(password, groups)) return null;
  }

  // 洗牌后校验连续字符约束
  if (settings.noSequentialChars && hasSequenceInString(password)) return null;

  return password;
}

// 让密码以大写字母开头：优先与已有大写字符交换（保持字符集合不变），否则替换首字符
function applyCapitalizeFirst(password, upperPool, noRepeat) {
  const arr = password.split("");
  if (arr[0] >= "A" && arr[0] <= "Z") return password;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] >= "A" && arr[i] <= "Z") {
      const tmp = arr[0];
      arr[0] = arr[i];
      arr[i] = tmp;
      return arr.join("");
    }
  }
  // 密码中没有任何大写字母（如未启用大写类型）→ 替换首字符
  if (!upperPool || upperPool.length === 0) return null;
  const repl = secureRandomChar(upperPool);
  if (noRepeat && arr.includes(repl)) return null;
  arr[0] = repl;
  return arr.join("");
}

function satisfiesEachType(password, groups) {
  return groups.every((g) => password.split("").some((ch) => g.chars.includes(ch)));
}

// 字符串中是否存在 3 位及以上连续序列（升或降）
function hasSequenceInString(str) {
  for (let i = 0; i < str.length - 2; i++) {
    const a = str.charCodeAt(i);
    const b = str.charCodeAt(i + 1);
    const c = str.charCodeAt(i + 2);
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true;
  }
  return false;
}

// 暴露到全局，供 popup.js 使用（普通脚本引入，无模块系统）
window.FreshPass = window.FreshPass || {};
window.FreshPass.generatePassword = generatePassword;
window.FreshPass.PasswordError = PasswordError;
window.FreshPass.constants = { SYMBOLS_COMMON, SYMBOLS_FULL, SIMILAR_CHARS };
