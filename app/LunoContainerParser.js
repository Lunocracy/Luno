class LunoContainerParser {
  constructor() {}

  static parse(rawText) {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        return LunoPayloadParser.parse(rawText);
      }
      return { files: [], serverScript: '', requests: [], debugLogs: ['LunoPayloadParser unavailable; facade returning empty container'] };
    }

  static parsePatchLog(patchLogHtml) {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parsePatchLog === 'function') {
        return LunoPayloadParser.parsePatchLog(patchLogHtml);
      }
      return LunoContainerParser.parse(patchLogHtml);
    }
}

globalThis.LunoContainerParser = LunoContainerParser;
if (typeof module !== "undefined" && module.exports) module.exports = LunoContainerParser;