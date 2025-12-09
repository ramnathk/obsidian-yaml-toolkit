// Auto-generated from docs/examples.md
// Category: Object Operations
// Generated: 2025-12-06T16:22:50.458Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Object Operations', () => {

  test('Example 46: MERGE simple object', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1
  }
};

    // Rule
    const condition = "";
    const action = "FOR metadata MERGE { \"editor\": \"Jane\", \"reviewed\": true }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1,
    "editor": "Jane",
    "reviewed": true
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 47: MERGE overwrites existing keys', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1
  }
};

    // Rule
    const condition = "";
    const action = "FOR metadata MERGE { \"version\": \"2.0\", \"status\": \"published\" }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 2,
    "status": "published"
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 48: MERGE deep (nested objects)', () => {
    // Input YAML
    const input = {
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 14
    },
    "data": {
      "cache": true
    }
  }
};

    // Rule
    const condition = "";
    const action = "FOR config MERGE { \"ui\": { \"fontSize\": 16, \"fontFamily\": \"Arial\" } }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 16,
      "fontFamily": "Arial"
    },
    "data": {
      "cache": true
    }
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 49: MERGE with arrays (arrays REPLACED, not merged)', () => {
    // Input YAML
    const input = {
  "data": {
    "tags": [
      "a",
      "b",
      "c"
    ],
    "count": 5
  }
};

    // Rule
    const condition = "";
    const action = "FOR data MERGE { \"tags\": [\"x\", \"y\"], \"count\": 10 }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "data": {
    "tags": [
      "x",
      "y"
    ],
    "count": 10
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 50: MERGE_OVERWRITE vs MERGE', () => {
    // Input YAML
    const input = {
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 14
    }
  }
};

    // Rule
    const condition = "";
    const action = "FOR config MERGE { \"ui\": { \"fontSize\": 16 } }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 16
    }
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
