/**
 * v2.0 Grammar: Array Operations Tests
 *
 * Tests for v2.0 array operations with FOR prefix:
 * - FOR array INSERT value AT index (replaces APPEND/PREPEND/INSERT_AT)
 * - FOR array FOR value REMOVE_ALL (polymorphic: value | array)
 * - FOR array SORT [BY field] [order]
 * - FOR array MOVE FROM index TO index
 * - FOR array DEDUPLICATE
 *
 * Key changes from v1.0:
 * - INSERT with special indices: AT 0 = start, AT -1 = end
 * - FOR accepts REMOVE_ALL single value OR array (eliminates REMOVE_ANY)
 * - ADD eliminated (use INSERT)
 * - APPEND/FOR eliminated PREPEND (use INSERT AT -1 / INSERT AT 0)
 *
 * Expected: ALL TESTS WILL FAIL (parser not updated to v2.0)
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '@/parser/actionParser';
// import { executeActions } from '@/actions/actionDispatcher'; // v2.0 not implemented yet

describe.skip('v2.0 Grammar: Array Operations', () => {
  describe('FOR ... INSERT AT (replaces APPEND/PREPEND)', () => {
    it('should parse: FOR tags INSERT "urgent" AT -1 (append to end)', () => {
      const input = 'FOR tags INSERT "urgent" AT -1';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'tags' }] },
        operation: {
          type: 'INSERT',
          value: 'urgent',
          at: -1
        }
      });
    });

    it('should execute: FOR tags INSERT "urgent" AT -1 (append)', () => {
      const data = { tags: ['work', 'project'] };
      const actions = [parseAction('FOR tags INSERT "urgent" AT -1')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['work', 'project', 'urgent']);
      expect(result.changes).toContain('INSERT tags AT -1: "urgent"');
    });

    it('should parse: FOR tags INSERT "important" AT 0 (prepend to start)', () => {
      const input = 'FOR tags INSERT "important" AT 0';
      const result = parseAction(input);

      expect(result.operation).toEqual({
        type: 'INSERT',
        value: 'important',
        at: 0
      });
    });

    it('should execute: FOR tags INSERT "important" AT 0 (prepend)', () => {
      const data = { tags: ['work', 'project'] };
      const actions = [parseAction('FOR tags INSERT "important" AT 0')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['important', 'work', 'project']);
    });

    it('should parse: FOR tasks INSERT value AT 2 (specific position)', () => {
      const input = 'FOR tasks INSERT {"title": "Task"} AT 2';
      const result = parseAction(input);

      expect(result.operation.at).toBe(2);
      expect(result.operation.value).toEqual({ title: 'Task' });
    });

    it('should execute: FOR tags INSERT "middle" AT 2', () => {
      const data = { tags: ['a', 'b', 'c', 'd'] };
      const actions = [parseAction('FOR tags INSERT "middle" AT 2')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['a', 'b', 'middle', 'c', 'd']);
    });

    it('should handle negative indices: FOR tags INSERT "second-last" AT -2', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags INSERT "second-last" AT -2')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['a', 'second-last', 'b', 'c']);
    });
  });

  describe('FOR ... REMOVE_ALL (polymorphic)', () => {
    it('should parse: FOR tags REMOVE_ALL "draft" (single value)', () => {
      const input = 'FOR tags REMOVE_ALL "draft"';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'tags' }] },
        operation: {
          type: 'REMOVE_ALL',
          value: 'draft'
        }
      });
    });

    it('should execute: FOR tags REMOVE_ALL "draft" (single value)', () => {
      const data = { tags: ['work', 'draft', 'project', 'draft'] };
      const actions = [parseAction('FOR tags REMOVE_ALL "draft"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['work', 'project']);
      expect(result.changes).toContain('REMOVE_ALL tags: "draft"');
    });

    it('should parse: FOR tags REMOVE_ALL ["old", "wip", "temp"] (array of values)', () => {
      const input = 'FOR tags REMOVE_ALL ["old", "wip", "temp"]';
      const result = parseAction(input);

      expect(result.operation).toEqual({
        type: 'REMOVE_ALL',
        value: ['old', 'wip', 'temp']
      });
    });

    it('should execute: FOR tags REMOVE_ALL ["old", "wip"] (multiple values)', () => {
      const data = { tags: ['work', 'old', 'project', 'wip', 'important'] };
      const actions = [parseAction('FOR tags REMOVE_ALL ["old", "wip"]')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['work', 'project', 'important']);
    });

    it('should execute: FOR tags REMOVE_ALL ["a", "b", "c"] (remove multiple)', () => {
      const data = { tags: ['a', 'b', 'keep', 'c', 'keep2'] };
      const actions = [parseAction('FOR tags REMOVE_ALL ["a", "b", "c"]')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['keep', 'keep2']);
    });

    it('should handle missing values gracefully', () => {
      const data = { tags: ['work', 'project'] };
      const actions = [parseAction('FOR tags REMOVE_ALL "nonexistent"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['work', 'project']);
    });
  });

  describe('FOR ... SORT', () => {
    it('should parse: FOR tags SORT (default ascending)', () => {
      const input = 'FOR tags SORT';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'tags' }] },
        operation: {
          type: 'SORT',
          order: 'ASC'
        }
      });
    });

    it('should execute: FOR tags SORT', () => {
      const data = { tags: ['zebra', 'apple', 'banana'] };
      const actions = [parseAction('FOR tags SORT')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['apple', 'banana', 'zebra']);
    });

    it('should parse: FOR tags SORT DESC', () => {
      const input = 'FOR tags SORT DESC';
      const result = parseAction(input);

      expect(result.operation).toEqual({
        type: 'SORT',
        order: 'DESC'
      });
    });

    it('should execute: FOR tags SORT DESC', () => {
      const data = { tags: ['zebra', 'apple', 'banana'] };
      const actions = [parseAction('FOR tags SORT DESC')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['zebra', 'banana', 'apple']);
    });

    it('should parse: FOR tasks SORT BY priority', () => {
      const input = 'FOR tasks SORT BY priority';
      const result = parseAction(input);

      expect(result.operation).toEqual({
        type: 'SORT',
        by: 'priority',
        order: 'ASC'
      });
    });

    it('should execute: FOR tasks SORT BY priority', () => {
      const data = {
        tasks: [
          { title: 'Task C', priority: 3 },
          { title: 'Task A', priority: 1 },
          { title: 'Task B', priority: 2 }
        ]
      };
      const actions = [parseAction('FOR tasks SORT BY priority')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks).toEqual([
        { title: 'Task A', priority: 1 },
        { title: 'Task B', priority: 2 },
        { title: 'Task C', priority: 3 }
      ]);
    });

    it('should parse: FOR tasks SORT BY priority DESC', () => {
      const input = 'FOR tasks SORT BY priority DESC';
      const result = parseAction(input);

      expect(result.operation).toEqual({
        type: 'SORT',
        by: 'priority',
        order: 'DESC'
      });
    });

    it('should execute: FOR tasks SORT BY priority DESC', () => {
      const data = {
        tasks: [
          { title: 'Task C', priority: 3 },
          { title: 'Task A', priority: 1 },
          { title: 'Task B', priority: 2 }
        ]
      };
      const actions = [parseAction('FOR tasks SORT BY priority DESC')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks).toEqual([
        { title: 'Task C', priority: 3 },
        { title: 'Task B', priority: 2 },
        { title: 'Task A', priority: 1 }
      ]);
    });

    it('should execute: FOR tasks SORT BY date ASC', () => {
      const data = {
        tasks: [
          { title: 'C', date: '2024-03-01' },
          { title: 'A', date: '2024-01-01' },
          { title: 'B', date: '2024-02-01' }
        ]
      };
      const actions = [parseAction('FOR tasks SORT BY date ASC')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks[0].title).toBe('A');
      expect(result.data.tasks[2].title).toBe('C');
    });
  });

  describe('FOR ... MOVE FROM ... TO', () => {
    it('should parse: FOR tags MOVE FROM 0 TO 5', () => {
      const input = 'FOR tags MOVE FROM 0 TO 5';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'tags' }] },
        operation: {
          type: 'MOVE',
          from: 0,
          to: 5
        }
      });
    });

    it('should execute: FOR tags MOVE FROM 0 TO 2', () => {
      const data = { tags: ['a', 'b', 'c', 'd'] };
      const actions = [parseAction('FOR tags MOVE FROM 0 TO 2')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['b', 'c', 'a', 'd']);
    });

    it('should execute: FOR tags MOVE FROM 3 TO 0', () => {
      const data = { tags: ['a', 'b', 'c', 'd'] };
      const actions = [parseAction('FOR tags MOVE FROM 3 TO 0')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['d', 'a', 'b', 'c']);
    });

    it('should handle negative indices: FOR tags MOVE FROM -1 TO 0', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags MOVE FROM -1 TO 0')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['c', 'a', 'b']);
    });
  });

  describe('FOR ... DEDUPLICATE', () => {
    it('should parse: FOR tags DEDUPLICATE', () => {
      const input = 'FOR tags DEDUPLICATE';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'tags' }] },
        operation: {
          type: 'DEDUPLICATE'
        }
      });
    });

    it('should execute: FOR tags DEDUPLICATE', () => {
      const data = { tags: ['work', 'project', 'work', 'important', 'project'] };
      const actions = [parseAction('FOR tags DEDUPLICATE')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['work', 'project', 'important']);
    });

    it('should preserve order during deduplication', () => {
      const data = { tags: ['a', 'b', 'a', 'c', 'b', 'd'] };
      const actions = [parseAction('FOR tags DEDUPLICATE')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle already unique arrays', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const actions = [parseAction('FOR tags DEDUPLICATE')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Error handling', () => {
    it('should reject v1.0 syntax: FOR tags APPEND "value" (missing FOR)', () => {
      const input = 'FOR tags APPEND "value"';

      expect(() => parseAction(input)).toThrow(/Expected FOR keyword/i);
    });

    it('should reject: FOR tags INSERT "value" (missing AT)', () => {
      const input = 'FOR tags INSERT "value"';

      expect(() => parseAction(input)).toThrow(/Expected AT after INSERT/i);
    });

    it('should reject: FOR tags INSERT AT 0 (missing value)', () => {
      const input = 'FOR tags INSERT AT 0';

      expect(() => parseAction(input)).toThrow(/Expected value before AT/i);
    });

    it('should reject: FOR tags REMOVE_ALL (missing value)', () => {
      const input = 'FOR tags REMOVE_ALL';

      expect(() => parseAction(input)).toThrow(/Expected value after REMOVE_ALL/i);
    });

    it('should reject: FOR tags MOVE FROM (missing indices)', () => {
      const input = 'FOR tags MOVE FROM';

      expect(() => parseAction(input)).toThrow(/Expected index after FROM/i);
    });

    it('should reject: FOR tags MOVE FROM 0 (missing TO)', () => {
      const input = 'FOR tags MOVE FROM 0';

      expect(() => parseAction(input)).toThrow(/Expected TO after FROM index/i);
    });

    it('should reject invalid sort order: FOR tags SORT INVALID', () => {
      const input = 'FOR tags SORT INVALID';

      expect(() => parseAction(input)).toThrow(/Expected ASC or DESC/i);
    });
  });

  describe('Complex values in arrays', () => {
    it('should insert objects into array', () => {
      const data = { tasks: [] };
      const input = 'FOR tasks INSERT {"title": "New Task", "status": "pending"} AT -1';
      const actions = [parseAction(input)];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks).toEqual([
        { title: 'New Task', status: 'pending' }
      ]);
    });

    it('should remove objects from array', () => {
      const data = {
        tasks: [
          { title: 'Task 1', done: true },
          { title: 'Task 2', done: false },
          { title: 'Task 1', done: true }
        ]
      };
      const input = 'FOR tasks REMOVE_ALL {"title": "Task 1", "done": true}';
      const actions = [parseAction(input)];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.tasks).toEqual([
        { title: 'Task 2', done: false }
      ]);
    });
  });
});
