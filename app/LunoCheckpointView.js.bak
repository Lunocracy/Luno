class LunoCheckpointView {
  constructor() {}

  static lastGitOutput = '';
  static lastConsolidationOutput = '';

  /**
   * ⚙️ METHOD: mountUI(container)
   * - Type: Static Method
   * - Modifier: async
   */
  static async mountUI(container) {
    if (!container) return;
    container.innerHTML = '';

    var m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          var el = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
          for (var i = 2; i < arguments.length; i++) {
            var c = arguments[i];
            if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        };

    var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';
    var pParam = targetProj ? ('&project=' + encodeURIComponent(targetProj)) : '';
    var uncommittedCount = (typeof ClientApp !== 'undefined' && ClientApp.uncommittedCount) || 0;

    // Read LunoPatchLog.html to check pending patch count for target project
    var pendingPatchesCount = 0;
    var patchLogContent = '';
    try {
      var plRes = await fetch('/api/fs/read?path=LunoPatchLog.html' + pParam);
      var plData = await plRes.json();
      if (plRes.ok && plData && plData.content) {
        patchLogContent = plData.content;
        var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
        if (parser && typeof parser.parsePatchLog === 'function') {
          var parsedPl = parser.parsePatchLog(patchLogContent);
          pendingPatchesCount = (parsedPl.files || []).length;
        } else if (parser && typeof parser.parse === 'function') {
          var parsedPl = parser.parse(patchLogContent);
          pendingPatchesCount = (parsedPl.files || []).length;
        }
      }
    } catch(e) {}

    var pendingNote = '';
    try {
      if (typeof localStorage !== 'undefined') {
        pendingNote = localStorage.getItem('luno_pending_checkpoint_desc') || '';
      }
      var mRes = await fetch('/api/fs/read?path=luno.json' + pParam);
      var mData = await mRes.json();
      if (mData && mData.content) {
        var meta = JSON.parse(mData.content);
        if (!pendingNote && meta.pendingCheckpointDescription && !meta.pendingCheckpointDescription.startsWith('Clean')) {
          pendingNote = meta.pendingCheckpointDescription;
        }
      }
    } catch(e) {}

    var recentLogText = '';
    try {
      var logScriptObj = {
        files: [],
        serverScript: [
          'const { execSync } = require("child_process");',
          'const root = LunoServer.resolveProjectBaseDir("' + targetProj + '");',
          'try { return execSync("git log -n 5 --oneline", { cwd: root, encoding: "utf8" }); }',
          'catch(e) { return "No recent git log available for " + root; }'
        ].join('\n'),
        project: targetProj
      };
      var logRes = await fetch('/api/save' + (targetProj ? ('?project=' + encodeURIComponent(targetProj)) : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logScriptObj)
      });
      var logData = await logRes.json();
      if (logData && logData.llmFeedback) {
        recentLogText = logData.llmFeedback.replace(/^⚡ SERVER SCRIPT OUTPUT:[\r\n]+(?:--- Return Value ---\s*)?/i, '').trim();
      }
    } catch(e) {}

    // STEP 1: Consolidation Control Panel Card
    var consolidationCard = m('div', {
      style: {
        background: '#0d1117',
        border: '2px solid ' + (pendingPatchesCount > 0 ? '#8257e5' : '#30363d'),
        borderRadius: '10px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        boxShadow: pendingPatchesCount > 0 ? '0 4px 16px rgba(130,87,229,0.25)' : 'none'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' } },
        m('strong', { style: { color: pendingPatchesCount > 0 ? '#d2a8ff' : '#8b949e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, 'STEP 1: 🧩 CONSOLIDATE PATCHES TO DISK'),
        m('span', {
          style: {
            fontSize: '0.72rem',
            fontWeight: 'bold',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            background: pendingPatchesCount > 0 ? '#271052' : '#161b22',
            color: pendingPatchesCount > 0 ? '#d2a8ff' : '#8b949e',
            border: '1px solid ' + (pendingPatchesCount > 0 ? '#8257e5' : '#30363d')
          }
        }, pendingPatchesCount + ' patch(es) pending for [' + targetProj + ']')
      ),
      m('p', { style: { color: '#8b949e', margin: 0, fontSize: '0.78rem', lineHeight: '1.4' } },
        'Client-side consolidation validates ES6 AST syntax, creates .bak sidecar backups, merges methods into ES6 class bodies, and resets LunoPatchLog.html.'
      ),
      m('button', {
        id: 'btn-consolidate-patches',
        style: {
          padding: '0.75rem',
          background: pendingPatchesCount > 0 ? '#8257e5' : '#21262d',
          color: pendingPatchesCount > 0 ? '#ffffff' : '#8b949e',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: pendingPatchesCount > 0 ? 'pointer' : 'default',
          fontFamily: 'monospace',
          boxShadow: pendingPatchesCount > 0 ? '0 4px 12px rgba(130,87,229,0.3)' : 'none'
        },
        onclick: async function() {
          if (pendingPatchesCount === 0) {
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('LunoPatchLog.html is already clean for [' + targetProj + ']!', 'info', 'ℹ️');
            }
            return;
          }

          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Validating AST syntax & consolidating patches...', 'info', '🧩');
          }

          try {
            var data = null;
            if (typeof LunoPatchConsolidator !== 'undefined' && LunoPatchConsolidator.consolidate) {
              data = await LunoPatchConsolidator.consolidate(targetProj);
            } else {
              throw new Error('LunoPatchConsolidator module is not loaded on client.');
            }

            if (data && data.success) {
              LunoCheckpointView.lastConsolidationOutput = '✅ Safely Consolidated ' + (data.consolidatedCount || 0) + ' patch(es) for [' + targetProj + '] across ' + (data.modifiedFiles ? data.modifiedFiles.length : 0) + ' file(s)!\nSidecar backups (.bak) created.\nModified Base Files:\n- ' + (data.modifiedFiles || []).join('\n- ');

              if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
                ClientApp.showToast('Consolidated ' + data.consolidatedCount + ' patch(es) into [' + targetProj + '] base files with .bak backups!', 'success', '✨');
              }
              LunoCheckpointView.mountUI(container);
            } else {
              alert('Consolidation Aborted: ' + (data ? data.error : 'Unknown error'));
            }
          } catch(e) {
            alert('Consolidation Error: ' + e.message);
          }
        }
      }, '🧩 Consolidate Pending Patches (' + pendingPatchesCount + ')'),

      LunoCheckpointView.lastConsolidationOutput ? m('pre', {
        style: { background: '#070a13', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.55rem', color: '#7ee787', fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 },
        textContent: LunoCheckpointView.lastConsolidationOutput
      }) : null
    );

    var card = m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #30363d',
        borderRadius: '12px',
        padding: '1.25rem',
        maxWidth: '680px',
        margin: '1rem auto',
        color: '#c9d1d9',
        fontFamily: 'monospace',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' } },
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' } },
          m('h2', { style: { color: '#f0f6fc', fontSize: '1.2rem', margin: 0 } }, '📸 Checkpoint Manager'),
          m('span', { style: { fontSize: '0.72rem', color: '#00f2fe', background: '#0d2d4a', border: '1px solid #0088cc', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' } }, 'Target: ' + targetProj)
        ),
        m('button', {
          style: { padding: '0.3rem 0.65rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
          onclick: function() {
            if (typeof localStorage !== 'undefined') localStorage.setItem('luno_active_dock_view', 'workspace');
            if (typeof LunoSpaDock !== 'undefined') LunoSpaDock.mountView('workspace');
          }
        }, '🏠 Workspace')
      ),

      consolidationCard,

      m('div', { style: { background: '#0d1117', border: '1px solid #238636', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem' } },
        m('strong', { style: { color: '#3fb950', display: 'block', marginBottom: '0.35rem' } }, '📊 Uncommitted Modifications for [' + targetProj + ']: ' + uncommittedCount + ' file(s)'),
        m('p', { style: { color: '#8b949e', margin: 0, lineHeight: '1.4' } },
          'Recording a Checkpoint creates a Git commit snapshot of the active target project directory.'
        )
      ),

      m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' } },
        m('label', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold' } }, 'STEP 2: 📸 Git Commit Note (Optional):'),
        m('input', {
          id: 'checkpoint-note-input',
          type: 'text',
          value: pendingNote,
          placeholder: 'e.g. Consolidated patch log and verified ES6 class migrations',
          style: { width: '100%', padding: '0.65rem', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }
        })
      ),

      m('button', {
        style: { padding: '0.85rem', background: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(35,134,54,0.3)' },
        onclick: async function() {
          var inp = document.getElementById('checkpoint-note-input');
          var note = inp ? inp.value.trim() : '';
          var desc = note || ('Checkpoint ' + new Date().toLocaleString());

          var outputCard = document.getElementById('checkpoint-output-card');
          var outputPre = document.getElementById('checkpoint-output-text');
          if (outputCard) outputCard.style.display = 'block';
          if (outputPre) {
            outputPre.style.color = '#00f2fe';
            outputPre.textContent = '⚡ Executing High-Speed Git Commit for [' + targetProj + ']...';
          }

          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Recording Git Checkpoint for ' + targetProj + '...', 'info', '📸');
          }

          try {
            var serverScriptObj = {
              files: [],
              serverScript: [
                'const { execSync } = require("child_process");',
                'const fs = require("fs");',
                'const path = require("path");',
                'const activeProjRoot = LunoServer.resolveProjectBaseDir("' + targetProj + '");',
                'const gitRoot = LunoServer.getGitRootDir();',
                'let commitMsg = "' + desc.replace(/"/g, '\\"') + '";',
                'let gitOutput = "";',
                'try {',
                '  const lockFile = path.join(gitRoot, ".git", "index.lock");',
                '  if (fs.existsSync(lockFile)) { try { fs.unlinkSync(lockFile); } catch(e){} }',
                '  gitOutput += "$ git add .\\n";',
                '  try { gitOutput += (execSync("git add .", { cwd: activeProjRoot, encoding: "utf8" }) || ""); } catch(e){}',
                '  gitOutput += "\\n$ git commit -m \\"" + commitMsg + "\\" --allow-empty\\n";',
                '  gitOutput += (execSync(`git commit -m "${commitMsg}" --allow-empty`, { cwd: gitRoot, encoding: "utf8" }) || "");',
                '  gitOutput += "\\n$ git log -1 --stat\\n";',
                '  gitOutput += (execSync("git log -1 --stat", { cwd: gitRoot, encoding: "utf8" }) || "");',
                '  const lunoJsonPath = path.join(activeProjRoot, "luno.json");',
                '  if (fs.existsSync(lunoJsonPath)) {',
                '    const meta = JSON.parse(fs.readFileSync(lunoJsonPath, "utf8"));',
                '    meta.processedCountSinceCheckpoint = 0;',
                '    meta.lastCheckpointTime = new Date().toISOString();',
                '    meta.pendingCheckpointDescription = "Clean working tree";',
                '    fs.writeFileSync(lunoJsonPath, JSON.stringify(meta, null, 2), "utf8");',
                '  }',
                '  return gitOutput.trim();',
                '} catch(e) { return "❌ Git Checkpoint Error:\\n" + (e.stdout || "") + "\\n" + (e.stderr || e.message); }'
              ].join('\n'),
              project: targetProj
            };

            var res = await fetch('/api/save' + (targetProj ? ('?project=' + encodeURIComponent(targetProj)) : ''), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(serverScriptObj)
            });
            var data = await res.json();

            var rawGitText = (data && data.llmFeedback)
              ? data.llmFeedback.replace(/^⚡ SERVER SCRIPT OUTPUT:[\r\n]+(?:--- Return Value ---\s*)?/i, '').trim()
              : 'Checkpoint created cleanly.';

            LunoCheckpointView.lastGitOutput = rawGitText;

            if (outputPre) {
              outputPre.style.color = '#7ee787';
              outputPre.textContent = rawGitText;
            }

            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('luno_pending_checkpoint_desc');
            }

            if (typeof ClientApp !== 'undefined') {
              ClientApp.showToast('Snapshot Recorded for ' + targetProj + '!', 'success', '📸');
              ClientApp.uncommittedCount = 0;
              await ClientApp.fetchCodebaseMetrics();
            }
            if (inp) inp.value = '';
          } catch(e) {
            if (outputPre) {
              outputPre.style.color = '#ff7b72';
              outputPre.textContent = '❌ Network Error: ' + e.message;
            }
          }
        }
      }, '📸 Create Git Checkpoint'),

      m('div', {
        id: 'checkpoint-output-card',
        style: {
          background: '#0d1117',
          border: '1px solid #00f2fe',
          borderRadius: '8px',
          padding: '0.85rem',
          display: LunoCheckpointView.lastGitOutput ? 'block' : 'none'
        }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', borderBottom: '1px solid #30363d', paddingBottom: '0.3rem' } },
          m('span', { style: { fontWeight: 'bold', color: '#00f2fe', fontSize: '0.78rem' } }, '⚡ Git Terminal Output & Response:'),
          m('button', {
            style: { padding: '0.3rem 0.65rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
            onclick: function() {
              var text = LunoCheckpointView.lastGitOutput || (document.getElementById('checkpoint-output-text') ? document.getElementById('checkpoint-output-text').textContent : '');
              if (text && typeof OutboxQueue !== 'undefined') {
                OutboxQueue.addBundle('Git Checkpoint Response', text, { priority: 'high' });
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
                  ClientApp.showToast('Sent Git Response to Outbox!', 'success', '📤');
                }
              }
            }
          }, '📤 Send Output to Outbox')
        ),
        m('pre', {
          id: 'checkpoint-output-text',
          style: { background: '#070a13', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.65rem', color: '#7ee787', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto', margin: 0 },
          textContent: LunoCheckpointView.lastGitOutput || ''
        })
      ),

      m('div', { style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' } },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          m('strong', { style: { color: '#d2a8ff', fontSize: '0.82rem' } }, '📜 Recent Git Checkpoint History:'),
          m('button', {
            style: { padding: '0.2rem 0.5rem', background: '#161b22', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
            onclick: function() {
              if (recentLogText && typeof OutboxQueue !== 'undefined') {
                OutboxQueue.addBundle('Git Commit History Log', recentLogText);
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Sent Commit Log to Outbox!', 'success', '📤');
              }
            }
          }, '📤 Send Log to Outbox')
        ),
        m('pre', {
          style: { background: '#070a13', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.55rem', color: '#8b949e', fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 },
          textContent: recentLogText || 'No git commit history found.'
        })
      )
    );

    container.appendChild(card);
  }
}

globalThis.LunoCheckpointView = LunoCheckpointView;
if (typeof module !== "undefined" && module.exports) module.exports = LunoCheckpointView;