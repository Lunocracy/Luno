class LunoDocsWidgets {
  constructor() {}

  static copySnippet(text, btnEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      if (btnEl) {
        const orig = btnEl.textContent;
        btnEl.textContent = '✅ Copied to Clipboard!';
        setTimeout(() => { btnEl.textContent = orig; }, 2000);
      }
    } else {
      prompt('Copy payload snippet:', text);
    }
  }

  static pushToOutbox(title, payloadText) {
    if (typeof OutboxQueue !== 'undefined') {
      OutboxQueue.addBundle(title, payloadText);
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('Pushed "' + title + '" to Outbox!', 'success', '📤');
      }
    }
  }

  static createDemandPagedSandbox() {
    const m = (tag, attrs, ...ch) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...ch);
      }
      const el = document.createElement(tag);
      if (attrs) Object.assign(el, attrs);
      ch.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const typeSelect = m('select', {
      style: { width: '100%', background: '#0d1117', color: '#a371f7', border: '1px solid #8257e5', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.5rem', fontFamily: 'monospace', fontWeight: 'bold' }
    },
      m('option', { value: 'FILE' }, '📄 FILE - Full File Request'),
      m('option', { value: 'METHOD' }, '✂️ METHOD - AST Class Method Request'),
      m('option', { value: 'LINES' }, '📏 LINES - Line Range Request (L10-L50)'),
      m('option', { value: 'SKELETON' }, '🦴 SKELETON - Class Signatures Overview')
    );

    const pathInput = m('input', {
      type: 'text', value: 'Luno/app/ClientApp.js', placeholder: 'relative/path/to/file.js',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem' }
    });

    const specInput = m('input', {
      type: 'text', value: 'ClientApp.setTargetProject', placeholder: 'ClassName.methodName',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem' }
    });

    const rangeInput = m('input', {
      type: 'text', value: 'L10-L40', placeholder: 'L10-L50',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem', display: 'none' }
    });

    const headerPreview = m('pre', {
      style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.65rem', borderRadius: '6px', color: '#a371f7', fontSize: '0.78rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }
    });

    const resultBox = m('pre', {
      style: { background: '#070a13', border: '1px solid #30363d', padding: '0.65rem', borderRadius: '6px', color: '#7ee787', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto', marginBottom: '0.5rem', display: 'none' }
    });

    const closeScript = '</' + 'script>';

    const updatePreview = () => {
      const type = typeSelect.value;
      const pathVal = pathInput.value.trim() || 'Luno/app/ClientApp.js';
      const specVal = specInput.value.trim();

      specInput.style.display = (type === 'METHOD' || type === 'SKELETON') ? 'block' : 'none';
      rangeInput.style.display = (type === 'LINES') ? 'block' : 'none';

      let header = '';
      if (type === 'METHOD') {
        header = '<script type="application/luno-request" data-kind="METHOD" data-file="' + pathVal + '" data-method="' + (specVal || 'ClassName.methodName') + '">' + closeScript;
      } else if (type === 'LINES') {
        header = '<script type="application/luno-request" data-kind="LINES" data-file="' + pathVal + '">' + closeScript;
      } else if (type === 'SKELETON') {
        header = '<script type="application/luno-request" data-kind="SKELETON" data-file="' + pathVal + '"' + (specVal ? (' data-method="' + specVal + '"') : '') + '>' + closeScript;
      } else {
        header = '<script type="application/luno-request" data-kind="FILE" data-file="' + pathVal + '">' + closeScript;
      }

      headerPreview.textContent = header;
    };

    typeSelect.onchange = updatePreview;
    pathInput.oninput = updatePreview;
    specInput.oninput = updatePreview;
    rangeInput.oninput = updatePreview;
    updatePreview();

    let btnTest, btnOutbox;
    return m('div', { style: { background: '#161b22', border: '2px solid #8257e5', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 4px 16px rgba(130,87,229,0.2)' } },
      m('h3', { style: { color: '#d2a8ff', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🧠 Interactive Demand-Paged Context Sandbox'),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.65rem' } }, 'Test generating LLM context request directives and fulfill snippets live:'),
      typeSelect,
      pathInput,
      specInput,
      rangeInput,
      m('strong', { style: { color: '#8b949e', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' } }, 'Generated Request Directive:'),
      headerPreview,
      resultBox,
      m('div', { style: { display: 'flex', gap: '0.5rem' } },
        btnTest = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' },
          onclick: async () => {
            resultBox.style.display = 'block';
            resultBox.textContent = '⚡ Fulfilling context request via /api/context/request...';
            try {
              const reqHeader = headerPreview.textContent;
              const res = await fetch('/api/context/request', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: reqHeader
              });
              const data = await res.json();
              if (res.ok && data.success) {
                resultBox.textContent = data.bundledText || 'Fulfilled cleanly.';
              } else {
                resultBox.textContent = '❌ Error: ' + (data.error || 'Failed to fulfill request.');
              }
            } catch (e) {
              resultBox.textContent = '❌ Exception: ' + e.message;
            }
          }
        }, '⚡ Test Fulfill'),
        btnOutbox = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' },
          onclick: () => globalThis.LunoDocsWidgets.pushToOutbox('Context Request Directive', headerPreview.textContent)
        }, 'Outbox ➔ Queue Request')
      )
    );
  }
}

globalThis.LunoDocsWidgets = LunoDocsWidgets;
if (typeof module !== "undefined" && module.exports) module.exports = LunoDocsWidgets;