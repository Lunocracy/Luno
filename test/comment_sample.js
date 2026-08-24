class CommentSample {
  constructor() {}

  static getSample() {
    const tpl = "<!-- preserved comment test -->";
    return {
      template: tpl,
      valid: true
    };
  }
}

globalThis.CommentSample = CommentSample;
if (typeof module !== 'undefined' && module.exports) module.exports = CommentSample;