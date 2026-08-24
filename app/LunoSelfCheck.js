class LunoSelfCheck {
  constructor() {}

  static verifyContainers(codeText = '') {
    if (!codeText || typeof codeText !== 'string') return { valid: false, error: 'Payload is empty.' };
    const tagRegex = /<(script|style|template|svg)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    const matches = [];
    let match;
    while ((match = tagRegex.exec(codeText)) !== null) {
      matches.push(match[1]);
    }
    if (matches.length === 0) {
      return { valid: false, error: 'Missing HTML container tag. Example: <script data-file="path/to/file.js">' };
    }
    return { valid: true, count: matches.length, containers: matches };
  }

  static isStrictFilePath(headerText) {
    if (!headerText || typeof headerText !== 'string') return false;
    const h = headerText.trim();
    if (!h) return false;

    if (h.toLowerCase() === 'luno.json' || h.toLowerCase() === 'files.json' || h.toLowerCase() === 'package.json') {
      return true;
    }

    const upper = h.toUpperCase();
    if (
      upper.startsWith('LUNO ') ||
      upper.startsWith('---') ||
      upper.includes('PACKAGE') ||
      upper.includes('FEEDBACK') ||
      upper.includes('REQUEST') ||
      upper.includes('ITEM') ||
      upper.includes('EXAMPLE') ||
      upper.includes('TELEMETRY') ||
      upper.includes('OUTPUT') ||
      upper.includes('PROMPT NOTE') ||
      upper.includes('DIRECTIVES') ||
      upper.includes('NOTE')
    ) {
      return false;
    }

    if (/\s/.test(h)) return false;

    return /^[a-zA-Z0-9_@\-\/\.]+\.[a-zA-Z0-9_-]+$/.test(h) || /^[a-zA-Z0-9_@\-\/]+\/[a-zA-Z0-9_@\-\/\.]+$/.test(h);
  }

  static async runPostPatchCheck() {
    try {
      const res = await fetch('/api/ping');
      const data = await res.json();
      return { healthy: res.ok && data.status === 'online', pid: data.pid };
    } catch (err) {
      return { healthy: false, error: 'Server ping failed: ' + err.message };
    }
  }
}

globalThis.LunoSelfCheck = LunoSelfCheck;
if (typeof module !== "undefined" && module.exports) module.exports = LunoSelfCheck;