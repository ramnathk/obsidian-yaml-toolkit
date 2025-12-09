/**
 * Hybrid v2.0 Grammar: Edge Cases and Error Handling Tests
 *
 * Tests edge cases, error conditions, and boundary scenarios for Hybrid v2.0 grammar:
 * - Scalar operations (SET, DELETE, RENAME, INCREMENT, DECREMENT) work WITHOUT FOR
 * - Collection operations (arrays, objects, WHERE clauses) require FOR
 * - Tests parser validation, runtime errors, and helpful error messages
 *
 * Expected: ALL TESTS WILL FAIL (parser not updated to Hybrid v2.0)
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '@/parser/actionParser';
// import { executeActions } from '@/actions/actionDispatcher'; // v2.0 not implemented yet

describe.skip('Hybrid v2.0 Grammar: Edge Cases and Error Handling', () => {
  describe('Parser errors: Scalar operations reject FOR keyword', () => {
    it('should reject: FOR title SET "value" (FOR not allowed for scalar SET)', () => {
      expect(() => parseAction('FOR title SET "value"'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: title SET "value"/i);
    });

    it('should reject: FOR field DELETE (FOR not allowed for DELETE)', () => {
      expect(() => parseAction('FOR field DELETE'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: field DELETE/i);
    });

    it('should reject: FOR old RENAME TO new (FOR not allowed for RENAME)', () => {
      expect(() => parseAction('FOR old RENAME TO new'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: old RENAME TO new/i);
    });

    it('should reject: FOR count INCREMENT 1 (FOR not allowed for INCREMENT)', () => {
      expect(() => parseAction('FOR count INCREMENT 1'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: count SET count\+1/i);
    });

    it('should reject: FOR count DECREMENT 1 (FOR not allowed for DECREMENT)', () => {
      expect(() => parseAction('FOR count DECREMENT 1'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: count SET count-1/i);
    });
  });

  describe('Parser errors: Collection operations require FOR keyword', () => {
    it('should reject: tags INSERT "value" AT 0 (missing FOR for array operation)', () => {
      expect(() => parseAction('tags INSERT "value" AT 0'))
        .toThrow(/Hybrid v2\.0: Collection operations require FOR keyword.*Use: FOR tags INSERT "value" AT 0/i);
    });

    it('should reject: tags SORT (missing FOR)', () => {
      expect(() => parseAction('tags SORT'))
        .toThrow(/Hybrid v2\.0: Collection operations require FOR keyword.*Use: FOR tags SORT/i);
    });

    it('should reject: metadata MERGE {"key": "value"} (missing FOR)', () => {
      expect(() => parseAction('metadata MERGE {"key": "value"}'))
        .toThrow(/Hybrid v2\.0: Collection operations require FOR keyword.*Use: FOR metadata MERGE/i);
    });

    it('should reject: tasks WHERE status = "done" SET flag true (missing FOR)', () => {
      expect(() => parseAction('tasks WHERE status = "done" SET flag true'))
        .toThrow(/Hybrid v2\.0: WHERE clauses require FOR keyword.*Use: FOR tasks WHERE/i);
    });
  });

  describe('Parser errors: Invalid scalar operation syntax', () => {
    it('should reject: title (missing operation)', () => {
      expect(() => parseAction('title'))
        .toThrow(/Expected operation keyword after path/i);
    });

    it('should reject: title INVALID (invalid operation)', () => {
      expect(() => parseAction('title INVALID'))
        .toThrow(/Unknown operation: INVALID/i);
    });

    it('should reject: title SET (missing value)', () => {
      expect(() => parseAction('title SET'))
        .toThrow(/Expected value after SET/i);
    });

    it('should reject: title RENAME (missing TO)', () => {
      expect(() => parseAction('title RENAME'))
        .toThrow(/Expected TO after RENAME/i);
    });

    it('should reject: title RENAME TO (missing new name)', () => {
      expect(() => parseAction('title RENAME TO'))
        .toThrow(/Expected identifier after TO/i);
    });
  });

  describe('Parser errors: Invalid FOR collection syntax', () => {
    it('should reject: FOR (missing path)', () => {
      expect(() => parseAction('FOR'))
        .toThrow(/Expected path after FOR/i);
    });

    it('should reject: FOR INSERT "value" (missing path)', () => {
      expect(() => parseAction('FOR INSERT "value"'))
        .toThrow(/Expected collection path after FOR/i);
    });

    it('should reject: FOR tags (missing operation)', () => {
      expect(() => parseAction('FOR tags'))
        .toThrow(/Expected collection operation keyword/i);
    });

    it('should reject: FOR tags INVALID (invalid operation)', () => {
      expect(() => parseAction('FOR tags INVALID'))
        .toThrow(/Unknown collection operation: INVALID/i);
    });
  });

  describe('Parser errors: Array operations', () => {
    it('should reject: FOR tags INSERT (missing value)', () => {
      expect(() => parseAction('FOR tags INSERT'))
        .toThrow(/Expected value after INSERT/i);
    });

    it('should reject: FOR tags INSERT "value" (missing AT)', () => {
      expect(() => parseAction('FOR tags INSERT "value"'))
        .toThrow(/Expected AT after INSERT value/i);
    });

    it('should reject: FOR tags INSERT "value" AT (missing index)', () => {
      expect(() => parseAction('FOR tags INSERT "value" AT'))
        .toThrow(/Expected index after AT/i);
    });

    it('should reject: FOR tags INSERT "value" AT abc (non-numeric index)', () => {
      expect(() => parseAction('FOR tags INSERT "value" AT abc'))
        .toThrow(/Expected numeric index after AT/i);
    });

    it('should reject: FOR tags REMOVE_ALL (missing value)', () => {
      expect(() => parseAction('FOR tags REMOVE_ALL'))
        .toThrow(/Expected value after REMOVE_ALL/i);
    });

    it('should reject: FOR tags SORT INVALID (invalid order)', () => {
      expect(() => parseAction('FOR tags SORT INVALID'))
        .toThrow(/Expected ASC, DESC, or BY after SORT/i);
    });

    it('should reject: FOR tags SORT BY (missing field)', () => {
      expect(() => parseAction('FOR tags SORT BY'))
        .toThrow(/Expected field name after BY/i);
    });

    it('should reject: FOR tags MOVE FROM (missing index)', () => {
      expect(() => parseAction('FOR tags MOVE FROM'))
        .toThrow(/Expected index after FROM/i);
    });

    it('should reject: FOR tags MOVE FROM 0 (missing TO)', () => {
      expect(() => parseAction('FOR tags MOVE FROM 0'))
        .toThrow(/Expected TO after FROM index/i);
    });

    it('should reject: FOR tags MOVE FROM 0 TO (missing index)', () => {
      expect(() => parseAction('FOR tags MOVE FROM 0 TO'))
        .toThrow(/Expected index after TO/i);
    });
  });

  describe('Parser errors: WHERE clauses', () => {
    it('should reject: FOR tasks WHERE (missing condition)', () => {
      expect(() => parseAction('FOR tasks WHERE'))
        .toThrow(/Expected condition after WHERE/i);
    });

    it('should reject: FOR tasks WHERE status (incomplete condition)', () => {
      expect(() => parseAction('FOR tasks WHERE status'))
        .toThrow(/Expected operator after field/i);
    });

    it('should reject: FOR tasks WHERE status = (missing value)', () => {
      expect(() => parseAction('FOR tasks WHERE status ='))
        .toThrow(/Expected value after operator/i);
    });

    it('should reject: FOR tasks WHERE status = "done" (missing operation)', () => {
      expect(() => parseAction('FOR tasks WHERE status = "done"'))
        .toThrow(/Expected operation after WHERE clause/i);
    });

    it('should reject: FOR tasks WHERE status = "done" SET (missing updates)', () => {
      expect(() => parseAction('FOR tasks WHERE status = "done" SET'))
        .toThrow(/Expected field name and value after SET/i);
    });

    it('should reject: FOR tasks WHERE status = "done" MOVE (missing TO)', () => {
      expect(() => parseAction('FOR tasks WHERE status = "done" MOVE'))
        .toThrow(/Expected TO after MOVE/i);
    });

    it('should reject: FOR tasks WHERE status = "done" MOVE TO (missing target)', () => {
      expect(() => parseAction('FOR tasks WHERE status = "done" MOVE TO'))
        .toThrow(/Expected target after TO \(START, END, AFTER, BEFORE\)/i);
    });
  });

  describe('Parser errors: Expression syntax', () => {
    it('should reject: count SET count+ (missing operand)', () => {
      expect(() => parseAction('count SET count+'))
        .toThrow(/Expected value after operator/i);
    });

    it('should reject: count SET +1 (missing left operand)', () => {
      expect(() => parseAction('count SET +1'))
        .toThrow(/Expected field reference before operator/i);
    });

    it('should reject: count SET count ^ 2 (invalid operator)', () => {
      expect(() => parseAction('count SET count ^ 2'))
        .toThrow(/Invalid operator: \^/i);
    });

    it('should reject: count SET count + + 1 (double operator)', () => {
      expect(() => parseAction('count SET count + + 1'))
        .toThrow(/Unexpected operator/i);
    });
  });

  describe('Runtime errors: Type mismatches', () => {
    it('should error on arithmetic with string', () => {
      const data = { title: 'Hello' };
      const actions = [parseAction('title SET title+5')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot perform arithmetic on non-numeric value/i);
    });

    it('should error on arithmetic with boolean', () => {
      const data = { enabled: true };
      const actions = [parseAction('enabled SET enabled+1')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot perform arithmetic on non-numeric value/i);
    });

    it('should error on arithmetic with array', () => {
      const data = { tags: ['a', 'b'] };
      const actions = [parseAction('tags SET tags+1')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot perform arithmetic on non-numeric value/i);
    });

    it('should error on arithmetic with object', () => {
      const data = { metadata: { author: 'Alice' } };
      const actions = [parseAction('metadata SET metadata+1')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot perform arithmetic on non-numeric value/i);
    });

    it('should error on division by zero', () => {
      const data = { value: 100 };
      const actions = [parseAction('value SET value/0')];

      expect(() => executeActions(data, actions))
        .toThrow(/Division by zero/i);
    });

    it('should error on modulo by zero', () => {
      const data = { value: 100 };
      const actions = [parseAction('value SET value%0')];

      expect(() => executeActions(data, actions))
        .toThrow(/Modulo by zero/i);
    });
  });

  describe('Runtime errors: Invalid operations on types', () => {
    it('should error: INSERT on non-array', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title INSERT "value" AT 0')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot INSERT: title is not an array/i);
    });

    it('should error: FOR on REMOVE_ALL non-array', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title REMOVE_ALL "value"')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot REMOVE_ALL: title is not an array/i);
    });

    it('should error: SORT on non-array', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title SORT')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot SORT: title is not an array/i);
    });

    it('should error: MOVE on non-array', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title MOVE FROM 0 TO 1')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot MOVE: title is not an array/i);
    });

    it('should error: FOR on DEDUPLICATE non-array', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title DEDUPLICATE')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot DEDUPLICATE: title is not an array/i);
    });

    it('should error: FOR on MERGE non-object', () => {
      const data = { title: 'Note' };
      const actions = [parseAction('FOR title MERGE {"key": "value"}')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot MERGE: title is not an object/i);
    });

    it('should error: SORT BY missing field', () => {
      const data = {
        tasks: [
          { title: 'Task 1' },
          { title: 'Task 2' }
        ]
      };
      const actions = [parseAction('FOR tasks SORT BY priority')];

      expect(() => executeActions(data, actions))
        .toThrow(/Cannot SORT BY priority: field not found in array items/i);
    });
  });

  describe('Edge case: Empty data structures', () => {
    it('should handle empty arrays: FOR tags INSERT "value" AT 0', () => {
      const data = { tags: [] };
      const actions = [parseAction('FOR tags INSERT "value" AT 0')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['value']);
    });

    it('should handle empty arrays: FOR tags SORT', () => {
      const data = { tags: [] };
      const actions = [parseAction('FOR tags SORT')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual([]);
    });

    it('should handle empty arrays: FOR tags DEDUPLICATE', () => {
      const data = { tags: [] };
      const actions = [parseAction('FOR tags DEDUPLICATE')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual([]);
    });

    it('should handle empty objects: FOR metadata MERGE {"key": "value"}', () => {
      const data = { metadata: {} };
      const actions = [parseAction('FOR metadata MERGE {"key": "value"}')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.metadata).toEqual({ key: 'value' });
    });

    it('should handle empty WHERE results: FOR tasks WHERE status = "done" REMOVE', () => {
      const data = {
        tasks: [
          { title: 'Task 1', status: 'pending' },
          { title: 'Task 2', status: 'pending' }
        ]
      };
      const actions = [parseAction('FOR tasks WHERE status = "done" REMOVE')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks).toHaveLength(2);
    });
  });

  describe('Edge case: Boundary indices', () => {
    it('should handle INSERT AT 0 on empty array', () => {
      const data = { tags: [] };
      const actions = [parseAction('FOR tags INSERT "first" AT 0')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['first']);
    });

    it('should handle INSERT AT -1 on empty array', () => {
      const data = { tags: [] };
      const actions = [parseAction('FOR tags INSERT "last" AT -1')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['last']);
    });

    it('should handle large positive index: FOR tags INSERT "value" AT 1000', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags INSERT "value" AT 1000')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags[result.data.tags.length - 1]).toBe('value');
    });

    it('should handle large negative index: FOR tags INSERT "value" AT -1000', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags INSERT "value" AT -1000')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags[0]).toBe('value');
    });

    it('should handle MOVE FROM out of bounds', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags MOVE FROM 10 TO 0')];

      expect(() => executeActions(data, actions))
        .toThrow(/Index out of bounds: 10/i);
    });

    it('should handle MOVE TO negative index', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags MOVE FROM 0 TO -1')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags[result.data.tags.length - 1]).toBe('a');
    });
  });

  describe('Edge case: Special characters and escaping', () => {
    it('should handle quotes in strings: title SET "Hello \\"World\\""', () => {
      const data = { title: 'Old' };
      const actions = [parseAction('title SET "Hello \\"World\\""')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Hello "World"');
    });

    it('should handle newlines in strings: notes SET "Line 1\\nLine 2"', () => {
      const data = { notes: '' };
      const actions = [parseAction('notes SET "Line 1\\nLine 2"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.notes).toBe('Line 1\nLine 2');
    });

    it('should handle tabs in strings: data SET "Col1\\tCol2"', () => {
      const data = { data: '' };
      const actions = [parseAction('data SET "Col1\\tCol2"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.data).toBe('Col1\tCol2');
    });

    it('should handle unicode: title SET "Hello 世界"', () => {
      const data = { title: '' };
      const actions = [parseAction('title SET "Hello 世界"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Hello 世界');
    });

    it('should handle emoji: title SET "Task 🎯"', () => {
      const data = { title: '' };
      const actions = [parseAction('title SET "Task 🎯"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Task 🎯');
    });
  });

  describe('Edge case: Deeply nested paths', () => {
    it('should handle deep nesting: a.b.c.d.e SET "value"', () => {
      const data = { a: { b: { c: { d: {} } } } };
      const actions = [parseAction('a.b.c.d.e SET "value"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.a.b.c.d.e).toBe('value');
    });

    it('should create missing intermediate paths', () => {
      const data = {};
      const actions = [parseAction('a.b.c SET "value"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.a.b.c).toBe('value');
    });

    it('should handle array indices in paths: items[0].metadata.tags[1] SET "value"', () => {
      const data = {
        items: [
          { metadata: { tags: ['a', 'b', 'c'] } }
        ]
      };
      const actions = [parseAction('items[0].metadata.tags[1] SET "updated"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.items[0].metadata.tags[1]).toBe('updated');
    });
  });

  describe('Edge case: Concurrent operations', () => {
    it('should handle multiple operations on same field', () => {
      const data = { count: 10 };
      const actions = [
        parseAction('count SET count+5'),
        parseAction('count SET count*2'),
        parseAction('count SET count-3')
      ];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(27); // ((10+5)*2)-3
    });

    it('should handle operations on array during iteration', () => {
      const data = {
        tasks: [
          { title: 'Task 1', priority: 5 },
          { title: 'Task 2', priority: 3 },
          { title: 'Task 3', priority: 8 }
        ]
      };
      const actions = [
        parseAction('FOR tasks WHERE priority < 5 SET priority priority+2'),
        parseAction('FOR tasks SORT BY priority DESC')
      ];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks[0].priority).toBeGreaterThanOrEqual(result.data.tasks[1].priority);
    });
  });

  describe('Edge case: Numeric precision', () => {
    it('should handle float precision: price SET price+0.2', () => {
      const data = { price: 0.1 };
      const actions = [parseAction('price SET price+0.2')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.price).toBeCloseTo(0.3, 10);
    });

    it('should handle very large numbers', () => {
      const data = { count: 9007199254740991 }; // MAX_SAFE_INTEGER
      const actions = [parseAction('count SET count+1')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(9007199254740992);
    });

    it('should handle very small numbers', () => {
      const data = { value: 0.0000001 };
      const actions = [parseAction('value SET value*2')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.value).toBeCloseTo(0.0000002, 10);
    });
  });

  describe('Edge case: Complex WHERE conditions', () => {
    it('should handle deeply nested logic: FOR tasks WHERE (a = 1 AND b = 2) OR (c = 3 AND d = 4) SET flag true', () => {
      const data = {
        tasks: [
          { a: 1, b: 2, c: 0, d: 0 },
          { a: 0, b: 0, c: 3, d: 4 },
          { a: 0, b: 0, c: 0, d: 0 }
        ]
      };
      const input = 'FOR tasks WHERE (a = 1 AND b = 2) OR (c = 3 AND d = 4) SET flag true';
      const actions = [parseAction(input)];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks[0].flag).toBe(true);
      expect(result.data.tasks[1].flag).toBe(true);
      expect(result.data.tasks[2].flag).toBeUndefined();
    });

    it('should handle multiple NOT: FOR tasks WHERE NOT (NOT status = "done") SET final true', () => {
      const data = {
        tasks: [
          { status: 'done' },
          { status: 'pending' }
        ]
      };
      const input = 'FOR tasks WHERE NOT (NOT status = "done") SET final true';
      const actions = [parseAction(input)];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks[0].final).toBe(true);
      expect(result.data.tasks[1].final).toBeUndefined();
    });
  });

  describe('Error messages quality', () => {
    it('should provide helpful error for incorrect FOR usage on scalar', () => {
      expect(() => parseAction('FOR title SET "value"'))
        .toThrow(/Hybrid v2\.0: FOR keyword not allowed for scalar operations.*Use: title SET "value"/i);
    });

    it('should provide helpful error for missing FOR on array operation', () => {
      expect(() => parseAction('tags INSERT "value" AT 0'))
        .toThrow(/Hybrid v2\.0: Collection operations require FOR keyword.*Use: FOR tags INSERT "value" AT 0/i);
    });

    it('should suggest correct syntax for v1.0 INCREMENT', () => {
      expect(() => parseAction('INCREMENT count 1'))
        .toThrow(/Unknown operation.*Use: count SET count\+1/i);
    });

    it('should provide location in error', () => {
      expect(() => parseAction('title SET "unterminated'))
        .toThrow(/Unterminated string at position \d+/i);
    });

    it('should provide context in parser errors', () => {
      expect(() => parseAction('FOR tasks WHERE status = "done" INVALID'))
        .toThrow(/Unknown operation: INVALID.*Expected: SET, REMOVE, MOVE/i);
    });

    it('should explain Hybrid syntax in errors', () => {
      expect(() => parseAction('FOR count SET count+1'))
        .toThrow(/Hybrid v2\.0.*scalar operations.*without FOR/i);
    });
  });
});
