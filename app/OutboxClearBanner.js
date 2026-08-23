class OutboxClearBanner {
  constructor() {}

  static showClearCountdownBanner(durationMs, itemId) {
    var duration = durationMs || 10000;
    var existing = typeof document !== 'undefined' ? document.getElementById('outbox-clear-banner') : null;
    if (existing) existing.remove();

    var targetQueue = typeof OutboxQueue !== 'undefined' ? OutboxQueue : null;

    if (targetQueue && targetQueue.activeClearClock && typeof targetQueue.activeClearClock.stop === 'function') {
      targetQueue.activeClearClock.stop();
      targetQueue.activeClearClock = null;
    }

    var container = typeof document !== 'undefined' ? (document.getElementById('outbox-queue-container') || document.getElementById('outbox-card-content')) : null;
    if (!container) return;

    var banner = document.createElement('div');
    banner.id = 'outbox-clear-banner';
    banner.style.cssText = 'display:flex; align-items:center; justify-content:space-between; width:100%; background:#271052; border:1px solid #8257e5; padding:0.55rem 0.75rem; border-radius:8px; font-size:0.78rem; color:#d2a8ff; margin-bottom:0.6rem; font-family:monospace; box-sizing:border-box; flex-wrap:wrap; gap:0.4rem; box-shadow:0 4px 12px rgba(130,87,229,0.3);';

    var info = document.createElement('div');
    info.style.cssText = 'display:flex; align-items:center; gap:0.55rem;';

    var clock = null;
    if (typeof SvgCountdownClock !== 'undefined') {
      try {
        clock = new SvgCountdownClock({
          size: 24,
          strokeWidth: 3,
          durationMs: duration,
          color: '#d2a8ff',
          onComplete: function() {
            if (targetQueue) {
              if (itemId) {
                targetQueue.removeItem(itemId);
              } else {
                targetQueue.queue = [];
                targetQueue.saveQueue();
              }
            }
            if (banner.parentNode) banner.remove();
            if (targetQueue && typeof targetQueue.renderWidget === 'function') targetQueue.renderWidget();
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast(itemId ? '📦 Item removed from Outbox queue!' : '📦 Outbox queue auto-cleared after copying!', 'info', '🧹');
            }
          }
        });
        if (targetQueue) targetQueue.activeClearClock = clock;
        info.appendChild(clock.element);
      } catch (e) {}
    }

    var textSpan = document.createElement('span');
    textSpan.innerHTML = itemId
      ? '📋 <strong>Item Copied!</strong> Removing item from Outbox queue...'
      : '📋 <strong>Package Copied!</strong> Auto-clearing Outbox queue...';
    info.appendChild(textSpan);

    var btnCancel = document.createElement('button');
    btnCancel.style.cssText = 'background:#161b22; color:#ff7b72; border:1px solid #da3633; border-radius:6px; padding:0.3rem 0.6rem; font-size:0.72rem; cursor:pointer; font-family:monospace; font-weight:bold;';
    btnCancel.textContent = '✖ Cancel Clear';
    btnCancel.onclick = function(e) {
      e.stopPropagation();
      if (targetQueue && targetQueue.activeClearClock && typeof targetQueue.activeClearClock.stop === 'function') {
        targetQueue.activeClearClock.stop();
        targetQueue.activeClearClock = null;
      }
      banner.remove();
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('Auto-clear cancelled. Outbox items retained.', 'info', '🛡️');
      }
    };

    banner.appendChild(info);
    banner.appendChild(btnCancel);

    if (container.firstChild) {
      container.insertBefore(banner, container.firstChild);
    } else {
      container.appendChild(banner);
    }

    if (clock && typeof clock.start === 'function') clock.start();
  }
}

// Bind to OutboxQueue for backward compatibility
if (typeof OutboxQueue !== 'undefined') {
  OutboxQueue.showClearCountdownBanner = OutboxClearBanner.showClearCountdownBanner;
}

globalThis.OutboxClearBanner = OutboxClearBanner;
if (typeof module !== "undefined" && module.exports) module.exports = OutboxClearBanner;