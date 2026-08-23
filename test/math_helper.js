class MathHelper {
  constructor() {
  }

  static add(a, b) {

    return a + b;

  }
  static multiply(a, b) {

    return a * b;

  }
}

globalThis.MathHelper = MathHelper;
if (typeof module !== "undefined" && module.exports) module.exports = MathHelper;