/**
 * Tests for Direct Element Access with SET
 * Tests the feature: FOR array[index] SET field value
 */

import { describe, it, expect } from 'vitest';
import { executeDirectElementSet } from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('Direct Element Access - SET with positive index', () => {
	it('should set field on element at index 0', () => {
		const data = {
			history: [
				{ date: '2025-01-01', reviewed: false },
				{ date: '2025-01-02', reviewed: false }
			]
		};

		// Action: FOR history[0] SET reviewed true
		const result = executeDirectElementSet(data, 'history[0]', [
			{ field: 'reviewed', value: true }
		]);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.history[0].reviewed).toBe(true);
		expect(data.history[1].reviewed).toBe(false); // unchanged
	});

	it('should set field on element at middle index', () => {
		const data = {
			tasks: [
				{ name: 'Task 1', status: 'pending' },
				{ name: 'Task 2', status: 'pending' },
				{ name: 'Task 3', status: 'pending' }
			]
		};

		// Action: FOR tasks[1] SET status "active"
		const result = executeDirectElementSet(data, 'tasks[1]', [
			{ field: 'status', value: 'active' }
		]);

		expect(result.success).toBe(true);
		expect(data.tasks[1].status).toBe('active');
		expect(data.tasks[0].status).toBe('pending');
		expect(data.tasks[2].status).toBe('pending');
	});
});

describe('Direct Element Access - SET with negative index', () => {
	it('should set field on last element (index -1)', () => {
		const data = {
			history: [
				{ date: '2025-01-01', reviewed: false },
				{ date: '2025-01-05', reviewed: false }
			]
		};

		// Action: FOR history[-1] SET reviewed true
		const result = executeDirectElementSet(data, 'history[-1]', [
			{ field: 'reviewed', value: true }
		]);

		expect(result.success).toBe(true);
		expect(data.history[1].reviewed).toBe(true); // last element
		expect(data.history[0].reviewed).toBe(false); // unchanged
	});

	it('should set field on second-to-last element (index -2)', () => {
		const data = {
			items: [
				{ id: 1, priority: 0 },
				{ id: 2, priority: 0 },
				{ id: 3, priority: 0 }
			]
		};

		// Action: FOR items[-2] SET priority 10
		const result = executeDirectElementSet(data, 'items[-2]', [
			{ field: 'priority', value: 10 }
		]);

		expect(result.success).toBe(true);
		expect(data.items[1].priority).toBe(10); // second-to-last
		expect(data.items[0].priority).toBe(0);
		expect(data.items[2].priority).toBe(0);
	});

	it('should set multiple fields on element with negative index', () => {
		const data = {
			tasks: [
				{ name: 'Task 1', status: 'pending', priority: 0 },
				{ name: 'Task 2', status: 'pending', priority: 0 }
			]
		};

		// Action: FOR tasks[-1] SET status "completed", priority 10
		const result = executeDirectElementSet(data, 'tasks[-1]', [
			{ field: 'status', value: 'completed' },
			{ field: 'priority', value: 10 }
		]);

		expect(result.success).toBe(true);
		expect(data.tasks[1].status).toBe('completed');
		expect(data.tasks[1].priority).toBe(10);
		expect(data.tasks[0].status).toBe('pending'); // unchanged
	});
});

describe('Direct Element Access - SET with nested paths', () => {
	it('should set field on nested array element', () => {
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

		// Action: FOR teams[0].members[-1] SET role "lead"
		const result = executeDirectElementSet(data, 'teams[0].members[-1]', [
			{ field: 'role', value: 'lead' }
		]);

		expect(result.success).toBe(true);
		expect(data.teams[0].members[1].role).toBe('lead');
		expect(data.teams[0].members[0].role).toBe('developer');
	});

	it('should set field on deeply nested array with multiple negative indices', () => {
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

		// Action: FOR projects[-1].phases[-1].tasks[-1] SET status "completed"
		const result = executeDirectElementSet(data, 'projects[-1].phases[-1].tasks[-1]', [
			{ field: 'status', value: 'completed' }
		]);

		expect(result.success).toBe(true);
		expect(data.projects[0].phases[0].tasks[1].status).toBe('completed');
		expect(data.projects[0].phases[0].tasks[0].status).toBe('pending');
	});

	it('should set field on element with mixed positive and negative indices', () => {
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

		// Action: FOR teams[-1].members[0] SET badge "team-lead"
		const result = executeDirectElementSet(data, 'teams[-1].members[0]', [
			{ field: 'badge', value: 'team-lead' }
		]);

		expect(result.success).toBe(true);
		expect(data.teams[1].members[0].badge).toBe('team-lead');
	});
});

describe('Direct Element Access - SET error cases', () => {
	it('should fail when index is out of bounds', () => {
		const data = { items: [{ a: 1 }, { a: 2 }] };

		// Action: FOR items[10] SET a 100
		const result = executeDirectElementSet(data, 'items[10]', [
			{ field: 'a', value: 100 }
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('out of bounds');
	});

	it('should fail when negative index is beyond array length', () => {
		const data = { items: [{ a: 1 }] };

		// Action: FOR items[-10] SET a 100
		const result = executeDirectElementSet(data, 'items[-10]', [
			{ field: 'a', value: 100 }
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('out of bounds');
	});

	it('should fail when path does not resolve to an object', () => {
		const data = { tags: ['a', 'b', 'c'] };

		// Action: FOR tags[0] SET field value
		// tags[0] is a string, not an object
		const result = executeDirectElementSet(data, 'tags[0]', [
			{ field: 'field', value: 'value' }
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('not an object');
	});

	it('should fail when array does not exist', () => {
		const data = {};

		// Action: FOR nonexistent[0] SET field value
		const result = executeDirectElementSet(data, 'nonexistent[0]', [
			{ field: 'field', value: 'value' }
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('does not exist');
	});

	it('should fail when intermediate path is not an array', () => {
		const data = { field: 'value' };

		// Action: FOR field[0] SET x y
		const result = executeDirectElementSet(data, 'field[0]', [
			{ field: 'x', value: 'y' }
		]);

		expect(result.success).toBe(false);
		expect(result.error).toContain('not an array');
	});
});

describe('Direct Element Access - SET edge cases', () => {
	it('should create field if it does not exist on element', () => {
		const data = {
			items: [{ name: 'Item 1' }]
		};

		// Action: FOR items[0] SET priority 10
		const result = executeDirectElementSet(data, 'items[0]', [
			{ field: 'priority', value: 10 }
		]);

		expect(result.success).toBe(true);
		expect(data.items[0].priority).toBe(10);
	});

	it('should overwrite existing field value', () => {
		const data = {
			items: [{ status: 'old' }]
		};

		// Action: FOR items[0] SET status "new"
		const result = executeDirectElementSet(data, 'items[0]', [
			{ field: 'status', value: 'new' }
		]);

		expect(result.success).toBe(true);
		expect(data.items[0].status).toBe('new');
	});

	it('should handle setting null value', () => {
		const data = {
			items: [{ field: 'value' }]
		};

		// Action: FOR items[0] SET field null
		const result = executeDirectElementSet(data, 'items[0]', [
			{ field: 'field', value: null }
		]);

		expect(result.success).toBe(true);
		expect(data.items[0].field).toBeNull();
	});
});
