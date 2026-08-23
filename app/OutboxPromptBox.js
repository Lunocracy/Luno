class OutboxPromptBox {
  constructor() {}

  static setupFloatingPromptDrag(card, titleBar, isCompact, savedGeo) {
    var isDragging = false;
    var startX = 0, startY = 0, origLeft = 0, origTop = 0;

    var startDrag = function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.classList.contains('luno-resize-handle')) return;
      isDragging = true;
      titleBar.style.cursor = 'grabbing';
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      startX = evt.clientX;
      startY = evt.clientY;
      origLeft = card.offsetLeft;
      origTop = card.offsetTop;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    var doDrag = function(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      var dx = evt.clientX - startX;
      var dy = evt.clientY - startY;

      var minLeft = 30 - card.offsetWidth;
      var maxLeft = window.innerWidth - 30;
      var minTop = 0;
      var maxTop = window.innerHeight - 30;

      var newLeft = Math.max(minLeft, Math.min(maxLeft, origLeft + dx));
      var newTop = Math.max(minTop, Math.min(maxTop, origTop + dy));
      card.style.left = newLeft + 'px';
      card.style.top = newTop + 'px';
    };

    var stopDrag = function() {
      if (!isDragging) return;
      isDragging = false;
      titleBar.style.cursor = 'grab';
      var geo = {};
      try { geo = JSON.parse(localStorage.getItem('luno_prompt_box_geo') || '{}'); } catch(e){}
      geo.top = card.offsetTop;
      geo.left = card.offsetLeft;
      try { localStorage.setItem('luno_prompt_box_geo', JSON.stringify(geo)); } catch(e){}
    };

    titleBar.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    titleBar.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag);
    window.addEventListener('touchend', stopDrag);
  }

  static promptWriteNoteModal(initialText, editingItemId) {
    if (typeof document === 'undefined') return;
    var existing = document.getElementById('luno-floating-prompt-box');
    var savedDraft = (typeof localStorage !== 'undefined' && localStorage.getItem('luno_prompt_draft_text')) || '';
    var textToLoad = initialText || savedDraft;

    if (existing) {
      existing.style.display = 'flex';
      var input = document.getElementById('floating-prompt-input');
      if (input && textToLoad) input.value = textToLoad;
      existing.dataset.editingItemId = editingItemId || '';
      var btnAdd = existing.querySelector('#btn-add-prompt-outbox');
      if (btnAdd) btnAdd.textContent = editingItemId ? 'Save Changes to Outbox' : 'Add to Outbox';
      return;
    }

    var savedGeo = { top: 80, left: 20, width: 340, height: 280 };
    try {
      var raw = localStorage.getItem('luno_prompt_box_geo');
      if (raw) savedGeo = Object.assign(savedGeo, JSON.parse(raw));
    } catch(e){}

    var boxH = savedGeo.height || 280;
    var boxW = savedGeo.width || 340;
    var boxT = savedGeo.top !== undefined ? savedGeo.top : 80;
    var boxL = savedGeo.left !== undefined ? savedGeo.left : 20;

    var card = document.createElement('div');
    card.id = 'luno-floating-prompt-box';
    card.dataset.editingItemId = editingItemId || '';
    card.style.cssText = [
      'position: fixed;',
      'top: ' + boxT + 'px;',
      'left: ' + boxL + 'px;',
      'width: ' + boxW + 'px;',
      'height: ' + boxH + 'px;',
      'min-width: 240px;',
      'min-height: 110px;',
      'background: rgba(22, 27, 34, 0.95);',
      'color: #c9d1d9;',
      'border: 2px solid #8257e5;',
      'border-radius: 10px;',
      'z-index: 9900;',
      'box-shadow: 0 10px 32px rgba(0,0,0,0.6);',
      'display: flex;',
      'flex-direction: column;',
      'font-family: monospace;',
      'box-sizing: border-box;',
      'overflow: hidden;',
      'backdrop-filter: blur(8px);'
    ].join('\n');

    var titleBar = document.createElement('div');
    titleBar.id = 'floating-prompt-header';
    titleBar.style.cssText = 'background:#271052; color:#d2a8ff; padding:0.45rem 0.65rem; user-select:none; font-weight:bold; font-size:0.78rem; display:flex; justify-content:space-between; align-items:center; cursor:grab; border-radius:8px 8px 0 0; flex-shrink:0; gap:0.3rem;';

    titleBar.innerHTML = [
      '<span>' + (editingItemId ? 'Edit Prompt Note' : 'Write Prompt') + '</span>',
      '<div style="display:flex; gap:0.3rem; align-items:center;">',
      '  <button id="btn-close-floating-prompt" style="background:none; border:none; color:#ff7b72; cursor:pointer; font-weight:bold; font-size:0.9rem; padding:0 0.2rem;">✖</button>',
      '</div>'
    ].join('\n');

    var body = document.createElement('div');
    body.id = 'floating-prompt-body';
    body.style.cssText = 'padding:0.5rem; display:flex; flex-direction:column; gap:0.4rem; flex:1; overflow:hidden; box-sizing:border-box; position:relative;';

    var input = document.createElement('textarea');
    input.id = 'floating-prompt-input';
    input.placeholder = 'Type your prompt note for LLM...';
    input.value = textToLoad;
    input.style.cssText = 'width:100%; flex:1; background:#0d1117; color:#7ee787; border:1px solid #8257e5; border-radius:6px; padding:0.5rem; font-family:monospace; font-size:0.82rem; outline:none; box-sizing:border-box; resize:none; font-weight:600; min-height:30px;';

    input.oninput = function() {
      try { localStorage.setItem('luno_prompt_draft_text', input.value); } catch(e){}
    };

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:0.4rem; flex-shrink:0;';

    var btnAdd = document.createElement('button');
    btnAdd.id = 'btn-add-prompt-outbox';
    btnAdd.style.cssText = 'flex:2; padding:0.45rem; background:#8257e5; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem; font-family:monospace;';
    btnAdd.textContent = editingItemId ? 'Save Changes to Outbox' : 'Add to Outbox';
    btnAdd.onclick = function() {
      var val = input.value.trim();
      var activeEditId = card.dataset.editingItemId;
      if (val) {
        var title = 'Prompt Note: ' + val.slice(0, 25);
        var payload = '\n' + val;

        if (activeEditId && typeof OutboxQueue !== 'undefined' && OutboxQueue.updateItem) {
          OutboxQueue.updateItem(activeEditId, title, payload);
        } else if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
          OutboxQueue.addBundle(title, payload);
        }

        input.value = '';
        card.dataset.editingItemId = '';
        try { localStorage.removeItem('luno_prompt_draft_text'); } catch(e){}
        card.style.display = 'none';
      } else {
        alert('Please enter prompt note text first.');
      }
    };

    var btnHide = document.createElement('button');
    btnHide.style.cssText = 'flex:1; padding:0.45rem; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; cursor:pointer; font-size:0.75rem; font-family:monospace;';
    btnHide.textContent = 'Hide';
    btnHide.onclick = function() { card.style.display = 'none'; };

    btnRow.appendChild(btnAdd);
    btnRow.appendChild(btnHide);

    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'luno-resize-handle';
    resizeHandle.style.cssText = 'position:absolute; bottom:1px; right:1px; width:22px; height:22px; cursor:se-resize; user-select:none; z-index:10; color:#00f2fe; font-size:13px; text-align:right; line-height:22px; font-weight:bold; opacity:0.85; padding-right:2px;';
    resizeHandle.textContent = '◢';

    var isResizing = false;
    var rStartX = 0, rStartY = 0, rStartW = 0, rStartH = 0;

    var startResize = function(e) {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      isResizing = true;
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      rStartX = evt.clientX;
      rStartY = evt.clientY;
      rStartW = card.offsetWidth;
      rStartH = card.offsetHeight;
    };

    var doResize = function(e) {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      var newW = Math.max(240, rStartW + (evt.clientX - rStartX));
      var newH = Math.max(115, rStartH + (evt.clientY - rStartY));
      card.style.width = newW + 'px';
      card.style.height = newH + 'px';
    };

    var stopResize = function() {
      if (!isResizing) return;
      isResizing = false;
      var geo = {};
      try { geo = JSON.parse(localStorage.getItem('luno_prompt_box_geo') || '{}'); } catch(e){}
      geo.width = card.offsetWidth;
      geo.height = card.offsetHeight;
      try { localStorage.setItem('luno_prompt_box_geo', JSON.stringify(geo)); } catch(e){}
    };

    resizeHandle.addEventListener('mousedown', startResize);
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);

    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    window.addEventListener('touchmove', doResize);
    window.addEventListener('touchend', stopResize);

    body.appendChild(input);
    body.appendChild(btnRow);
    body.appendChild(resizeHandle);

    card.appendChild(titleBar);
    card.appendChild(body);
    document.body.appendChild(card);

    document.getElementById('btn-close-floating-prompt').onclick = function() { card.style.display = 'none'; };

    OutboxPromptBox.setupFloatingPromptDrag(card, titleBar, false, savedGeo);

    setTimeout(function() { if (input) input.focus(); }, 100);
  }
}

// Bind to OutboxQueue for backward compatibility
if (typeof OutboxQueue !== 'undefined') {
  OutboxQueue.promptWriteNoteModal = OutboxPromptBox.promptWriteNoteModal;
  OutboxQueue.setupFloatingPromptDrag = OutboxPromptBox.setupFloatingPromptDrag;
}

globalThis.OutboxPromptBox = OutboxPromptBox;
if (typeof module !== "undefined" && module.exports) module.exports = OutboxPromptBox;