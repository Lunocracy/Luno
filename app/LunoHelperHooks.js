class LunoHelperHooks {
  constructor() {}

  static navigateTo(viewKey = 'workspace') {
    if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.mountView) {
      LunoSpaDock.mountView(viewKey);
    }
  }

  static highlightElement(elementId, durationMs = 4000) {
    const el = document.getElementById(elementId) || document.querySelector('.' + elementId);
    if (!el) return;

    const origShadow = el.style.boxShadow;
    const origBorder = el.style.borderColor;

    el.style.boxShadow = '0 0 24px #00f2fe, 0 0 12px #3fb950';
    el.style.borderColor = '#00f2fe';
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(e) {}

    setTimeout(() => {
      el.style.boxShadow = origShadow;
      el.style.borderColor = origBorder;
    }, durationMs);
  }

  static openPromptNoteWriter(initialText = '') {
    if (typeof OutboxPromptBox !== 'undefined' && OutboxPromptBox.promptWriteNoteModal) {
      OutboxPromptBox.promptWriteNoteModal(initialText);
    } else if (typeof OutboxQueue !== 'undefined' && OutboxQueue.promptWriteNoteModal) {
      OutboxQueue.promptWriteNoteModal(initialText);
    }
  }

  static openTemplateWizard() {
    if (typeof LunoProjectTemplates !== 'undefined' && LunoProjectTemplates.openTemplateWizard) {
      LunoProjectTemplates.openTemplateWizard();
    }
  }
}

globalThis.LunoHelperHooks = LunoHelperHooks;
if (typeof module !== "undefined" && module.exports) module.exports = LunoHelperHooks;