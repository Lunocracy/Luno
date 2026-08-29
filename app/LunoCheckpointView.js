class LunoCheckpointView {
  constructor() {}

  static lastGitOutput = '';

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

    var isServerMode = (typeof LunoFileSystem !== 'undefined') ? (LunoFileSystem.getActiveMode() === 'server') : true;

    if (!isServerMode) {
      var staticNoticeCard = m('div', {
        style: {
          background: '#161b22',
          border: '2px solid #58a6ff',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '640px',
          margin: '2rem auto',
          color: '#c9d1d9',
          fontFamily: 'monospace',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center'
        }
      },
        m('h2', { style: { color: '#58a6ff', fontSize: '1.25rem', margin: 0 } }, '📸 Git Checkpoint Manager'),
        m('div', { style: { background: '#0d1117', border: '1px solid #30363d', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', lineHeight: '1.5', textAlign: 'left' } },
          m('strong', { style: { color: '#00f2fe', display: 'block', marginBottom: '0.5rem' } }, 'ℹ️ Server-Only Feature:'),
          'Git snapshots, staging, and commits require local Node.js process and filesystem access.',
          m('br'),
          m('br'),
          'You are currently running in ',
          m('strong', { style: { color: '#3fb950' } }, 'IndexedDB / Static Hosting Mode'),
          '. All your files, edits, and template creations are being saved directly in your browser\'s persistent virtual storage.',
          m('br'),
          m('br'),
          'To record snapshots directly into Git repositories, run Luno with Node.js on your local machine (http://localhost:8080).'
        ),
        m('button', {
          style: { padding: '0.65rem 1.2rem', background: '#21262d', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', alignSelf: 'center' },
          onclick: function() {
            if (typeof LunoSpaDock !== 'undefined') LunoSpaDock.mountView('workspace');
          }
        }, '🏠 Return to Workspace')
      );
      container.appendChild(staticNoticeCard);
      return;
    }

    var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';
    var pParam = targetProj ? ('&project=' + encodeURIComponent(targetProj)) : '';
    var uncommittedCount = (typeof ClientApp !== 'undefined' && ClientApp.uncommittedCount) || 0;

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

    var projectSelect = m('select', {
      style: { background: '#0d1117', color: '#00f2fe', border: '1px solid #00f2fe', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer' },
      onchange: function(e) {
        if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
          ClientApp.setTargetProject(e.target.value);
        }
        LunoCheckpointView.mountUI(container);
      }
    }, m('option', { value: targetProj }, '📁 ' + targetProj));

    setTimeout(async function() {
      try {
        if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchProjectsList) {
          var pData = await LunoApiClient.fetchProjectsList();
          if (pData && Array.isArray(pData.projects)) {
            projectSelect.innerHTML = '';
            pData.projects.forEach(function(p) {
              if (p.isLibrary || p.name === 'Library') return;
              var opt = document.createElement('option');
              opt.value = p.name;
              opt.textContent = '📁 ' + p.name + (p.name === 'Luno' ? ' (Core)' : '');
              if (p.name === targetProj) opt.selected = true;
              projectSelect.appendChild(opt);
            });
          }
        }
      } catch (e) {}
    }, 40);

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
          projectSelect
        ),
        m('button', {
          style: { padding: '0.3rem 0.65rem', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
          onclick: function() {
            if (typeof localStorage !== 'undefined') localStorage.setItem('luno_active_dock_view', 'workspace');
            if (typeof LunoSpaDock !== 'undefined') LunoSpaDock.mountView('workspace');
          }
        }, '🏠 Workspace')
      ),

      m('div', { style: { background: '#0d1117', border: '1px solid #238636', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem' } },
        m('strong', { style: { color: '#3fb950', display: 'block', marginBottom: '0.35rem' } }, '📊 Uncommitted Modifications for [' + targetProj + ']: ' + uncommittedCount + ' file(s)'),
        m('p', { style: { color: '#8b949e', margin: 0, lineHeight: '1.4' } },
          'Creates a clean Git snapshot tagged for [' + targetProj + '] and automatically purges temporary backup files.'
        )
      ),

      m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' } },
        m('label', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold' } }, 'Git Commit Note:'),
        m('input', {
          id: 'checkpoint-note-input',
          type: 'text',
          value: pendingNote,
          placeholder: 'e.g. [' + targetProj + '] Updated modules and verified tests',
          style: { width: '100%', padding: '0.65rem', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }
        })
      ),

      m('button', {
        style: { padding: '0.85rem', background: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(35,134,54,0.3)' },
        onclick: async function() {
          var inp = document.getElementById('checkpoint-note-input');
          var note = inp ? inp.value.trim() : '';
          var desc = note || ('[' + targetProj + '] Checkpoint ' + new Date().toLocaleString());

          var outputCard = document.getElementById('checkpoint-output-card');
          var outputPre = document.getElementById('checkpoint-output-text');
          if (outputCard) outputCard.style.display = 'block';
          if (outputPre) {
            outputPre.style.color = '#00f2fe';
            outputPre.textContent = '⚡ Recording Clean Git Checkpoint for [' + targetProj + ']...';
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
                '  function deleteBakFiles(dir) {',
                '    if (!fs.existsSync(dir)) return;',
                '    const list = fs.readdirSync(dir);',
                '    for (const item of list) {',
                '      if (item === "node_modules" || item === ".git") continue;',
                '      const full = path.join(dir, item);',
                '      if (fs.statSync(full).isDirectory()) deleteBakFiles(full);',
                '      else if (item.endsWith(".bak")) { try { fs.unlinkSync(full); } catch(e){} }',
                '    }',
                '  }',
                '  deleteBakFiles(activeProjRoot);',
                '  const lockFile = path.join(gitRoot, ".git", "index.lock");',
                '  if (fs.existsSync(lockFile)) { try { fs.unlinkSync(lockFile); } catch(e){} }',
                '  gitOutput += "$ git add -A\\n";',
                '  try { gitOutput += (execSync("git add -A", { cwd: activeProjRoot, encoding: "utf8" }) || ""); } catch(e){}',
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

            var res = await fetch('/api/save?project=' + encodeURIComponent(targetProj), {
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

            if (typeof ClientApp !== 'undefined') {
              ClientApp.showToast('Clean Snapshot Recorded for ' + targetProj + '!', 'success', '📸');
              ClientApp.uncommittedCount = 0;
              await ClientApp.fetchCodebaseMetrics();
            }
            if (inp) inp.value = '';
          } catch(e) {
            if (outputPre) {
              outputPre.style.color = '#ff7b72';
              outputPre.textContent = '❌ Error: ' + e.message;
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
          m('span', { style: { fontWeight: 'bold', color: '#00f2fe', fontSize: '0.78rem' } }, '⚡ Git Output:'),
          m('button', {
            style: { padding: '0.3rem 0.65rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
            onclick: function() {
              var text = LunoCheckpointView.lastGitOutput || (document.getElementById('checkpoint-output-text') ? document.getElementById('checkpoint-output-text').textContent : '');
              if (text && typeof OutboxQueue !== 'undefined') {
                OutboxQueue.addBundle('Git Checkpoint Output', text, { priority: 'high' });
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
      )
    );

    container.appendChild(card);
  }
}

globalThis.LunoCheckpointView = LunoCheckpointView;
if (typeof module !== "undefined" && module.exports) module.exports = LunoCheckpointView;