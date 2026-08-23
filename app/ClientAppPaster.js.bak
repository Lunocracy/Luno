class ClientAppPaster {
  constructor() {}

  /**
   * ⚙️ METHOD: pasteClipboard()
   */
  static async pasteClipboard() {
    var pastedText = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        pastedText = await navigator.clipboard.readText();
      }
    } catch (err) {}

    if (pastedText && pastedText.trim()) {
      ClientAppPaster.processPastedText(pastedText);
    } else {
      var text = prompt('Paste HTML Container payload text here:');
      if (text) ClientAppPaster.processPastedText(text);
    }
  }

  /**
   * ⚙️ METHOD: processPastedText(text)
   */
  static async processPastedText(text) {
    if (!text || !text.trim()) return;

    if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.mountView) {
      LunoSpaDock.mountView('workspace');
    }

    if (typeof ClientAppUI !== 'undefined') {
      ClientAppUI.inboxExpanded = true;
      var inboxContent = document.getElementById('inbox-card-content');
      if (inboxContent) inboxContent.style.display = 'block';
    }

    var input = document.getElementById('code-input') || document.getElementById('payload-input');
    if (input) input.value = text;

    ClientAppPaster.executeSave(text);
  }

  /**
   * ⚙️ METHOD: saveCode()
   */
  static async saveCode() {
    var input = document.getElementById('code-input') || document.getElementById('payload-input');
    var text = input ? input.value : '';
    if (!text || !text.trim()) {
      var targetApp = globalThis.ClientAppCore || globalThis.ClientApp;
      if (targetApp && targetApp.showToast) {
        targetApp.showToast('Payload box is empty.', 'error', '⚠️');
      }
      return;
    }
    ClientAppPaster.executeSave(text);
  }

  /**
   * ⚙️ METHOD: executeSave(overrideText)
   */
  static async executeSave(overrideText) {
    var input = document.getElementById('code-input') || document.getElementById('payload-input');
    var rawText = overrideText || (input ? input.value : '');
    if (!rawText || !rawText.trim()) return;

    var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';

    var rawPayload = { files: [], serverScript: '', requests: [], debugLogs: [] };
    if (typeof LunoPayloadParser !== 'undefined' && LunoPayloadParser.parse) {
      rawPayload = LunoPayloadParser.parse(rawText);
    }

    // Process SVG vector payloads if present
    if (rawPayload.files && rawPayload.files.length > 0) {
      for (var s = 0; s < rawPayload.files.length; s++) {
        var fItem = rawPayload.files[s];
        if (fItem.tagName === 'svg' || (fItem.filePath && fItem.filePath.toLowerCase().endsWith('.svg'))) {
          if (typeof LunoSvgStudio !== 'undefined' && LunoSvgStudio.loadSvgPayload) {
            LunoSvgStudio.loadSvgPayload(fItem.content, fItem.filePath);
          }
        }
      }
    }

    var lunoMeta = {};
    try {
      if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
        var metaRes = await LunoApiClient.fetchFsRead('luno.json', targetProj);
        if (metaRes && metaRes.content) {
          lunoMeta = JSON.parse(metaRes.content);
        } else {
          var filesMetaRes = await LunoApiClient.fetchFsRead('files.json', targetProj);
          if (filesMetaRes && filesMetaRes.content) lunoMeta = JSON.parse(filesMetaRes.content);
        }
      }
    } catch (e) {}

    var finalPayload = rawPayload;
    if (typeof LunoManifestDecisionEngine !== 'undefined' && LunoManifestDecisionEngine.processPayload) {
      finalPayload = await LunoManifestDecisionEngine.processPayload(rawPayload, lunoMeta, targetProj);
    }

    if (finalPayload && typeof finalPayload === 'object' && targetProj) {
      finalPayload.project = targetProj;
    }

    var clientSummary = "🔍 CLIENT BROWSER PARSER SUMMARY (HTML Container Protocol):\n";
    clientSummary += "• Target Project: " + (targetProj || "Default Root") + "\n";
    clientSummary += "• HTML Containers Found: " + finalPayload.files.length + " file(s)\n";
    finalPayload.files.forEach(function(f, idx) {
      var isDirect = f.action === 'direct';
      var isPatch = f.methodSpec || f.action === 'patch';
      clientSummary += "  " + (idx + 1) + ". <" + (f.tagName || "script") + " data-file=\"" + f.filePath + "\"" + (f.methodSpec ? (" data-method=\"" + f.methodSpec + "\"") : "") + "> (" + (f.content ? f.content.length : 0) + " bytes)" + (isDirect ? " [Client AST Direct Write]" : (isPatch ? " [Surgical Patch Log]" : "")) + "\n";
    });
    if (finalPayload.serverScript) {
      clientSummary += "• Server Script Detected (" + finalPayload.serverScript.length + " bytes)\n";
    }
    clientSummary += "\n⚡ Sending structured JSON payload to server...\n\n";

    var targetApp = globalThis.ClientAppCore || globalThis.ClientApp;
    if (targetApp && targetApp.showFeedback) {
      targetApp.showFeedback(clientSummary, "info");
    }

    if (targetApp && targetApp.showToast) {
      targetApp.showToast('Applying payload to project [' + (targetProj || 'Default') + ']...', 'info', '⚡');
    }

    try {
      var data = null;
      if (typeof LunoApiClient !== 'undefined' && LunoApiClient.savePayload) {
        data = await LunoApiClient.savePayload(finalPayload, targetProj);
      } else {
        var pParam = targetProj ? ('?project=' + encodeURIComponent(targetProj)) : '';
        var res = await fetch("/api/save" + pParam, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload)
        });
        data = await res.json();
      }

      var finalFeedback = clientSummary + "📊 SERVER EXECUTION RESPONSE:\n" + (data.llmFeedback || JSON.stringify(data, null, 2));

      if (targetApp && targetApp.showFeedback) {
        targetApp.showFeedback(finalFeedback, data && data.success ? "success" : "error");
      }

      if (data && data.success) {
        if (input) input.value = "";

        if (typeof LunoLoader !== 'undefined' && LunoLoader.applyPatchLog) {
          await LunoLoader.applyPatchLog(targetProj);
        }

        // AUTO-RELOAD PREVIEW IFRAME: Automatically refresh active preview iframe for the targeted project
        if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.reloadActivePreviewIframe) {
          LunoSpaDock.reloadActivePreviewIframe(targetProj);
        }

        if (targetApp && targetApp.showToast) {
          var modCount = data.modifiedCount !== undefined ? data.modifiedCount : (data.count || 0);
          if (modCount > 0) {
            targetApp.showToast('Saved & Applied ' + modCount + ' change(s) to [' + (targetProj || 'Default') + ']!', 'success', '💾');
          } else {
            targetApp.showToast('Evaluated: Target(s) up-to-date.', 'info', 'ℹ️');
          }
        }
      } else {
        throw new Error((data && data.error) || 'Save operation failed on server');
      }
    } catch (err) {
      if (targetApp && targetApp.showFeedback) {
        targetApp.showFeedback("❌ Save Error: " + err.message, "error");
      }
      if (targetApp && targetApp.showToast) {
        targetApp.showToast("Save Error: " + err.message, "error", "❌");
      }
    }
  }
}

globalThis.ClientAppPaster = ClientAppPaster;
if (typeof module !== "undefined" && module.exports) module.exports = ClientAppPaster;