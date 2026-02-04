/**
 * Integration tests for Direct Element SET (Phase 2)
 * Tests the full pipeline from parser → AST → executor
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '../../src/parser/actionParser';
import { executeAction } from '../../src/core/ruleEngine';

describe('Direct Element SET Integration', () => {
	describe('Parser to Executor Pipeline', () => {
		it('should parse and execute direct element SET on positive index', () => {
			const data = {
				history: [
					{ date: '2026-01-01', reviewed: false },
					{ date: '2026-01-02', reviewed: false }
				]
			};

			const ast = parseAction('FOR history[0] SET reviewed true');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.history[0].reviewed).toBe(true);
			expect(data.history[1].reviewed).toBe(false);
		});

		it('should parse and execute direct element SET on negative index', () => {
			const data = {
				history: [
					{ date: '2026-01-01', reviewed: false },
					{ date: '2026-01-02', reviewed: false }
				]
			};

			const ast = parseAction('FOR history[-1] SET reviewed true');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.history[1].reviewed).toBe(true);
			expect(data.history[0].reviewed).toBe(false);
		});

		it('should parse and execute direct element SET with multiple field updates', () => {
			const data = {
				tasks: [
					{ name: 'Task 1', status: 'pending', priority: 0 }
				]
			};

			const ast = parseAction('FOR tasks[0] SET status "done", priority 10');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.tasks[0].status).toBe('done');
			expect(data.tasks[0].priority).toBe(10);
		});

		it('should parse and execute direct element SET on nested path', () => {
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

			const ast = parseAction('FOR teams[0].members[-1] SET role "lead"');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.teams[0].members[1].role).toBe('lead');
			expect(data.teams[0].members[0].role).toBe('developer');
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

			const ast = parseAction('FOR projects[0].phases[0].tasks[-1] SET status "completed"');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.projects[0].phases[0].tasks[1].status).toBe('completed');
			expect(data.projects[0].phases[0].tasks[0].status).toBe('pending');
		});

		it('should fail when index is out of bounds', () => {
			const data = { items: [{ a: 1 }] };

			const ast = parseAction('FOR items[10] SET a 100');
			const result = executeAction(ast, data);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('out of bounds');
		});

		it('should fail when path does not exist', () => {
			const data = {};

			const ast = parseAction('FOR nonexistent[0] SET field "value"');
			const result = executeAction(ast, data);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should fail when target is not an object', () => {
			const data = { tags: ['a', 'b', 'c'] };

			const ast = parseAction('FOR tags[0] SET field "value"');
			const result = executeAction(ast, data);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('not an object');
		});

		it('should report changes in result', () => {
			const data = {
				items: [{ status: 'old', priority: 0 }]
			};

			const ast = parseAction('FOR items[0] SET status "new", priority 5');
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(result.changes.length).toBeGreaterThan(0);
			expect(result.changes[0]).toMatch(/SET items\[0\]/);
		});
	});

	describe('AST Format Verification', () => {
		it('should produce DirectElementSetAction AST with correct type', () => {
			const ast = parseAction('FOR history[0] SET reviewed true');

			expect(ast).toHaveProperty('type');
			expect(ast.type).toBe('action');
			expect(ast).toHaveProperty('target');
			expect(ast).toHaveProperty('operation');
			expect(ast.operation.type).toBe('SET');
			expect(ast.operation.where).toBeUndefined();
			expect(ast.operation).toHaveProperty('updates');
		});

		it('should handle standard action AST format for direct element SET', () => {
			const directAction = {
				type: 'action',
				target: {
					type: 'path',
					segments: [
						{ type: 'property', key: 'items' },
						{ type: 'index', index: 0 }
					]
				},
				operation: {
					type: 'SET',
					where: undefined,
					updates: [{ field: 'status', value: 'done' }]
				}
			};

			const data = { items: [{ status: 'pending' }] };
			const result = executeAction(directAction, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
		});
	});
});
