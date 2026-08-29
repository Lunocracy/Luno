class ClientAppPaster {
  constructor() {}

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

    var inboxCard = document.querySelector('.inbox-card');
    if (inboxCard && typeof LunoAnimationEngine !== 'undefined') {
      var rect = inboxCard.getBoundingClientRect();
      LunoAnimationEngine.burstSparks(rect.left + (rect.width / 2), rect.top + (rect.height / 2), '#3fb950', 16);
      LunoAnimationEngine.pulseTarget(inboxCard, { color: '#3fb950', glowColor: 'rgba(63, 185, 80, 0.8)' });
      if (typeof LunoAnimationEngine.wavePulse === 'function') {
        LunoAnimationEngine.wavePulse(inboxCard, '#3fb950');
      }
    }

    var input = document.getElementById('code-input') || document.getElementById('payload-input');
    if (input) input.value = text;

    ClientAppPaster.executeSave(text);
  }

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

  static async executeSave(overrideText) {
    var targetApp = globalThis.ClientAppCore || globalThis.ClientApp;
    var input = document.getElementById('code-input') || document.getElementById('payload-input');
    var rawText = overrideText || (input ? input.value : '');
    if (!rawText || !rawText.trim()) return;

    try {
      if (typeof LunoAcornLoader !== 'undefined' && typeof LunoAcornLoader.ensureLoaded === 'function') {
        try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
      }

      var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

      var rawPayload = { files: [], serverScript: '', requests: [], debugLogs: [] };
      if (typeof LunoPayloadParser !== 'undefined' && LunoPayloadParser.parse) {
        rawPayload = LunoPayloadParser.parse(rawText);
      }

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
      clientSummary += "• Target Project: " + (targetProj || "Luno") + "\n";
      clientSummary += "• HTML Containers Found: " + finalPayload.files.length + " file(s)\n";
      finalPayload.files.forEach(function(f, idx) {
        var isDirect = f.action === 'direct';
        var isPatch = f.methodSpec || f.action === 'patch';
        clientSummary += "  " + (idx + 1) + ". <" + (f.tagName || "script") + " data-file=\"" + f.filePath + "\"" + (f.methodSpec ? (" data-method=\"" + f.methodSpec + "\"") : "") + "> (" + (f.content ? f.content.length : 0) + " bytes)" + (isDirect ? " [Client AST Direct Write]" : (isPatch ? " [Surgical Patch Log]" : "")) + "\n";
      });
      if (finalPayload.serverScript) {
        clientSummary += "• Server Script Detected (" + finalPayload.serverScript.length + " bytes)\n";
      }
      clientSummary += "\n⚡ Persisting changes to storage...\n\n";

      var pasteBtn = document.getElementById('btn-paste-chatbot');
      var feedbackCard = document.getElementById('feedback-card');
      if (pasteBtn && feedbackCard && typeof LunoAnimationEngine !== 'undefined') {
        LunoAnimationEngine.flyElement(pasteBtn, feedbackCard, {
          label: '📥 Applying Payload (' + finalPayload.files.length + ' files)',
          color: '#3fb950',
          glowColor: 'rgba(63, 185, 80, 0.85)',
          icon: '⚡',
          duration: 550
        });
      }

      if (targetApp && targetApp.showFeedback) {
        targetApp.showFeedback(clientSummary, "info");
      }

      if (targetApp && targetApp.showToast) {
        targetApp.showToast('Applying payload to project [' + (targetProj || 'Luno') + ']...', 'info', '⚡');
      }

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

      var finalFeedback = clientSummary + "📊 STORAGE EXECUTION RESPONSE:\n" + (data.llmFeedback || JSON.stringify(data, null, 2));

      if (targetApp && targetApp.showFeedback) {
        targetApp.showFeedback(finalFeedback, data && data.success ? "success" : "error");
      }

      if (feedbackCard && typeof LunoAnimationEngine !== 'undefined') {
        LunoAnimationEngine.pulseTarget(feedbackCard, {
          color: data && data.success ? '#00f2fe' : '#ff7b72',
          glowColor: data && data.success ? 'rgba(0, 242, 254, 0.7)' : 'rgba(255, 123, 114, 0.7)'
        });
      }

      if (data && data.success) {
        if (input) input.value = "";

        // Automated feedback loop: Queue ground-truth response directly into Outbox
        if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
          var modCountText = (data.modifiedCount !== undefined ? data.modifiedCount : (data.count || finalPayload.files.length));
          OutboxQueue.addBundle('Save Feedback: [' + (targetProj || 'Luno') + '] (' + modCountText + ' files)', finalFeedback, { priority: 'high' });
        }

        if (typeof LunoLoader !== 'undefined' && LunoLoader.applyPatchLog) {
          await LunoLoader.applyPatchLog(targetProj);
        }

        if (typeof OutboxQueue !== 'undefined' && OutboxQueue.renderWidget) {
          try { OutboxQueue.renderWidget(); } catch(e){}
        }

        if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.reloadActivePreviewIframe) {
          LunoSpaDock.reloadActivePreviewIframe(targetProj);
        }

        if (typeof ClientApp !== 'undefined' && ClientApp.fetchCodebaseMetrics) {
          await ClientApp.fetchCodebaseMetrics(targetProj);
        }

        if (targetApp && targetApp.showToast) {
          var modCount = data.modifiedCount !== undefined ? data.modifiedCount : (data.count || 0);
          if (modCount > 0) {
            targetApp.showToast('Saved & Applied ' + modCount + ' change(s) to [' + (targetProj || 'Luno') + ']!', 'success', '💾');
          } else {
            targetApp.showToast('Evaluated: Target(s) up-to-date.', 'info', 'ℹ️');
          }
        }
      } else {
        throw new Error((data && data.error) || 'Save operation failed in storage');
      }
    } catch (err) {
      console.error('[ClientAppPaster Exception]', err);
      if (targetApp && targetApp.showFeedback) {
        targetApp.showFeedback("❌ Save Error: " + err.message + "\n\n" + (err.stack || ""), "error");
      }
      if (targetApp && targetApp.showToast) {
        targetApp.showToast("Save Error: " + err.message, "error", "❌");
      }
    }
  }
}

globalThis.ClientAppPaster = ClientAppPaster;
if (typeof module !== "undefined" && module.exports) module.exports = ClientAppPaster;