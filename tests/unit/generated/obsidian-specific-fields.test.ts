// Auto-generated from docs/examples.md
// Category: Obsidian-Specific Fields
// Generated: 2025-12-02T23:50:16.311Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Obsidian-Specific Fields', () => {

  test('Example 50: Add tag', () => {
    // Input YAML
    const input = {
  "tags": [
    "project",
    "work"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "APPEND tags \"urgent\"";

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

  test('Example 51: Set aliases', () => {
    // Input YAML
    const input = {
  "title": "Project Overview"
};

    // Rule
    const condition = "(none)";
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

  test('Example 52: Dataview custom fields', () => {
    // Input YAML
    const input = {
  "project": "Website Redesign"
};

    // Rule
    const condition = "project exists";
    const action = "SET status \"active\", priority 5, dueDate \"2025-12-31\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

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
