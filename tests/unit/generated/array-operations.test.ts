// Auto-generated from docs/examples.md
// Category: Array Operations
// Generated: 2025-12-06T16:22:50.457Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Array Operations', () => {

  test('Example 24: FOR to APPEND existing array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
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

  test('Example 25: FOR creates APPEND array if field missing', () => {
    // Input YAML
    const input = {
  "title": "Note"
};

    // Rule
    const condition = "";
    const action = "FOR tags APPEND \"new\"";

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

  test('Example 26: FOR to APPEND non-array (error)', () => {
    // Input YAML
    const input = {
  "status": "draft"
};

    // Rule
    const condition = "";
    const action = "FOR status APPEND \"test\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 27: FOR to PREPEND array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags PREPEND \"urgent\"";

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

  test('Example 28: FOR matching REMOVE value', () => {
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
    const condition = "";
    const action = "FOR tags REMOVE \"urgent\"";

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

  test('Example 29: REMOVE non-existent value (silent)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags REMOVE \"urgent\"";

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

  test('Example 30: FOR specific REMOVE_AT index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags REMOVE_AT 1";

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

  test('Example 31: FOR negative REMOVE_AT index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags REMOVE_AT -1";

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

  test('Example 32: FOR out REMOVE_AT of bounds (error)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags REMOVE_AT 5";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 33: INSERT_AT middle', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags INSERT \"urgent\" AT 1";

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

  test('Example 34: FOR at INSERT end (index = length)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "";
    const action = "FOR tags INSERT \"project\" AT 2";

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

  test('Example 35: DEDUPLICATE array', () => {
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
    const condition = "";
    const action = "FOR tags DEDUPLICATE";

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

  test('Example 36: SORT alphabetically', () => {
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
    const condition = "";
    const action = "FOR tags SORT";

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

  test('Example 37: SORT numbers', () => {
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
    const condition = "";
    const action = "FOR scores SORT";

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

  test('Example 39: SORT_BY object property', () => {
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
    const condition = "";
    const action = "FOR countsLog SORT BY count DESC";

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

  test('Example 40: MOVE by index', () => {
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
    const condition = "";
    const action = "FOR tags MOVE FROM 1 TO 3";

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

  test('Example 41: MOVE_WHERE to index', () => {
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
    const condition = "";
    const action = "FOR countsLog WHERE count > 5 TO 0";

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

  test('Example 42: MOVE_WHERE AFTER', () => {
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
    const condition = "";
    const action = "FOR countsLog WHERE count > 5 AFTER book=\"The Hobbit\"";

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

  test('Example 43: UPDATE_WHERE single field', () => {
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
    const condition = "";
    const action = "FOR countsLog WHERE book=\"BBBK\" SET unit \"Malas\"";

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

  test('Example 44: UPDATE_WHERE multiple fields', () => {
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
    const condition = "";
    const action = "FOR tasks WHERE title=\"Review PR\" SET status \"done\", priority 5, completedDate \"2025-11-19\"";

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

  test('Example 45: UPDATE_WHERE no matches (silent)', () => {
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
    const condition = "";
    const action = "FOR countsLog WHERE title=\"Neuromancer\" SET count 216";

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
