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
  if (!str || !attrName) return "";
  var targetKey = attrName.toLowerCase() + "=";
  var searchStr = str.toLowerCase();
  var pos = 0;

  while (pos < searchStr.length) {
    var attrIdx = searchStr.indexOf(targetKey, pos);
    if (attrIdx === -1) return "";

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

    var headerEndIdx = cleaned.indexOf(">", openIdx);
    if (headerEndIdx === -1) {
      break;
    }

    var headerStr = cleaned.substring(openIdx + 1 + tagWord.length, headerEndIdx);
    var closeTag = "</" + tagWord;
    var closeSearchIdx = cleaned.indexOf(closeTag, headerEndIdx);
    if (closeSearchIdx === -1) {
      pos = headerEndIdx + 1;
      continue;
    }

    var closeEndIdx = cleaned.indexOf(">", closeSearchIdx);
    if (closeEndIdx === -1) {
      pos = headerEndIdx + 1;
      continue;
    }

    var innerContent = cleaned.substring(headerEndIdx + 1, closeSearchIdx).trim();

    var rawFilePath = LunoPayloadParser.getAttrValue(headerStr, "data-file");
    var filePath = rawFilePath ? rawFilePath.replace(/\\/g, '/').replace(/^\/+/, '').trim() : '';
    var methodSpec = LunoPayloadParser.getAttrValue(headerStr, "data-method");
    var action = LunoPayloadParser.getAttrValue(headerStr, "data-action") || "write";
    var typeAttr = LunoPayloadParser.getAttrValue(headerStr, "type");

    action = action.toLowerCase();
    typeAttr = typeAttr.toLowerCase();

    if (typeAttr === "application/luno-request" || action === "request") {
      requests.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, content: innerContent });
    } else if (action === "run-server" || filePath === "RUN: SERVER") {
      serverScript += (serverScript ? "\n\n" : "") + innerContent;
    } else if (filePath && filePath !== "...") {
      files.push({ tagName: tagWord, filePath: filePath, methodSpec: methodSpec, action: action, content: innerContent });
    }

    pos = closeEndIdx + 1;
  }

  return { files: files, serverScript: serverScript, requests: requests, debugLogs: debugLogs };
};

LunoPayloadParser.parsePatchLog = function(patchLogHtml) {
  return LunoPayloadParser.parse(patchLogHtml);
};

if (typeof window !== "undefined") window.LunoPayloadParser = LunoPayloadParser;
if (typeof module !== "undefined") module.exports = LunoPayloadParser;