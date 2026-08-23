var LunoPayloadParser = globalThis.LunoPayloadParser = function LunoPayloadParser() {};

LunoPayloadParser.stripMarkdownFences = function(text) {
  if (!text || typeof text !== "string") return "";
  var cleaned = text.trim();
  var FENCE = "```";
  if (cleaned.indexOf(FENCE) === 0) {
    var firstNL = cleaned.indexOf("\n");
    if (firstNL !== -1) cleaned = cleaned.substring(firstNL + 1);
    if (cleaned.lastIndexOf(FENCE) === cleaned.length - 3) {
      cleaned = cleaned.substring(0, cleaned.length - 3).trim();
    }
  }
  return cleaned;
};

LunoPayloadParser.getAttrValue = function(str, attrName) {
  if (!str) return "";
  var attrIdx = str.indexOf(attrName + "=");
  if (attrIdx === -1) return "";
  var sub = str.substring(attrIdx + attrName.length + 1).trim();
  if (sub.length === 0) return "";
  var q = sub.charAt(0);
  if (q === '"' || q === "'") {
    var endQ = sub.indexOf(q, 1);
    if (endQ !== -1) return sub.substring(1, endQ);
  } else {
    var spaceIdx = sub.indexOf(" ");
    if (spaceIdx !== -1) return sub.substring(0, spaceIdx);
    return sub;
  }
  return "";
};

LunoPayloadParser.parse = function(text) {
  if (!text || typeof text !== "string") {
    return { files: [], serverScript: "", requests: [], debugLogs: ["Input text is empty"] };
  }

  var rawInputLen = text.length;
  var cleaned = LunoPayloadParser.stripMarkdownFences(text);

  // Strip HTML comments (<!-- ... -->) without regex
  var commentStart = cleaned.indexOf("<!--");
  var commentsStripped = 0;
  while (commentStart !== -1) {
    var commentEnd = cleaned.indexOf("-->", commentStart + 4);
    if (commentEnd === -1) {
      cleaned = cleaned.substring(0, commentStart);
      break;
    }
    cleaned = cleaned.substring(0, commentStart) + cleaned.substring(commentEnd + 3);
    commentStart = cleaned.indexOf("<!--");
    commentsStripped++;
  }

  var files = [];
  var serverScript = "";
  var requests = [];

  var pos = 0;
  var len = cleaned.length;

  var SCRIPT_WORD = "scr" + "ipt";
  var STYLE_WORD = "sty" + "le";
  var TEMPLATE_WORD = "temp" + "late";
  var SVG_WORD = "sv" + "g";

  var debugLogs = [];
  debugLogs.push("Input Raw Len: " + rawInputLen + " bytes | Cleaned Len: " + len + " bytes | Comments Stripped: " + commentsStripped);

  while (pos < len) {
    var openIdx = cleaned.indexOf("<", pos);
    if (openIdx === -1) {
      debugLogs.push("No more '<' found after index " + pos);
      break;
    }

    var isClose = cleaned.substring(openIdx, openIdx + 2) === "</";
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

    debugLogs.push("▶ Found start tag '<" + tagWord + "' at index " + openIdx);

    var headerEndIdx = cleaned.indexOf(">", openIdx);
    if (headerEndIdx === -1) {
      debugLogs.push("  ❌ ERR: Unclosed opening header tag at index " + openIdx);
      break;
    }

    var headerStr = cleaned.substring(openIdx + 1 + tagWord.length, headerEndIdx);
    debugLogs.push("  • Header Attributes: [" + headerStr + "]");

    var closeTag = "</" + tagWord;
    var closeSearchIdx = cleaned.indexOf(closeTag, headerEndIdx);
    if (closeSearchIdx === -1) {
      debugLogs.push("  ❌ ERR: No matching '" + closeTag + "' found after index " + headerEndIdx);
      pos = headerEndIdx + 1;
      continue;
    }

    var closeEndIdx = cleaned.indexOf(">", closeSearchIdx);
    if (closeEndIdx === -1) {
      debugLogs.push("  ❌ ERR: Unclosed end tag '" + closeTag + "' at index " + closeSearchIdx);
      pos = headerEndIdx + 1;
      continue;
    }

    var innerContent = cleaned.substring(headerEndIdx + 1, closeSearchIdx).trim();

    var filePath = LunoPayloadParser.getAttrValue(headerStr, "data-file");
    var methodSpec = LunoPayloadParser.getAttrValue(headerStr, "data-method");
    var action = LunoPayloadParser.getAttrValue(headerStr, "data-action") || "write";
    var typeAttr = LunoPayloadParser.getAttrValue(headerStr, "type");

    debugLogs.push("  • Parsed Attrs -> filePath: '" + filePath + "' | method: '" + methodSpec + "' | action: '" + action + "' | contentLen: " + innerContent.length + " bytes");

    action = action.toLowerCase();
    typeAttr = typeAttr.toLowerCase();

    if (typeAttr === "application/luno-request" || action === "request") {
      requests.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, content: innerContent });
      debugLogs.push("  ✅ Action: Queued LLM Context Request");
    } else if (action === "run-server" || filePath === "RUN: SERVER") {
      serverScript += (serverScript ? "\n\n" : "") + innerContent;
      debugLogs.push("  ✅ Action: Queued Server Script (" + innerContent.length + " bytes)");
    } else if (filePath && filePath !== "...") {
      files.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, action: action, content: innerContent });
      debugLogs.push("  ✅ Action: Queued File Target '" + filePath + "'");
    } else {
      debugLogs.push("  ⚠️ Ignored: filePath is empty or '...'");
    }

    pos = closeEndIdx + 1;
  }

  debugLogs.push("SUMMARY: " + files.length + " file(s), " + requests.length + " request(s), serverScript: " + (serverScript ? "YES" : "NO"));

  return { files: files, serverScript: serverScript, requests: requests, debugLogs: debugLogs };
};

