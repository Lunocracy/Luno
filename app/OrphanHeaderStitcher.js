class OrphanHeaderStitcher {
  constructor() {

  }

  static pendingCode = null;
  static activeTarget = null;

  static inspect(text) {

    if (!text || typeof text !== 'string') return { type: 'empty' };

    const trimmed = text.trim();

    // If already wrapped in HTML Container tags, it's valid
    if (/<(script|style|template|svg)\b([^>]*)>[\s\S]*?<\/\1>/gi.test(trimmed)) {
      OrphanHeaderStitcher.pendingCode = null;
      return { type: 'valid', payload: trimmed };
    }

    // Buffer raw snippet for target wrapping
    if (trimmed.length > 10) {
      OrphanHeaderStitcher.pendingCode = trimmed;
      const lineCount = trimmed.split('\n').length;
      return {
        type: 'buffered',
        lines: lineCount,
        preview: trimmed.slice(0, 100)
      };
    }

    return { type: 'invalid' };

  }
  static stitchWithTarget(filePath, codeText) {

    const code = codeText || OrphanHeaderStitcher.pendingCode;
    if (!code) return null;

    const closeTag = '</' + 'script>';
    const container = '<script data-file="' + filePath + '">\n' + code + '\n' + closeTag;
    OrphanHeaderStitcher.clear();
    return container;

  }
  static clear() {

    OrphanHeaderStitcher.pendingCode = null;
    OrphanHeaderStitcher.activeTarget = null;

  }
  static hasBufferedCode() {

    return Boolean(OrphanHeaderStitcher.pendingCode);

  }
}

globalThis.OrphanHeaderStitcher = OrphanHeaderStitcher;
if (typeof module !== "undefined" && module.exports) module.exports = OrphanHeaderStitcher;