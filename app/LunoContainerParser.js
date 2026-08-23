class LunoContainerParser {
  constructor() {}

  // Constant concatenated tag words preventing scanner collisions
  static WORD_SCRIPT = 'scr' + 'ipt';
  static WORD_STYLE = 'sty' + 'le';
  static WORD_TEMPLATE = 'temp' + 'late';
  static WORD_SVG = 'sv' + 'g';

  static SUPPORTED_TAGS = [
    LunoContainerParser.WORD_SCRIPT,
    LunoContainerParser.WORD_STYLE,
    LunoContainerParser.WORD_TEMPLATE,
    LunoContainerParser.WORD_SVG
  ];

  /**
   * Deterministic string attribute parser (Zero Regular Expressions)
   */
  static parseAttributesDeterministic(attrString) {
    const attrs = {};
    if (!attrString || typeof attrString !== 'string') return attrs;

    let i = 0;
    const len = attrString.length;

    while (i < len) {
      // Skip whitespace
      while (i < len && attrString.charCodeAt(i) <= 32) i++;
      if (i >= len) break;

      // Find attribute key start
      const keyStart = i;
      while (i < len && attrString.charCodeAt(i) > 32 && attrString.charAt(i) !== '=') {
        i++;
      }
      const key = attrString.substring(keyStart, i).toLowerCase().trim();

      // Skip whitespace around '='
      while (i < len && attrString.charCodeAt(i) <= 32) i++;

      let value = '';
      if (i < len && attrString.charAt(i) === '=') {
        i++; // skip '='
        while (i < len && attrString.charCodeAt(i) <= 32) i++;

        if (i < len) {
          const quote = attrString.charAt(i);
          if (quote === '"' || quote === "'") {
            i++; // skip open quote
            const valStart = i;
            while (i < len && attrString.charAt(i) !== quote) {
              i++;
            }
            value = attrString.substring(valStart, i);
            if (i < len) i++; // skip close quote
          } else {
            const valStart = i;
            while (i < len && attrString.charCodeAt(i) > 32) {
              i++;
            }
            value = attrString.substring(valStart, i);
          }
        }
      }

      if (key) {
        attrs[key] = value;
      }
    }

    return attrs;
  }

  /**
   * Deterministic string-walking HTML Container Tag Extractor (Zero Regular Expressions)
   */
  static parse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { files: [], serverScript: '', requests: [] };
    }

    const files = [];
    let serverScript = '';
    const requests = [];

    let text = rawText.trim();

    // Strip markdown code fences deterministically without regex
    const FENCE = '`' + '`' + '`';
    if (text.startsWith(FENCE)) {
      const firstNewline = text.indexOf('\n');
      if (firstNewline !== -1) {
        text = text.substring(firstNewline + 1);
      }
      if (text.endsWith(FENCE)) {
        text = text.substring(0, text.length - 3).trim();
      }
    }

    let cursor = 0;
    const textLen = text.length;

    while (cursor < textLen) {
      // Find next '<'
      const openAngleIdx = text.indexOf('<', cursor);
      if (openAngleIdx === -1) break;

      // Check if this is a closing tag '</'
      if (text.charAt(openAngleIdx + 1) === '/') {
        cursor = openAngleIdx + 2;
        continue;
      }

      // Identify matching supported tag name
      let matchedTag = null;
      let tagWordStart = openAngleIdx + 1;

      for (let t = 0; t < LunoContainerParser.SUPPORTED_TAGS.length; t++) {
        const tagName = LunoContainerParser.SUPPORTED_TAGS[t];
        const candidate = text.substring(tagWordStart, tagWordStart + tagName.length).toLowerCase();
        if (candidate === tagName) {
          const nextChar = text.charAt(tagWordStart + tagName.length);
          if (nextChar === ' ' || nextChar === '>' || nextChar === '\n' || nextChar === '\r' || nextChar === '\t') {
            matchedTag = tagName;
            break;
          }
        }
      }

      if (!matchedTag) {
        cursor = openAngleIdx + 1;
        continue;
      }

      // Find end of opening header tag '>', respecting quotes
      let headerEndIdx = -1;
      let inQuote = null;

      for (let h = tagWordStart + matchedTag.length; h < textLen; h++) {
        const ch = text.charAt(h);
        if (inQuote) {
          if (ch === inQuote) inQuote = null;
        } else {
          if (ch === '"' || ch === "'") {
            inQuote = ch;
          } else if (ch === '>') {
            headerEndIdx = h;
            break;
          }
        }
      }

      if (headerEndIdx === -1) {
        cursor = openAngleIdx + 1;
        continue;
      }

      // Extract opening tag attribute string
      const attrString = text.substring(tagWordStart + matchedTag.length, headerEndIdx);
      const attrs = LunoContainerParser.parseAttributesDeterministic(attrString);

      // Search forward for matching close tag '</' + matchedTag + '>'
      const closeTagTarget = '</' + matchedTag;
      let closeTagStartIdx = -1;
      let closeSearchPos = headerEndIdx + 1;

      while (closeSearchPos < textLen) {
        const foundIdx = text.indexOf(closeTagTarget, closeSearchPos);
        if (foundIdx === -1) break;

        // Verify closing tag ends with '>'
        const afterCloseTag = text.substring(foundIdx + closeTagTarget.length).trim();
        if (afterCloseTag.startsWith('>')) {
          closeTagStartIdx = foundIdx;
          break;
        }
        closeSearchPos = foundIdx + 1;
      }

      if (closeTagStartIdx === -1) {
        cursor = headerEndIdx + 1;
        continue;
      }

      // Extract inner container body content
      const innerContent = text.substring(headerEndIdx + 1, closeTagStartIdx).trim();

      const filePath = attrs['data-file'] || '';
      const methodSpec = attrs['data-method'] || '';
      const action = (attrs['data-action'] || 'write').toLowerCase();
      const typeAttr = (attrs['type'] || '').toLowerCase();

      if (typeAttr === 'application/luno-request' || action === 'request') {
        requests.push({
          tagName: matchedTag,
          filePath: filePath,
          methodSpec: methodSpec,
          content: innerContent
        });
      } else if (action === 'run-server' || filePath === 'RUN: SERVER') {
        serverScript += (serverScript ? '\n\n' : '') + innerContent;
      } else if (filePath && filePath !== '...') {
        files.push({
          tagName: matchedTag,
          filePath: filePath,
          methodSpec: methodSpec,
          action: action,
          content: innerContent
        });
      }

      // Advance cursor past closing tag '></' + matchedTag + '>'
      const closeTagEndIdx = text.indexOf('>', closeTagStartIdx);
      cursor = closeTagEndIdx !== -1 ? closeTagEndIdx + 1 : closeTagStartIdx + closeTagTarget.length;
    }

    return { files, serverScript, requests };
  }
}

globalThis.LunoContainerParser = LunoContainerParser;
if (typeof module !== "undefined" && module.exports) module.exports = LunoContainerParser;

LunoContainerParser.parsePatchLog = function(patchLogHtml) {
  return LunoContainerParser.parse(patchLogHtml);
};