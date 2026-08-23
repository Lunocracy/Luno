class LunoGuideEngine {
  /**
   * ⚙️ CONSTRUCTOR: LunoGuideEngine()
   */
  constructor() {

  }

  static STATE_KEY = 'luno_guide_state_v1';
  static defaultState = {
    userScores: {
      savviness: 1,
      verbosity: 1,
      currentLesson: 1
    },
    heuristics: {
      totalPastes: 0,
      totalBundles: 0,
      hasCopiedOutbox: false,
      hasPastedInbox: false,
      lastAction: 'init'
    }
  };
  static state = LunoGuideEngine.loadState();

  /**
   * ⚙️ METHOD: loadState()
   * - Type: Static Method
   * - Modifier: sync
   */
  static loadState() {

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LunoGuideEngine.STATE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            userScores: { ...LunoGuideEngine.defaultState.userScores, ...(parsed.userScores || {}) },
            heuristics: { ...LunoGuideEngine.defaultState.heuristics, ...(parsed.heuristics || {}) }
          };
        }
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(LunoGuideEngine.defaultState));

  }
  /**
   * ⚙️ METHOD: saveState()
   * - Type: Static Method
   * - Modifier: sync
   */
  static saveState() {

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LunoGuideEngine.STATE_KEY, JSON.stringify(LunoGuideEngine.state));
      }
    } catch (e) {}

  }
  /**
   * ⚙️ METHOD: recordAction(actionType)
   * - Type: Static Method
   * - Modifier: sync
   */
  static recordAction(actionType) {

    const h = LunoGuideEngine.state.heuristics;
    h.lastAction = actionType;
    if (actionType === 'inbox_paste') h.hasPastedInbox = true;
    if (actionType === 'outbox_bundle') h.hasCopiedOutbox = true;
    LunoGuideEngine.saveState();

  }
  /**
   * ⚙️ METHOD: getSkillProfile(level)
   * - Type: Static Method
   * - Modifier: sync
   */
  static getSkillProfile(level) {

    const profiles = {
      1: { name: '🐣 ELI5 / Kid Mode', desc: 'Beginner friendly, plain English, visual step-by-step guidance.' },
      2: { name: '💻 Developer Mode', desc: 'Standard technical terms, clean code signatures, fast implementation.' },
      3: { name: '🚀 Master Architect', desc: 'AST range diffs, performance limits, full multi-file topologies.' }
    };
    return profiles[level] || profiles[1];

  }
  /**
   * ⚙️ METHOD: buildContextAwareTeacherPrompt(goalTitle, goalDesc)
   * - Type: Static Method
   * - Modifier: async
   */
  static async buildContextAwareTeacherPrompt(goalTitle, goalDesc) {

    const level = LunoGuideEngine.state.userScores.savviness || 1;
    const profile = LunoGuideEngine.getSkillProfile(level);

    let context = `\n`;
    context += `\n`;
    context += `\n`;
    context += `\n`;
    context += `\n\n`;

    try {
      const res = await fetch('/api/all-code');
      const data = await res.json();
      if (data && data.manifest) {
        context += `\n`;
        context += `\n\n`;
      }
    } catch (e) {}

    context += `INSTRUCTIONS FOR AI TEACHER:\n`;
    context += `1. Act as my personal, patient 1-on-1 coding mentor in Luno Workspace.\n`;
    context += `2. Guide me step-by-step toward my goal ("${goalTitle}").\n`;
    context += `3. Give me 1 small visual/functional change at a time.\n`;
    context += `4. Provide all code updates using strict HTML Container directives:\n`;
    context += `   - For single function update: <script data-file="relative/path/to/file.js" data-method="Class.method" data-action="patch">\n`;
    context += `   - For full file: <script data-file="relative/path/to/file.js">\n`;
    context += `5. End every lesson step with a quick 1-sentence question to test my understanding!\n`;

    return context;

  }
  /**
   * ⚙️ METHOD: launchInteractiveWalkthrough(goalKey, goalTitle, goalDesc)
   * - Type: Static Method
   * - Modifier: async
   */
  static async launchInteractiveWalkthrough(goalKey, goalTitle, goalDesc) {

    const promptText = await LunoGuideEngine.buildContextAwareTeacherPrompt(goalTitle, goalDesc);

    if (typeof OutboxQueue !== 'undefined') {
      OutboxQueue.addBundle(`AI Walkthrough: ${goalTitle}`, promptText, { priority: 'high' });
    }

    if (typeof ClientApp !== 'undefined') {
      ClientApp.showToast(`Queued Walkthrough Prompt into Outbox!`, 'success', '🧠');
    }

    LunoGuideEngine.showWalkthroughOverlay(goalTitle);

  }
  /**
   * ⚙️ METHOD: showWalkthroughOverlay(goalTitle)
   * - Type: Static Method
   * - Modifier: sync
   */
  static showWalkthroughOverlay(goalTitle) {

    const existing = typeof document !== 'undefined' ? document.getElementById('luno-walkthrough-overlay') : null;
    if (existing) existing.remove();

    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'luno-walkthrough-overlay';
    overlay.style.cssText = 'position:fixed; bottom:1rem; right:1rem; width:340px; max-width:92vw; background:#161b22; border:2px solid #00f2fe; border-radius:12px; padding:1rem; box-shadow:0 8px 24px rgba(0,242,254,0.3); z-index:9990; font-family:monospace; color:#c9d1d9; display:flex; flex-direction:column; gap:0.6rem;';

    overlay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color:#00f2fe; font-size:0.9rem;">🧠 AI Mentor Walkthrough</strong>
        <button id="btn-close-walk-overlay" style="background:none; border:none; color:#8b949e; cursor:pointer; font-size:1rem;">✖</button>
      </div>
      <div style="font-size:0.8rem; font-weight:bold; color:#3fb950;">Target: ${goalTitle}</div>
      <div style="font-size:0.75rem; color:#8b949e; line-height:1.4;">
        <strong>Step 1:</strong> Tap <strong>"📋 Copy Package"</strong> in the Outbox card, then paste it to ChatGPT / Gemini!
      </div>
      <div style="display:flex; gap:0.4rem; margin-top:0.3rem;">
        <button id="btn-walk-highlight-outbox" style="flex:1; padding:0.45rem; background:#8257e5; color:#fff; border:none; border-radius:6px; font-size:0.72rem; font-weight:bold; cursor:pointer;">📤 Highlight Outbox</button>
        <button id="btn-walk-highlight-inbox" style="flex:1; padding:0.45rem; background:#238636; color:#fff; border:none; border-radius:6px; font-size:0.72rem; font-weight:bold; cursor:pointer;">📥 Highlight Inbox</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-close-walk-overlay').onclick = () => overlay.remove();
    document.getElementById('btn-walk-highlight-outbox').onclick = () => {
      if (typeof LunoHelperHooks !== 'undefined') LunoHelperHooks.highlightElement('outbox-card-content');
    };
    document.getElementById('btn-walk-highlight-inbox').onclick = () => {
      if (typeof LunoHelperHooks !== 'undefined') LunoHelperHooks.highlightElement('inbox-card-content');
    };

  }
}

globalThis.LunoGuideEngine = LunoGuideEngine;
if (typeof module !== "undefined" && module.exports) module.exports = LunoGuideEngine;