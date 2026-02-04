/**
 * Tests for Direct Element SET Action Execution (Phase 2)
 *
 * Tests executeDirectElementSet function that works with DirectElementSetAction AST type
 * This is the bridge between the parser (which returns DirectElementSetAction)
 * and the execution engine (which modifies data objects)
 */

import { describe, it, expect } from 'vitest';
import { executeDirectElementSet } from '../../../src/actions/directElementSetAction';
import { DirectElementSetAction } from '../../../src/types';

describe('Execute Direct Element SET Action', () => {
	describe('Basic direct element SET', () => {
		it('should set field on element at positive index', () => {
			const data = {
				history: [
					{ date: '2026-01-01', reviewed: false },
					{ date: '2026-01-02', reviewed: false }
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'history[0]',
				updates: { reviewed: true }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.history[0].reviewed).toBe(true);
			expect(data.history[1].reviewed).toBe(false); // Unchanged
		});

		it('should set field on element at negative index', () => {
			const data = {
				history: [
					{ date: '2026-01-01', reviewed: false },
					{ date: '2026-01-02', reviewed: false }
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'history[-1]',
				updates: { reviewed: true }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.history[1].reviewed).toBe(true); // Last element
			expect(data.history[0].reviewed).toBe(false); // Unchanged
		});

		it('should handle multiple field updates', () => {
			const data = {
				history: [
					{ date: '2026-01-01', reviewed: false, status: 'pending' }
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'history[0]',
				updates: {
					reviewed: true,
					status: 'done'
				}
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.history[0].reviewed).toBe(true);
			expect(data.history[0].status).toBe('done');
		});
	});

	describe('Nested paths', () => {
		it('should handle nested path with array indices', () => {
			const data = {
				teams: [
					{
						name: 'Team A',
						members: [
							{ name: 'Alice', role: 'developer' },
							{ name: 'Bob', role: 'developer' }
						]
					}
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'teams[0].members[-1]',
				updates: { role: 'lead' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.teams[0].members[1].role).toBe('lead');
			expect(data.teams[0].members[0].role).toBe('developer'); // Unchanged
		});

		it('should handle deeply nested paths', () => {
			const data = {
				projects: [
					{
						phases: [
							{
								tasks: [
									{ name: 'Task 1', status: 'pending' },
									{ name: 'Task 2', status: 'pending' }
								]
							}
						]
					}
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'projects[-1].phases[-1].tasks[-1]',
				updates: { status: 'completed' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.projects[0].phases[0].tasks[1].status).toBe('completed');
			expect(data.projects[0].phases[0].tasks[0].status).toBe('pending'); // Unchanged
		});

		it('should handle mixed positive and negative indices', () => {
			const data = {
				teams: [
					{
						members: [
							{ name: 'Alice', badge: null },
							{ name: 'Bob', badge: null }
						]
					},
					{
						members: [
							{ name: 'Charlie', badge: null },
							{ name: 'Dave', badge: null }
						]
					}
				]
			};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'teams[-1].members[0]',
				updates: { badge: 'team-lead' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.teams[1].members[0].badge).toBe('team-lead');
		});
	});

	describe('Field value types', () => {
		it('should handle boolean values', () => {
			const data = { items: [{ active: false }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { active: true }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].active).toBe(true);
		});

		it('should handle string values', () => {
			const data = { items: [{ status: 'pending' }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { status: 'completed' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].status).toBe('completed');
		});

		it('should handle number values', () => {
			const data = { items: [{ count: 0 }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { count: 42 }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].count).toBe(42);
		});

		it('should handle null values', () => {
			const data = { items: [{ field: 'value' }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { field: null }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].field).toBeNull();
		});

		it('should handle object values', () => {
			const data = { items: [{ meta: null }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { meta: { created: '2026-01-01', author: 'Alice' } }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].meta).toEqual({ created: '2026-01-01', author: 'Alice' });
		});
	});

	describe('Error cases', () => {
		it('should fail when index is out of bounds', () => {
			const data = { items: [{ a: 1 }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[10]',
				updates: { a: 100 }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('should fail when negative index is beyond array length', () => {
			const data = { items: [{ a: 1 }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[-10]',
				updates: { a: 100 }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('should fail when element is not an object', () => {
			const data = { tags: ['a', 'b', 'c'] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'tags[0]',
				updates: { field: 'value' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('not an object');
		});

		it('should fail when path does not exist', () => {
			const data = {};

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'nonexistent[0]',
				updates: { field: 'value' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should fail when intermediate path is not an array', () => {
			const data = { field: 'value' };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'field[0]',
				updates: { x: 'y' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('not an array');
		});
	});

	describe('Edge cases', () => {
		it('should create new field on element', () => {
			const data = { items: [{ name: 'Item 1' }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { priority: 10 }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].priority).toBe(10);
		});

		it('should overwrite existing field', () => {
			const data = { items: [{ status: 'old' }] };

			const action: DirectElementSetAction = {
				type: 'DIRECT_ELEMENT_SET',
				path: 'items[0]',
				updates: { status: 'new' }
			};

			const result = executeDirectElementSet(data, action);

			expect(result.success).toBe(true);
			expect(data.items[0].status).toBe('new');
		});
	});
});
