/**
 * Nested Path Parser Tests
 * Verify that nested paths like "metadata.views" are parsed correctly
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '../../../src/parser/actionParser';

describe('Nested Path Parsing', () => {
	it('should parse simple top-level INCREMENT', () => {
		const ast = parseAction('INCREMENT views 5');

		console.log('\nSimple INCREMENT AST:');
		console.log(JSON.stringify(ast, null, 2));

		expect(ast.type).toBe('action');
		expect(ast.operation.type).toBe('INCREMENT');
		expect(ast.operation.amount).toBe(5);
		expect(ast.target.segments).toHaveLength(1);
		expect(ast.target.segments[0]).toEqual({ type: 'property', key: 'views' });
	});

	it('should parse nested path INCREMENT', () => {
		const ast = parseAction('INCREMENT metadata.views 10');

		console.log('\nNested INCREMENT AST:');
		console.log(JSON.stringify(ast, null, 2));

		expect(ast.type).toBe('action');
		expect(ast.operation.type).toBe('INCREMENT');
		expect(ast.operation.amount).toBe(10);

		// Should have 2 segments: metadata and views
		expect(ast.target.segments).toHaveLength(2);
		expect(ast.target.segments[0]).toEqual({ type: 'property', key: 'metadata' });
		expect(ast.target.segments[1]).toEqual({ type: 'property', key: 'views' });
	});

	it('should parse deeply nested path INCREMENT', () => {
		const ast = parseAction('INCREMENT stats.nested.count 1');

		console.log('\nDeeply nested INCREMENT AST:');
		console.log(JSON.stringify(ast, null, 2));

		expect(ast.type).toBe('action');
		expect(ast.target.segments).toHaveLength(3);
		expect(ast.target.segments[0]).toEqual({ type: 'property', key: 'stats' });
		expect(ast.target.segments[1]).toEqual({ type: 'property', key: 'nested' });
		expect(ast.target.segments[2]).toEqual({ type: 'property', key: 'count' });
	});
});

import { executeAction } from '../../../src/core/ruleEngine';

describe('segmentsToPath Conversion', () => {

	it('should convert simple path segments to string', () => {
		const ast = parseAction('INCREMENT views 5');
		const data = { views: 10 };

		const result = executeAction(ast, data);

		console.log('\nSimple path conversion:');
		console.log('  AST segments:', ast.target.segments);
		console.log('  Converted path should be: "views"');
		console.log('  Result:', result);

		expect(result.success).toBe(true);
		expect(data.views).toBe(15);
	});

	it('should convert nested path segments to string', () => {
		const ast = parseAction('INCREMENT metadata.views 10');
		const data = { metadata: { views: 20, likes: 5 } };

		console.log('\nNested path conversion:');
		console.log('  AST segments:', ast.target.segments);
		console.log('  Converted path should be: "metadata.views"');

		const result = executeAction(ast, data);

		console.log('  Result:', result);
		console.log('  Data after:', data);

		expect(result.success).toBe(true);
		expect(data.metadata.views).toBe(30);
		expect(data.metadata.likes).toBe(5); // Unchanged
	});
});
