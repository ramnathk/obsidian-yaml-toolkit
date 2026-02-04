/**
 * Debug test for nested INCREMENT issue
 * Simulates E2E flow to understand why nested paths don't work
 */

import { describe, it, expect } from 'vitest';
import { executeIncrement } from '../../src/actions/basicActions';
import { parseAction } from '../../src/parser/actionParser';
import { executeAction } from '../../src/core/ruleEngine';

describe('Debug Nested INCREMENT', () => {
	it('should show how nested INCREMENT works in unit test', () => {
		const data = {
			metadata: {
				views: 20,
				likes: 5
			}
		};

		console.log('========== DIRECT executeIncrement ==========');
		console.log('BEFORE:', JSON.stringify(data, null, 2));

		const result = executeIncrement(data, 'metadata.views', 10);

		console.log('AFTER:', JSON.stringify(data, null, 2));
		console.log('RESULT:', result);

		expect(data.metadata.views).toBe(30);
		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
	});

	it('should show how nested INCREMENT works through parser + executeAction', () => {
		const data = {
			metadata: {
				views: 20,
				likes: 5
			}
		};

		console.log('========== THROUGH PARSER + executeAction ==========');
		console.log('BEFORE:', JSON.stringify(data, null, 2));

		const actionAST = parseAction('INCREMENT metadata.views 10');
		console.log('AST:', JSON.stringify(actionAST, null, 2));

		const result = executeAction(actionAST, data);

		console.log('AFTER:', JSON.stringify(data, null, 2));
		console.log('RESULT:', result);

		expect(data.metadata.views).toBe(30);
		expect(result.success).toBe(true);
		expect(result.modified).toBe(true);
	});

	it('should show AST structure for nested path', () => {
		const actionAST = parseAction('INCREMENT metadata.views 10');

		console.log('========== AST STRUCTURE ==========');
		console.log(JSON.stringify(actionAST, null, 2));

		// Check AST structure
		expect((actionAST as any).type).toBe('action');
		expect((actionAST as any).target.type).toBe('path');
		expect((actionAST as any).operation.type).toBe('INCREMENT');
		expect((actionAST as any).operation.amount).toBe(10);

		// Check segments
		const segments = (actionAST as any).target.segments;
		console.log('SEGMENTS:', segments);
		expect(segments).toEqual([
			{ type: 'property', key: 'metadata' },
			{ type: 'property', key: 'views' }
		]);
	});
});