if (typeof window !== "undefined") window.LunoPayloadParser = LunoPayloadParser;
if (typeof module !== "undefined") module.exports = LunoPayloadParser;


LunoPayloadParser.parsePatchLog = function(patchLogHtml) {
  return LunoPayloadParser.parse(patchLogHtml);
};

LunoPayloadParser.parse = function(text) {
  if (!text || typeof text !== "string") {
    return { files: [], serverScript: "", requests: [], debugLogs: ["Input text is empty"] };
  }

  var rawInputLen = text.length;
  var cleaned = LunoPayloadParser.stripMarkdownFences(text);

  var files = [];
  var serverScript = "";
  var requests = [];

  var pos = 0;
  var len = cleaned.length;

  var SCRIPT_WORD = "scr" + "ipt";
  var STYLE_WORD = "sty" + "le";
  var TEMPLATE_WORD = "temp" + "late";
  var SVG_WORD = "sv" + "g";

  var debugLogs = [];
  debugLogs.push("Input Raw Len: " + rawInputLen + " bytes | Cleaned Len: " + len + " bytes");

  while (pos < len) {
    var openIdx = cleaned.indexOf("<", pos);
    if (openIdx === -1) {
      debugLogs.push("No more '<' found after index " + pos);
      break;
    }

    var isClose = cleaned.substring(openIdx, openIdx + 2) === "</";
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

    debugLogs.push("▶ Found start tag '<" + tagWord + "' at index " + openIdx);

    var headerEndIdx = cleaned.indexOf(">", openIdx);
    if (headerEndIdx === -1) {
      debugLogs.push("  ❌ ERR: Unclosed opening header tag at index " + openIdx);
      break;
    }

    var headerStr = cleaned.substring(openIdx + 1 + tagWord.length, headerEndIdx);
    debugLogs.push("  • Header Attributes: [" + headerStr + "]");

    var closeTag = "</" + tagWord;
    var closeSearchIdx = cleaned.indexOf(closeTag, headerEndIdx);
    if (closeSearchIdx === -1) {
      debugLogs.push("  ❌ ERR: No matching '" + closeTag + "' found after index " + headerEndIdx);
      pos = headerEndIdx + 1;
      continue;
    }

    var closeEndIdx = cleaned.indexOf(">", closeSearchIdx);
    if (closeEndIdx === -1) {
      debugLogs.push("  ❌ ERR: Unclosed end tag '" + closeTag + "' at index " + closeSearchIdx);
      pos = headerEndIdx + 1;
      continue;
    }

    var innerContent = cleaned.substring(headerEndIdx + 1, closeSearchIdx).trim();

    var filePath = LunoPayloadParser.getAttrValue(headerStr, "data-file");
    var methodSpec = LunoPayloadParser.getAttrValue(headerStr, "data-method");
    var action = LunoPayloadParser.getAttrValue(headerStr, "data-action") || "write";
    var typeAttr = LunoPayloadParser.getAttrValue(headerStr, "type");

    debugLogs.push("  • Parsed Attrs -> filePath: '" + filePath + "' | method: '" + methodSpec + "' | action: '" + action + "' | contentLen: " + innerContent.length + " bytes");

    action = action.toLowerCase();
    typeAttr = typeAttr.toLowerCase();

    if (typeAttr === "application/luno-request" || action === "request") {
      requests.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, content: innerContent });
      debugLogs.push("  ✅ Action: Queued LLM Context Request");
    } else if (action === "run-server" || filePath === "RUN: SERVER") {
      serverScript += (serverScript ? "\n\n" : "") + innerContent;
      debugLogs.push("  ✅ Action: Queued Server Script (" + innerContent.length + " bytes)");
    } else if (filePath && filePath !== "...") {
      files.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, action: action, content: innerContent });
      debugLogs.push("  ✅ Action: Queued File Target '" + filePath + "'");
    } else {
      debugLogs.push("  ⚠️ Ignored: filePath is empty or '...'");
    }

    pos = closeEndIdx + 1;
  }

  debugLogs.push("SUMMARY: " + files.length + " file(s), " + requests.length + " request(s), serverScript: " + (serverScript ? "YES" : "NO"));

  return { files: files, serverScript: serverScript, requests: requests, debugLogs: debugLogs };
};

LunoPayloadParser.getAttrValue = function(str, attrName) {
  if (!str || !attrName) return "";
  var targetKey = attrName.toLowerCase() + "=";
  var searchStr = str.toLowerCase();
  var pos = 0;

  while (pos < searchStr.length) {
    var attrIdx = searchStr.indexOf(targetKey, pos);
    if (attrIdx === -1) return "";

    // Boundary check: preceding character must be whitespace or start of header string
    if (attrIdx === 0 || searchStr.charCodeAt(attrIdx - 1) <= 32) {
      var sub = str.substring(attrIdx + targetKey.length).trim();
      if (sub.length === 0) return "";
      var q = sub.charAt(0);
      if (q === '"' || q === "'") {
        var endQ = sub.indexOf(q, 1);
        if (endQ !== -1) return sub.substring(1, endQ);
      } else {
        var spaceIdx = -1;
        for (var i = 0; i < sub.length; i++) {
          if (sub.charCodeAt(i) <= 32) { spaceIdx = i; break; }
        }
        if (spaceIdx !== -1) return sub.substring(0, spaceIdx);
        return sub;
      }
    }
    pos = attrIdx + 1;
  }

  return "";
};