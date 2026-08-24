class BookmarkletPresets {
  constructor() {}

  static getPresets() {
    return [
      {
        id: 'aistudio_relay',
        title: '🤖 Google AI Studio Relay & Collapser Bridge',
        desc: 'Connects AI Studio to Luno Workspace (localhost:8080) with 1-tap Send to Inbox and collapsible code widgets.',
        source: `(function(){
          if(window.__LUNO_RELAY_ACTIVE__) return;
          window.__LUNO_RELAY_ACTIVE__ = true;

          var HOST_ORIGIN = "http://localhost:8080";
          var REGISTRY = new Map();

          function computeFp(txt){
            if(!txt) return "";
            var t = txt.trim();
            return "fp_" + t.length + "_" + t.slice(0, 20).replace(/\\s+/g, "");
          }

          function sendToLuno(rawText, fp){
            var win = window.opener || window.parent;
            if(win && typeof win.postMessage === 'function'){
              win.postMessage({
                type: 'LUNO_SEND_INBOX',
                target: 'aistudio.google.com',
                timestamp: new Date().toISOString(),
                payload: { rawText: rawText, fingerprint: fp }
              }, '*');
            }
          }

          function wrapBlock(el){
            if(el.__lunoWrapped__) return;
            el.__lunoWrapped__ = true;

            var raw = el.innerText || el.textContent || '';
            if(!raw || raw.length < 15) return;

            var isContainer = /<(script|style|template|svg)\\b/i.test(raw);
            var isJs = isContainer || /\\b(const|let|var|function|class|import|export|async)\\b/.test(raw);
            if(!isJs) return;

            var fp = computeFp(raw);
            var lines = raw.split('\\n').length;

            var header = document.createElement('div');
            header.style.cssText = 'background:#0d1117; border:2px solid #00f2fe; padding:4px 8px; font-family:monospace; font-size:11px; color:#00f2fe; font-weight:bold; display:flex; justify-content:space-between; align-items:center; margin-top:6px;';
            header.innerHTML = '<span>⚡ ' + (isContainer ? 'Luno HTML Container' : 'JS Code Block') + ' (' + lines + ' lines)</span>';

            var btn = document.createElement('button');
            btn.textContent = '📥 Send to Luno Inbox';
            btn.style.cssText = 'background:#238636; color:#fff; border:none; border-radius:4px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:bold; font-family:monospace;';
            btn.onclick = function(e){
              e.stopPropagation();
              sendToLuno(raw, fp);
              btn.textContent = '✓ Sent!';
              setTimeout(function(){ btn.textContent = '📥 Send to Luno Inbox'; }, 1800);
            };

            header.appendChild(btn);
            if(el.parentNode){
              el.parentNode.insertBefore(header, el);
            }
          }

          function scan(){
            var blocks = document.querySelectorAll('ms-code-block, pre');
            for(var i = 0; i < blocks.length; i++){
              wrapBlock(blocks[i]);
            }
          }

          scan();
          var observer = new MutationObserver(function(){ scan(); });
          observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
          console.log('[Luno] AI Studio Relay Active');
        })();`
      }
    ];
  }
}

globalThis.BookmarkletPresets = BookmarkletPresets;
if (typeof module !== "undefined" && module.exports) module.exports = BookmarkletPresets;