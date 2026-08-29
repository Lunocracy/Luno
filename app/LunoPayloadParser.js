class LunoPayloadParser {
  constructor() {}

  static stripMarkdownFences(text) {
    if (!text || typeof text !== 'string') return '';
    var cleaned = text.trim();
    var FENCE = String.fromCharCode(96, 96, 96);

    var fenceStart = cleaned.indexOf(FENCE);
    if (fenceStart !== -1) {
      var firstNL = cleaned.indexOf('\n', fenceStart);
      if (firstNL !== -1) {
        var fenceEnd = cleaned.lastIndexOf(FENCE);
        if (fenceEnd > firstNL) {
          return cleaned.substring(firstNL + 1, fenceEnd).trim();
        } else {
          return cleaned.substring(firstNL + 1).trim();
        }
      }
    }
    return cleaned;
  }

  static getAttrValue(str, attrName) {
    if (!str || !attrName) return '';
    var regex = new RegExp('(?:^|\\s)' + attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
    var match = str.match(regex);
    if (match) {
      return match[1] !== undefined ? match[1] : (match[2] !== undefined ? match[2] : (match[3] || ''));
    }
    return '';
  }

  static parse(text) {
      if (!text || typeof text !== 'string') {
        return { files: [], serverScript: '', requests: [], debugLogs: ['Input text is empty'] };
      }
  
      var rawInputLen = text.length;
      var cleaned = LunoPayloadParser.stripMarkdownFences(text);
  
      var files = [];
      var serverScript = '';
      var requests = [];
  
      var pos = 0;
      var len = cleaned.length;
  
      var SCRIPT_WORD = 'scr' + 'ipt';
      var STYLE_WORD = 'sty' + 'le';
      var TEMPLATE_WORD = 'temp' + 'late';
      var SVG_WORD = 'sv' + 'g';
  
      var debugLogs = [];
      debugLogs.push('Input Raw Len: ' + rawInputLen + ' bytes | Cleaned Len: ' + len + ' bytes');
  
      while (pos < len) {
        var openIdx = cleaned.indexOf('<', pos);
        if (openIdx === -1) {
          debugLogs.push('No more "<" found after index ' + pos);
          break;
        }
  
        var isClose = cleaned.substring(openIdx, openIdx + 2) === '</';
        if (isClose) {
          pos = openIdx + 2;
          continue;
        }
  
        var tagWord = null;
        var rest = cleaned.substring(openIdx + 1);
  
        if (rest.indexOf(SCRIPT_WORD) === 0) tagWord = SCRIPT_WORD;
        else if (rest.indexOf(STYLE_WORD) === 0) tagWord = STYLE_WORD;
        else if (rest.indexOf(TEMPLATE_WORD) === 0) tagWord = TEMPLATE_WORD;
        else if (rest.indexOf(SVG_WORD) === 0) tagWord = SVG_WORD;
  
        if (!tagWord) {
          pos = openIdx + 1;
          continue;
        }
  
        // Verify tag word boundary: next character must be whitespace or '>'
        var nextChar = cleaned.charAt(openIdx + 1 + tagWord.length);
        if (nextChar && nextChar !== ' ' && nextChar !== '\t' && nextChar !== '\n' && nextChar !== '\r' && nextChar !== '>') {
          pos = openIdx + 1;
          continue;
        }
  
        // Find header closing '>' respecting quotes inside attribute values
        var headerEndIdx = -1;
        var inAttrQuote = false;
        var attrQuoteChar = '';
        for (var h = openIdx + 1 + tagWord.length; h < len; h++) {
          var ch = cleaned.charAt(h);
          if (inAttrQuote) {
            if (ch === attrQuoteChar && cleaned.charAt(h - 1) !== '\\') {
              inAttrQuote = false;
            }
          } else if (ch === '"' || ch === "'") {
            inAttrQuote = true;
            attrQuoteChar = ch;
          } else if (ch === '>') {
            headerEndIdx = h;
            break;
          }
        }
  
        if (headerEndIdx === -1) {
          break;
        }
  
        var headerStr = cleaned.substring(openIdx + 1 + tagWord.length, headerEndIdx);
        var closeTag = '</' + tagWord;
  
        // Scan for structural, unescaped container closing tag followed by '>'
        var closeSearchIdx = -1;
        var searchFrom = headerEndIdx + 1;
        while (searchFrom < len) {
          var foundIdx = cleaned.indexOf(closeTag, searchFrom);
          if (foundIdx === -1) break;
  
          // Skip escaped sequences like <\/script>
          if (foundIdx > 0 && cleaned.charAt(foundIdx - 1) === '\\') {
            searchFrom = foundIdx + closeTag.length;
            continue;
          }
  
          // Verify closing tag is followed by optional whitespace and '>'
          var afterCloseIdx = foundIdx + closeTag.length;
          while (afterCloseIdx < len && (cleaned.charAt(afterCloseIdx) === ' ' || cleaned.charAt(afterCloseIdx) === '\t' || cleaned.charAt(afterCloseIdx) === '\r' || cleaned.charAt(afterCloseIdx) === '\n')) {
            afterCloseIdx++;
          }
  
          if (afterCloseIdx < len && cleaned.charAt(afterCloseIdx) === '>') {
            closeSearchIdx = foundIdx;
            break;
          }
  
          searchFrom = foundIdx + closeTag.length;
        }
  
        if (closeSearchIdx === -1) {
          pos = headerEndIdx + 1;
          continue;
        }
  
        var closeEndIdx = cleaned.indexOf('>', closeSearchIdx);
        if (closeEndIdx === -1) {
          pos = headerEndIdx + 1;
          continue;
        }
  
        var innerContent = cleaned.substring(headerEndIdx + 1, closeSearchIdx).trim();
  
        var rawFilePath = LunoPayloadParser.getAttrValue(headerStr, 'data-file');
        var filePath = rawFilePath ? rawFilePath.replace(/\\/g, '/').replace(/^\/+/, '').trim() : '';
        var methodSpec = LunoPayloadParser.getAttrValue(headerStr, 'data-method');
        var action = LunoPayloadParser.getAttrValue(headerStr, 'data-action') || 'write';
        var typeAttr = LunoPayloadParser.getAttrValue(headerStr, 'type');
  
        action = action.toLowerCase();
        typeAttr = typeAttr.toLowerCase();
  
        if (typeAttr === 'application/luno-request' || action === 'request') {
          requests.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, content: innerContent });
        } else if (action === 'run-server' || filePath === 'RUN: SERVER') {
          serverScript += (serverScript ? '\n\n' : '') + innerContent;
        } else if (filePath && filePath !== '...') {
          files.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, action: action, content: innerContent });
        }
  
        pos = closeEndIdx + 1;
      }
  
      return { files: files, serverScript: serverScript, requests: requests, debugLogs: debugLogs };
    }

  static parsePatchLog(patchLogHtml) {
    return LunoPayloadParser.parse(patchLogHtml);
  }
}

globalThis.LunoPayloadParser = LunoPayloadParser;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoPayloadParser;