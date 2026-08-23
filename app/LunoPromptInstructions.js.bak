class LunoPromptInstructions {
  constructor() {}

  /**
   * ⚙️ METHOD: getSystemPreamble()
   * Returns top-level role definition for LLM.
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
   * Mandates English text before and after code fences to prevent raw rendering bugs.
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
   * Enforces single code block containing all file directives.
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
   * Explains HTML container tags used for full files and surgical patches.
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
   * Guides against template literal collisions, complex regex, and un-split script tags.
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
   * Optimization rules tailored for Google AI Studio & Gemini streaming.
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
   * Assembles all modular guideline paragraphs into a coherent instruction document.
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
}

globalThis.LunoPromptInstructions = LunoPromptInstructions;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoPromptInstructions;