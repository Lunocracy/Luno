class LunoDocs {
  constructor() {}

  static activeTab = 'instructions';

  static renderHeader(m) {
    return m('header', { style: { borderBottom: '1px solid #30363d', paddingBottom: '0.65rem', marginBottom: '0.75rem' } },
      m('h1', { style: { color: '#00f2fe', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '📖 Luno Protocol & Architecture Hub'),
      m('div', { style: { fontSize: '0.75rem', color: '#8b949e', marginTop: '0.2rem' } },
        'Comprehensive reference for HTML container directives, modular prompt guidelines, SVG vector studio, demand-paged context, and REST APIs'
      )
    );
  }

  static renderSubNav(m, container) {
    const tabs = [
      { key: 'instructions', label: '📋 Instructions Hub' },
      { key: 'overview', label: '📖 Overview & Protocol' },
      { key: 'svgstudio', label: '🎨 SVG Studio' },
      { key: 'es6converter', label: '⚡ ES6 Converter' },
      { key: 'stringifier', label: '🔬 Runtime Stringifier' },
      { key: 'context', label: '🧠 Demand-Paged Context' },
      { key: 'metrics', label: '📊 Codebase Metrics' },
      { key: 'relay', label: '🤖 AI Studio Relay' },
      { key: 'test', label: '🧪 Test Suite' }
    ];

    const tabBtns = tabs.map(t => {
      const isActive = globalThis.LunoDocs.activeTab === t.key;
      return m('button', {
        style: {
          padding: '0.4rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          borderRadius: '6px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'monospace',
          background: isActive ? '#238636' : '#21262d',
          color: isActive ? '#ffffff' : '#c9d1d9',
          border: '1px solid ' + (isActive ? '#3fb950' : '#30363d')
        },
        onclick: () => {
          globalThis.LunoDocs.activeTab = t.key;
          globalThis.LunoDocs.mountUI(container);
        }
      }, t.label);
    });

    return m('div', {
      style: { display: 'flex', gap: '0.35rem', marginBottom: '1rem', borderBottom: '1px solid #21262d', paddingBottom: '0.5rem', overflowX: 'auto' }
    }, ...tabBtns);
  }

  static mountUI(container) {
    if (!container) return;
    container.innerHTML = '';

    var m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          var el = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
          for (var i = 2; i < arguments.length; i++) {
            var c = arguments[i];
            if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        };

    var header = globalThis.LunoDocs.renderHeader(m);
    var subNav = globalThis.LunoDocs.renderSubNav(m, container);
    var contentBox = m('div', { id: 'docs-content-area' });

    container.appendChild(header);
    container.appendChild(subNav);
    container.appendChild(contentBox);

    var tab = globalThis.LunoDocs.activeTab;

    if (tab === 'instructions') {
      if (typeof LunoPromptInstructions !== 'undefined' && LunoPromptInstructions.mountUI) {
        LunoPromptInstructions.mountUI(contentBox);
      }
    } else if (tab === 'overview') {
      contentBox.innerHTML = '<div style="padding:1rem; background:#161b22; border-radius:8px; color:#c9d1d9; font-size:0.8rem; line-height:1.45;">' +
        '<strong style="color:#00f2fe;">HTML Container Protocol Overview:</strong><br>' +
        'Luno Workspace communicates with language models using clean HTML container tags (<script data-file="...">, <style>, <template>, <svg>). ' +
        'All client-side parsing and surgical method consolidation execute directly in browser memory.</div>';
    } else if (tab === 'svgstudio') {
      if (typeof LunoSvgStudio !== 'undefined' && LunoSvgStudio.mountUI) {
        LunoSvgStudio.mountUI(contentBox);
      }
    } else if (tab === 'es6converter') {
      if (typeof LunoEs6Converter !== 'undefined' && LunoEs6Converter.mountUI) {
        LunoEs6Converter.mountUI(contentBox);
      }
    } else if (tab === 'stringifier') {
      if (typeof LunoRuntimeStringifier !== 'undefined' && LunoRuntimeStringifier.mountUI) {
        LunoRuntimeStringifier.mountUI(contentBox);
      }
    } else if (tab === 'context') {
      if (typeof LunoDocsWidgets !== 'undefined' && LunoDocsWidgets.createDemandPagedSandbox) {
        contentBox.appendChild(LunoDocsWidgets.createDemandPagedSandbox());
      }
    } else if (tab === 'metrics') {
      if (typeof LunoMetricsAnalyzer !== 'undefined' && LunoMetricsAnalyzer.mountUI) {
        LunoMetricsAnalyzer.mountUI(contentBox);
      }
    } else if (tab === 'relay') {
      if (typeof AiStudioRelayDocs !== 'undefined' && AiStudioRelayDocs.renderDocCard) {
        contentBox.appendChild(AiStudioRelayDocs.renderDocCard());
      }
    } else if (tab === 'test') {
      if (typeof LunoTestRunner !== 'undefined') {
        LunoTestRunner.mountUI(contentBox);
      }
    }
  }
}

globalThis.LunoDocs = LunoDocs;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoDocs;