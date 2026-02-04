/**
 * Test using EXACT fixture data from reference-examples-18
 */

import { describe, it, expect } from 'vitest';
import { executeMoveWhere } from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('MOVE TO Bug - Exact Fixture Data', () => {
  it('should reproduce the E2E test failure', () => {
    // EXACT fixture data from reference-examples-18
    const data = {
      title: "My Reading List",
      books: [
        {
          title: "Casual Read",
          priority: "normal"
        },
        {
          title: "Important Research",
          priority: "high"
        },
        {
          title: "Quick Reference",
          priority: "low"
        },
        {
          title: "Critical Paper",
          priority: "high"
        }
      ]
    };

    const initialOrder = data.books.map((b: any) => `${b.title} (${b.priority})`);
    console.log('📄 Initial order:', initialOrder);

    // FOR books WHERE priority = "high" MOVE TO START
    const condition = parseCondition('priority = "high"');
    const result = executeMoveWhere(data, 'books', condition, 'START');

    const finalOrder = data.books.map((b: any) => `${b.title} (${b.priority})`);
    console.log('📄 Final order:', finalOrder);

    // Expected output from fixture
    const expectedOrder = [
      "Important Research (high)",
      "Critical Paper (high)",
      "Casual Read (normal)",
      "Quick Reference (low)"
    ];

    console.log('✅ Expected order:', expectedOrder);
    console.log('❌ E2E reported: [Casual Read (normal), Important Research (high), Quick Reference (low), Critical Paper (high)]');

    expect(result.success).toBe(true);
    expect(result.modified).toBe(true);
    expect(finalOrder).toEqual(expectedOrder);
  });

  it('should move matching items to END', () => {
    const data = {
      title: "Task List",
      tasks: [
        { name: "High Priority", priority: "high" },
        { name: "Low Priority 1", priority: "low" },
        { name: "Medium Priority", priority: "medium" },
        { name: "Low Priority 2", priority: "low" }
      ]
    };

    const condition = parseCondition('priority = "low"');
    const result = executeMoveWhere(data, 'tasks', condition, 'END');

    expect(result.success).toBe(true);
    expect(result.modified).toBe(true);

    // Low priority tasks should be at end
    expect(data.tasks[0].priority).toBe('high');
    expect(data.tasks[1].priority).toBe('medium');
    expect(data.tasks[2].priority).toBe('low');
    expect(data.tasks[3].priority).toBe('low');
  });
});
