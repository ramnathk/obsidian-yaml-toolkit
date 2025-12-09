// Auto-generated from docs/examples.md
// Category: Obsidian-Specific Fields
// Generated: 2025-12-06T16:22:50.464Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Obsidian-Specific Fields', () => {

  test('Example 74: Add tag', () => {
    // Input YAML
    const input = {
  "tags": [
    "project",
    "work"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags APPEND \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "project",
    "work",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 75: Set aliases', () => {
    // Input YAML
    const input = {
  "title": "Project Overview"
};

    // Rule
    const condition = "";
    const action = "SET aliases [\"Overview\", \"Project Summary\"]";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "Project Overview",
  "aliases": [
    "Overview",
    "Project Summary"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 77: Dataview custom fields', () => {
    // Input YAML
    const input = {
  "project": "Website Redesign"
};

    // Rule - NOTE: Multiple SETs executed sequentially
    // (Multi-field SET in single statement not yet implemented)
    const condition = "project exists";

    // Execute multiple SET operations
    let data = { ...input };
    const result1 = executeTestRule({ condition, action: 'SET status "active"' }, data);
    data = result1.newData;
    const result2 = executeTestRule({ condition: "", action: 'SET priority 5' }, data);
    data = result2.newData;
    const result = executeTestRule({ condition: "", action: 'SET dueDate "2025-12-31"' }, data);

    // Expected output
    const expectedOutput = {
  "project": "Website Redesign",
  "status": "active",
  "priority": 5,
  "dueDate": "2025-12-31"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);

  });
});
