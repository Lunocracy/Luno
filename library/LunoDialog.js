/**
 * 📚 LUNO SHARED LIBRARY: LunoDialog.js
 * High-performance floating window & dialog engine combining 8-directional
 * edge/corner resizing with Luno's cyber-dark glowing aesthetics.
 */

class LunoDialog {
  constructor(options = {}) {
    this.id = options.id || ('luno-dialog-' + Math.random().toString(36).slice(2, 9));
    this.title = options.title || 'Dialog Window';
    this.width = options.width || 420;
    this.height = options.height || 320;
    this.minWidth = options.minWidth || 260;
    this.minHeight = options.minHeight || 160;
    this.top = options.top !== undefined ? options.top : 80;
    this.left = options.left !== undefined ? options.left : Math.max(16, (window.innerWidth - this.width) / 2);
    this.accentColor = options.accentColor || '#00f2fe';
    this.glowColor = options.glowColor || 'rgba(0, 242, 254, 0.35)';
    this.storageKey = options.storageKey || ('luno_dialog_geo_' + this.id);
    this.onClose = typeof options.onClose === 'function' ? options.onClose : null;
    this.isMaximized = false;
    this.isMinimized = false;
    this.savedNormalGeo = null;

    this.restoreSavedGeometry();
    this.buildDOM();
    this.setupDragging();
    this.setup8WayResizing();
    this.setupFocusElevation();

    if (options.content) {
      this.setContent(options.content);
    }
  }

