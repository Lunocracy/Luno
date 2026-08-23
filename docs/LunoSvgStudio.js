class LunoSvgStudio {
  constructor() {}

  static zoomLevel = 1;
  static bgPattern = 'checkered';
  static activeFilePath = 'assets/logo.svg';
  static discoveredSvgFiles = [];

  static PRESETS = [
    {
      id: 'moon',
      name: '🌙 Moon Logo',
      path: 'assets/logo.svg',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#00f2fe" stroke="#00f2fe" stroke-width="1.5"/></svg>'
    },
    {
      id: 'star',
      name: '⭐ Star Icon',
      path: 'assets/star.svg',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#ff9800"/></svg>'
    },
    {
      id: 'checkmark',
      name: '✅ Checkmark Badge',
      path: 'assets/check.svg',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#3fb950" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    },
    {
      id: 'shield',
      name: '🛡️ Security Shield',
      path: 'assets/shield.svg',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#d2a8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#271052"/></svg>'
    },
    {
      id: 'terminal',
      name: '💻 Terminal Prompt',
      path: 'assets/terminal.svg',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
    }
  ];

  static activeSvgText = LunoSvgStudio.PRESETS[0].svg;

  static sanitizeSvg(svgCode) {
    if (!svgCode || typeof svgCode !== 'string') return '';
    let cleaned = svgCode.trim();
    if (cleaned.indexOf('```') === 0) {
      const firstNL = cleaned.indexOf('\n');
      if (firstNL !== -1) cleaned = cleaned.substring(firstNL + 1);
      if (cleaned.lastIndexOf('```') === cleaned.length - 3) {
        cleaned = cleaned.substring(0, cleaned.length - 3).trim();
      }
    }
    return cleaned;
  }

  static formatXml(xmlStr) {
    if (!xmlStr) return '';
    let formatted = '';
    let reg = /(>)(<)(\/*)/g;
    let xml = xmlStr.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach(node => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      let padding = '';
      for (let i = 0; i < pad; i++) padding += '  ';
      formatted += padding + node + '\n';
      pad += indent;
    });
    return formatted.trim();
  }

  static loadSvgPayload(svgContent, filePath) {
    if (!svgContent) return;
    LunoSvgStudio.activeSvgText = LunoSvgStudio.sanitizeSvg(svgContent);
    if (filePath) LunoSvgStudio.activeFilePath = filePath;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('LUNO_SVG_RECEIVED', {
        detail: { content: LunoSvgStudio.activeSvgText, filePath: LunoSvgStudio.activeFilePath }
      }));
    }

    const floatBody = typeof document !== 'undefined' ? document.getElementById('luno-floating-svg-body') : null;
    if (floatBody) {
      const m = (tag, attrs, ...children) => {
        if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
          return LunoUIComponents.makeElement(tag, attrs, ...children);
        }
        const el = document.createElement(tag);
        if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
        children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
        return el;
      };
      floatBody.innerHTML = '';
      floatBody.appendChild(LunoSvgStudio.renderPreviewViewport(m));
    }

    const contentArea = typeof document !== 'undefined' ? document.getElementById('luno-svg-studio-content') : null;
    if (contentArea) {
      const m = (tag, attrs, ...children) => {
        if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
          return LunoUIComponents.makeElement(tag, attrs, ...children);
        }
        const el = document.createElement(tag);
        if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
        children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
        return el;
      };
      contentArea.innerHTML = '';
      contentArea.appendChild(LunoSvgStudio.renderPreviewViewport(m));
    }

    if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
      ClientApp.showToast('🎨 Received SVG Payload: ' + (filePath || 'Vector Asset'), 'success', '✨');
    }
  }

  static updateSvgAttributes(newFill, newStroke, newStrokeWidth) {
    let text = LunoSvgStudio.activeSvgText;
    if (!text) return;

    if (newFill !== undefined) {
      if (/fill=["'][^"']*["']/i.test(text)) {
        text = text.replace(/fill=["'][^"']*["']/gi, 'fill="' + newFill + '"');
      } else if (text.indexOf('<path') !== -1) {
        text = text.replace(/<path/gi, '<path fill="' + newFill + '"');
      }
    }

    if (newStroke !== undefined) {
      if (/stroke=["'][^"']*["']/i.test(text)) {
        text = text.replace(/stroke=["'][^"']*["']/gi, 'stroke="' + newStroke + '"');
      } else if (text.indexOf('<path') !== -1) {
        text = text.replace(/<path/gi, '<path stroke="' + newStroke + '"');
      }
    }

    if (newStrokeWidth !== undefined) {
      if (/stroke-width=["'][^"']*["']/i.test(text)) {
        text = text.replace(/stroke-width=["'][^"']*["']/gi, 'stroke-width="' + newStrokeWidth + '"');
      } else if (text.indexOf('<path') !== -1) {
        text = text.replace(/<path/gi, '<path stroke-width="' + newStrokeWidth + '"');
      }
    }

    LunoSvgStudio.activeSvgText = text;

    const editor = document.getElementById('luno-svg-code-editor');
    if (editor) editor.value = text;

    const stage = document.getElementById('luno-svg-preview-stage');
    if (stage) {
      const sanitized = LunoSvgStudio.sanitizeSvg(text);
      const scale = LunoSvgStudio.zoomLevel || 1;
      stage.innerHTML = '<div style="transform: scale(' + scale + '); transform-origin: center center; display: inline-flex; align-items: center; justify-content: center;">' + sanitized + '</div>';
    }
  }

  static renderPreviewViewport(m) {
    const scale = LunoSvgStudio.zoomLevel || 1;
    const bgMode = LunoSvgStudio.bgPattern || 'checkered';

    let bgCss = 'background: #0d1117;';
    if (bgMode === 'checkered') {
      bgCss = 'background-color: #0d1117; background-image: linear-gradient(45deg, #161b22 25%, transparent 25%), linear-gradient(-45deg, #161b22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161b22 75%), linear-gradient(-45deg, transparent 75%, #161b22 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;';
    } else if (bgMode === 'light') {
      bgCss = 'background: #ffffff; color: #000000;';
    } else if (bgMode === 'dark') {
      bgCss = 'background: #000000;';
    }

    const sanitized = LunoSvgStudio.sanitizeSvg(LunoSvgStudio.activeSvgText);
    const viewBoxMatch = sanitized.match(/viewBox=["']([^"']+)["']/i);
    const widthMatch = sanitized.match(/\bwidth=["']([^"']+)["']/i);
    const heightMatch = sanitized.match(/\bheight=["']([^"']+)["']/i);

    const viewBoxStr = viewBoxMatch ? viewBoxMatch[1] : 'auto';
    const dimStr = (widthMatch && heightMatch) ? (widthMatch[1] + ' × ' + heightMatch[1]) : 'responsive';

    const stage = m('div', {
      id: 'luno-svg-preview-stage',
      style: {
        width: '100%',
        minHeight: '260px',
        maxHeight: '400px',
        borderRadius: '8px',
        border: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflow: 'auto',
        boxSizing: 'border-box',
        transition: 'background 0.2s ease',
        cssText: bgCss
      }
    });

    const wrapper = m('div', {
      style: {
        transform: 'scale(' + scale + ')',
        transformOrigin: 'center center',
        transition: 'transform 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    });
    wrapper.innerHTML = sanitized;
    stage.appendChild(wrapper);

    const toolbar = m('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#0d1117', border: '1px solid #30363d', padding: '0.45rem 0.65rem', borderRadius: '6px', marginBottom: '0.5rem' }
    },
      m('div', { style: { display: 'flex', gap: '0.3rem', alignItems: 'center' } },
        m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Zoom:'),
        ...[0.5, 1, 2, 4].map(z => m('button', {
          style: {
            padding: '0.2rem 0.5rem',
            background: (scale === z) ? '#238636' : '#161b22',
            color: (scale === z) ? '#ffffff' : '#c9d1d9',
            border: '1px solid ' + ((scale === z) ? '#3fb950' : '#30363d'),
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          },
          onclick: function() {
            LunoSvgStudio.zoomLevel = z;
            const mainRoot = document.getElementById('docs-content-area') || document.body;
            LunoSvgStudio.mountUI(mainRoot);
          }
        }, z + 'x'))
      ),

      m('div', { style: { display: 'flex', gap: '0.3rem', alignItems: 'center' } },
        m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Stage:'),
        ...[
          { key: 'checkered', label: '🏁 Checkered' },
          { key: 'dark', label: '⬛ Dark' },
          { key: 'light', label: '⬜ Light' }
        ].map(b => m('button', {
          style: {
            padding: '0.2rem 0.5rem',
            background: (bgMode === b.key) ? '#00f2fe22' : '#161b22',
            color: (bgMode === b.key) ? '#00f2fe' : '#c9d1d9',
            border: '1px solid ' + ((bgMode === b.key) ? '#00f2fe' : '#30363d'),
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          },
          onclick: function() {
            LunoSvgStudio.bgPattern = b.key;
            const mainRoot = document.getElementById('docs-content-area') || document.body;
            LunoSvgStudio.mountUI(mainRoot);
          }
        }, b.label))
      ),

      m('div', { style: { fontSize: '0.72rem', color: '#00f2fe', fontFamily: 'monospace', fontWeight: 'bold' } },
        'viewBox: ' + viewBoxStr + ' | Size: ' + dimStr
      )
    );

    return m('div', { style: { display: 'flex', flexDirection: 'column' } },
      toolbar,
      stage
    );
  }

  static renderQuickTweaker(m) {
    const text = LunoSvgStudio.activeSvgText || '';
    const fillMatch = text.match(/fill=["']([^"']+)["']/i);
    const strokeMatch = text.match(/stroke=["']([^"']+)["']/i);
    const swMatch = text.match(/stroke-width=["']([^"']+)["']/i);

    const curFill = (fillMatch && fillMatch[1] !== 'none') ? fillMatch[1] : '#00f2fe';
    const curStroke = (strokeMatch && strokeMatch[1] !== 'none') ? strokeMatch[1] : '#00f2fe';
    const curSw = swMatch ? parseFloat(swMatch[1]) : 1.5;

    const fillInput = m('input', {
      type: 'color',
      value: curFill.indexOf('#') === 0 && curFill.length === 7 ? curFill : '#00f2fe',
      style: { width: '28px', height: '26px', border: '1px solid #30363d', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 },
      oninput: function(e) {
        LunoSvgStudio.updateSvgAttributes(e.target.value, undefined, undefined);
      }
    });

    const strokeInput = m('input', {
      type: 'color',
      value: curStroke.indexOf('#') === 0 && curStroke.length === 7 ? curStroke : '#00f2fe',
      style: { width: '28px', height: '26px', border: '1px solid #30363d', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 },
      oninput: function(e) {
        LunoSvgStudio.updateSvgAttributes(undefined, e.target.value, undefined);
      }
    });

    const swSlider = m('input', {
      type: 'range',
      min: '0.5',
      max: '8',
      step: '0.5',
      value: String(curSw),
      style: { width: '80px', cursor: 'pointer' },
      oninput: function(e) {
        LunoSvgStudio.updateSvgAttributes(undefined, undefined, e.target.value);
      }
    });

    const presets = [
      { name: 'Cyan', color: '#00f2fe' },
      { name: 'Emerald', color: '#3fb950' },
      { name: 'Gold', color: '#ff9800' },
      { name: 'Pink', color: '#ff007f' },
      { name: 'White', color: '#ffffff' }
    ];

    const presetBtns = presets.map(p => m('button', {
      style: {
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: p.color,
        border: '1px solid #30363d',
        cursor: 'pointer',
        padding: 0
      },
      title: 'Set fill & stroke to ' + p.name,
      onclick: function() {
        fillInput.value = p.color;
        strokeInput.value = p.color;
        LunoSvgStudio.updateSvgAttributes(p.color, p.color, undefined);
      }
    }));

    return m('div', {
      style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '0.5rem 0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }
    },
      m('div', { style: { display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' } },
        m('div', { style: { display: 'flex', gap: '0.3rem', alignItems: 'center' } },
          m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Fill:'),
          fillInput
        ),
        m('div', { style: { display: 'flex', gap: '0.3rem', alignItems: 'center' } },
          m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Stroke:'),
          strokeInput
        ),
        m('div', { style: { display: 'flex', gap: '0.3rem', alignItems: 'center' } },
          m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Width:'),
          swSlider
        )
      ),

      m('div', { style: { display: 'flex', gap: '0.35rem', alignItems: 'center' } },
        m('span', { style: { fontSize: '0.7rem', color: '#8b949e', fontWeight: 'bold' } }, 'Presets:'),
        ...presetBtns
      )
    );
  }

  static renderPresetGallery(m) {
    const btns = LunoSvgStudio.PRESETS.map(p => m('button', {
      style: {
        padding: '0.35rem 0.65rem',
        background: '#161b22',
        color: '#00f2fe',
        border: '1px solid #00f2fe66',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'monospace'
      },
      onclick: function() {
        LunoSvgStudio.loadSvgPayload(p.svg, p.path);
      }
    }, p.name));

    return m('div', {
      style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }
    },
      m('strong', { style: { color: '#00f2fe', fontSize: '0.78rem' } }, '🎨 SVG Icon Preset Gallery:'),
      m('div', { style: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' } }, ...btns)
    );
  }

  static renderCodeEditor(m) {
    const statusBadge = m('span', {
      id: 'luno-svg-status-badge',
      style: { fontSize: '0.7rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' }
    }, '✅ Valid SVG XML');

    const editor = m('textarea', {
      id: 'luno-svg-code-editor',
      value: LunoSvgStudio.activeSvgText,
      placeholder: '<svg xmlns="http://www.w3.org/2000/svg"...>',
      style: {
        width: '100%',
        height: '140px',
        background: '#070a13',
        color: '#7ee787',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '0.65rem',
        fontFamily: 'monospace',
        fontSize: '0.78rem',
        lineHeight: '1.4',
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box'
      },
      oninput: function(e) {
        const val = e.target.value;
        LunoSvgStudio.activeSvgText = val;

        const stage = document.getElementById('luno-svg-preview-stage');
        if (stage) {
          const sanitized = LunoSvgStudio.sanitizeSvg(val);
          const scale = LunoSvgStudio.zoomLevel || 1;
          stage.innerHTML = '<div style="transform: scale(' + scale + '); transform-origin: center center; display: inline-flex; align-items: center; justify-content: center;">' + sanitized + '</div>';
        }

        if (val.indexOf('<svg') !== -1 && val.indexOf('</svg>') !== -1) {
          statusBadge.textContent = '✅ Valid SVG XML';
          statusBadge.style.color = '#3fb950';
          statusBadge.style.background = '#0d2818';
          statusBadge.style.borderColor = '#238636';
        } else {
          statusBadge.textContent = '⚠️ Incomplete SVG XML';
          statusBadge.style.color = '#ff7b72';
          statusBadge.style.background = '#3c1418';
          statusBadge.style.borderColor = '#da3633';
        }
      }
    });

    const btnFormat = m('button', {
      style: { padding: '0.25rem 0.55rem', background: '#21262d', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold', fontFamily: 'monospace' },
      onclick: function() {
        const formatted = LunoSvgStudio.formatXml(LunoSvgStudio.activeSvgText);
        LunoSvgStudio.activeSvgText = formatted;
        editor.value = formatted;
      }
    }, '📋 Format XML');

    const btnClear = m('button', {
      style: { padding: '0.25rem 0.55rem', background: '#161b22', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold', fontFamily: 'monospace' },
      onclick: function() {
        LunoSvgStudio.activeSvgText = '';
        editor.value = '';
        const stage = document.getElementById('luno-svg-preview-stage');
        if (stage) stage.innerHTML = '<span style="color:#8b949e; font-size:0.75rem;">Stage Empty</span>';
      }
    }, '🧹 Clear');

    const toolbar = m('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.35rem' }
    },
      m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' } },
        m('strong', { style: { color: '#00f2fe', fontSize: '0.8rem' } }, '📝 SVG Code Editor'),
        statusBadge
      ),
      m('div', { style: { display: 'flex', gap: '0.35rem' } },
        btnFormat,
        btnClear
      )
    );

    return m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.35rem' } },
      toolbar,
      editor
    );
  }

  static renderFileBrowser(m) {
    const fileInput = m('input', {
      id: 'luno-svg-filepath-input',
      type: 'text',
      value: LunoSvgStudio.activeFilePath || 'assets/logo.svg',
      placeholder: 'relative/path/to/asset.svg',
      style: { flex: '1 1 180px', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', padding: '0.4rem 0.6rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 'bold', outline: 'none' },
      oninput: function(e) {
        LunoSvgStudio.activeFilePath = e.target.value.trim();
      }
    });

    const selectDropdown = m('select', {
      style: { background: '#0d1117', color: '#3fb950', border: '1px solid #238636', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', outline: 'none' },
      onchange: async function(e) {
        const selectedPath = e.target.value;
        if (!selectedPath) return;
        try {
          let res = await fetch('/api/fs/read?path=' + encodeURIComponent(selectedPath));
          let data = await res.json();
          if (res.ok && data && data.content) {
            LunoSvgStudio.loadSvgPayload(data.content, selectedPath);
            fileInput.value = selectedPath;
          }
        } catch (err) {
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Failed to load SVG: ' + err.message, 'error', '❌');
          }
        }
      }
    },
      m('option', { value: '' }, '📁 Select SVG File from Workspace...')
    );

    setTimeout(async () => {
      try {
        let res = await fetch('/api/all-code');
        let data = await res.json();
        if (res.ok && data && data.manifest) {
          const svgFiles = data.manifest.filter(f => f.toLowerCase().indexOf('.svg') !== -1);
          LunoSvgStudio.discoveredSvgFiles = svgFiles;
          selectDropdown.innerHTML = '<option value="">📁 Select SVG File (' + svgFiles.length + ' found)...</option>';
          svgFiles.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = '🎨 ' + f;
            if (f === LunoSvgStudio.activeFilePath) opt.selected = true;
            selectDropdown.appendChild(opt);
          });
        }
      } catch (e) {}
    }, 50);

    const btnLoad = m('button', {
      style: { padding: '0.4rem 0.7rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
      onclick: async function() {
        const p = fileInput.value.trim();
        if (!p) return;
        try {
          let res = await fetch('/api/fs/read?path=' + encodeURIComponent(p));
          let data = await res.json();
          if (res.ok && data && data.content) {
            LunoSvgStudio.loadSvgPayload(data.content, p);
          } else {
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('New target file: ' + p + ' (Ready to save)', 'info', '📝');
            }
          }
        } catch (err) {
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('New target file path set: ' + p, 'info', '📝');
          }
        }
      }
    }, '📂 Load File');

    return m('div', {
      style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '0.5rem 0.65rem', display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }
    },
      m('span', { style: { fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold' } }, 'Target:'),
      fileInput,
      btnLoad,
      selectDropdown
    );
  }

  static generateContainerDirective() {
    const filePath = LunoSvgStudio.activeFilePath || 'assets/logo.svg';
    const content = LunoSvgStudio.sanitizeSvg(LunoSvgStudio.activeSvgText || '');
    const closeSvg = '</' + 'svg>';
    return '<svg data-file="' + filePath + '">\n' + content + '\n' + closeSvg;
  }

  static renderExportBar(m) {
    const btnOutbox = m('button', {
      style: { flex: 1, minWidth: '150px', padding: '0.65rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'monospace' },
      onclick: function() {
        const directive = LunoSvgStudio.generateContainerDirective();
        const path = LunoSvgStudio.activeFilePath || 'assets/logo.svg';
        if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
          OutboxQueue.addBundle('SVG Vector: ' + path, directive);
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Queued SVG Directive to Outbox!', 'success', '📤');
          }
        }
      }
    }, '📤 Send SVG to Outbox');

    const btnCopy = m('button', {
      style: { flex: 1, minWidth: '150px', padding: '0.65rem', background: '#161b22', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'monospace' },
      onclick: function() {
        const directive = LunoSvgStudio.generateContainerDirective();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(directive);
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Copied SVG Container Directive to Clipboard!', 'success', '📋');
          }
        } else {
          prompt('Copy SVG Container Directive:', directive);
        }
      }
    }, '📋 Copy Directive');

    const btnSaveDisk = m('button', {
      style: { flex: 1, minWidth: '150px', padding: '0.65rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(35,134,54,0.3)' },
      onclick: async function() {
        const filePath = LunoSvgStudio.activeFilePath || 'assets/logo.svg';
        const content = LunoSvgStudio.sanitizeSvg(LunoSvgStudio.activeSvgText || '');
        if (!filePath || !content) return;

        try {
          const payload = {
            files: [{ filePath: filePath, content: content, action: 'write' }],
            serverScript: ''
          };
          let res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          let data = await res.json();
          if (res.ok && data.success) {
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('Saved ' + filePath + ' directly to disk!', 'success', '💾');
            }
          } else {
            alert('Save failed: ' + (data.error || 'Server error'));
          }
        } catch (err) {
          alert('Save network error: ' + err.message);
        }
      }
    }, '💾 Save SVG to Disk');

    return m('div', {
      style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }
    },
      btnOutbox,
      btnCopy,
      btnSaveDisk
    );
  }

  static setupFloatingDrag(card, header) {
    let isDragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;

    const startDrag = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.classList.contains('luno-svg-resize-handle')) return;
      isDragging = true;
      header.style.cursor = 'grabbing';
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      startX = evt.clientX;
      startY = evt.clientY;
      origLeft = card.offsetLeft;
      origTop = card.offsetTop;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    const doDrag = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;

      const minLeft = 10;
      const maxLeft = window.innerWidth - 60;
      const minTop = 10;
      const maxTop = window.innerHeight - 60;

      const newLeft = Math.max(minLeft, Math.min(maxLeft, origLeft + dx));
      const newTop = Math.max(minTop, Math.min(maxTop, origTop + dy));
      card.style.left = newLeft + 'px';
      card.style.top = newTop + 'px';
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
      const geo = { top: card.offsetTop, left: card.offsetLeft, width: card.offsetWidth, height: card.offsetHeight };
      try { localStorage.setItem('luno_svg_studio_geo', JSON.stringify(geo)); } catch(e){}
    };

    header.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    header.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag);
    window.addEventListener('touchend', stopDrag);
  }

  static openFloatingDialog() {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('luno-floating-svg-studio');
    if (existing) {
      existing.style.display = existing.style.display === 'none' ? 'flex' : 'none';
      return;
    }

    let savedGeo = { top: 80, left: Math.max(20, window.innerWidth - 440), width: 420, height: 480 };
    try {
      const raw = localStorage.getItem('luno_svg_studio_geo');
      if (raw) Object.assign(savedGeo, JSON.parse(raw));
    } catch(e){}

    const card = document.createElement('div');
    card.id = 'luno-floating-svg-studio';
    card.style.cssText = [
      'position: fixed;',
      'top: ' + savedGeo.top + 'px;',
      'left: ' + savedGeo.left + 'px;',
      'width: ' + savedGeo.width + 'px;',
      'height: ' + savedGeo.height + 'px;',
      'min-width: 320px;',
      'min-height: 360px;',
      'background: rgba(22, 27, 34, 0.95);',
      'color: #c9d1d9;',
      'border: 2px solid #00f2fe;',
      'border-radius: 10px;',
      'z-index: 9920;',
      'box-shadow: 0 10px 32px rgba(0,242,254,0.35);',
      'display: flex;',
      'flex-direction: column;',
      'font-family: monospace;',
      'box-sizing: border-box;',
      'overflow: hidden;',
      'backdrop-filter: blur(8px);'
    ].join('\n');

    const header = document.createElement('div');
    header.style.cssText = 'background:#003847; color:#00f2fe; padding:0.45rem 0.65rem; user-select:none; font-weight:bold; font-size:0.82rem; display:flex; justify-content:space-between; align-items:center; cursor:grab; border-radius:8px 8px 0 0; flex-shrink:0;';
    header.innerHTML = [
      '<span>🎨 SVG Studio Dialog</span>',
      '<div style="display:flex; gap:0.3rem; align-items:center;">',
      '  <button id="btn-close-floating-svg-studio" style="background:none; border:none; color:#ff7b72; cursor:pointer; font-weight:bold; font-size:0.9rem; padding:0 0.2rem;">✖</button>',
      '</div>'
    ].join('\n');

    const body = document.createElement('div');
    body.id = 'luno-floating-svg-body';
    body.style.cssText = 'padding:0.65rem; display:flex; flex-direction:column; gap:0.5rem; flex:1; overflow-y:auto; box-sizing:border-box; position:relative;';

    const m = (tag, attrs, ...children) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...children);
      }
      const el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    body.appendChild(LunoSvgStudio.renderPreviewViewport(m));
    body.appendChild(LunoSvgStudio.renderQuickTweaker(m));

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'luno-svg-resize-handle';
    resizeHandle.style.cssText = 'position:absolute; bottom:1px; right:1px; width:22px; height:22px; cursor:se-resize; user-select:none; z-index:10; color:#00f2fe; font-size:12px; text-align:right; line-height:22px; font-weight:bold; opacity:0.85;';
    resizeHandle.textContent = '◢';

    let isResizing = false;
    let rStartX = 0, rStartY = 0, rStartW = 0, rStartH = 0;

    const startResize = (e) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      isResizing = true;
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      rStartX = evt.clientX;
      rStartY = evt.clientY;
      rStartW = card.offsetWidth;
      rStartH = card.offsetHeight;
    };

    const doResize = (e) => {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      card.style.width = Math.max(320, rStartW + (evt.clientX - rStartX)) + 'px';
      card.style.height = Math.max(360, rStartH + (evt.clientY - rStartY)) + 'px';
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      let geo = {};
      try { geo = JSON.parse(localStorage.getItem('luno_svg_studio_geo') || '{}'); } catch(e){}
      geo.width = card.offsetWidth;
      geo.height = card.offsetHeight;
      try { localStorage.setItem('luno_svg_studio_geo', JSON.stringify(geo)); } catch(e){}
    };

    resizeHandle.addEventListener('mousedown', startResize);
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);

    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    window.addEventListener('touchmove', doResize);
    window.addEventListener('touchend', stopResize);

    body.appendChild(resizeHandle);
    card.appendChild(header);
    card.appendChild(body);
    document.body.appendChild(card);

    document.getElementById('btn-close-floating-svg-studio').onclick = () => { card.style.display = 'none'; };
    LunoSvgStudio.setupFloatingDrag(card, header);
  }

  static mountUI(container) {
    if (!container || typeof document === 'undefined') return;
    container.innerHTML = '';

    const m = (tag, attrs, ...children) => {
      if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
        return LunoUIComponents.makeElement(tag, attrs, ...children);
      }
      const el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const contentContainer = m('div', { id: 'luno-svg-studio-content', style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } });
    contentContainer.appendChild(LunoSvgStudio.renderFileBrowser(m));
    contentContainer.appendChild(LunoSvgStudio.renderPresetGallery(m));
    contentContainer.appendChild(LunoSvgStudio.renderPreviewViewport(m));
    contentContainer.appendChild(LunoSvgStudio.renderQuickTweaker(m));
    contentContainer.appendChild(LunoSvgStudio.renderCodeEditor(m));
    contentContainer.appendChild(LunoSvgStudio.renderExportBar(m));

    const card = m('div', {
      id: 'luno-svg-studio-card',
      style: {
        background: '#161b22',
        border: '2px solid #00f2fe',
        borderRadius: '10px',
        padding: '1.25rem',
        color: '#c9d1d9',
        fontFamily: 'monospace',
        boxShadow: '0 4px 20px rgba(0, 242, 254, 0.2)'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' } },
        m('h2', { style: { color: '#00f2fe', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🎨 Luno SVG Studio'),
        m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center' } },
          m('button', {
            style: { padding: '0.3rem 0.65rem', background: '#003847', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
            onclick: () => LunoSvgStudio.openFloatingDialog()
          }, '🖥️ Float Window'),
          m('span', { style: { fontSize: '0.72rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'v1.0 Complete')
        )
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: '0 0 1rem 0', lineHeight: '1.4' } },
        'Visual SVG vector studio. Renders and edits SVG vector assets sent via HTML container protocol (<svg data-file="...">).'
      ),
      contentContainer
    );

    container.appendChild(card);
  }
}

globalThis.LunoSvgStudio = LunoSvgStudio;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoSvgStudio;

LunoSvgStudio.runSelfTest = function() {
  const sample = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0z" fill="none"/></svg>';
  const sanitized = LunoSvgStudio.sanitizeSvg(sample);
  const isSanitized = sanitized.includes('<svg') && sanitized.includes('</svg>');
  const directive = LunoSvgStudio.generateContainerDirective();
  const hasDirective = directive.includes('<svg data-file=') && directive.includes('</svg>');
  return {
    success: isSanitized && hasDirective,
    sanitized: isSanitized,
    hasDirective: hasDirective,
    activeFilePath: LunoSvgStudio.activeFilePath
  };
};