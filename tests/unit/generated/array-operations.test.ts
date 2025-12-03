// Auto-generated from docs/examples.md
// Category: Array Operations
// Generated: 2025-12-02T23:50:16.306Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Array Operations', () => {

  test('Example 16: APPEND to existing array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
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
    "work",
    "project",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 17: APPEND creates array if field missing', () => {
    // Input YAML
    const input = {
  "title": "Note"
};

    // Rule
    const condition = "(none)";
    const action = "APPEND tags \"new\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "Note",
  "tags": [
    "new"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 18: APPEND to non-array (error)', () => {
    // Input YAML
    const input = {
  "status": "draft"
};

    // Rule
    const condition = "(none)";
    const action = "APPEND status \"test\"";

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
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 19: REMOVE matching value', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project",
    "urgent"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REMOVE tags \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 20: REMOVE non-existent value (silent)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REMOVE tags \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ]
};
    const expectedStatus = "warning";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 21: REMOVE_AT specific index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REMOVE_AT tags 1";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 22: REMOVE_AT negative index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REMOVE_AT tags -1";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 23: REMOVE_AT out of bounds (error)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "REMOVE_AT tags 5";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 24: INSERT_AT at end (index = length)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "INSERT_AT tags \"project\" AT 2";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 25: DEDUPLICATE array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "work",
    "project",
    "urgent",
    "work"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "DEDUPLICATE tags";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 26: SORT alphabetically', () => {
    // Input YAML
    const input = {
  "tags": [
    "zebra",
    "apple",
    "mango",
    "banana"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT tags";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "apple",
    "banana",
    "mango",
    "zebra"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 27: SORT numbers', () => {
    // Input YAML
    const input = {
  "scores": [
    100,
    25,
    5,
    300
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT scores";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "scores": [
    5,
    25,
    100,
    300
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 28: SORT_BY object property', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    },
    {
      "book": "1984",
      "count": 54
    },
    {
      "book": "Dune",
      "count": 216
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT_BY countsLog BY count DESC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "Dune",
      "count": 216
    },
    {
      "book": "The Hobbit",
      "count": 108
    },
    {
      "book": "1984",
      "count": 54
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 29: MOVE by index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project",
    "personal"
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE tags FROM 1 TO 3";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project",
    "personal",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 30: MOVE_WHERE to index', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    },
    {
      "book": "Foundation",
      "count": 7
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE_WHERE countsLog WHERE count > 5 TO 0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "Foundation",
      "count": 7
    },
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 31: MOVE_WHERE AFTER', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE_WHERE countsLog WHERE count > 5 AFTER book=\"The Hobbit\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 32: UPDATE_WHERE single field', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "BBBK",
      "count": 108,
      "unit": "Repetitions"
    },
    {
      "book": "The Hobbit",
      "count": 54,
      "unit": "Repetitions"
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE countsLog WHERE book=\"BBBK\" SET unit \"Malas\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "BBBK",
      "count": 108,
      "unit": "Malas"
    },
    {
      "book": "The Hobbit",
      "count": 54,
      "unit": "Repetitions"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 33: UPDATE_WHERE multiple fields', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Review PR",
      "status": "pending",
      "priority": 0
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE tasks WHERE title=\"Review PR\" SET status \"done\", priority 5, completedDate \"2025-11-19\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": [
    {
      "title": "Review PR",
      "status": "done",
      "priority": 5,
      "completedDate": "2025-11-19"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 34: UPDATE_WHERE no matches (silent)', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE countsLog WHERE title=\"Neuromancer\" SET count 216";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    }
  ]
};
    const expectedStatus = "warning";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
