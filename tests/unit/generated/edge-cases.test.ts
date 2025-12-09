// Auto-generated from docs/examples.md
// Category: Edge Cases
// Generated: 2025-12-06T16:22:50.460Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Edge Cases', () => {

  test('Example 67: Empty frontmatter block', () => {
    // Input YAML (empty frontmatter)
    const input = {};

    // Rule
    const condition = "";
    const action = "SET status \"draft\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "draft"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);

  });

  test.skip('Example 68: Invalid YAML (parse error)', () => {
    // NOTE: This test is skipped because testRuleExecutor works with parsed objects,
    // not raw YAML strings, so it cannot test YAML parsing errors.
    // YAML parsing is tested separately in yamlProcessor tests.

    // Input YAML
    const input = {};

    // Rule
    const condition = "";
    const action = "SET reviewed true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred

  });
});
