class DiffApprovalModal {
  constructor() {

  }

  static escapeHtml(str) {

    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }
  static open(options) {

    options = options || {};
    const existing = typeof document !== 'undefined' ? document.getElementById('luno-diff-approval-modal') : null;
    if (existing) existing.remove();

    const payloadText = options.payloadText || '';
    const oldCode = options.oldCode || '';
    const newCode = options.newCode || '';
    const onConfirm = options.onConfirm || (() => {});
    const onCancel = options.onCancel || (() => {});

    // Parse HTML Containers via LunoPayloadParser (Legacy comment headers are dead!)
    const parsed = typeof LunoPayloadParser !== 'undefined' && LunoPayloadParser.parse
      ? LunoPayloadParser.parse(payloadText)
      : { files: [], serverScript: '' };

    const hasServerScript = Boolean(parsed.serverScript);
    const targetCount = parsed.files.length || (payloadText.trim() ? 1 : 0);
    const methodTargets = parsed.files.filter(f => f.methodSpec || f.action === 'patch');
    const lines = payloadText.split('\n').length;

    const overlay = document.createElement('div');
    overlay.id = 'luno-diff-approval-modal';
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9500; font-family:monospace; padding:1rem;';

    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-secondary, #161b22); border:2px solid ' + (hasServerScript ? '#e3b341' : '#238636') + '; border-radius:12px; padding:1.25rem; max-width:600px; width:100%; max-height:88vh; display:flex; flex-direction:column; gap:0.75rem; box-shadow:0 12px 32px rgba(0,0,0,0.7);';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #30363d; padding-bottom:0.5rem;';
    header.innerHTML = `
      <div style="color:${hasServerScript ? '#e3b341' : '#3fb950'}; font-weight:bold; font-size:1.1rem; display:flex; align-items:center; gap:0.4rem;">
        ${hasServerScript ? '⚡ Inspect Privileged Server Script & Payload' : '🔍 Inspect Pending Payload Changes'}
      </div>
      <button id="btn-close-diff-modal" style="background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer;">✖</button>
    `;

    let serverWarningBanner = '';
    if (hasServerScript) {
      serverWarningBanner = `
        <div style="background:#271c00; border:2px solid #e3b341; color:#f0e68c; padding:0.65rem 0.85rem; border-radius:8px; font-size:0.78rem; line-height:1.4;">
          <strong>⚡ PRIVILEGED OPERATION: Server Execution Script Detected</strong><br>
          This payload contains server-side JavaScript that will execute with full local Node.js process and filesystem access.
        </div>
      `;
    }

    const metricsBar = document.createElement('div');
    metricsBar.style.cssText = 'background:#0d1117; border:1px solid #30363d; padding:0.65rem; border-radius:6px; font-size:0.8rem; color:#c9d1d9; display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.4rem;';

    const paceStr = (typeof ClientApp !== 'undefined' && ClientApp.executionPace === 'fast') ? '⚡ Power Through' : '🐢 Methodical';
    metricsBar.innerHTML = `
      <span>🎯 <strong>${targetCount}</strong> HTML container target(s) ${methodTargets.length > 0 ? `<span style="color:#00f2fe;">(${methodTargets.length} surgical patch)</span>` : ''}</span>
      <span>📄 <strong>${lines}</strong> line(s)</span>
      <span style="color:#58a6ff;">Pace: <strong>${paceStr}</strong></span>
    `;

    const diffBox = document.createElement('pre');
    diffBox.style.cssText = 'background:#070a13; border:1px solid #1e293b; border-radius:6px; padding:0.75rem; color:#7ee787; font-size:0.78rem; overflow-y:auto; flex:1; max-height:260px; white-space:pre-wrap; word-break:break-all;';

    let previewLinesHtml = '';
    if (oldCode && newCode && typeof CodeDiffer !== 'undefined') {
      const spans = CodeDiffer.diff(oldCode, newCode);
      previewLinesHtml = spans.map(s => {
        const escaped = DiffApprovalModal.escapeHtml(s.lines.join('\n'));
        if (s.type === 'add') return `<span style="color:#3fb950; background:#0d2818;">+ ${escaped}</span>`;
        if (s.type === 'delete') return `<span style="color:#f85149; background:#3c1418;">- ${escaped}</span>`;
        return escaped;
      }).join('\n');
    } else {
      previewLinesHtml = payloadText.split('\n').slice(0, 40).map(line => {
        const escaped = DiffApprovalModal.escapeHtml(line);
        if (line.startsWith('+')) return `<span style="color:#3fb950; background:#0d2818;">${escaped}</span>`;
        if (line.startsWith('-')) return `<span style="color:#f85149; background:#3c1418;">${escaped}</span>`;
        if (line.includes('data-action="run-server"')) return `<span style="color:#e3b341; font-weight:bold; background:#271c00;">${escaped}</span>`;
        if (line.includes('data-method=')) return `<span style="color:#00f2fe; font-weight:bold;">${escaped}</span>`;
        if (line.includes('data-file=')) return `<span style="color:#58a6ff; font-weight:bold;">${escaped}</span>`;
        return escaped;
      }).join('\n');
    }

    diffBox.innerHTML = previewLinesHtml + (lines > 40 ? `\n<span style="color:#8b949e;">... (${lines - 40} more lines omitted)</span>` : '');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:0.5rem; flex-wrap:wrap;';

    const btnApply = document.createElement('button');
    btnApply.className = 'btn-primary';
    btnApply.style.cssText = 'flex:1; padding:0.7rem; font-weight:bold; background:' + (hasServerScript ? '#b58105' : '#238636') + '; color:#fff; border:none; border-radius:6px; cursor:pointer;';
    btnApply.textContent = hasServerScript ? '⚡ Authorize & Execute Server Script' : '⚡ Apply Payload Now';
    btnApply.onclick = () => {
      overlay.remove();
      onConfirm();
    };

    const btnAbort = document.createElement('button');
    btnAbort.className = 'btn-secondary';
    btnAbort.style.cssText = 'flex:1; padding:0.7rem; background:#21262d; color:#f85149; border:1px solid #da3633; border-radius:6px; cursor:pointer; font-weight:bold;';
    btnAbort.textContent = '❌ Abort Action';
    btnAbort.onclick = () => {
      overlay.remove();
      onCancel();
    };

    btnRow.appendChild(btnApply);
    btnRow.appendChild(btnAbort);

    card.appendChild(header);
    if (serverWarningBanner) {
      const bannerDiv = document.createElement('div');
      bannerDiv.innerHTML = serverWarningBanner;
      card.appendChild(bannerDiv);
    }
    card.appendChild(metricsBar);
    card.appendChild(diffBox);
    card.appendChild(btnRow);
    overlay.appendChild(card);

    document.body.appendChild(overlay);

    document.getElementById('btn-close-diff-modal').onclick = () => {
      overlay.remove();
      onCancel();
    };

  }
}

globalThis.DiffApprovalModal = DiffApprovalModal;
if (typeof module !== "undefined" && module.exports) module.exports = DiffApprovalModal;