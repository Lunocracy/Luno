class LunoPromptInstructions {
  constructor() {}

  /**
   * ⚙️ METHOD: getSystemPreamble()
   */
  static getSystemPreamble() {
    return [
      '================================================================================',
      '🌙 LUNO WORKSPACE - LLM RESPONSE PROTOCOL INSTRUCTIONS',
      '================================================================================',
      'You are collaborating with a developer using Luno Workspace, a local file-editing',
      'environment that processes your responses directly in browser client JavaScript.'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: getEnglishSandwichRule()
   */
  static getEnglishSandwichRule() {
    return [
      'CRITICAL FORMATTING MANDATE (ENGLISH SANDWICH RULE):',
      '1. Always write natural English explanations BEFORE opening your markdown code fence.',
      '2. Always return your code wrapped in a SINGLE markdown code block (```html ... ```).',
      '3. Always write a concluding English summary AFTER closing the markdown code fence.',
      '4. Never return bare code blocks without conversational English before and after.'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: getSingleCodeBlockRule()
   */
  static getSingleCodeBlockRule() {
    return [
      'SINGLE CODE BLOCK REQUIREMENT:',
      '• All modified files, new files, and server scripts MUST be contained within ONE',
      '  single ```html ... ``` markdown block in your response.',
      '• Do not split multiple files across separate markdown code fences.'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: getContainerDirectivesSpec()
   */
  static getContainerDirectivesSpec() {
    var scr = 'scr' + 'ipt';
    return [
      'HTML CONTAINER PROTOCOL DIRECTIVES:',
      '• Full File Write / Replacement:',
      '  <' + scr + ' data-file="path/to/file.js">',
      '  // Full file source code here...',
      '  </' + scr + '>',
      '',
      '• Surgical ES6 Class Method Patch (Updates ONLY that specific method):',
      '  <' + scr + ' data-file="path/to/file.js" data-method="ClassName.methodName" data-action="patch">',
      '  methodName(args) {',
      '    // Updated method code only...',
      '  }',
      '  </' + scr + '>',
      '',
      '• Server Script Execution (Runs with full Node.js process / fs access):',
      '  <' + scr + ' data-action="run-server">',
      '  const fs = require("fs");',
      '  return "Executed successfully";',
      '  </' + scr + '>',
      '',
      '• Stylesheets (<style data-file="css/style.css">) and Templates (<template data-file="view.html">).'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: getSyntaxSafetyRules()
   */
  static getSyntaxSafetyRules() {
    return [
      'SYNTAX & PARSER SAFETY RULES:',
      '1. SCRIPT TAG COLLISION: Inside JS strings, never write closing script tags together.',
      '   Always concatenate or escape: "</" + "script>" or "<\\/script>".',
      '2. CLEAN ES6 EXPORTS: All classes must export to globalThis and module.exports:',
      '   globalThis.ClassName = ClassName;',
      '   if (typeof module !== "undefined" && module.exports) module.exports = ClassName;',
      '3. AVOID FRAGILE REGEX: Prefer deterministic string scanning (indexOf, slice) over',
      '   complex regular expressions for parsing operations.'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: getAiStudioSpecificRules()
   */
  static getAiStudioSpecificRules() {
    return [
      'GOOGLE AI STUDIO & GEMINI STREAMING OPTIMIZATIONS:',
      '• Keep method replacements surgical and modular so they can be reviewed easily.',
      '• When modifying a single method, use data-action="patch" rather than dumping entire files.',
      '• Always ensure class methods are declared with standard ES6 syntax inside the class body.'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: assembleFullInstructions()
   */
  static assembleFullInstructions() {
    return [
      LunoPromptInstructions.getSystemPreamble(),
      '',
      LunoPromptInstructions.getEnglishSandwichRule(),
      '',
      LunoPromptInstructions.getSingleCodeBlockRule(),
      '',
      LunoPromptInstructions.getContainerDirectivesSpec(),
      '',
      LunoPromptInstructions.getSyntaxSafetyRules(),
      '',
      LunoPromptInstructions.getAiStudioSpecificRules(),
      '================================================================================\n'
    ].join('\n');
  }

  /**
   * ⚙️ METHOD: mountUI(container)
   * Dedicated interactive UI for viewing, customizing, and pushing modular instruction rules.
   */
  static mountUI(container) {
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

    var sections = [
      { id: 'preamble', title: '1. System Role Preamble', method: 'getSystemPreamble', text: LunoPromptInstructions.getSystemPreamble() },
      { id: 'sandwich', title: '2. English Sandwich Rule', method: 'getEnglishSandwichRule', text: LunoPromptInstructions.getEnglishSandwichRule() },
      { id: 'codeblock', title: '3. Single Code Block Rule', method: 'getSingleCodeBlockRule', text: LunoPromptInstructions.getSingleCodeBlockRule() },
      { id: 'containers', title: '4. HTML Container Directives Spec', method: 'getContainerDirectivesSpec', text: LunoPromptInstructions.getContainerDirectivesSpec() },
      { id: 'syntax', title: '5. Syntax & Parser Safety Rules', method: 'getSyntaxSafetyRules', text: LunoPromptInstructions.getSyntaxSafetyRules() },
      { id: 'aistudio', title: '6. AI Studio & Gemini Quirks', method: 'getAiStudioSpecificRules', text: LunoPromptInstructions.getAiStudioSpecificRules() }
    ];

    var sectionCards = sections.map(function(sec) {
      return m('div', {
        style: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }
      },
        m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.85rem' } }, sec.title),
          m('span', { style: { fontSize: '0.68rem', color: '#8b949e', fontFamily: 'monospace' } }, 'Method: ' + sec.method + '()')
        ),
        m('pre', {
          style: { background: '#070a13', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.55rem', color: '#7ee787', fontSize: '0.74rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '160px', overflowY: 'auto' },
          textContent: sec.text
        }),
        m('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' } },
          m('button', {
            style: { padding: '0.25rem 0.55rem', background: '#161b22', color: '#58a6ff', border: '1px solid #0088cc', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace' },
            onclick: function() {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(sec.text);
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Copied rule to clipboard!', 'success', '📋');
              }
            }
          }, '📋 Copy Rule'),
          m('button', {
            style: { padding: '0.25rem 0.55rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
            onclick: function() {
              if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
                OutboxQueue.addBundle('Rule: ' + sec.title, sec.text);
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Queued rule to Outbox!', 'success', '📤');
              }
            }
          }, 'Outbox ➔')
        )
      );
    });

    var masterCard = m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #8257e5',
        borderRadius: '10px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: '0 4px 16px rgba(130,87,229,0.2)'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' } },
        m('h3', { style: { color: '#d2a8ff', fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '📋 Modular LLM Protocol Instruction Hub'),
        m('div', { style: { display: 'flex', gap: '0.4rem' } },
          m('button', {
            style: { padding: '0.4rem 0.75rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' },
            onclick: function() {
              var full = LunoPromptInstructions.assembleFullInstructions();
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(full);
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Copied Master Instructions!', 'success', '📋');
              }
            }
          }, '📋 Copy Master Prompt'),
          m('button', {
            style: { padding: '0.4rem 0.75rem', background: '#8257e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' },
            onclick: function() {
              var full = LunoPromptInstructions.assembleFullInstructions();
              if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
                OutboxQueue.addBundle('Luno Protocol Master Instructions', full, { priority: 'high' });
                if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Queued Master Instructions to Outbox!', 'success', '📤');
              }
            }
          }, '📤 Send Master Prompt to Outbox')
        )
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
        'These modular instruction blocks teach any LLM how to format files and surgical patches using the HTML Container Protocol. ' +
        'Because each rule is an isolated method on LunoPromptInstructions, you can edit individual paragraphs without replacing the whole document.'
      ),
      m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' } }, ...sectionCards)
    );

    container.appendChild(masterCard);
  }
}

globalThis.LunoPromptInstructions = LunoPromptInstructions;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoPromptInstructions;