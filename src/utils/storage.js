// XOR cipher over percent-encoded JSON — protects plain-text localStorage exposure.
// Not a substitute for a backend; all inputs stay within ASCII range so btoa/atob are safe.
const K = 'SC_ERP#2024_SistemaEngenharia_v1';

function xorStr(str) {
  return str.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ K.charCodeAt(i % K.length))
  ).join('');
}

export function saveSecure(key, value) {
  try {
    const encoded = btoa(xorStr(encodeURIComponent(JSON.stringify(value))));
    localStorage.setItem(key, encoded);
  } catch {}
}

export function loadSecure(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
      // Try decrypted first
      return JSON.parse(decodeURIComponent(xorStr(atob(raw))));
    } catch {
      // Migration: data was stored unencrypted — parse as plain JSON and let the next save encrypt it
      return JSON.parse(raw);
    }
  } catch {
    return defaultValue;
  }
}
