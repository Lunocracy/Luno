class LunoGuideEngine {
  constructor() {}

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

  static saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LunoGuideEngine.STATE_KEY, JSON.stringify(LunoGuideEngine.state));
      }
    } catch (e) {}
  }

  static recordAction(actionType) {
    const h = LunoGuideEngine.state.heuristics;
    h.lastAction = actionType;
    if (actionType === 'inbox_paste') h.hasPastedInbox = true;
    if (actionType === 'outbox_bundle') h.hasCopiedOutbox = true;
    LunoGuideEngine.saveState();
  }

    static getSkillProfile(level) {
      const profiles = {
        1: {
          name: '🐣 Newbie / Kid Mode',
          desc: 'Beginner-friendly, visual step-by-step guidance',
          instructions: 'Explain concepts in clear, intuitive English. Break features into single, testable steps. Always ask what the user sees on screen before moving to the next step.'
        },
        2: {
          name: '💻 Builder / Developer Mode',
          desc: 'Standard technical terms and fast implementation',
          instructions: 'Use standard Web API terms, clean ES6 signatures, and fast implementation steps using surgical method patches.'
        },
        3: {
          name: '🚀 Master Architect Mode',
          desc: 'Deep AST topology and performance architecture',
          instructions: 'Deliver AST-range patches, performance benchmarks, and multi-file project topologies.'
        }
      };
      return profiles[level] || profiles[1];
    }

  static async buildContextAwareTeacherPrompt(goalTitle, goalDesc) {
    const level = LunoGuideEngine.state.userScores.savviness || 1;
    const profile = LunoGuideEngine.getSkillProfile(level);

    let context = `🌙 LUNO AI MENTOR INSTRUCTION PACKET\n`;
    context += `Target Goal: "${goalTitle}"\n`;
    context += `Description: ${goalDesc}\n`;
    context += `Learner Profile: ${profile.name} (${profile.desc})\n`;
    context += `================================================================================\n\n`;

    context += `INSTRUCTIONS FOR AI TEACHER:\n`;
    context += `1. Act as my personal, patient 1-on-1 coding mentor in Luno Workspace.\n`;
    context += `2. Guide me step-by-step toward my goal ("${goalTitle}").\n`;
    context += `3. Give me 1 small visual/functional change at a time.\n`;
    context += `4. Provide all code updates using strict HTML Container directives:\n`;
    context += `   - For single method update: <script data-file="relative/path/to/file.js" data-method="Class.method" data-action="patch">\n`;
    context += `   - For full file write: <script data-file="relative/path/to/file.js">\n`;
    context += `5. End every lesson step with a quick 1-sentence question to verify my understanding!\n`;

    return context;
  }

    static async launchInteractiveWalkthrough(goalKey, goalTitle, goalDesc) {
      const targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
      const promptText = await LunoGuideEngine.buildInteractiveMentorPrompt(goalTitle, goalDesc, targetProj);
  
      if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
        OutboxQueue.addBundle(`🧠 AI Mentor Prompt: ${goalTitle} [${targetProj}]`, promptText, { priority: 'high' });
      }
  
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast(`Queued Mentor Prompt for [${targetProj}] to Outbox!`, 'success', '🧠');
      }
  
      LunoGuideEngine.showWalkthroughOverlay(goalTitle, targetProj);
    }

    static showWalkthroughOverlay(goalTitle, targetProj) {
      const existing = typeof document !== 'undefined' ? document.getElementById('luno-walkthrough-overlay') : null;
      if (existing) existing.remove();
      if (typeof document === 'undefined') return;
  
      const pName = targetProj || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
  
      const overlay = document.createElement('div');
      overlay.id = 'luno-walkthrough-overlay';
      overlay.style.cssText = [
        'position: fixed;',
        'bottom: 0.8rem;',
        'right: 0.8rem;',
        'width: 320px;',
        'max-width: 92vw;',
        'background: rgba(22, 27, 34, 0.96);',
        'border: 2px solid #00f2fe;',
        'border-radius: 12px;',
        'padding: 0.85rem;',
        'box-shadow: 0 8px 28px rgba(0, 242, 254, 0.35);',
        'z-index: 9990;',
        'font-family: monospace;',
        'color: #c9d1d9;',
        'display: flex;',
        'flex-direction: column;',
        'gap: 0.5rem;',
        'backdrop-filter: blur(8px);'
      ].join('\n');
  
      overlay.innerHTML = [
        '<div style="display:flex; justify-content:space-between; align-items:center;">',
        '  <strong style="color:#00f2fe; font-size:0.85rem; display:flex; align-items:center; gap:0.3rem;">🧠 AI Coding Mentor</strong>',
        '  <button id="btn-close-walk-overlay" style="background:#21262d; border:1px solid #30363d; color:#8b949e; border-radius:4px; cursor:pointer; font-size:0.75rem; padding:0.15rem 0.4rem;">✖</button>',
        '</div>',
        '<div style="font-size:0.75rem; font-weight:bold; color:#3fb950; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Project: [' + pName + '] - ' + (goalTitle || 'Active') + '</div>',
        '<div style="font-size:0.72rem; color:#8b949e; line-height:1.35;">',
        '  1. Tap <strong>Copy Outbox</strong> and paste to your AI.<br>',
        '  2. When the AI answers, tap <strong>Paste Inbox</strong>.',
        '</div>',
        '<div style="display:flex; gap:0.35rem; margin-top:0.2rem;">',
        '  <button id="btn-walk-copy-outbox" style="flex:1; padding:0.45rem; background:#8257e5; color:#fff; border:none; border-radius:6px; font-size:0.72rem; font-weight:bold; cursor:pointer; font-family:monospace;">📋 Copy Outbox</button>',
        '  <button id="btn-walk-paste-inbox" style="flex:1; padding:0.45rem; background:#238636; color:#fff; border:none; border-radius:6px; font-size:0.72rem; font-weight:bold; cursor:pointer; font-family:monospace;">📥 Paste Inbox</button>',
        '</div>'
      ].join('\n');
  
      document.body.appendChild(overlay);
  
      document.getElementById('btn-close-walk-overlay').onclick = () => overlay.remove();
      document.getElementById('btn-walk-copy-outbox').onclick = () => {
        if (typeof OutboxQueue !== 'undefined' && OutboxQueue.copyPackageToClipboard) {
          OutboxQueue.copyPackageToClipboard();
        }
      };
      document.getElementById('btn-walk-paste-inbox').onclick = () => {
        if (typeof ClientAppPaster !== 'undefined' && ClientAppPaster.pasteClipboard) {
          ClientAppPaster.pasteClipboard();
        }
      };
    }

  static async buildInteractiveMentorPrompt(goalTitle, goalDesc, targetProj) {
      const proj = targetProj || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
      const level = LunoGuideEngine.state.userScores.savviness || 1;
      const profile = LunoGuideEngine.getSkillProfile(level);
  
      let lunoMeta = {};
      try {
        if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
          const metaRes = await LunoApiClient.fetchFsRead('luno.json', proj);
          if (metaRes && metaRes.content) lunoMeta = JSON.parse(metaRes.content);
        }
      } catch (e) {}
  
      const scr = 'scr' + 'ipt';
  
      return [
        '================================================================================',
        '🌙 LUNO WORKSPACE - PROACTIVE INTERACTIVE AI MENTOR INSTRUCTIONS',
        '================================================================================',
        'You are collaborating with a learner/developer using Luno Workspace, a phone-first,',
        'browser-based coding environment that directly executes your output via clipboard.',
        '',
        `TARGET PROJECT: [${proj}] (${lunoMeta.description || 'Custom Web Application'})`,
        `LEARNER PROFILE: ${profile.name} - ${profile.desc}`,
        `TEACHING STYLE: ${profile.instructions}`,
        `USER'S GOAL: "${goalTitle || 'Build an application feature'}"`,
        goalDesc ? `GOAL DETAILS: ${goalDesc}` : '',
        '--------------------------------------------------------------------------------',
        '',
        '🧠 HOW LUNO WORKSPACE OPERATES:',
        '1. The user copies your response and taps "Paste from Chatbot" in Luno Workspace.',
        '2. Luno parses your response in browser JavaScript, extracts HTML containers, and applies',
        '   changes directly to disk or in-memory AST classes.',
        '3. When the user taps Preview, the app updates live inside an isolated iframe sandbox.',
        '4. Errors are surfaced immediately in glowing toast notifications and diagnostic banners.',
        '',
        '🎯 CRITICAL RESPONSE PROTOCOL:',
        '1. ENGLISH SANDWICH: Always write conversational explanations BEFORE opening your markdown code',
        '   fence, and conclude with a warm, encouraging check-in question AFTER the code fence.',
        '2. SINGLE CODE FENCE: Wrap ALL file creations, method patches, and server scripts in ONE ```html code block.',
        '3. STRICT PATH ANCHORING: Every data-file path MUST start with the project name:',
        `   <${scr} data-file="${proj}/src/App.js">`,
        '   Never write ambiguous bare paths like data-file="src/App.js".',
        '4. SURGICAL PATCHING: When updating a class method, update ONLY that method using:',
        `   <${scr} data-file="${proj}/src/App.js" data-method="App.methodName" data-action="patch">`,
        '   methodName() {',
        '     // Complete updated method...',
        '   }',
        `   </${scr}>`,
        '5. BE PROACTIVE: Do not overwhelm the user with 10 files at once. Give them ONE small, visible step,',
        '   then ask: "Tap Paste in Luno and tell me what you see on the screen!"',
        '================================================================================\n'
      ].filter(Boolean).join('\n');
    }
}

globalThis.LunoGuideEngine = LunoGuideEngine;
if (typeof module !== "undefined" && module.exports) module.exports = LunoGuideEngine;