class LunoUIComponents {
  constructor() {}

  static makeElement(tag, attrs, ...children) {
    const el = document.createElement(tag || 'div');
    let a = attrs;
    let ch = children;

    if (a && (typeof a !== 'object' || a instanceof Node || Array.isArray(a))) {
      ch = [a, ...children];
      a = {};
    }

    if (a && typeof a === 'object') {
      for (const [k, v] of Object.entries(a)) {
        if (v === null || v === undefined) continue;
        if (k.startsWith('on') && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'style') {
          if (typeof v === 'object') {
            Object.assign(el.style, v);
          } else {
            el.style.cssText = String(v);
          }
        } else if (k === 'className' || k === 'class') {
          el.className = String(v);
        } else if (k in el) {
          try { el[k] = v; } catch (e) { el.setAttribute(k, v); }
        } else {
          el.setAttribute(k, v);
        }
      }
    }

    const append = (child) => {
      if (child === null || child === undefined) return;
      if (Array.isArray(child)) {
        child.forEach(append);
      } else if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    };

    ch.forEach(append);
    return el;
  }

  static createSmartHelpModal(options = {}) {
    const existing = document.getElementById('luno-smart-help-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;

    const modal = m('div', {
      id: 'luno-smart-help-modal',
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9950, fontFamily: 'monospace', padding: '1rem'
      }
    },
      m('div', {
        style: {
          background: '#161b22', border: '2px solid #00f2fe', borderRadius: '12px',
          padding: '1.25rem', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 12px 36px rgba(0,242,254,0.25)'
        }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.6rem' } },
          m('h2', { style: { color: '#00f2fe', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '❓ Luno Help & Guidance Portal'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: () => modal.remove() }, '✖')
        ),

        m('p', { style: { fontSize: '0.8rem', color: '#8b949e', margin: 0 } }, 'Explore guides, technical specifications, and interactive AI mentorship:'),

        m('div', {
          style: { background: '#0d1117', border: '1px solid #0969da', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer' },
          onclick: () => {
            modal.remove();
            if (typeof LunoSpaDock !== 'undefined') LunoSpaDock.mountView('docs');
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' } },
            m('strong', { style: { color: '#58a6ff', fontSize: '0.95rem' } }, '📖 1. Architecture & Protocol Docs'),
            m('span', { style: { fontSize: '0.7rem', color: '#58a6ff', background: '#0969da22', padding: '0.2rem 0.5rem', borderRadius: '12px' } }, 'Technical Specs')
          ),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0 } }, 'Access full system specs, protocol header sandboxes, and REST API references.')
        ),

        m('div', {
          style: { background: 'linear-gradient(135deg, #0d2818 0%, #161b22 100%)', border: '2px solid #238636', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(35,134,54,0.25)' },
          onclick: () => {
            modal.remove();
            LunoUIComponents.openWalkthroughWizardModal();
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' } },
            m('strong', { style: { color: '#3fb950', fontSize: '0.95rem' } }, '🧠 2. Interactive AI Walkthrough & Guided Tour'),
            m('span', { style: { fontSize: '0.7rem', color: '#3fb950', background: '#23863622', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Recommended')
          ),
          m('p', { style: { fontSize: '0.78rem', color: '#c9d1d9', margin: 0 } }, 'Pick a goal and skill level to assemble your codebase context into Outbox.')
        ),

        m('button', {
          style: { padding: '0.65rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' },
          onclick: () => modal.remove()
        }, 'Close Help Portal')
      )
    );

    document.body.appendChild(modal);
    return modal;
  }

  static openWalkthroughWizardModal() {
    const existing = document.getElementById('luno-walkthrough-wizard-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;
    let selectedLevel = (typeof LunoGuideEngine !== 'undefined' && LunoGuideEngine.state) ? LunoGuideEngine.state.userScores.savviness : 1;

    const goals = [
      { id: 'web_app', title: '🌱 Build a Web App from Scratch', desc: 'Create a single-page web app with HTML, CSS, and JS components.' },
      { id: 'ast_patch', title: '✂️ Master Surgical AST Method Patching', desc: 'Modify individual class methods without rewriting whole files.' },
      { id: 'server_script', title: '⚡ Build a REST API with RUN: SERVER', desc: 'Write backend Node.js execution scripts that process server files.' },
      { id: 'custom', title: '✍️ Custom Goal / Problem Debugging', desc: 'Describe your own custom feature or bug to solve step-by-step.' }
    ];

    const goalRows = goals.map(g => {
      return m('div', {
        style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' },
        onclick: () => {
          let desc = g.desc;
          if (g.id === 'custom') {
            const customVal = prompt('Describe what you want to build or fix:', 'Add dark mode toggle button to header');
            if (!customVal) return;
            desc = customVal;
          }
          wizardModal.remove();
          if (typeof LunoGuideEngine !== 'undefined') {
            LunoGuideEngine.launchInteractiveWalkthrough(g.id, g.title, desc);
          }
        }
      },
        m('strong', { style: { color: '#58a6ff', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' } }, g.title),
        m('p', { style: { fontSize: '0.75rem', color: '#8b949e', margin: 0 } }, g.desc)
      );
    });

    const levelSelect = m('select', {
      style: { width: '100%', background: '#0d1117', color: '#3fb950', border: '1px solid #238636', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '0.75rem' },
      onchange: (e) => {
        selectedLevel = parseInt(e.target.value, 10);
        if (typeof LunoGuideEngine !== 'undefined') {
          LunoGuideEngine.state.userScores.savviness = selectedLevel;
          LunoGuideEngine.saveState();
        }
      }
    },
      m('option', { value: '1', selected: selectedLevel === 1 }, '🐣 Skill Level: ELI5 / Kid Mode (Simple, visual)'),
      m('option', { value: '2', selected: selectedLevel === 2 }, '💻 Skill Level: Developer Mode (Technical, method signatures)'),
      m('option', { value: '3', selected: selectedLevel === 3 }, '🚀 Skill Level: Master Architect Mode (Deep AST topology)')
    );

    const wizardModal = m('div', {
      id: 'luno-walkthrough-wizard-modal',
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9960, fontFamily: 'monospace', padding: '1rem'
      }
    },
      m('div', {
        style: {
          background: '#161b22', border: '2px solid #238636', borderRadius: '12px',
          padding: '1.25rem', maxWidth: '580px', width: '100%', maxHeight: '88vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '0.75rem'
        }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
          m('strong', { style: { color: '#3fb950', fontSize: '1.1rem' } }, '🧠 Interactive AI Walkthrough Setup'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: () => wizardModal.remove() }, '✖')
        ),
        m('div', {},
          m('label', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' } }, '1. Select Learner Experience Profile:'),
          levelSelect
        ),
        m('label', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold', display: 'block' } }, '2. Choose Your Walkthrough Goal:'),
        ...goalRows,
        m('button', {
          style: { padding: '0.6rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
          onclick: () => wizardModal.remove()
        }, 'Cancel')
      )
    );

    document.body.appendChild(wizardModal);
  }
}

globalThis.LunoUIComponents = LunoUIComponents;
if (typeof module !== "undefined" && module.exports) module.exports = LunoUIComponents;