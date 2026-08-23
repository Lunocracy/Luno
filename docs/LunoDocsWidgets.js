class LunoDocsWidgets {
  constructor() {
  }

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
      type: 'text', value: 'app/ClientApp.js', placeholder: 'relative/path/to/file.js',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem' }
    });

    const specInput = m('input', {
      type: 'text', value: 'ClientApp.processPastedText', placeholder: 'ClassName.methodName',
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
      const pathVal = pathInput.value.trim() || 'app/ClientApp.js';
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
      m('strong', { style: { color: '#8b949e', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' } }, 'Generated Request Directive Header:'),
      headerPreview,
      resultBox,
      m('div', { style: { display: 'flex', gap: '0.5rem' } },
        btnTest = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
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
                resultBox.textContent = data.bundledText || 'Fulfilled cleanly with no code.';
              } else {
                resultBox.textContent = '❌ Error: ' + (data.error || 'Failed to fulfill request.');
              }
            } catch (e) {
              resultBox.textContent = '❌ Exception: ' + e.message;
            }
          }
        }, '⚡ Test Fulfill Request'),
        btnOutbox = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
          onclick: () => globalThis.LunoDocsWidgets.pushToOutbox('Context Request Note', headerPreview.textContent)
        }, 'Outbox ➔ Queue Request')
      )
    );

  }
  static createInteractiveDelimiterTester() {

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
      style: { width: '100%', background: '#0d1117', color: '#58a6ff', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.5rem', fontFamily: 'monospace' }
    },
      m('option', { value: 'method' }, '✂️ Surgical Method Patch (<script data-file="..." data-method="...">)'),
      m('option', { value: 'file' }, '📄 Full File Write (<script data-file="...">)'),
      m('option', { value: 'server' }, '⚡ Server Execution Script (<script data-action="run-server">)')
    );

    const pathInput = m('input', {
      type: 'text', value: 'test/sample_test.js', placeholder: 'relative/path/to/file.js',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem' }
    });

    const methodInput = m('input', {
      type: 'text', value: 'SampleTestClass.greet', placeholder: 'ClassName.methodName',
      style: { width: '100%', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '0.5rem' }
    });

    const codeArea = m('textarea', {
      value: "greet() {\n  return '✨ Live Protocol Test Output!';\n}",
      style: { width: '100%', height: '90px', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '0.75rem', outline: 'none' }
    });

    const outputPreview = m('pre', {
      style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.65rem', borderRadius: '6px', color: '#00f2fe', fontSize: '0.78rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }
    });

    const closeScript = '</' + 'script>';

    const updatePreview = () => {
      const type = typeSelect.value;
      const pathVal = pathInput.value.trim() || 'test/sample_test.js';
      const methodVal = methodInput.value.trim() || 'SampleTestClass.greet';
      const codeVal = codeArea.value.trim();

      let formatted = '';
      if (type === 'method') {
        formatted = '<script data-file="' + pathVal + '" data-method="' + methodVal + '" data-action="patch">\n' + codeVal + '\n' + closeScript;
      } else if (type === 'file') {
        formatted = '<script data-file="' + pathVal + '">\n' + codeVal + '\n' + closeScript;
      } else if (type === 'server') {
        formatted = '<script data-action="run-server">\n' + codeVal + '\n' + closeScript;
      }

      outputPreview.textContent = formatted;
      methodInput.style.display = (type === 'method') ? 'block' : 'none';
      pathInput.style.display = (type === 'method' || type === 'file') ? 'block' : 'none';
    };

    typeSelect.onchange = updatePreview;
    pathInput.oninput = updatePreview;
    methodInput.oninput = updatePreview;
    codeArea.oninput = updatePreview;
    updatePreview();

    let copyBtn, outboxBtn;
    return m('div', { style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' } },
      m('h3', { style: { color: '#58a6ff', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🧪 Live HTML Container Sandbox'),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.65rem' } }, 'Construct, test, and format Luno HTML Container payloads live:'),
      typeSelect,
      pathInput,
      methodInput,
      codeArea,
      m('strong', { style: { color: '#8b949e', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' } }, 'Formatted Payload Output:'),
      outputPreview,
      m('div', { style: { display: 'flex', gap: '0.5rem' } },
        copyBtn = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
          onclick: () => globalThis.LunoDocsWidgets.copySnippet(outputPreview.textContent, copyBtn)
        }, '📋 Copy Payload'),
        outboxBtn = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
          onclick: () => globalThis.LunoDocsWidgets.pushToOutbox('Custom HTML Container Payload', outputPreview.textContent)
        }, 'Outbox ➔ Queue')
      )
    );

  }
  static createBenignExampleCards() {

    const m = (tag, attrs, ...ch) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...ch);
      }
      const el = document.createElement(tag);
      if (attrs) Object.assign(el, attrs);
      ch.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const closeScript = '</' + 'script>';

    const examples = [
      {
        title: '📄 1. Full File Creation / Write Example',
        badge: 'Safe Test File',
        desc: 'Creates or updates a safe test file at test/sample_test.js using <script data-file="...">.',
        payload: '<script data-file="test/sample_test.js">\n' +
          'globalThis.SampleTestClass = function SampleTestClass() {};\n' +
          'globalThis.SampleTestClass.run = function() { return "Hello from Luno Test Runner!"; };\n' +
          'globalThis.SampleTestClass.prototype.greet = function() { return "Welcome to Luno Workspace!"; };\n' +
          closeScript
      },
      {
        title: '✂️ 2. Surgical Additive Method Patch Example',
        badge: 'Additive Linear Patch',
        desc: 'Appends a linear prototype assignment (SampleTestClass.prototype.greet = function() ...) to the bottom of test/sample_test.js.',
        payload: '<script data-file="test/sample_test.js" data-method="SampleTestClass.prototype.greet" data-action="patch">\n' +
          'greet() {\n' +
          '  return "✨ Updated via Additive Linear Method Patch!";\n' +
          '}\n' +
          closeScript
      },
      {
        title: '⚡ 3. Server Execution Script Example',
        badge: 'Backend Node.js',
        desc: 'Executes a safe server-side script using injected environment variables (env.fs, env.path, env.rootDir). Writes and verifies a test file on disk.',
        payload: '<script data-action="run-server">\n' +
          'const testPath = env.path.join(env.rootDir, "test", "server_demo.txt");\n' +
          'env.fs.mkdirSync(env.path.dirname(testPath), { recursive: true });\n' +
          'env.fs.writeFileSync(testPath, "Luno Server Script Executed at " + new Date().toISOString(), "utf8");\n' +
          'const content = env.fs.readFileSync(testPath, "utf8");\n' +
          'return { success: true, file: "test/server_demo.txt", content: content };\n' +
          closeScript
      }
    ];

    const cards = examples.map(item => {
      let copyBtn, outboxBtn;
      return m('div', { style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' } },
        m('div', { style: { display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '0.35rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.88rem' } }, item.title),
          m('span', { style: { fontSize: '0.68rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', borderRadius: '10px', padding: '0.15rem 0.45rem', fontWeight: 'bold' } }, item.badge)
        ),
        m('p', { style: { fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.5rem', lineHeight: '1.3' } }, item.desc),
        m('pre', { style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.6rem', borderRadius: '6px', color: '#7ee787', fontSize: '0.74rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: '0.5rem', maxHeight: '160px', overflowY: 'auto' } }, item.payload),
        m('div', { style: { display: 'flex', gap: '0.4rem' } },
          copyBtn = m('button', {
            style: { flex: 1, padding: '0.45rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
            onclick: () => globalThis.LunoDocsWidgets.copySnippet(item.payload, copyBtn)
          }, '📋 Copy Example Payload'),
          outboxBtn = m('button', {
            style: { flex: 1, padding: '0.45rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
            onclick: () => globalThis.LunoDocsWidgets.pushToOutbox(item.title, item.payload)
          }, 'Outbox ➔ Queue')
        )
      );
    });

    return m('div', { style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' } },
      m('h3', { style: { color: '#3fb950', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 Interactive Try-It-Out Code Examples'),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.75rem' } }, 'Test Luno HTML Container payloads live. Tap Copy or Outbox to test applying them in Inbox:'),
      ...cards
    );

  }
  static createLlmPromptPresetCards() {

    const m = (tag, attrs, ...ch) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...ch);
      }
      const el = document.createElement(tag);
      if (attrs) Object.assign(el, attrs);
      ch.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const closeScript = '</' + 'script>';

    const presets = [
      {
        title: '🧠 Request Partial Context (Method or File)',
        desc: 'Direct the LLM to request code snippets using HTML container directives.',
        prompt: 'You can request any file or class method you need before answering by outputting:\n' +
          '<script type="application/luno-request" data-kind="METHOD" data-file="path/to/file.js" data-method="ClassName.methodName">' + closeScript + '\n' +
          '<script type="application/luno-request" data-kind="FILE" data-file="path/to/file.js">' + closeScript
      },
      {
        title: '✂️ Request Additive Linear Method Patch',
        desc: 'Ask your LLM to modify a single function via linear ES5 prototype assignment.',
        prompt: 'Please provide an additive linear method patch using the Luno HTML Container format:\n' +
          '<script data-file="path/to/file.js" data-method="ClassName.prototype.methodName" data-action="patch">\n' +
          'methodName() {\n  // Code here...\n}\n' +
          closeScript
      },
      {
        title: '⚡ Request Server Execution Script',
        desc: 'Ask your LLM to write an asynchronous Node.js backend script using env.fs and env.path.',
        prompt: 'Please write a Luno server execution script using the HTML Container format:\n' +
          '<script data-action="run-server">\n' +
          'const files = env.fs.readdirSync(env.rootDir);\n' +
          'return { count: files.length, activeRoot: env.rootDir };\n' +
          closeScript
      }
    ];

    const cards = presets.map(p => {
      return m('div', { style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' } },
        m('strong', { style: { color: '#58a6ff', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' } }, p.title),
        m('p', { style: { fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.5rem' } }, p.desc),
        m('button', {
          style: { padding: '0.35rem 0.65rem', fontSize: '0.75rem', width: '100%', background: '#21262d', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
          onclick: () => globalThis.LunoDocsWidgets.pushToOutbox(p.title, p.prompt)
        }, 'Outbox ➔ Queue Prompt Note')
      );
    });

    return m('div', { style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' } },
      m('h3', { style: { color: '#00f2fe', fontSize: '1rem', marginBottom: '0.4rem' } }, '🤖 LLM Prompt Templates'),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.75rem' } }, 'Push structured prompt notes directly into your Outbox queue:'),
      ...cards
    );

  }
}

globalThis.LunoDocsWidgets = LunoDocsWidgets;
if (typeof module !== "undefined" && module.exports) module.exports = LunoDocsWidgets;