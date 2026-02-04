/**
 * Integration Tests for Negative Indexing Operations
 * Tests end-to-end workflow with negative indices
 */

import { describe, it, expect } from 'vitest';
import { parseCondition } from '../../src/parser/conditionParser';
import { parseAction } from '../../src/parser/actionParser';
import { evaluateCondition } from '../../src/evaluator/conditionEvaluator';
import { executeAction } from '../../src/core/ruleEngine';

describe('Integration - Negative Indexing Operations', () => {
	it('should execute rule with negative index in condition and action', () => {
		const data = {
			history: [
				{ date: '2025-01-01', reviewed: false },
				{ date: '2025-01-05', reviewed: false }
			]
		};

		// Condition: history[-1].reviewed = false
		const conditionAST = parseCondition('history[-1].reviewed = false');
		expect(evaluateCondition(conditionAST, data)).toBe(true);

		// Action: FOR history[-1] SET reviewed true
		const actionAST = parseAction('FOR history[-1] SET reviewed true');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.history[1].reviewed).toBe(true);
		expect(data.history[0].reviewed).toBe(false);
	});

	it('should execute rule with nested negative indices', () => {
		const data = {
			teams: [
				{
					name: 'Team A',
					members: [
						{ name: 'Alice', role: 'developer', badge: null }
					]
				}
			]
		};

		// Condition: teams[-1].members[-1].role = "developer"
		const conditionAST = parseCondition('teams[-1].members[-1].role = "developer"');
		expect(evaluateCondition(conditionAST, data)).toBe(true);

		// Action: FOR teams[-1].members[-1] SET badge "team-lead"
		const actionAST = parseAction('FOR teams[-1].members[-1] SET badge "team-lead"');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.teams[0].members[0].badge).toBe('team-lead');
	});

	it('should handle multiple actions with negative indices', () => {
		const data = {
			tasks: [
				{ name: 'Task 1', status: 'pending', priority: 5 },
				{ name: 'Task 2', status: 'pending', priority: 5 }
			],
			tags: ['project']
		};

		// First action: FOR tasks[-1] SET status "completed"
		const actionAST1 = parseAction('FOR tasks[-1] SET status "completed"');
		const result1 = executeAction(actionAST1, data);
		expect(result1.success).toBe(true);
		expect(data.tasks[1].status).toBe('completed');

		// Second action: FOR tasks[-1] SET priority 0
		const actionAST2 = parseAction('FOR tasks[-1] SET priority 0');
		const result2 = executeAction(actionAST2, data);
		expect(result2.success).toBe(true);
		expect(data.tasks[1].priority).toBe(0);

		// Third action: FOR tags APPEND "archived"
		const actionAST3 = parseAction('FOR tags APPEND "archived"');
		const result3 = executeAction(actionAST3, data);
		expect(result3.success).toBe(true);
		expect(data.tags).toContain('archived');
	});

	it('should execute direct element SET with negative index', () => {
		const data = {
			items: [
				{ id: 1, status: 'pending' },
				{ id: 2, status: 'pending' },
				{ id: 3, status: 'pending' }
			]
		};

		// Action: FOR items[-1] SET status "done"
		const actionAST = parseAction('FOR items[-1] SET status "done"');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.items[2].status).toBe('done'); // last element
		expect(data.items[0].status).toBe('pending'); // unchanged
		expect(data.items[1].status).toBe('pending'); // unchanged
	});

	it('should execute direct element SET with second-to-last index', () => {
		const data = {
			events: [
				{ type: 'create', reviewed: false },
				{ type: 'update', reviewed: false },
				{ type: 'delete', reviewed: false }
			]
		};

		// Action: FOR events[-2] SET reviewed true
		const actionAST = parseAction('FOR events[-2] SET reviewed true');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(data.events[1].reviewed).toBe(true); // second-to-last
		expect(data.events[0].reviewed).toBe(false);
		expect(data.events[2].reviewed).toBe(false);
	});

	it('should set multiple fields with negative index', () => {
		const data = {
			tasks: [
				{ name: 'Task 1', status: 'pending', priority: 0, assigned: false },
				{ name: 'Task 2', status: 'pending', priority: 0, assigned: false }
			]
		};

		// Action: FOR tasks[-1] SET status "done", priority 10, assigned true
		const actionAST = parseAction('FOR tasks[-1] SET status "done", priority 10, assigned true');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(data.tasks[1].status).toBe('done');
		expect(data.tasks[1].priority).toBe(10);
		expect(data.tasks[1].assigned).toBe(true);
		expect(data.tasks[0].status).toBe('pending'); // unchanged
	});

	it('should execute mixed positive and negative indices', () => {
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

		// Action: FOR teams[-1].members[0] SET badge "lead"
		const actionAST = parseAction('FOR teams[-1].members[0] SET badge "lead"');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(data.teams[1].members[0].badge).toBe('lead');
		expect(data.teams[0].members[0].badge).toBeNull(); // unchanged
	});

	it('should insert at negative index in array (Example 33)', () => {
		const data = {
			title: 'Tag Management',
			tags: ['project', 'active', 'important', 'final']
		};

		// Action: FOR tags INSERT "archived" AT -2
		// This should insert "archived" at position 2 (before "final")
		const actionAST = parseAction('FOR tags INSERT "archived" AT -2');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.tags).toEqual(['project', 'active', 'important', 'archived', 'final']);
	});

	it('should insert at negative index with different offset', () => {
		const data = {
			items: [1, 2, 3, 4, 5]
		};

		// Action: FOR items INSERT 99 AT -3
		// -3 in array of length 5 maps to index 2
		// With +1 for INSERT semantics: position = 5 + (-3) + 1 = 3
		// Insert at position 3 (before element at index 3): [1, 2, 3, 99, 4, 5]
		const actionAST = parseAction('FOR items INSERT 99 AT -3');
		const result = executeAction(actionAST, data);

		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.items).toEqual([1, 2, 3, 99, 4, 5]);
	});
});
