class OutboxQueue {
  constructor() {}

  static STORAGE_KEY = 'luno_outbox_queue_v1';
  static activeClearClock = null;
  static activeExpandedId = null;

  static loadQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(OutboxQueue.STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.warn('[OutboxQueue] Corrupted localStorage queue reset:', e);
    }
    return [];
  }

  static queue = OutboxQueue.loadQueue();

  static saveQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OutboxQueue.STORAGE_KEY, JSON.stringify(OutboxQueue.queue || []));
      }
    } catch (e) {
      console.error('[OutboxQueue] Save queue error:', e);
    }
  }

  static notifyTargetPage(title, payloadText) {
    try {
      var envelope = {
        type: 'LUNO_OUTBOX_NOTIFY',
        target: 'aistudio.google.com',
        timestamp: new Date().toISOString(),
        payload: { title: title, text: payloadText }
      };

      if (typeof window !== 'undefined') {
        var win = window.opener || window.parent;
        if (win && typeof win.postMessage === 'function') {
          win.postMessage(envelope, '*');
        }
      }
    } catch (e) {}
  }

  static addBundle(title, payloadText, options) {
    var opts = options || {};
    var payload = payloadText || '';
    var item = {
      id: 'outbox_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title || 'Outbox Item',
      payload: payload,
      timestamp: new Date().toLocaleTimeString(),
      priority: opts.priority || 'normal',
      lines: payload.split('\n').length,
      estTokens: Math.ceil(payload.length / 4)
    };

    OutboxQueue.queue.push(item);
    if (OutboxQueue.queue.length > 20) OutboxQueue.queue.shift();

    OutboxQueue.saveQueue();
    OutboxQueue.notifyTargetPage(item.title, payload);

    if (typeof ClientAppUI !== 'undefined') {
      ClientAppUI.outboxExpanded = true;
      var content = typeof document !== 'undefined' ? document.getElementById('outbox-card-content') : null;
      if (content) content.style.display = 'block';
    }

    if (typeof OutboxQueue.renderWidget === 'function') {
      OutboxQueue.renderWidget();
    }
    return item;
  }

  static togglePriority(id) {
    var item = OutboxQueue.queue.find(function(i) { return i && i.id === id; });
    if (item) {
      item.priority = item.priority === 'high' ? 'normal' : 'high';
      OutboxQueue.queue.sort(function(a, b) { return (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0); });
      OutboxQueue.saveQueue();
      if (typeof OutboxQueue.renderWidget === 'function') {
        OutboxQueue.renderWidget();
      }
    }
  }

  static removeItem(id) {
    OutboxQueue.queue = OutboxQueue.queue.filter(function(i) { return i && i.id !== id; });
    OutboxQueue.saveQueue();
    if (typeof OutboxQueue.renderWidget === 'function') {
      OutboxQueue.renderWidget();
    }
  }

  static updateItem(id, newTitle, newPayload) {
    var item = OutboxQueue.queue.find(function(i) { return i && i.id === id; });
    if (item) {
      item.title = newTitle;
      item.payload = newPayload;
      item.lines = newPayload.split('\n').length;
      item.estTokens = Math.ceil(newPayload.length / 4);
      OutboxQueue.saveQueue();
      if (typeof OutboxQueue.renderWidget === 'function') {
        OutboxQueue.renderWidget();
      }
    }
  }

  static bundleAndQueueCodebase(filesMap, manifest, projName, options) {
    var opts = options || {};
    var pName = projName || 'Project';
    var maxBytes = 500000;
    var includeInstructions = opts.includeInstructions !== false;

    try {
      if (typeof LunoSettings !== 'undefined') {
        if (typeof LunoSettings.maxPackageSize === 'function') {
          maxBytes = LunoSettings.maxPackageSize();
        } else if (typeof LunoSettings.getItem === 'function') {
          var val = LunoSettings.getItem('luno_max_pkg_size');
          if (val) maxBytes = parseInt(val, 10) || 500000;
        }
      }
    } catch (e) {
      maxBytes = 500000;
    }

    var SCRIPT_WORD = 'scr' + 'ipt';
    var STYLE_WORD = 'sty' + 'le';
    var TEMPLATE_WORD = 'temp' + 'late';
    var SVG_WORD = 'sv' + 'g';

    var closeStyle = '</' + STYLE_WORD + '>';
    var closeTemplate = '</' + TEMPLATE_WORD + '>';
    var closeScript = '</' + SCRIPT_WORD + '>';
    var closeSvg = '</' + SVG_WORD + '>';

    var escapeStyle = '<\\/' + STYLE_WORD + '>';
    var escapeTemplate = '<\\/' + TEMPLATE_WORD + '>';
    var escapeScript = '<\\/' + SCRIPT_WORD + '>';
    var escapeSvg = '<\\/' + SVG_WORD + '>';

    var instructionPreamble = '';
    if (includeInstructions && typeof LunoPromptInstructions !== 'undefined') {
      instructionPreamble = LunoPromptInstructions.assembleFullInstructions() + '\n';
    }

    var baseHeader = instructionPreamble;

    var parts = [];
    var currentPartText = baseHeader;
    var currentPartFiles = 0;
    var totalFiles = 0;

    for (var filePath in filesMap) {
      if (!Object.prototype.hasOwnProperty.call(filesMap, filePath)) continue;
      var content = filesMap[filePath];
      var ext = filePath.split('.').pop().toLowerCase();
      var safeContent = content || '';
      var block = '';

      if (ext === 'css') {
        safeContent = safeContent.split(closeStyle).join(escapeStyle);
        block = '<' + STYLE_WORD + ' data-file="' + filePath + '">\n' + safeContent + '\n' + closeStyle + '\n\n';
      } else if (ext === 'html' || ext === 'htm') {
        safeContent = safeContent.split(closeTemplate).join(escapeTemplate);
        block = '<' + TEMPLATE_WORD + ' data-file="' + filePath + '">\n' + safeContent + '\n' + closeTemplate + '\n\n';
      } else if (ext === 'json') {
        safeContent = safeContent.split(closeScript).join(escapeScript);
        block = '<' + SCRIPT_WORD + ' type="application/json" data-file="' + filePath + '">\n' + safeContent + '\n' + closeScript + '\n\n';
      } else if (ext === 'md' || ext === 'txt') {
        safeContent = safeContent.split(closeScript).join(escapeScript);
        block = '<' + SCRIPT_WORD + ' type="text/plain" data-file="' + filePath + '">\n' + safeContent + '\n' + closeScript + '\n\n';
      } else if (ext === 'svg') {
        safeContent = safeContent.split(closeSvg).join(escapeSvg);
        block = '<' + SVG_WORD + ' data-file="' + filePath + '">\n' + safeContent + '\n' + closeSvg + '\n\n';
      } else {
        safeContent = safeContent.split(closeScript).join(escapeScript);
        block = '<' + SCRIPT_WORD + ' data-file="' + filePath + '">\n' + safeContent + '\n' + closeScript + '\n\n';
      }

      totalFiles++;

      if ((currentPartText.length + block.length) > maxBytes && currentPartFiles > 0) {
        parts.push(currentPartText.trim() + '\n\n');
        currentPartText = baseHeader + block;
        currentPartFiles = 1;
      } else {
        currentPartText += block;
        currentPartFiles++;
      }
    }

    if (currentPartFiles > 0) {
      parts.push(currentPartText.trim() + '\n\n');
    }

    // Only replace existing packages that belong to this specific project
    OutboxQueue.queue = OutboxQueue.queue.filter(function(i) {
      if (!i || !i.title) return false;
      var isThisProjectPackage = i.title.startsWith('Codebase Package: ' + pName) || i.title.startsWith('Smart Bundle: ' + pName);
      return !isThisProjectPackage;
    });

    for (var i = 0; i < parts.length; i++) {
      var partTitle = 'Codebase Package: ' + pName + (parts.length > 1 ? (' (Part ' + (i + 1) + '/' + parts.length + ')') : '');
      OutboxQueue.addBundle(partTitle, parts[i], { priority: 'high' });
    }

    OutboxQueue.saveQueue();

    return {
      fileCount: totalFiles,
      totalParts: parts.length,
      projTitle: pName
    };
  }

  static getCombinedPackageText(itemId) {
    if (OutboxQueue.queue.length === 0) return '';

    if (itemId) {
      var target = OutboxQueue.queue.find(function(i) { return i && i.id === itemId; });
      if (target) return target.payload.trim();
    }

    var packageText = '';

    OutboxQueue.queue.forEach(function(item) {
      if (item && item.payload) {
        if (packageText) {
          packageText += '\n';
        }
        packageText += item.payload.trim() + '\n\n';
      }
    });

    return packageText.trim() + '\n\n';
  }

    static copyPackageToClipboard() {
    == 0) {
        if (typeof ClientApp !== 'undefined') ClientApp.showToast('Outbox is empty!', 'info');
        return;
      }
  
      var packageText = '';
      var toastMsg = 'Copied Outbox Package to clipboard!';
  
      if (itemId) {
        var item = OutboxQueue.queue.find(function(i) { return i && i.id === itemId; });
        if (item) {
          packageText = item.payload.trim();
          toastMsg = 'Copied ' + item.title + ' to clipboard!';
        }
      }
  
      if (!packageText) {
        packageText = OutboxQueue.getCombinedPackageText();
        toastMsg = 'Copied Outbox Package (' + OutboxQueue.queue.length + ' items) to clipboard!';
      }
  
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(packageText);
        }
      } catch (e) {}
  
      var outboxCard = document.querySelector('.outbox-card');
      if (outboxCard && typeof LunoAnimationEngine !== 'undefined') {
        var rect = outboxCard.getBoundingClientRect();
        LunoAnimationEngine.burstSparks(rect.left + (rect.width / 2), rect.top + 30, '#3fb950', 20);
        LunoAnimationEngine.pulseTarget(outboxCard, { color: '#3fb950', glowColor: 'rgba(63, 185, 80, 0.85)' });
        if (typeof LunoAnimationEngine.wavePulse === 'function') {
          LunoAnimationEngine.wavePulse(outboxCard, '#3fb950');
        }
      }
  
      if (typeof OutboxQueue.notifyTargetPage === 'function') {
        OutboxQueue.notifyTargetPage(itemId ? 'Single Item' : 'Outbox Package', packageText);
      }
  
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast(toastMsg, 'success', '📋');
      }
  
      if (typeof OutboxQueue.showClearCountdownBanner === 'function') {
        OutboxQueue.showClearCountdownBanner(10000, itemId);
      }
    }
  }

  static async executeSmartBundle(bundleOptions) {
    try {
      var opts = (typeof bundleOptions === 'object' && bundleOptions !== null) ? bundleOptions : { includeInstructions: true, includeLibrary: false };
      var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';
      var lunoMeta = {};
      try {
        var resMeta = await fetch('/api/fs/read?path=luno.json' + (targetProj ? '&project=' + encodeURIComponent(targetProj) : ''));
        var dataMeta = await resMeta.json();
        if (dataMeta && dataMeta.content) lunoMeta = JSON.parse(dataMeta.content);
      } catch (e) {}

      var projName = lunoMeta.name || targetProj || (typeof ClientApp !== 'undefined' && ClientApp.activeRootDir ? ClientApp.activeRootDir.split('/').filter(Boolean).pop() : 'Project');

      var pParams = [];
      if (targetProj) pParams.push('project=' + encodeURIComponent(targetProj));
      if (opts.includeLibrary) pParams.push('includeLibrary=true');
      var queryString = pParams.length > 0 ? ('?' + pParams.join('&')) : '';

      var resCode = await fetch('/api/all-code' + queryString);
      var dataCode = await resCode.json();
      if (!resCode.ok) throw new Error('Failed to fetch codebase from server');

      var filesMap = dataCode.filesMap || {};

      if (typeof OutboxQueue.bundleAndQueueCodebase === 'function') {
        var result = OutboxQueue.bundleAndQueueCodebase(filesMap, lunoMeta, projName, opts);
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Bundled ' + result.fileCount + ' file(s) for [' + projName + '] into ' + result.totalParts + ' package part(s)!', 'success', '⚡');
        }
      }
    } catch (err) {
      if (typeof ClientApp !== 'undefined' && ClientApp.reportError) {
        ClientApp.reportError('Smart Bundle Error', err);
      }
    }
  }

    static renderWidget(containerId, retryCount) {
      if (typeof OutboxWidgetRenderer !== 'undefined' && OutboxWidgetRenderer.renderWidget) {
        return OutboxWidgetRenderer.renderWidget(containerId, retryCount);
      }
    }
}

