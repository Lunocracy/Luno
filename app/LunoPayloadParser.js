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
        if (openIdx === -1) break;

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
            var bkCount = 0;
            var bkIdx = h - 1;
            while (bkIdx >= 0 && cleaned.charAt(bkIdx) === '\\') { bkCount++; bkIdx--; }
            if (ch === attrQuoteChar && (bkCount % 2 === 0)) {
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

        if (headerEndIdx === -1) break;

        var headerStr = cleaned.substring(openIdx + 1 + tagWord.length, headerEndIdx);
        var closeTag = '</' + tagWord;

        // Lexical scanner with explicit template stack and backslash parity
        var closeSearchIdx = -1;
        var i = headerEndIdx + 1;
        var inString = false;
        var strChar = '';
        var inLineComment = false;
        var inBlockComment = false;
        var stack = []; // Elements: 'TEMPLATE_RAW' or { type: 'INTERPOLATION', braceDepth: number }

        while (i < len) {
          var curr = cleaned.charAt(i);
          var next = (i + 1 < len) ? cleaned.charAt(i + 1) : '';

          // Calculate backslash parity for escaped characters
          var backslashCount = 0;
          var b = i - 1;
          while (b >= 0 && cleaned.charAt(b) === '\\') {
            backslashCount++;
            b--;
          }
          var isEscaped = (backslashCount % 2 === 1);

          var currentContext = stack.length > 0 ? stack[stack.length - 1] : null;
          var isInsideRawTemplate = (currentContext === 'TEMPLATE_RAW');

          // 1. Line and block comments (only active in JS code / interpolation, not inside strings or raw template text)
          if (inLineComment) {
            if (curr === '\n' || curr === '\r') inLineComment = false;
            i++;
            continue;
          }
          if (inBlockComment) {
            if (curr === '*' && next === '/') {
              inBlockComment = false;
              i += 2;
              continue;
            }
            i++;
            continue;
          }

          // 2. String literal handling (active in JS code / interpolation)
          if (inString) {
            if (curr === strChar && !isEscaped) {
              inString = false;
            }
            i++;
            continue;
          }

          // 3. Raw template-literal body processing
          if (isInsideRawTemplate) {
            if (curr === '`' && !isEscaped) {
              stack.pop(); // Exit raw template literal
              i++;
              continue;
            }
            if (curr === '$' && next === '{' && !isEscaped) {
              stack.push({ type: 'INTERPOLATION', braceDepth: 1 });
              i += 2;
              continue;
            }
            // In raw template string mode, bare quotes and slashes are plain characters!
            i++;
            continue;
          }

          // 4. Interpolation expression body processing (${ ... })
          if (currentContext && currentContext.type === 'INTERPOLATION') {
            if (curr === '{') {
              currentContext.braceDepth++;
              i++;
              continue;
            }
            if (curr === '}') {
              currentContext.braceDepth--;
              if (currentContext.braceDepth === 0) {
                stack.pop(); // Return to previous template literal context
              }
              i++;
              continue;
            }
          }

          // 5. General JS expression token openers (top-level or inside interpolation)
          if (curr === '/' && next === '/' && !isEscaped) {
            inLineComment = true;
            i += 2;
            continue;
          }
          if (curr === '/' && next === '*' && !isEscaped) {
            inBlockComment = true;
            i += 2;
            continue;
          }
          if ((curr === '"' || curr === "'") && !isEscaped) {
            inString = true;
            strChar = curr;
            i++;
            continue;
          }
          if (curr === '`' && !isEscaped) {
            stack.push('TEMPLATE_RAW');
            i++;
            continue;
          }

          // 6. Check for structural container close tag at top-level
          if (stack.length === 0 && curr === '<' && cleaned.substring(i, i + closeTag.length) === closeTag) {
            var afterCloseIdx = i + closeTag.length;
            while (afterCloseIdx < len && (cleaned.charAt(afterCloseIdx) === ' ' || cleaned.charAt(afterCloseIdx) === '\t' || cleaned.charAt(afterCloseIdx) === '\r' || cleaned.charAt(afterCloseIdx) === '\n')) {
              afterCloseIdx++;
            }
            if (afterCloseIdx < len && cleaned.charAt(afterCloseIdx) === '>') {
              closeSearchIdx = i;
              break;
            }
          }

          i++;
        }

        // Fallback simple search if scanner hit end without finding clean closing tag
        if (closeSearchIdx === -1) {
          var simpleIdx = cleaned.indexOf(closeTag, headerEndIdx + 1);
          if (simpleIdx !== -1) {
            var afterIdx = simpleIdx + closeTag.length;
            while (afterIdx < len && (cleaned.charAt(afterIdx) === ' ' || cleaned.charAt(afterIdx) === '\t' || cleaned.charAt(afterIdx) === '\r' || cleaned.charAt(afterIdx) === '\n')) {
              afterIdx++;
            }
            if (afterIdx < len && cleaned.charAt(afterIdx) === '>') {
              closeSearchIdx = simpleIdx;
            }
          }
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