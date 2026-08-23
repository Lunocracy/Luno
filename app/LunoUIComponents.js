class LunoUIComponents {
  /**
   * ⚙️ CONSTRUCTOR: LunoUIComponents()
   */
  constructor() {

  }

  /**
   * ⚙️ METHOD: makeElement(tag, attrs, ...children)
   * - Type: Static Method
   * - Modifier: sync
   */
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
  /**
   * ⚙️ METHOD: createMoonLogoSvg(size = 24)
   * - Type: Static Method
   * - Modifier: sync
   */
  static createMoonLogoSvg(size = 24) {

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.style.cssText = 'vertical-align:middle; flex-shrink:0;';
    svg.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#00f2fe" stroke="#00f2fe" stroke-width="1.5"/>`;
    return svg;

  }
  /**
   * ⚙️ METHOD: createDraggableGuideWidget()
   * - Type: Static Method
   * - Modifier: sync
   */
  static createDraggableGuideWidget() {

    const m = LunoUIComponents.makeElement;
    return m('div', {
      style: {
        position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9000,
        background: '#161b22', border: '1px solid #00f2fe', borderRadius: '20px',
        padding: '0.4rem 0.8rem', color: '#00f2fe', fontSize: '0.72rem',
        fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,242,254,0.2)'
      },
      onclick: () => LunoUIComponents.openModeGuideModal()
    }, '🌙 Luno Quick Guide');

  }
  /**
   * ⚙️ METHOD: createSmartHelpModal(options = {})
   * - Type: Static Method
   * - Modifier: sync
   */
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

        m('p', { style: { fontSize: '0.8rem', color: '#8b949e', margin: 0 } }, 'Select a learning mode below to explore video guides, technical specifications, or interactive AI mentorship:'),

        m('div', {
          style: { background: '#0d1117', border: '1px solid #ff007f', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer' },
          onclick: () => {
            modal.remove();
            LunoUIComponents.openVideoDemosModal();
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' } },
            m('strong', { style: { color: '#ff66cc', fontSize: '0.95rem' } }, '🎬 1. Video Tutorials & Visual Demos'),
            m('span', { style: { fontSize: '0.7rem', color: '#ff66cc', background: '#ff007f22', padding: '0.2rem 0.5rem', borderRadius: '12px' } }, 'Interactive Demos')
          ),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0 } }, 'Watch visual demonstrations of 1-tap payload loops and surgical AST patching.')
        ),

        m('div', {
          style: { background: '#0d1117', border: '1px solid #0969da', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer' },
          onclick: () => {
            modal.remove();
            if (typeof LunoSpaDock !== 'undefined') LunoSpaDock.mountView('docs');
          }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' } },
            m('strong', { style: { color: '#58a6ff', fontSize: '0.95rem' } }, '📖 2. Architecture & REST API Docs'),
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
            m('strong', { style: { color: '#3fb950', fontSize: '0.95rem' } }, '🧠 3. Interactive AI Walkthrough & Guided Tour'),
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
  /**
   * ⚙️ METHOD: openModeGuideModal()
   * - Type: Static Method
   * - Modifier: sync
   */
  static openModeGuideModal() {

    const existing = document.getElementById('luno-mode-guide-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;
    const modal = m('div', {
      id: 'luno-mode-guide-modal',
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 9950, fontFamily: 'monospace', padding: '1rem' }
    },
      m('div', {
        style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '12px', padding: '1.25rem', maxWidth: '580px', width: '100%', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '1.1rem' } }, '📖 Luno Protocol & Operating Modes Guide'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: () => modal.remove() }, '✖')
        ),
        m('div', { style: { background: '#0d1117', border: '1px solid #8257e5', borderRadius: '8px', padding: '0.75rem' } },
          m('strong', { style: { color: '#d2a8ff', fontSize: '0.88rem', display: 'block', marginBottom: '0.25rem' } }, '📤 Outbox Mode (Code ➔ LLM)'),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } }, 'Packages your codebase into ~500KB part blocks with demand-paged context instructions. Copy to ChatGPT, Claude, or Gemini.')
        ),
        m('div', { style: { background: '#0d1117', border: '1px solid #238636', borderRadius: '8px', padding: '0.75rem' } },
          m('strong', { style: { color: '#3fb950', fontSize: '0.88rem', display: 'block', marginBottom: '0.25rem' } }, '📥 Inbox Mode (LLM ➔ Code)'),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } }, 'Receives LLM responses. Detects file headers, AST surgical method patches, and context directives, then applies changes to disk.')
        ),
        m('div', { style: { background: '#0d1117', border: '1px solid #00f2fe', borderRadius: '8px', padding: '0.75rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.88rem', display: 'block', marginBottom: '0.25rem' } }, '✂️ AST Surgical Patching Mode'),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } }, 'Acorn AST matches exact node ranges in source files to update or insert single class methods without overwriting full files.')
        ),
        m('button', { style: { padding: '0.65rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }, onclick: () => modal.remove() }, 'Close Guide')
      )
    );
    document.body.appendChild(modal);

  }
  /**
   * ⚙️ METHOD: createIframePreviewModal(projectUrl = '/app-preview')
   * - Type: Static Method
   * - Modifier: sync
   */
  static createIframePreviewModal(projectUrl = '/app-preview') {

    const existing = document.getElementById('luno-iframe-preview-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;
    const modal = m('div', {
      id: 'luno-iframe-preview-modal',
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9950, fontFamily: 'monospace', padding: '1rem' }
    },
      m('div', {
        style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '12px', padding: '1rem', maxWidth: '850px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', gap: '0.5rem' }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '1rem' } }, '📱 Active App Live Preview'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: () => modal.remove() }, '✖')
        ),
        m('iframe', { src: projectUrl, style: { width: '100%', flex: 1, border: '1px solid #30363d', borderRadius: '6px', background: '#ffffff' } })
      )
    );
    document.body.appendChild(modal);

  }
  /**
   * ⚙️ METHOD: openWalkthroughWizardModal()
   * - Type: Static Method
   * - Modifier: sync
   */
  static openWalkthroughWizardModal() {

    const existing = document.getElementById('luno-walkthrough-wizard-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;

    let selectedLevel = (typeof LunoGuideEngine !== 'undefined' && LunoGuideEngine.state) ? LunoGuideEngine.state.userScores.savviness : 1;

    const goals = [
      { id: 'web_app', title: '🌱 Build a Web App from Scratch', desc: 'Create a single-page web app with HTML, CSS, and JS components.' },
      { id: 'ast_patch', title: '✂️ Master Surgical AST Method Patching', desc: 'Learn to modify individual class methods without rewriting whole files.' },
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
        m('div', { style: { display: 'flex', justify: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
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
  /**
   * ⚙️ METHOD: openVideoDemosModal()
   * - Type: Static Method
   * - Modifier: sync
   */
  static openVideoDemosModal() {

    const existing = document.getElementById('luno-video-demos-modal');
    if (existing) existing.remove();

    const m = LunoUIComponents.makeElement;

    const videoModal = m('div', {
      id: 'luno-video-demos-modal',
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9960, fontFamily: 'monospace', padding: '1rem'
      }
    },
      m('div', {
        style: {
          background: '#161b22', border: '2px solid #ff007f', borderRadius: '12px',
          padding: '1.25rem', maxWidth: '580px', width: '100%', maxHeight: '88vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '0.85rem'
        }
      },
        m('div', { style: { display: 'flex', justify: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' } },
          m('strong', { style: { color: '#ff66cc', fontSize: '1.1rem' } }, '🎬 Video Tutorials & Visual Demonstrations'),
          m('button', { style: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }, onclick: () => videoModal.remove() }, '✖')
        ),

        m('div', { style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', padding: '0.85rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' } }, '📽️ Demo 1: The 1-Tap Outbox / Inbox Cycle'),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.5rem', lineHeight: '1.4' } }, 'Watch how to package your codebase into Outbox, copy to ChatGPT/Gemini, and paste the LLM response back into Inbox.'),
          m('div', { style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.5rem', borderRadius: '6px', color: '#3fb950', fontSize: '0.72rem' } }, '📤 Outbox [Bundle] ➔ 📋 Copy ➔ 🤖 LLM Prompt ➔ 📥 Inbox [Paste] ➔ ⚡ Apply Patch')
        ),

        m('div', { style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', padding: '0.85rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' } }, '📽️ Demo 2: Surgical AST Method Patching'),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', marginBottom: '0.5rem', lineHeight: '1.4' } }, 'Learn how Acorn AST locates class method boundaries and surgically replaces methods without overwriting entire source files.'),
          m('div', { style: { background: '#070a13', border: '1px solid #1e293b', padding: '0.5rem', borderRadius: '6px', color: '#58a6ff', fontSize: '0.72rem' } }, '<script data-file="app/ClientApp.js" data-method="ClientApp.saveCode" data-action="patch">')
        ),

        m('button', {
          style: { padding: '0.65rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
          onclick: () => videoModal.remove()
        }, 'Close Video Demos')
      )
    );

    document.body.appendChild(videoModal);

  }
}

globalThis.LunoUIComponents = LunoUIComponents;
if (typeof module !== "undefined" && module.exports) module.exports = LunoUIComponents;