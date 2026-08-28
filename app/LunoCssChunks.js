class LunoCssChunks {
  constructor() {

  }

    static getVariableCSS(state) {
      var s = state || {};
      var isLight = Boolean(s.isLightMode);
      var fontSize = s.fontSize !== undefined ? s.fontSize : 13;
      var glowLevel = s.glowLevel !== undefined ? s.glowLevel : 50;
  
      var actualGlow = isLight ? 0 : glowLevel;
      var glowBlur = Math.round(actualGlow * 0.35);
      var glowOpacity = (actualGlow * 0.008).toFixed(2);
      var glowColor = isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0, 242, 254, ' + glowOpacity + ')';
  
      var bgPrimary = isLight ? '#f6f8fa' : '#070a13';
      var bgSecondary = isLight ? '#ffffff' : '#0f172a';
      var bgCard = isLight ? '#ffffff' : '#161b22';
      var bgInput = isLight ? '#ffffff' : '#070a13';
      var textPrimary = isLight ? '#0f172a' : '#f8fafc';
      var textSecondary = isLight ? '#475569' : '#8b949e';
      var textAccent = isLight ? '#0284c7' : '#00f2fe';
      var textCode = isLight ? '#15803d' : '#7ee787';
      var borderColor = isLight ? '#d0d7de' : '#1e293b';
      var accentGreen = isLight ? '#16a34a' : '#00e676';
      var accentPurple = isLight ? '#7e22ce' : '#ff007f';
  
      return [
        ':root {',
        '  --bg-primary: ' + bgPrimary + ';',
        '  --bg-secondary: ' + bgSecondary + ';',
        '  --bg-card: ' + bgCard + ';',
        '  --bg-input: ' + bgInput + ';',
        '  --text-primary: ' + textPrimary + ';',
        '  --text-secondary: ' + textSecondary + ';',
        '  --text-accent: ' + textAccent + ';',
        '  --text-code: ' + textCode + ';',
        '  --border-color: ' + borderColor + ';',
        '  --accent-green: ' + accentGreen + ';',
        '  --accent-purple: ' + accentPurple + ';',
        '  --glow-color: ' + glowColor + ';',
        '  --glow-blur: ' + glowBlur + 'px;',
        '  --font-size-val: ' + fontSize + 'px;',
        '}',
        'html {',
        '  font-size: ' + fontSize + 'px !important;',
        '  background-color: ' + bgPrimary + ' !important;',
        '  color: ' + textPrimary + ' !important;',
        '}',
        'html, body, #app-root {',
        '  font-size: ' + fontSize + 'px;',
        '  filter: none !important;',
        '}',
        'iframe {',
        '  filter: none !important;',
        '}'
      ].join('\n');
    }
  static getLayoutCSS() {

    return [
      '* { box-sizing: border-box; margin: 0; padding: 0; }',
      'body { background-color: var(--bg-primary, #070a13); color: var(--text-primary, #f8fafc); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: var(--font-size-val, 13px); }',
      'button, input, select, textarea { font-family: inherit; }'
    ].join('\n');

  }
  static getCardCSS() {

    return [
      '.inbox-card-hero { transition: transform 0.15s ease, box-shadow 0.15s ease; }',
      '.outbox-card-hero { transition: transform 0.15s ease, box-shadow 0.15s ease; }',
      '.inbox-card-hero:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(35, 134, 54, 0.35) !important; }',
      '.outbox-card-hero:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(130, 87, 229, 0.35) !important; }',
      '',
      '/* Light Mode Comprehensive Structural Override */',
      'body.light-mode,',
      'body.light-mode #app-root,',
      'body.light-mode #luno-spa-view-container {',
      '  background-color: #f6f8fa !important;',
      '  color: #0f172a !important;',
      '}',
      '',
      'body.light-mode div,',
      'body.light-mode section,',
      'body.light-mode article,',
      'body.light-mode main {',
      '  color: #0f172a;',
      '}',
      '',
      'body.light-mode .card,',
      'body.light-mode .glow-card,',
      'body.light-mode #luno-theme-widget-card,',
      'body.light-mode .status-bar,',
      'body.light-mode #outbox-queue-container > div,',
      'body.light-mode #item-list-container > div,',
      'body.light-mode #dev-editor-content,',
      'body.light-mode #luno-floating-prompt-box {',
      '  background-color: #ffffff !important;',
      '  background-image: none !important;',
      '  color: #0f172a !important;',
      '  border-color: #d0d7de !important;',
      '  box-shadow: 0 4px 12px rgba(140, 149, 159, 0.15) !important;',
      '}',
      '',
      'body.light-mode .inbox-card {',
      '  background: #f0fdf4 !important;',
      '  border: 2px solid #16a34a !important;',
      '  color: #0f172a !important;',
      '}',
      '',
      'body.light-mode .outbox-card {',
      '  background: #faf5ff !important;',
      '  border: 2px solid #7e22ce !important;',
      '  color: #0f172a !important;',
      '}',
      '',
      'body.light-mode #outbox-card-content,',
      'body.light-mode #inbox-card-content,',
      'body.light-mode #dev-editor-content {',
      '  background: transparent !important;',
      '}',
      '',
      'body.light-mode textarea,',
      'body.light-mode input[type="text"],',
      'body.light-mode select {',
      '  background-color: #ffffff !important;',
      '  color: #0f172a !important;',
      '  border: 1px solid #cbd5e1 !important;',
      '}',
      '',
      'body.light-mode pre,',
      'body.light-mode code,',
      'body.light-mode #feedback,',
      'body.light-mode #feedback-text-area {',
      '  background-color: #f1f5f9 !important;',
      '  color: #0969da !important;',
      '  border-color: #cbd5e1 !important;',
      '}',
      '',
      'body.light-mode #luno-settings-modal > div,',
      'body.light-mode #luno-diff-approval-modal > div,',
      'body.light-mode #luno-smart-help-modal > div,',
      'body.light-mode #luno-project-selector-modal > div,',
      'body.light-mode #luno-template-modal > div,',
      'body.light-mode #luno-walkthrough-wizard-modal > div,',
      'body.light-mode #luno-video-demos-modal > div {',
      '  background-color: #ffffff !important;',
      '  color: #0f172a !important;',
      '  border: 2px solid #0284c7 !important;',
      '  box-shadow: 0 12px 36px rgba(140, 149, 159, 0.3) !important;',
      '}',
      '',
      'body.light-mode #active-root-display,',
      'body.light-mode #active-root-label {',
      '  color: #0284c7 !important;',
      '  border-color: #0284c7 !important;',
      '  background-color: #e0f2fe !important;',
      '}',
      '',
      'body.light-mode span,',
      'body.light-mode p,',
      'body.light-mode label,',
      'body.light-mode strong,',
      'body.light-mode h1,',
      'body.light-mode h2,',
      'body.light-mode h3 {',
      '  color: inherit;',
      '}',
      '',
      'body.light-mode a {',
      '  color: #0284c7 !important;',
      '}',
      '',
      'body.light-mode button.action-btn,',
      'body.light-mode button.btn-secondary {',
      '  background-color: #f1f5f9 !important;',
      '  color: #0f172a !important;',
      '  border: 1px solid #cbd5e1 !important;',
      '}',
      '',
      'body.light-mode button.btn-primary,',
      'body.light-mode button.btn-apply {',
      '  background-color: #16a34a !important;',
      '  color: #ffffff !important;',
      '  border: none !important;',
      '}',
      '',
      'body.light-mode button.btn-purple {',
      '  background-color: #7e22ce !important;',
      '  color: #ffffff !important;',
      '  border: none !important;',
      '}'
    ].join('\n');

  }
  static getAnimationCSS(glowEnabled, animEnabled) {

    var glow = glowEnabled !== undefined ? glowEnabled : true;
    if (!glow) return '';
    return [
      '@keyframes gentleGlow {',
      '  from { box-shadow: 0 0 4px var(--glow-color); }',
      '  to { box-shadow: 0 0 var(--glow-blur) var(--glow-color); }',
      '}',
      '.glow-card, .inbox-card, .outbox-card, #luno-theme-widget-card { animation: gentleGlow 2.5s infinite alternate; }'
    ].join('\n');

  }
}

globalThis.LunoCssChunks = LunoCssChunks;
if (typeof module !== "undefined" && module.exports) module.exports = LunoCssChunks;