class AiStudioRelayDocs {
  constructor() {}

  static getOverviewSection() {
    return [
      '=== 🤖 Google AI Studio Relay & Collapsible Suite Overview ===',
      'The Luno <-> Google AI Studio Communication & Collapser Suite connects Luno Workspace (localhost:8080)',
      'with Google AI Studio (aistudio.google.com) over a cross-domain postMessage bridge.',
      '',
      'Key Capabilities:',
      '- 1-Tap Outbox -> AI Studio prompt injection via synthetic Angular/Lit DOM events.',
      '- Automatic detection & filtering of JavaScript/TypeScript code blocks in Gemini responses.',
      '- Collapsible code widget wrapping with preview shims, 5-line text snippets, and line counters.',
      '- User Prompt Collapsing: Shrinks massive codebase prompt transfers into compact orange preview bars.',
      '- Response Turn Grouping: Groups all code blocks in an Assistant turn with a 1-tap bulk inbox dispatch.'
    ].join('\n');
  }

  static getMobileAndroidArchSection() {
    return [
      '=== 📱 Mobile & Performance Architecture (Preview Shims) ===',
      'To prevent layout lag and memory bloat on mobile browsers (Kiwi, Chrome on Android):',
      '- Collapsed elements are hidden using "display: none !important" rather than expensive height animations.',
      '- A lightweight plain-text shim (.luno-shim-base) renders a 5-line snippet preview.',
      '- Heavy processing (Acorn AST parsing, syntax validation, file patching) remains inside Luno client memory.',
      '- Target-side bookmarklet performs fast regex classification and postMessage dispatching.'
    ].join('\n');
  }

  static getPromptCollapsingSection() {
    return [
      '=== ✍️ User Prompt Collapsing (PromptCollapserWidget) ===',
      'Large codebase prompts in AI Studio consume massive vertical screen real estate:',
      '- PromptCollapserWidget scans user turn containers (ms-prompt-chunk, div[data-turn-role="User"]).',
      '- Applies a distinctive orange preview bar (border: 2px solid #d35400) with a 1-line text preview.',
      '- Collapses prompts by default while preserving instant 1-tap expansion.',
      '- State choices are persisted in localStorage under luno_prompt_states_v1.'
    ].join('\n');
  }

  static getResponseGroupingSection() {
    return [
      '=== 🤖 Assistant Response Turn Grouping (ResponseGroupWidget) ===',
      'When Gemini outputs multiple code blocks across a single response turn:',
      '- ResponseGroupWidget identifies the Assistant turn (ms-chat-turn, .agent-turn).',
      '- Applies a subtle purple turn container outline (outline: 1px solid #8257e5).',
      '- Injects a top-level group bar showing block count and total line metrics.',
      '- Adds a 1-tap "[📥 Send All Turn Code to Inbox]" button to transmit all blocks in a single payload.'
    ].join('\n');
  }

  static getVirtualizationSection() {
    return [
      '=== 🔄 Scroll Virtualization & State Persistence ===',
      'Google AI Studio uses virtualized scrolling (Lit/Angular unmounts off-screen DOM nodes):',
      '- Fingerprinting Engine calculates a hash: fp_lines_length_head_tail.',
      '- Registered in window.__LUNO_BLOCK_REGISTRY__ to prevent duplicate queue items on scroll.',
      '- Collapse states (isCollapsed) persist across scroll cycles and page reloads via localStorage.'
    ].join('\n');
  }

  static getBlockLifecycleSyncSection() {
    return [
      '=== ⚡ Bi-Directional Block Lifecycle Sync (LUNO_BLOCK_APPLIED) ===',
      'Tracks when code snippets have been saved to disk:',
      '- When Luno applies a payload to disk, Luno broadcasts LUNO_BLOCK_APPLIED to AI Studio.',
      '- AiStudioQueue updates the target registry (isApplied = true).',
      '- Widget UI updates its status to [✓ Applied to Disk].',
      '- Luno Relay Inspector displays a green [✓ APPLIED] badge next to consumed items.'
    ].join('\n');
  }

  static getProtocolSection() {
    return [
      '=== 📡 Protocol Message Schema ===',
      'All cross-window communication uses structured LunoRelayProtocol envelopes:',
      '- LUNO_PING / LUNO_PONG: Heartbeat ping.',
      '- LUNO_CMD_SCAN: Command from Host to force target DOM scan.',
      '- LUNO_CMD_GET_QUEUE: Request list of queued JS code blocks.',
      '- LUNO_CODE_DISCOVERED: Target notifies Host of newly discovered JS blocks.',
      '- LUNO_QUEUE_RESPONSE: Target sends queued code blocks to Host.',
      '- LUNO_SEND_INBOX: Target sends code snippet or group payload directly to Luno Inbox.',
      '- LUNO_OUTBOX_NOTIFY: Host notifies Target that Outbox package is ready.',
      '- LUNO_BLOCK_APPLIED: Host notifies Target that a block fingerprint was saved to disk.'
    ].join('\n');
  }

  static renderDocCard() {
    const m = (tag, attrs, ...children) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...children);
      }
      const el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const sections = [
      AiStudioRelayDocs.getOverviewSection(),
      AiStudioRelayDocs.getMobileAndroidArchSection(),
      AiStudioRelayDocs.getPromptCollapsingSection(),
      AiStudioRelayDocs.getResponseGroupingSection(),
      AiStudioRelayDocs.getVirtualizationSection(),
      AiStudioRelayDocs.getBlockLifecycleSyncSection(),
      AiStudioRelayDocs.getProtocolSection()
    ];

    const card = m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #00f2fe',
        borderRadius: '8px',
        padding: '1rem',
        marginTop: '0.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 16px rgba(0,242,254,0.15)'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #30363d', paddingBottom: '0.4rem' } },
        m('h3', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: 0 } }, '🤖 Google AI Studio Relay & Collapsible Widget Suite'),
        m('span', { style: { fontSize: '0.7rem', color: '#00f2fe', background: '#00f2fe22', border: '1px solid #00f2fe', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' } }, 'v2.0 Architecture')
      ),
      ...sections.map(sec => m('pre', {
        style: {
          background: '#0d1117',
          border: '1px solid #21262d',
          borderRadius: '6px',
          padding: '0.75rem',
          color: '#c9d1d9',
          fontSize: '0.78rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          marginBottom: '0.75rem',
          lineHeight: '1.45'
        }
      }, sec))
    );

    return card;
  }
}

globalThis.AiStudioRelayDocs = AiStudioRelayDocs;
if (typeof module !== "undefined" && module.exports) module.exports = AiStudioRelayDocs;