class MicroApprovalBadge {
  constructor() {

  }

  static calculateMetrics(payloadText) {

    payloadText = payloadText || '';
    if (!payloadText || typeof payloadText !== 'string') {
      return { targets: 0, methodPatches: 0, methodDeletions: 0, serverScripts: 0, contextRequests: 0, additions: 0, deletions: 0, totalLines: 0, isUnifiedDiff: false };
    }

    const parsed = typeof LunoPayloadParser !== 'undefined' && LunoPayloadParser.parse
      ? LunoPayloadParser.parse(payloadText)
      : { files: [], serverScript: '', requests: [] };

    const lines = payloadText.split('\n');
    const methodPatches = parsed.files.filter(f => f.methodSpec || f.action === 'patch').length;
    const methodDeletions = parsed.files.filter(f => f.action === 'delete').length;
    const serverScripts = parsed.serverScript ? 1 : 0;
    const contextRequests = parsed.requests ? parsed.requests.length : 0;
    const targets = parsed.files.length || (payloadText.trim() ? 1 : 0);

    let additions = 0, deletions = 0;
    const isUnifiedDiff = payloadText.includes('diff --git') || /@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/.test(payloadText);

    if (isUnifiedDiff) {
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) additions++;
        else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
      }
    }

    return {
      targets,
      methodPatches,
      methodDeletions,
      serverScripts,
      contextRequests,
      additions,
      deletions,
      totalLines: lines.length,
      isUnifiedDiff
    };

  }
  static renderInlineBadge(payloadText, containerId) {

    containerId = containerId || 'inbox-metrics-badge';
    const el = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
    if (!el) return;

    const m = MicroApprovalBadge.calculateMetrics(payloadText);
    const badges = [];

    if (m.targets > 0) {
      badges.push(`<span style="color:#58a6ff; font-weight:bold;">🎯 ${m.targets} target(s)</span>`);
    }
    if (m.methodPatches > 0) {
      badges.push(`<span style="color:#00f2fe; font-weight:bold;">✂️ ${m.methodPatches} HTML patch</span>`);
    }
    if (m.methodDeletions > 0) {
      badges.push(`<span style="color:#ff7b72; font-weight:bold;">🗑️ ${m.methodDeletions} deletion</span>`);
    }
    if (m.serverScripts > 0) {
      badges.push(`<span style="color:#e3b341; font-weight:bold;">⚡ ${m.serverScripts} server script</span>`);
    }
    if (m.contextRequests > 0) {
      badges.push(`<span style="color:#a371f7; font-weight:bold;">🧠 ${m.contextRequests} context req</span>`);
    }

    let lineStats = `<span style="color:#8b949e;">📄 ${m.totalLines} lines</span>`;
    if (m.isUnifiedDiff && (m.additions > 0 || m.deletions > 0)) {
      lineStats = `<span style="color:#3fb950; font-weight:bold;">+${m.additions}</span> <span style="color:#f85149; font-weight:bold;">-${m.deletions}</span> <span style="color:#8b949e;">(${m.totalLines} lines)</span>`;
    }

    el.innerHTML = `
      <span style="display:inline-flex; align-items:center; gap:0.4rem; background:#0d1117; border:1px solid #30363d; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.72rem; font-family:monospace; flex-wrap:wrap;">
        ${badges.join('<span style="color:#30363d;">|</span>')}
        ${badges.length > 0 ? '<span style="color:#30363d;">|</span>' : ''}
        ${lineStats}
      </span>
    `;

  }
}

globalThis.MicroApprovalBadge = MicroApprovalBadge;
if (typeof module !== "undefined" && module.exports) module.exports = MicroApprovalBadge;