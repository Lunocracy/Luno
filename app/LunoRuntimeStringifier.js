class LunoRuntimeStringifier {
  constructor() {}

  static stringifyObject(obj, targetName) {
    if (obj === null || obj === undefined) return '// Object is null or undefined';
    const name = targetName || 'Object';
    let output = `// Runtime Stringification for: ${name}\n`;

    if (typeof obj === 'function') {
      output += obj.toString();
      if (obj.prototype) {
        const protoKeys = Object.getOwnPropertyNames(obj.prototype);
        for (const k of protoKeys) {
          if (k === 'constructor') continue;
          try {
            const fn = obj.prototype[k];
            if (typeof fn === 'function') {
              output += `\n\n${name}.prototype.${k} = ${fn.toString()};`;
            }
          } catch (e) {}
        }
      }
      return output;
    }

    try {
      return output + `${name} = ` + JSON.stringify(obj, null, 2) + ';';
    } catch (e) {
      return output + `// Error stringifying object: ${e.message}`;
    }
  }

  static mountUI(container) {
    if (!container || typeof document === 'undefined') return;
    container.innerHTML = '';

    const m = (tag, attrs, ...children) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...children);
      }
      const el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const select = m('select', {
      style: { width: '100%', background: '#0d1117', color: '#00f2fe', border: '1px solid #00f2fe', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '0.65rem' },
      onchange: (e) => LunoRuntimeStringifier.inspectTarget(e.target.value, codeBox)
    },
      m('option', { value: 'ClientApp' }, 'ClientApp (Main Controller)'),
      m('option', { value: 'ClientAppPaster' }, 'ClientAppPaster (Save Execution Loop)'),
      m('option', { value: 'OutboxQueue' }, 'OutboxQueue (Queue Manager)'),
      m('option', { value: 'LunoLinePatcher' }, 'LunoLinePatcher (Method Patch Engine)'),
      m('option', { value: 'LunoPayloadParser' }, 'LunoPayloadParser (HTML Container Parser)'),
      m('option', { value: 'LunoServer' }, 'LunoServer (Server Engine)')
    );

    const codeBox = m('pre', {
      style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '6px', color: '#7ee787', fontSize: '0.78rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '320px', overflowY: 'auto', margin: '0 0 0.65rem 0' }
    });

    let btnOutbox, btnCopy;
    const card = m('div', {
      style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', fontFamily: 'monospace', boxShadow: '0 4px 16px rgba(0,242,254,0.15)' }
    },
      m('h3', { style: { color: '#00f2fe', fontSize: '1.05rem', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🔬 Live Memory Runtime Stringifier'),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: '0 0 0.65rem 0' } }, 'Inspect live functions, prototypes, and properties directly out of browser runtime memory:'),
      select,
      codeBox,
      m('div', { style: { display: 'flex', gap: '0.5rem' } },
        btnCopy = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
          onclick: () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(codeBox.textContent);
              if (typeof ClientApp !== 'undefined') ClientApp.showToast('Copied Runtime Source!', 'success', '📋');
            }
          }
        }, '📋 Copy Source'),
        btnOutbox = m('button', {
          style: { flex: 1, padding: '0.6rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
          onclick: () => {
            if (typeof OutboxQueue !== 'undefined') {
              const closeScript = '</' + 'script>';
              const payload = `<script data-file="runtime_${select.value}.js">\n${codeBox.textContent}\n${closeScript}`;
              OutboxQueue.addBundle(`Runtime Dump: ${select.value}`, payload);
              if (typeof ClientApp !== 'undefined') ClientApp.showToast(`Sent ${select.value} Runtime Dump to Outbox!`, 'success', '📤');
            }
          }
        }, 'Outbox ➔ Queue Dump')
      )
    );

    container.appendChild(card);
    LunoRuntimeStringifier.inspectTarget('ClientApp', codeBox);
  }

  static inspectTarget(targetName, codeBoxEl) {
    if (!codeBoxEl) return;
    const target = globalThis[targetName];
    if (target) {
      codeBoxEl.textContent = LunoRuntimeStringifier.stringifyObject(target, targetName);
    } else {
      codeBoxEl.textContent = `// Target "${targetName}" not found in global scope.`;
    }
  }
}

globalThis.LunoRuntimeStringifier = LunoRuntimeStringifier;
if (typeof module !== "undefined" && module.exports) module.exports = LunoRuntimeStringifier;