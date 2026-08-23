class CodeDiffer {
  constructor() {

  }

  static diff(oldCode = '', newCode = '') {

    if (oldCode === newCode) return [];
    const linesA = oldCode.split(/\r?\n/), linesB = newCode.split(/\r?\n/);
    const spans = [];
    const max = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < max; i++) {
      if (linesA[i] !== linesB[i]) {
        if (linesA[i] !== undefined) spans.push({ type: 'delete', oldStartLine: i + 1, lines: [linesA[i]] });
        if (linesB[i] !== undefined) spans.push({ type: 'add', newStartLine: i + 1, lines: [linesB[i]] });
      }
    }
    return spans;

  }
}

globalThis.CodeDiffer = CodeDiffer;
if (typeof module !== "undefined" && module.exports) module.exports = CodeDiffer;