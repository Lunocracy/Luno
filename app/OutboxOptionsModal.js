class OutboxOptionsModal {
  constructor() {}

  static promptBundleOptionsModal() {
    var existing = document.getElementById('luno-bundle-options-modal');
    if (existing) existing.remove();

    var m = function(tag, attrs) {
      var children = Array.prototype.slice.call(arguments, 2);
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement.apply(LunoUIComponents, [tag, attrs].concat(children));
      }
      var el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(function(c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
      return el;
    };

    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Active Project';

    var modal = m('div', {
      id: 'luno-bundle-options-modal',
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9980, fontFamily: 'monospace', padding: '1rem'
      }
    },
      m('div', {
        style: {
          background: '#161b22', border: '2px solid #8257e5', borderRadius: '12px',
          padding: '1.25rem', maxWidth: '540px', width: '100%', display: 'flex',
          flexDirection: 'column', gap: '0.85rem', boxShadow: '0 12px 32px rgba(130,87,229,0.3)'
        }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
          m('strong', { style: { color: '#d2a8ff', fontSize: '1.1rem' } }, '📦 Outbox Bundle Mode Selector'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: function() { modal.remove(); } }, '✖')
        ),

        m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
          'Target project: <strong style="color:#00f2fe;">' + currentTarget + '</strong>'
        ),

        // Option 1: Smart Bundle with Luno Protocol & AI Studio Instructions Prepend
        m('div', {
          style: { background: '#0d1117', border: '2px solid #00f2fe', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer' },
          onclick: async function() {
            modal.remove();
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Building Bundle with Protocol Instructions for [' + currentTarget + ']...', 'info', '⚡');
            if (typeof OutboxQueue !== 'undefined' && OutboxQueue.executeSmartBundle) {
              await OutboxQueue.executeSmartBundle({ includeInstructions: true });
            }
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' } },
            m('strong', { style: { color: '#00f2fe', fontSize: '0.92rem' } }, '⚡ Smart Bundle + Protocol Instructions'),
            m('span', { style: { fontSize: '0.68rem', color: '#00f2fe', background: '#00f2fe22', border: '1px solid #00f2fe', padding: '0.15rem 0.45rem', borderRadius: '10px', fontWeight: 'bold' } }, 'Recommended')
          ),
          m('p', { style: { fontSize: '0.75rem', color: '#c9d1d9', margin: 0, lineHeight: '1.35' } },
            'Packages project files along with lightweight modular LLM protocol instructions (English sandwich rule, single code block, AST container spec).'
          )
        ),

        // Option 2: Code Only (No instructions)
        m('div', {
          style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' },
          onclick: async function() {
            modal.remove();
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Building Code-Only Bundle for [' + currentTarget + ']...', 'info', '📦');
            if (typeof OutboxQueue !== 'undefined' && OutboxQueue.executeSmartBundle) {
              await OutboxQueue.executeSmartBundle({ includeInstructions: false });
            }
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' } },
            m('strong', { style: { color: '#8b949e', fontSize: '0.88rem' } }, '📄 Code Only (No Instructions)'),
            m('span', { style: { fontSize: '0.68rem', color: '#8b949e', background: '#161b22', padding: '0.15rem 0.45rem', borderRadius: '10px' } }, 'Raw Files')
          ),
          m('p', { style: { fontSize: '0.75rem', color: '#8b949e', margin: 0, lineHeight: '1.35' } },
            'Packages only the raw target project source files without the protocol instruction preamble.'
          )
        ),

        // Option 3: Protocol Instructions Alone
        m('div', {
          style: { background: '#0d1117', border: '1px solid #8257e5', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' },
          onclick: function() {
            modal.remove();
            if (typeof LunoPromptInstructions !== 'undefined' && typeof OutboxQueue !== 'undefined') {
              var instructionsText = LunoPromptInstructions.assembleFullInstructions();
              OutboxQueue.addBundle('Luno Protocol & AI Studio Instructions', instructionsText, { priority: 'high' });
              if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
                ClientApp.showToast('Queued Protocol Instructions to Outbox!', 'success', '📋');
              }
            }
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' } },
            m('strong', { style: { color: '#d2a8ff', fontSize: '0.88rem' } }, '📋 Instructions Only'),
            m('span', { style: { fontSize: '0.68rem', color: '#d2a8ff', background: '#271052', padding: '0.15rem 0.45rem', borderRadius: '10px' } }, 'Prompt Note')
          ),
          m('p', { style: { fontSize: '0.75rem', color: '#8b949e', margin: 0, lineHeight: '1.35' } },
            'Queues only the modular LLM prompt guidelines directly into Outbox.'
          )
        ),

        m('button', {
          style: { padding: '0.6rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
          onclick: function() { modal.remove(); }
        }, 'Cancel')
      )
    );

    document.body.appendChild(modal);
  }
}

if (typeof OutboxQueue !== 'undefined') {
  OutboxQueue.promptBundleOptionsModal = OutboxOptionsModal.promptBundleOptionsModal;
}

globalThis.OutboxOptionsModal = OutboxOptionsModal;
if (typeof module !== "undefined" && module.exports) module.exports = OutboxOptionsModal;