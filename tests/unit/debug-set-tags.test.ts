/**
 * Debug test: Why does SET tags fail in E2E but pass in unit tests?
 */
import { describe, it, expect } from 'vitest';
import { parseAction } from '../../src/parser/actionParser';
import { executeAction } from '../../src/core/ruleEngine';

describe('Debug: SET tags operation', () => {
	it('should create tags array when setting on object without tags', () => {
		const data = {
			title: 'Untagged Note',
			status: 'active'
		};

		// Parse the exact action from failing E2E test
		const actionAST = parseAction('SET tags ["untagged"]');
		console.log('Parsed AST:', JSON.stringify(actionAST, null, 2));

		// Execute it
		const result = executeAction(actionAST, data);
		console.log('Execution result:', result);
		console.log('Modified data:', data);

		// What we expect
		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.tags).toEqual(['untagged']);
	});

	it('should execute FOR tags APPEND', () => {
		const data = {
			title: 'Old Project',
			created_date: '2023-06-15T00:00:00.000Z',
			tags: ['notes', 'project']
		};

		// Parse the exact action from PASSING E2E test
		const actionAST = parseAction('FOR tags APPEND "archived"');
		console.log('Parsed AST:', JSON.stringify(actionAST, null, 2));

		// Execute it
		const result = executeAction(actionAST, data);
		console.log('Execution result:', result);
		console.log('Modified data:', data);

		// What we expect
		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
		expect(data.tags).toContain('archived');
	});
});
