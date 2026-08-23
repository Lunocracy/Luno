class ProtocolTest {
  constructor() {
  }

  getVersion() {

    return "1.1.0-patched";

  }
  getAuthor() {

    return "Luno Protocol Suite";

  }
  computeTotal(a, b) {

    const MathHelper = typeof require !== 'undefined' ? require('./math_helper.js') : globalThis.MathHelper;
    return MathHelper.add(a, b) * 2;

  }
}

globalThis.ProtocolTest = ProtocolTest;
if (typeof module !== "undefined" && module.exports) module.exports = ProtocolTest;