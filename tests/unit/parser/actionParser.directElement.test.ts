/**
 * Tests for Direct Element Access parsing
 * Tests parsing of: FOR array[index] SET field value
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '../../../src/parser/actionParser';

describe('ActionParser - Direct Element SET', () => {
	it('should parse FOR array[0] SET field value', () => {
		const input = 'FOR history[0] SET reviewed true';
		const ast = parseAction(input);

		expect(ast.type).toBe('action');
		expect(ast.target.type).toBe('path');

		// Check segments include the index
		const hasIndex = ast.target.segments.some((seg: any) => seg.type === 'index' && seg.index === 0);
		expect(hasIndex).toBe(true);

		expect(ast.operation.type).toBe('SET');
		expect(ast.operation.where).toBeUndefined(); // No WHERE clause
		expect(ast.operation.updates).toEqual([
			{ field: 'reviewed', value: true }
		]);
	});

	it('should parse FOR array[-1] SET field value', () => {
		const input = 'FOR history[-1] SET reviewed true';
		const ast = parseAction(input);

		const hasNegativeIndex = ast.target.segments.some((seg: any) => seg.type === 'index' && seg.index === -1);
		expect(hasNegativeIndex).toBe(true);
		expect(ast.operation.type).toBe('SET');
	});

	it('should parse FOR array[index] SET multiple fields', () => {
		const input = 'FOR tasks[-1] SET status "completed", priority 10';
		const ast = parseAction(input);

		expect(ast.operation.updates).toEqual([
			{ field: 'status', value: 'completed' },
			{ field: 'priority', value: 10 }
		]);
	});
});

describe('ActionParser - Nested Path Direct Element SET', () => {
	it('should parse FOR nested.array[index] SET field value', () => {
		const input = 'FOR teams[0].members[-1] SET role "lead"';
		const ast = parseAction(input);

		expect(ast.target.segments).toEqual([
			{ type: 'property', key: 'teams' },
			{ type: 'index', index: 0 },
			{ type: 'property', key: 'members' },
			{ type: 'index', index: -1 }
		]);
		expect(ast.operation.updates).toEqual([
			{ field: 'role', value: 'lead' }
		]);
	});

	it('should parse FOR deeply nested path with multiple indices', () => {
		const input = 'FOR projects[-1].phases[-1].tasks[-1] SET status "done"';
		const ast = parseAction(input);

		expect(ast.target.segments).toEqual([
			{ type: 'property', key: 'projects' },
			{ type: 'index', index: -1 },
			{ type: 'property', key: 'phases' },
			{ type: 'index', index: -1 },
			{ type: 'property', key: 'tasks' },
			{ type: 'index', index: -1 }
		]);
	});
});

describe('ActionParser - Distinguish Direct vs Conditional SET', () => {
	it('should parse direct element SET (no WHERE)', () => {
		const input = 'FOR history[0] SET reviewed true';
		const ast = parseAction(input);

		expect(ast.operation.where).toBeUndefined();
		expect(ast.operation.updates).toBeDefined();
	});

	it('should parse conditional SET (with WHERE)', () => {
		const input = 'FOR history WHERE reviewed = false SET reviewed true';
		const ast = parseAction(input);

		expect(ast.operation.where).toBeDefined();
		expect(ast.operation.updates).toBeDefined();
	});

	it('should not confuse array index with WHERE clause', () => {
		const input = 'FOR history[-1] SET reviewed true';
		const ast = parseAction(input);

		// Should NOT have a WHERE clause
		expect(ast.operation.where).toBeUndefined();
		// Should have the negative index in segments
		const hasNegativeIndex = ast.target.segments.some((seg: any) => seg.type === 'index' && seg.index === -1);
		expect(hasNegativeIndex).toBe(true);
	});
});
