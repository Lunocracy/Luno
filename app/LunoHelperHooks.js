class LunoHelperHooks {
  /**
   * ⚙️ CONSTRUCTOR: LunoHelperHooks()
   */
  constructor() {

  }

  /**
   * ⚙️ METHOD: navigateTo(viewKey = 'workspace')
   * - Type: Static Method
   * - Modifier: sync
   */
  static navigateTo(viewKey = 'workspace') {

    if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.mountView) {
      LunoSpaDock.mountView(viewKey);
    }

  }
  /**
   * ⚙️ METHOD: highlightElement(elementId, durationMs = 4000)
   * - Type: Static Method
   * - Modifier: sync
   */
  static highlightElement(elementId, durationMs = 4000) {

    const el = document.getElementById(elementId);
    if (!el) return;

    const origShadow = el.style.boxShadow;
    const origBorder = el.style.borderColor;

    el.style.boxShadow = '0 0 24px #00f2fe, 0 0 12px #3fb950';
    el.style.borderColor = '#00f2fe';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      el.style.boxShadow = origShadow;
      el.style.borderColor = origBorder;
    }, durationMs);

  }
  /**
   * ⚙️ METHOD: openPromptNoteWriter(initialText = '')
   * - Type: Static Method
   * - Modifier: sync
   */
  static openPromptNoteWriter(initialText = '') {

    if (typeof OutboxQueue !== 'undefined' && OutboxQueue.promptWriteNoteModal) {
      OutboxQueue.promptWriteNoteModal(initialText);
    }

  }
  /**
   * ⚙️ METHOD: openTemplateWizard()
   * - Type: Static Method
   * - Modifier: sync
   */
  static openTemplateWizard() {

    if (typeof LunoProjectTemplates !== 'undefined' && LunoProjectTemplates.openTemplateWizard) {
      LunoProjectTemplates.openTemplateWizard();
    }

  }
}

globalThis.LunoHelperHooks = LunoHelperHooks;
if (typeof module !== "undefined" && module.exports) module.exports = LunoHelperHooks;