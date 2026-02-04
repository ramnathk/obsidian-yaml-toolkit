/**
 * Minimal test case to reproduce MOVE TO bug
 * Tests: FOR array WHERE condition MOVE TO START
 */

import { describe, it, expect } from 'vitest';
import { executeMoveWhere } from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('MOVE TO Bug - Minimal Test Case', () => {
  it('should move matching items to START', () => {
    const data = {
      title: 'My Reading List',
      books: [
        { title: 'Casual Read', priority: 'normal' },
        { title: 'Important Research', priority: 'high' },
        { title: 'Quick Reference', priority: 'low' },
        { title: 'Critical Paper', priority: 'high' }
      ]
    };

    // This is what's failing in the E2E test
    // FOR books WHERE priority = "high" MOVE TO START
    const condition = parseCondition('priority = "high"');
    const result = executeMoveWhere(data, 'books', condition, 'START');

    console.log('🐛 MOVE TO Bug Test');
    console.log('Initial order:', data.books.map((b: any) => `${b.title} (${b.priority})`));
    console.log('Condition: priority = "high"');
    console.log('Action: MOVE TO START');
    console.log('Result success:', result.success);
    console.log('Result modified:', result.modified);
    console.log('Final order:', data.books.map((b: any) => `${b.title} (${b.priority})`));

    // Expected: High-priority items at top (order preserved for moved items)
    expect(result.success).toBe(true);
    expect(result.modified).toBe(true);
    
    // Both high-priority items should be at positions 0 and 1
    expect(data.books[0].priority).toBe('high');
    expect(data.books[1].priority).toBe('high');
    
    // The specific order should be: Important Research (moved first), then Critical Paper
    // This preserves the relative order of matching items
    expect(data.books[0].title).toBe('Important Research');
    expect(data.books[1].title).toBe('Critical Paper');
    
    // Non-matching items should stay in their original relative order
    expect(data.books[2].title).toBe('Casual Read');
    expect(data.books[3].title).toBe('Quick Reference');
  });
});
