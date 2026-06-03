// utils/strength.js
// 密码强度评估，遵循 PRD 第 11 章规则。

const WEAK_PATTERNS = [
  "password", "passwd", "123456", "12345678", "111111", "qwerty",
  "abc123", "admin", "iloveyou", "welcome", "letmein", "monkey",
  "000000", "654321", "qazwsx", "dragon",
];

function countCharTypes(pwd) {
  let types = 0;
  if (/[A-Z]/.test(pwd)) types++;
  if (/[a-z]/.test(pwd)) types++;
  if (/[0-9]/.test(pwd)) types++;
  if (/[^A-Za-z0-9]/.test(pwd)) types++;
  return types;
}

function hasSequential(pwd) {
  // 连续 3 位及以上（升或降）
  for (let i = 0; i < pwd.length - 2; i++) {
    const a = pwd.charCodeAt(i);
    const b = pwd.charCodeAt(i + 1);
    const c = pwd.charCodeAt(i + 2);
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true;
  }
  return false;
}

function hasRepeats(pwd) {
  // 连续重复 3 次及以上，如 aaa
  return /(.)\1\1/.test(pwd);
}

function hasWeakPattern(pwd) {
  const lower = pwd.toLowerCase();
  return WEAK_PATTERNS.some((p) => lower.includes(p));
}

// 返回 { level, label, score(0-100) }
function evaluateStrength(pwd) {
  if (!pwd) return { level: "weak", label: "弱", score: 0 };

  const len = pwd.length;
  const types = countCharTypes(pwd);
  const weakPattern = hasWeakPattern(pwd);
  const seq = hasSequential(pwd);
  const rep = hasRepeats(pwd);

  // 估算评分（用于进度条）
  let score = 0;
  score += Math.min(len * 4, 50);
  score += types * 12;
  if (weakPattern) score -= 30;
  if (seq) score -= 12;
  if (rep) score -= 12;
  score = Math.max(0, Math.min(100, score));

  let level;
  if (len < 10 || types <= 1 || weakPattern) {
    level = "weak";
  } else if (len >= 20 && types === 4 && !seq && !rep) {
    level = "veryStrong";
  } else if (len >= 14 && types >= 3 && !seq && !rep) {
    level = "strong";
  } else {
    level = "medium";
  }

  const labels = { weak: "弱", medium: "中", strong: "强", veryStrong: "极强" };
  return { level, label: labels[level], score };
}

window.FreshPass = window.FreshPass || {};
window.FreshPass.evaluateStrength = evaluateStrength;
