class LunoDocs {
  constructor() {}

  static activeTab = 'overview';

  static renderHeader(m) {
    return m('header', { style: { borderBottom: '1px solid #30363d', paddingBottom: '0.65rem', marginBottom: '0.75rem' } },
      m('h1', { style: { color: '#00f2fe', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '📖 Luno Protocol & Architecture Hub'),
      m('div', { style: { fontSize: '0.75rem', color: '#8b949e', marginTop: '0.2rem' } },
        'Comprehensive reference for HTML container directives, SVG vector studio, additive linear method patching, demand-paged context, REST APIs, and diagnostic logs'
      )
    );
  }

  static renderSubNav(m, container) {
    const tabs = [
      { key: 'overview', label: '📖 Overview & Protocol' },
      { key: 'svgstudio', label: '🎨 SVG Studio' },
      { key: 'es6converter', label: '⚡ ES6 Converter' },
      { key: 'stringifier', label: '🔬 Runtime Stringifier' },
      { key: 'context', label: '🧠 Demand-Paged Context' },
      { key: 'metrics', label: '📊 Codebase Metrics' },
      { key: 'api', label: '🌐 REST API Reference' },
      { key: 'audit', label: '🛡️ Audit & Decisions' },
      { key: 'relay', label: '🤖 AI Studio Relay' },
      { key: 'sandbox', label: '🧪 Interactive Sandbox' },
      { key: 'test', label: '🔬 Diagnostic Suite' }
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

  static renderDeveloperOverviewCard(m) {
    return m('div', { style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' } },
      m('h3', { style: { color: '#00f2fe', fontSize: '1.05rem', marginBottom: '0.4rem' } }, '🌙 Developer Overview & HTML Container Protocol'),
      m('p', { style: { fontSize: '0.78rem', color: '#c9d1d9', lineHeight: '1.45', marginBottom: '0.6rem' } },
        'Luno Workspace acts as a structured local bridge between LLMs and local codebases using HTML container tags. ' +
        'All source updates, stylesheets, templates, vectors (<svg data-file="...">), and server scripts are packaged into standard HTML container directives.'
      )
    );
  }

  static mountUI(container) {
    if (!container) return;
    container.innerHTML = '';

    var m = LunoUIComponents.makeElement;

    var header = globalThis.LunoDocs.renderHeader(m);
    var subNav = globalThis.LunoDocs.renderSubNav(m, container);
    var contentBox = m('div', { id: 'docs-content-area' });

    container.appendChild(header);
    container.appendChild(subNav);
    container.appendChild(contentBox);

    var tab = globalThis.LunoDocs.activeTab;

    if (tab === 'overview') {
      contentBox.appendChild(globalThis.LunoDocs.renderDeveloperOverviewCard(m));
    } else if (tab === 'svgstudio') {
      if (typeof LunoSvgStudio !== 'undefined' && LunoSvgStudio.mountUI) {
        LunoSvgStudio.mountUI(contentBox);
      } else {
        contentBox.innerHTML = '<div style="padding:1rem; color:#8b949e;">LunoSvgStudio engine loading... Please refresh.</div>';
      }
    } else if (tab === 'es6converter') {
      if (typeof LunoEs6Converter !== 'undefined' && LunoEs6Converter.mountUI) {
        LunoEs6Converter.mountUI(contentBox);
      } else {
        contentBox.innerHTML = '<div style="padding:1rem; color:#8b949e;">LunoEs6Converter engine loading... Please refresh.</div>';
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
    } else if (tab === 'test') {
      if (typeof LunoTestRunner !== 'undefined') {
        LunoTestRunner.mountUI(contentBox);
      }
    }
  }
}

globalThis.LunoDocs = LunoDocs;
if (typeof module !== "undefined" && module.exports) module.exports = LunoDocs;