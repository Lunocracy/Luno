class LunoPlaybackLogger {
  constructor() {}

  static logs = [];
  static listeners = new Set();
  static isExpanded = true;
  static isVisible = typeof localStorage !== 'undefined' ? (localStorage.getItem('luno_show_telemetry') !== 'false') : true;

  /**
   * ⚙️ METHOD: setVisible(show)
   * - Type: Static Method
   * - Modifier: sync
   * Saves visibility setting to localStorage and updates drawer.
   */
  static setVisible(show) {
    LunoPlaybackLogger.isVisible = Boolean(show);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('luno_show_telemetry', String(show));
      }
    } catch (e) {}

    const drawer = document.getElementById('luno-telemetry-drawer-container');
    if (drawer) LunoPlaybackLogger.renderWidget(drawer);

    if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
      if (show) {
        ClientApp.showToast('Telemetry Drawer Enabled', 'info', '⚡');
      } else {
        ClientApp.showToast('Telemetry Drawer Hidden for Clean View', 'info', '🧹');
      }
    }
  }

  /**
   * ⚙️ METHOD: log(kind, title, detail)
   * - Type: Static Method
   * - Modifier: sync
   */
  static log(kind, title, detail) {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString(),
      kind: (kind || 'INFO').toUpperCase(),
      title: title || 'System Event',
      detail: detail || ''
    };

    LunoPlaybackLogger.logs.push(entry);
    if (LunoPlaybackLogger.logs.length > 100) {
      LunoPlaybackLogger.logs.shift();
    }

    LunoPlaybackLogger.notifyListeners();
    return entry;
  }

  static boot(title, detail) { return LunoPlaybackLogger.log('BOOT', title, detail); }
  static patch(title, detail) { return LunoPlaybackLogger.log('PATCH', title, detail); }
  static override(title, detail) { return LunoPlaybackLogger.log('OVERRIDE', title, detail); }
  static warn(title, detail) { return LunoPlaybackLogger.log('WARN', title, detail); }
  static error(title, detail) { return LunoPlaybackLogger.log('ERROR', title, detail); }

  static clear() {
    LunoPlaybackLogger.logs = [];
    LunoPlaybackLogger.notifyListeners();
  }

  static subscribe(fn) {
    if (typeof fn === 'function') LunoPlaybackLogger.listeners.add(fn);
  }

  static notifyListeners() {
    LunoPlaybackLogger.listeners.forEach(fn => {
      try { fn(LunoPlaybackLogger.logs); } catch(e){}
    });
  }

  /**
   * ⚙️ METHOD: sendToOutbox()
   * - Type: Static Method
   * - Modifier: sync
   * Formats all recorded telemetry events and queues them to Outbox.
   */
  static sendToOutbox() {
    if (LunoPlaybackLogger.logs.length === 0) {
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('Telemetry log is empty!', 'info');
      }
      return;
    }

    const closeScript = '</' + 'script>';
    let logText = '<script type="text/plain" data-file="telemetry_logs.txt">\n';
    logText += `🌙 LUNO TELEMETRY & PLAYBACK DIAGNOSTIC LOGS\n`;
    logText += `Generated: ${new Date().toLocaleString()}\n`;
    logText += `Total Events: ${LunoPlaybackLogger.logs.length}\n`;
    logText += `================================================================================\n\n`;

    LunoPlaybackLogger.logs.forEach((item, idx) => {
      logText += `[${idx + 1}] [${item.timestamp}] [${item.kind}] ${item.title}\n`;
      if (item.detail) logText += `    Detail: ${item.detail}\n`;
      logText += `\n`;
    });

    logText += closeScript;

    if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
      OutboxQueue.addBundle('Telemetry Diagnostic Logs (' + LunoPlaybackLogger.logs.length + ' events)', logText, { priority: 'high' });
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('Queued ' + LunoPlaybackLogger.logs.length + ' telemetry event(s) to Outbox!', 'success', '📤');
      }
    }
  }

  /**
   * ⚙️ METHOD: renderWidget(containerEl)
   * - Type: Static Method
   * - Modifier: sync
   * Mobile-responsive telemetry drawer with Outbox handoff and settings toggle.
   */
  static renderWidget(containerEl) {
    const target = containerEl || document.getElementById('luno-telemetry-drawer-container');
    if (!target) return;

    target.innerHTML = '';

    // If disabled by user in settings, do not render telemetry card
    if (!LunoPlaybackLogger.isVisible) {
      return;
    }

    const m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          const el = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
          for (let i = 2; i < arguments.length; i++) {
            const c = arguments[i];
            if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        };

    const isExpanded = LunoPlaybackLogger.isExpanded;
    const arrow = m('span', { style: { fontSize: '0.8rem', color: '#00f2fe', fontWeight: 'bold' } }, isExpanded ? '▲ Collapse' : '▼ Open');

    // Mobile-responsive event row layout (prevents narrow vertical letter squeezing)
    const logRows = LunoPlaybackLogger.logs.map(item => {
      let color = '#7ee787';
      let border = '#238636';
      let icon = 'ℹ️';

      if (item.kind === 'BOOT') { color = '#00f2fe'; border = '#0088cc'; icon = '🚀'; }
      else if (item.kind === 'PATCH') { color = '#d2a8ff'; border = '#8257e5'; icon = '⚡'; }
      else if (item.kind === 'OVERRIDE') { color = '#ff9800'; border = '#d35400'; icon = '🔄'; }
      else if (item.kind === 'WARN') { color = '#f1e05a'; border = '#b58105'; icon = '⚠️'; }
      else if (item.kind === 'ERROR') { color = '#ff7b72'; border = '#da3633'; icon = '❌'; }

      return m('div', {
        style: {
          background: '#0d1117',
          borderLeft: '3px solid ' + color,
          border: '1px solid ' + border,
          borderRadius: '4px',
          padding: '0.45rem 0.65rem',
          fontSize: '0.74rem',
          fontFamily: 'monospace',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }
      },
        m('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '0.45rem', flex: '1 1 220px', minWidth: '0' } },
          m('span', { style: { flexShrink: 0, fontSize: '0.85rem' } }, icon),
          m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: '1 1 auto', minWidth: '0' } },
            m('strong', { style: { color: color, wordBreak: 'break-word', lineHeight: '1.3' } }, item.title),
            item.detail ? m('span', { style: { color: '#8b949e', fontSize: '0.7rem', wordBreak: 'break-word', lineHeight: '1.3' } }, item.detail) : null
          )
        ),
        m('span', { style: { color: '#8b949e', fontSize: '0.65rem', flexShrink: 0, marginLeft: 'auto', paddingTop: '0.1rem' } }, item.timestamp)
      );
    });

    const contentBox = m('div', {
      style: {
        display: isExpanded ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '0.35rem',
        marginTop: '0.55rem',
        maxHeight: '260px',
        overflowY: 'auto'
      }
    },
      logRows.length > 0 ? logRows : m('div', { style: { color: '#7ee787', fontSize: '0.74rem', padding: '0.4rem', background: '#0d1117', borderRadius: '4px', border: '1px solid #238636' } }, '🚀 Workspace Online: System boot complete (LunoPatchLog.html is clean).')
    );

    const card = m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #00f2fe',
        borderRadius: '10px',
        padding: '0.75rem',
        marginBottom: '0.65rem',
        boxShadow: '0 4px 16px rgba(0, 242, 254, 0.25)',
        fontFamily: 'monospace'
      }
    },
      m('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.4rem' },
        onclick: function(e) {
          if (e.target.tagName !== 'BUTTON') {
            LunoPlaybackLogger.isExpanded = !LunoPlaybackLogger.isExpanded;
            contentBox.style.display = LunoPlaybackLogger.isExpanded ? 'flex' : 'none';
            arrow.textContent = LunoPlaybackLogger.isExpanded ? '▲ Collapse' : '▼ Open';
          }
        }
      },
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.88rem' } }, '⚡ TELEMETRY & PLAYBACK LOGS'),
          m('span', { style: { fontSize: '0.68rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' } }, LunoPlaybackLogger.logs.length + ' event(s)')
        ),
        m('div', { style: { display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' } },
          m('button', {
            style: { padding: '0.2rem 0.5rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
            title: 'Package telemetry logs into Outbox',
            onclick: function(e) {
              e.stopPropagation();
              LunoPlaybackLogger.sendToOutbox();
            }
          }, '📤 Outbox'),
          m('button', {
            style: { padding: '0.2rem 0.5rem', background: '#21262d', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
            title: 'Clear event history',
            onclick: function(e) {
              e.stopPropagation();
              LunoPlaybackLogger.clear();
              LunoPlaybackLogger.renderWidget(target);
            }
          }, 'Clear'),
          m('button', {
            style: { padding: '0.2rem 0.5rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace' },
            title: 'Hide Telemetry Drawer for clean view (Can re-enable anytime)',
            onclick: function(e) {
              e.stopPropagation();
              LunoPlaybackLogger.setVisible(false);
            }
          }, '✖ Hide'),
          arrow
        )
      ),
      contentBox
    );

    target.appendChild(card);
  }
}

globalThis.LunoPlaybackLogger = LunoPlaybackLogger;
if (typeof module !== "undefined" && module.exports) module.exports = LunoPlaybackLogger;