if (typeof OutboxPromptBox !== 'undefined') {
  OutboxQueue.promptWriteNoteModal = OutboxPromptBox.promptWriteNoteModal;
  OutboxQueue.setupFloatingPromptDrag = OutboxPromptBox.setupFloatingPromptDrag;
}
if (typeof OutboxClearBanner !== 'undefined') {
  OutboxQueue.showClearCountdownBanner = OutboxClearBanner.showClearCountdownBanner;
}
if (typeof OutboxOptionsModal !== 'undefined') {
  OutboxQueue.promptBundleOptionsModal = OutboxOptionsModal.promptBundleOptionsModal;
}
if (typeof OutboxWidgetRenderer !== 'undefined') {
  OutboxQueue.renderWidget = OutboxWidgetRenderer.renderWidget;
  OutboxQueue.renderQueueItemRow = OutboxWidgetRenderer.renderQueueItemRow;

  static copyPackageToClipboard() {
    == 0) {
        if (typeof ClientApp !== 'undefined') ClientApp.showToast('Outbox is empty!', 'info');
        return;
      }
  
      var packageText = '';
      var toastMsg = 'Copied Outbox Package to clipboard!';
  
      if (itemId) {
        var item = OutboxQueue.queue.find(function(i) { return i && i.id === itemId; });
        if (item) {
          packageText = item.payload.trim();
          toastMsg = 'Copied ' + item.title + ' to clipboard!';
        }
      }
  
      if (!packageText) {
        packageText = OutboxQueue.getCombinedPackageText();
        toastMsg = 'Copied Outbox Package (' + OutboxQueue.queue.length + ' items) to clipboard!';
      }
  
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(packageText);
        }
      } catch (e) {}
  
      var outboxCard = document.querySelector('.outbox-card');
      if (outboxCard && typeof LunoAnimationEngine !== 'undefined') {
        var rect = outboxCard.getBoundingClientRect();
        LunoAnimationEngine.burstSparks(rect.left + (rect.width / 2), rect.top + 30, '#3fb950', 20);
        LunoAnimationEngine.pulseTarget(outboxCard, { color: '#3fb950', glowColor: 'rgba(63, 185, 80, 0.85)' });
        if (typeof LunoAnimationEngine.wavePulse === 'function') {
          LunoAnimationEngine.wavePulse(outboxCard, '#3fb950');
        }
      }
  
      if (typeof OutboxQueue.notifyTargetPage === 'function') {
        OutboxQueue.notifyTargetPage(itemId ? 'Single Item' : 'Outbox Package', packageText);
      }
  
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast(toastMsg, 'success', '📋');
      }
  
      if (typeof OutboxQueue.showClearCountdownBanner === 'function') {
        OutboxQueue.showClearCountdownBanner(10000, itemId);
      }
    }
  }
}

globalThis.OutboxQueue = OutboxQueue;
if (typeof module !== 'undefined' && module.exports) module.exports = OutboxQueue;