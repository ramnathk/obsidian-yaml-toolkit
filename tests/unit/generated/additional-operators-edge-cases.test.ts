// Auto-generated from docs/examples.md
// Category: Additional Operators & Edge Cases
// Generated: 2025-12-02T23:50:16.312Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Additional Operators & Edge Cases', () => {

  test('Example 53: :string check', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "status": "draft",
  "priority": 5
};

    // Rule
    const condition = "status :string";
    const action = "SET statusType \"text\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "draft",
  "priority": 5,
  "statusType": "text"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 54: :number check', () => {
    // Input YAML
    const input = {
  "priority": 5,
  "count": "123"
};

    // Rule
    const condition = "priority :number";
    const action = "SET priorityType \"numeric\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 5,
  "count": "123",
  "priorityType": "numeric"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 55: :boolean check', () => {
    // Input YAML
    const input = {
  "published": true,
  "draft": false,
  "archived": "yes"
};

    // Rule
    const condition = "published :boolean";
    const action = "SET hasBooleanFlag true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "published": true,
  "draft": false,
  "archived": "yes",
  "hasBooleanFlag": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 56: :object check', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1
  },
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "metadata :object";
    const action = "SET hasMetadata true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1
  },
  "tags": [
    "work",
    "project"
  ],
  "hasMetadata": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 57: >= (greater than or equal)', () => {
    // Input YAML
    const input = {
  "priority": 5,
  "count": 3
};

    // Rule
    const condition = "priority >= 5";
    const action = "SET highPriority true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 5,
  "count": 3,
  "highPriority": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 58: <= (less than or equal)', () => {
    // Input YAML
    const input = {
  "progress": 100,
  "score": 85
};

    // Rule
    const condition = "progress <= 100";
    const action = "SET withinLimit true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "progress": 100,
  "score": 85,
  "withinLimit": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 59: !has (array doesn\'t have)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "tags !has \"archived\"";
    const action = "SET active true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ],
  "active": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 60: !:null (not null)', () => {
    // Input YAML
    const input = {
  "status": "active",
  "deletedAt": null,
  "archivedAt": null
};

    // Rule
    const condition = "status !:null";
    const action = "SET hasStatus true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "active",
  "deletedAt": null,
  "archivedAt": null,
  "hasStatus": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 61: ALL with match', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": true
    }
  ]
};

    // Rule
    const condition = "ALL tasks WHERE done = true";
    const action = "SET allComplete true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": true
    }
  ],
  "allComplete": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 62: ALL with no match (one fails)', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": false
    }
  ]
};

    // Rule
    const condition = "ALL tasks WHERE done = true";
    const action = "SET allComplete true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": false
    }
  ]
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 63: ALL with empty array', () => {
    // Input YAML
    const input = {
  "tasks": []
};

    // Rule
    const condition = "ALL tasks WHERE done = true";
    const action = "SET allComplete true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": []
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 64: INSERT (alternative to INSERT_AT)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "INSERT_AT tags \"urgent\" AT 0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "urgent",
    "work",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 65: INSERT_AFTER', () => {
    // Input YAML
    const input = {
  "tags": [
    "draft",
    "review",
    "publish"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "INSERT_AFTER tags \"approve\" AFTER \"review\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "review",
    "approve",
    "publish"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 66: INSERT_AFTER when target not found (error)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "INSERT_AFTER tags \"followup\" AFTER \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "review",
    "publish"
  ]
};
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 67: REMOVE_ALL (vs REMOVE)', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "REPLACE tags \"old-tag\" WITH \"new-tag\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "new-tag",
    "draft",
    "old-tag"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 68: REPLACE_ALL (all occurrences)', () => {
    // Input YAML
    const input = {
  "tags": [
    "draft",
    "old-tag",
    "draft",
    "old-tag"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REPLACE_ALL tags \"old-tag\" WITH \"new-tag\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "new-tag",
    "draft",
    "new-tag"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 69: RENAME top-level field', () => {
    // Input YAML
    const input = {
  "oldName": "value",
  "status": "active"
};

    // Rule
    const condition = "(none)";
    const action = "RENAME oldName newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "newName": "value",
  "status": "active"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 70: RENAME nested field', () => {
    // Input YAML
    const input = {
  "metadata": {
    "oldField": "data",
    "author": "John"
  }
};

    // Rule
    const condition = "(none)";
    const action = "RENAME metadata.oldField metadata.newField";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "newField": "data",
    "author": "John"
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 71: RENAME when source doesn\'t exist (silent)', () => {
    // Input YAML
    const input = {
  "status": "active"
};

    // Rule
    const condition = "(none)";
    const action = "RENAME nonExistent newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "active"
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 72: RENAME when target exists (overwrite)', () => {
    // Input YAML
    const input = {
  "oldName": "old value",
  "newName": "existing value"
};

    // Rule
    const condition = "(none)";
    const action = "RENAME oldName newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "newName": "old value"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 73: String length', () => {
    // Input YAML
    const input = {
  "title": "This is a very long title",
  "shortTitle": "Hi"
};

    // Rule
    const condition = "title.length > 20";
    const action = "SET longTitle true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "This is a very long title",
  "shortTitle": "Hi",
  "longTitle": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 74: Object keys length', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1,
    "created": "2025-11-01",
    "updated": "2025-11-15"
  }
};

    // Rule
    const condition = "metadata.length > 3";
    const action = "SET richMetadata true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1,
    "created": "2025-11-01",
    "updated": "2025-11-15"
  },
  "richMetadata": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 75: Exact length match', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "tags.length = 3";
    const action = "SET hasThreeTags true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ],
  "hasThreeTags": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 76: Multiple type checks', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "priority": 5,
  "published": true
};

    // Rule
    const condition = "title :string AND priority :number AND published :boolean";
    const action = "SET wellFormed true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "priority": 5,
  "published": true,
  "wellFormed": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 77: Range check (between values)', () => {
    // Input YAML
    const input = {
  "priority": 7
};

    // Rule
    const condition = "priority >= 5 AND priority <= 10";
    const action = "SET mediumPriority true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 7,
  "mediumPriority": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 78: Complex ANY/ALL combination', () => {
    // Input YAML
    const input = {
  "projects": [
    {
      "name": "Alpha",
      "status": "active",
      "priority": 8
    },
    {
      "name": "Beta",
      "status": "active",
      "priority": 3
    }
  ]
};

    // Rule
    const condition = "ANY projects WHERE status = \"active\" AND ALL projects WHERE priority > 0";
    const action = "SET hasActiveProjects true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "projects": [
    {
      "name": "Alpha",
      "status": "active",
      "priority": 8
    },
    {
      "name": "Beta",
      "status": "active",
      "priority": 3
    }
  ],
  "hasActiveProjects": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
