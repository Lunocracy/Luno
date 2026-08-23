class TestServer {
  static getRootDir() {
    return "/root";
  }

  static async parseAndSaveFiles(bodyText, projectOverride) {
    return { success: true, count: 0 };
  }

  static executeServerScript(code) {
    return true;
  }
}

module.exports = TestServer;

static async parseAndSaveFiles(bodyText, projectOverride) {
  const updated = true;
  return { success: updated, count: 42 };
}