  restoreSavedGeometry() {
    try {
      if (typeof localStorage !== 'undefined' && this.storageKey) {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const geo = JSON.parse(raw);
          if (geo.width) this.width = Math.max(this.minWidth, geo.width);
          if (geo.height) this.height = Math.max(this.minHeight, geo.height);
          if (geo.top !== undefined) this.top = Math.max(0, Math.min(window.innerHeight - 60, geo.top));
          if (geo.left !== undefined) this.left = Math.max(0, Math.min(window.innerWidth - 60, geo.left));
        }
      }
    } catch (e) {}
  }

  saveGeometry() {
    try {
      if (typeof localStorage !== 'undefined' && this.storageKey && !this.isMaximized && !this.isMinimized) {
        const geo = {
          top: this.element.offsetTop,
          left: this.element.offsetLeft,
          width: this.element.offsetWidth,
          height: this.element.offsetHeight
        };
        localStorage.setItem(this.storageKey, JSON.stringify(geo));
      }
    } catch (e) {}
  }

  buildDOM() {
    const card = document.createElement('div');
    card.id = this.id;
    card.className = 'luno-dialog-window';
    card.style.cssText = [
      'position: fixed;',
      'top: ' + this.top + 'px;',
      'left: ' + this.left + 'px;',
      'width: ' + this.width + 'px;',
      'height: ' + this.height + 'px;',
      'min-width: ' + this.minWidth + 'px;',
      'min-height: ' + this.minHeight + 'px;',
      'background: rgba(22, 27, 34, 0.96);',
      'color: #c9d1d9;',
      'border: 2px solid ' + this.accentColor + ';',
      'border-radius: 10px;',
      'z-index: ' + LunoDialog.getNextZIndex() + ';',
      'box-shadow: 0 12px 36px ' + this.glowColor + ', 0 4px 16px rgba(0,0,0,0.8);',
      'display: flex;',
      'flex-direction: column;',
      'font-family: monospace;',
      'box-sizing: border-box;',
      'overflow: hidden;',
      'backdrop-filter: blur(10px);',
      'user-select: auto;'
    ].join('\n');

    // Header Title Bar
    const header = document.createElement('div');
    header.className = 'luno-dialog-header';
    header.style.cssText = [
      'background: linear-gradient(135deg, #0d2818 0%, #161b22 100%);',
      'color: ' + this.accentColor + ';',
      'padding: 0.45rem 0.75rem;',
      'user-select: none;',
      'font-weight: bold;',
      'font-size: 0.82rem;',
      'display: flex;',
      'justify-content: space-between;',
      'align-items: center;',
      'cursor: grab;',
      'border-bottom: 1px solid rgba(255,255,255,0.08);',
      'flex-shrink: 0;',
      'gap: 0.4rem;'
    ].join('\n');

    const titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex; align-items:center; gap:0.4rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    titleBox.innerHTML = '<span style="font-size:0.9rem;">⚡</span><span class="luno-dialog-title-text">' + this.title + '</span>';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex; gap:0.3rem; align-items:center; flex-shrink:0;';

    const btnMin = document.createElement('button');
    btnMin.textContent = '–';
    btnMin.title = 'Minimize Window';
    btnMin.style.cssText = 'background:#21262d; border:1px solid #30363d; color:#c9d1d9; border-radius:4px; cursor:pointer; width:22px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center;';
    btnMin.onclick = (e) => { e.stopPropagation(); this.toggleMinimize(); };

    const btnMax = document.createElement('button');
    btnMax.textContent = '□';
    btnMax.title = 'Maximize / Restore Window';
    btnMax.style.cssText = 'background:#21262d; border:1px solid #30363d; color:#c9d1d9; border-radius:4px; cursor:pointer; width:22px; height:20px; font-size:10px; display:flex; align-items:center; justify-content:center;';
    btnMax.onclick = (e) => { e.stopPropagation(); this.toggleMaximize(); };

    const btnClose = document.createElement('button');
    btnClose.textContent = '✖';
    btnClose.title = 'Close Window';
    btnClose.style.cssText = 'background:#21262d; border:1px solid #da3633; color:#ff7b72; border-radius:4px; cursor:pointer; width:22px; height:20px; font-size:10px; display:flex; align-items:center; justify-content:center;';
    btnClose.onclick = (e) => { e.stopPropagation(); this.close(); };

    controls.appendChild(btnMin);
    controls.appendChild(btnMax);
    controls.appendChild(btnClose);
    header.appendChild(titleBox);
    header.appendChild(controls);

    // Body Content Container
    const body = document.createElement('div');
    body.className = 'luno-dialog-body';
    body.style.cssText = 'padding:0.75rem; flex:1; overflow:auto; box-sizing:border-box; display:flex; flex-direction:column; gap:0.5rem; position:relative;';

    card.appendChild(header);
    card.appendChild(body);

    this.element = card;
    this.header = header;
    this.body = body;
    this.titleTextEl = titleBox.querySelector('.luno-dialog-title-text');
    this.btnMax = btnMax;
  }

  setContent(content) {
    this.body.innerHTML = '';
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else if (content instanceof Node) {
      this.body.appendChild(content);
    }
  }

  mount(parentEl = document.body) {
    parentEl.appendChild(this.element);
    this.saveGeometry();
    return this;
  }

  close() {
    this.saveGeometry();
    if (this.onClose) this.onClose(this);
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.savedNormalGeo = { width: this.element.offsetWidth, height: this.element.offsetHeight };
      this.body.style.display = 'none';
      this.element.style.height = 'auto';
      this.element.querySelectorAll('.luno-resize-edge').forEach(el => el.style.display = 'none');
    } else {
      this.body.style.display = 'flex';
      if (this.savedNormalGeo) {
        this.element.style.height = this.savedNormalGeo.height + 'px';
      }
      this.element.querySelectorAll('.luno-resize-edge').forEach(el => el.style.display = 'block');
    }
  }

  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.savedNormalGeo = {
        top: this.element.offsetTop,
        left: this.element.offsetLeft,
        width: this.element.offsetWidth,
        height: this.element.offsetHeight
      };
      this.element.style.top = '10px';
      this.element.style.left = '10px';
      this.element.style.width = 'calc(100vw - 20px)';
      this.element.style.height = 'calc(100vh - 20px)';
      this.btnMax.textContent = '❐';
    } else {
      if (this.savedNormalGeo) {
        this.element.style.top = this.savedNormalGeo.top + 'px';
        this.element.style.left = this.savedNormalGeo.left + 'px';
        this.element.style.width = this.savedNormalGeo.width + 'px';
        this.element.style.height = this.savedNormalGeo.height + 'px';
      }
      this.btnMax.textContent = '□';
    }
  }

  setupFocusElevation() {
    const elevate = () => {
      this.element.style.zIndex = String(LunoDialog.getNextZIndex());
    };
    this.element.addEventListener('mousedown', elevate);
    this.element.addEventListener('touchstart', elevate, { passive: true });
  }

  setupDragging() {
    let isDragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;

    const startDrag = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.classList.contains('luno-resize-edge')) return;
      if (this.isMaximized) return;

      isDragging = true;
      this.header.style.cursor = 'grabbing';
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      startX = evt.clientX;
      startY = evt.clientY;
      origLeft = this.element.offsetLeft;
      origTop = this.element.offsetTop;

      if (e.cancelable) e.preventDefault();
    };

    const doDrag = (e) => {
      if (!isDragging) return;
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;

      const minLeft = 10;
      const maxLeft = window.innerWidth - 60;
      const minTop = 10;
      const maxTop = window.innerHeight - 50;

      this.element.style.left = Math.max(minLeft, Math.min(maxLeft, origLeft + dx)) + 'px';
      this.element.style.top = Math.max(minTop, Math.min(maxTop, origTop + dy)) + 'px';
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      this.header.style.cursor = 'grab';
      this.saveGeometry();
    };

    this.header.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    this.header.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
  }

  setup8WayResizing() {
    const handles = ['n', 's', 'e', 'w', 'nw', 'ne', 'se', 'sw'];
    const cursors = {
      n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
      nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize'
    };

    handles.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'luno-resize-edge luno-resize-' + dir;
      handle.style.cssText = [
        'position: absolute;',
        'z-index: 20;',
        'user-select: none;',
        'cursor: ' + cursors[dir] + ';'
      ].join('\n');

      const thickness = 8;
      if (dir === 'n') handle.style.cssText += 'top:0; left:8px; right:8px; height:' + thickness + 'px;';
      else if (dir === 's') handle.style.cssText += 'bottom:0; left:8px; right:8px; height:' + thickness + 'px;';
      else if (dir === 'e') handle.style.cssText += 'top:8px; bottom:8px; right:0; width:' + thickness + 'px;';
      else if (dir === 'w') handle.style.cssText += 'top:8px; bottom:8px; left:0; width:' + thickness + 'px;';
      else if (dir === 'nw') handle.style.cssText += 'top:0; left:0; width:12px; height:12px;';
      else if (dir === 'ne') handle.style.cssText += 'top:0; right:0; width:12px; height:12px;';
      else if (dir === 'se') handle.style.cssText += 'bottom:0; right:0; width:14px; height:14px; text-align:right; font-size:10px; color:' + this.accentColor + '; opacity:0.8;';
      else if (dir === 'sw') handle.style.cssText += 'bottom:0; left:0; width:12px; height:12px;';

      if (dir === 'se') handle.textContent = '◢';

      let isResizing = false;
      let startX = 0, startY = 0, startW = 0, startH = 0, startT = 0, startL = 0;

      const startResize = (e) => {
        if (this.isMaximized || this.isMinimized) return;
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();

        isResizing = true;
        const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
        startX = evt.clientX;
        startY = evt.clientY;
        startW = this.element.offsetWidth;
        startH = this.element.offsetHeight;
        startT = this.element.offsetTop;
        startL = this.element.offsetLeft;
      };

      const doResize = (e) => {
        if (!isResizing) return;
        const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
        const dx = evt.clientX - startX;
        const dy = evt.clientY - startY;

        if (dir.includes('e')) {
          this.element.style.width = Math.max(this.minWidth, startW + dx) + 'px';
        }
        if (dir.includes('s')) {
          this.element.style.height = Math.max(this.minHeight, startH + dy) + 'px';
        }
        if (dir.includes('w')) {
          const newW = Math.max(this.minWidth, startW - dx);
          if (newW > this.minWidth) {
            this.element.style.width = newW + 'px';
            this.element.style.left = (startL + dx) + 'px';
          }
        }
        if (dir.includes('n')) {
          const newH = Math.max(this.minHeight, startH - dy);
          if (newH > this.minHeight) {
            this.element.style.height = newH + 'px';
            this.element.style.top = (startT + dy) + 'px';
          }
        }
      };

      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        this.saveGeometry();
      };

      handle.addEventListener('mousedown', startResize);
      window.addEventListener('mousemove', doResize);
      window.addEventListener('mouseup', stopResize);

      handle.addEventListener('touchstart', startResize, { passive: false });
      window.addEventListener('touchmove', doResize, { passive: false });
      window.addEventListener('touchend', stopResize);

      this.element.appendChild(handle);
    });
  }

  static _zIndexCounter = 9000;
  static getNextZIndex() {
    return ++LunoDialog._zIndexCounter;
  }

  static create(options = {}) {
    const dialog = new LunoDialog(options);
    dialog.mount();
    return dialog;
  }
}

globalThis.LunoDialog = LunoDialog;
if (typeof window !== 'undefined') window.LunoDialog = LunoDialog;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoDialog;