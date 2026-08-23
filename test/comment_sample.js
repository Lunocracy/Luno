\nconst tpl = "<!-- preserved comment -->";\n' + closeScript;
      const parsed = LunoPayloadParser.parse(commentPayload);
      const extracted = parsed.files[0] ? parsed.files[0].content : '';
      const commentPreserved = extracted.includes('<!-- preserved comment -->');
      LunoTestRunner.assert('LunoPayloadParser: String Literal Comment Preservation', commentPreserved, '<!-- ... --> inside string literals preserved');
    }
  } catch (e) {
    LunoTestRunner.assert('LunoPayloadParser: String Literal Comment Preservation', false, e.message);
  }

  // Test 9: Strict Header Boundary & Prefix Rejection
  try {
    if (typeof LunoContainerParser !== 'undefined' && typeof LunoContainerParser.parse === 'function') {
      const closeScript = '</' + 'script>';
      const invalidPayload = '<scripture data-file="test/bad.js">\ncontent\n' + closeScript;
      const parsed = LunoContainerParser.parse(invalidPayload);
      const rejectedInvalidTag = parsed.files.length === 0;
      LunoTestRunner.assert('LunoContainerParser: Reject Invalid Tag Prefixes', rejectedInvalidTag, '<scripture> tag prefix rejected');
    }
  } catch (e) {
    LunoTestRunner.assert('LunoContainerParser: Reject Invalid Tag Prefixes', false, e.message);
  }

  return {
    total: LunoTestRunner.results.length,
    passed: LunoTestRunner.results.filter(r => r.success).length,
    failed: LunoTestRunner.results.filter(r => !r.success).length,
    details: LunoTestRunner.results
  };
}