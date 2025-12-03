/**
 * Syntax Validation Tests with Negative Assertions
 *
 * These tests verify correct parsing AND ensure nothing unexpected happens.
 * Each test includes both positive (what should work) and negative (what shouldn't change) assertions.
 */

import { describe, it, expect } from 'vitest';
import { parseCondition } from '../../../src/parser/conditionParser';
import { parseAction } from '../../../src/parser/actionParser';

describe('Syntax Validation - Conditions vs Actions', () => {
	describe('Condition Syntax (uses = for comparison)', () => {
		it('should parse equality comparison with ASCII quotes', () => {
			const condition = 'status = "draft"';
			const ast = parseCondition(condition);

			// Positive: correct structure
			expect(ast.type).toBe('comparison');
			expect(ast).toMatchObject({
				type: 'comparison',
				left: 'status',
				operator: '=',
				right: 'draft',
			});

			// Negative: ensure no mutations or side effects
			if (ast.type === 'comparison') {
				expect(ast.right).not.toContain('"'); // Quotes stripped
				expect(typeof ast.right).toBe('string'); // Type preserved
				expect(ast.left).toBe('status'); // Field name unchanged
				expect(ast.operator).not.toBe('SET'); // Not confused with action
				expect(ast.operator).not.toBe('=='); // Not normalized to ==
			}
		});

		it('should parse complex condition without modifying original', () => {
			const original = 'status = "draft" AND priority > 5';
			const condition = original; // Create reference
			const ast = parseCondition(condition);

			// Positive: correct parsing
			expect(ast.type).toBe('boolean');

			// Negative: original string unchanged
			expect(condition).toBe(original);
			expect(condition).toContain('=');
			expect(condition).toContain('AND');
			expect(condition).not.toContain('SET');
		});

		it('should reject invalid condition syntax', () => {
			// Missing value
			expect(() => parseCondition('status =')).toThrow();

			// Missing operator
			expect(() => parseCondition('status "draft"')).toThrow();

			// Action syntax in condition (should fail)
			expect(() => parseCondition('SET status "draft"')).toThrow();

			// Negative: errors should not partially parse
			try {
				parseCondition('status =');
			} catch (e) {
				expect(e).toBeDefined();
				expect(e instanceof Error).toBe(true);
			}
		});
	});

	describe('Action Syntax (uses space-separated, NO =)', () => {
		it('should parse SET action without equals sign', () => {
			const action = 'SET status "published"';
			const ast = parseAction(action);

			// Positive: correct structure
			expect(ast).toMatchObject({
				op: 'SET',
				path: 'status',
				value: 'published',
			});

			// Negative: ensure proper structure
			expect(ast.op).not.toBe('=');
			expect(ast.op).not.toBe('EQUALS');
			if ('value' in ast) {
				expect(ast.value).not.toContain('"'); // Quotes stripped
				expect(typeof ast.value).toBe('string');
			}
		});

		it('should parse MERGE for nested object fields', () => {
			const action = 'MERGE metadata { "reviewer": "Claude", "approved": true }';
			const ast = parseAction(action);

			// Positive: correct structure
			expect(ast).toMatchObject({
				op: 'MERGE',
				path: 'metadata',
			});

			// Negative: ensure object structure preserved
			if ('value' in ast && typeof ast.value === 'object') {
				expect(ast.value).not.toBeNull();
				expect(Array.isArray(ast.value)).toBe(false);
				expect(ast.value).toHaveProperty('reviewer');
				expect(ast.value).toHaveProperty('approved');
				// Values should not contain quotes
				expect(String(ast.value.reviewer)).not.toContain('"');
			}
		});

		it('should reject condition syntax in action field', () => {
			// Condition-style syntax (with =) should fail in action parser
			expect(() => parseAction('status = "published"')).toThrow();

			// Missing operation keyword
			expect(() => parseAction('status "published"')).toThrow();

			// Negative: errors should be informative
			try {
				parseAction('status = "published"');
			} catch (e) {
				expect(e).toBeDefined();
				expect(e instanceof Error).toBe(true);
				// Should indicate it's an action parser error
				if (e instanceof Error) {
					expect(e.message).toContain('Action');
				}
			}
		});

		it('should handle UPDATE_WHERE with comma-separated fields correctly', () => {
			const action = 'UPDATE_WHERE tasks WHERE status = "pending" SET status "active", priority 1';
			const ast = parseAction(action);

			// Positive: correct structure
			expect(ast).toMatchObject({
				op: 'UPDATE_WHERE',
				path: 'tasks',
			});

			// Negative: ensure updates array is present and correct
			if ('updates' in ast && Array.isArray(ast.updates)) {
				expect(ast.updates.length).toBe(2);
				expect(ast.updates[0]).toHaveProperty('field');
				expect(ast.updates[0]).toHaveProperty('value');
				// Values should be clean (no quotes)
				expect(ast.updates[0].value).not.toContain('"');
				expect(typeof ast.updates[1].value).toBe('number');
			}
		});
	});

	describe('Smart Quotes Detection', () => {
		it('should reject Unicode left double quote (U+201C)', () => {
			const leftQuote = String.fromCharCode(8220);
			const condition = `status = ${leftQuote}draft${leftQuote}`;

			expect(() => parseCondition(condition)).toThrow();

			// Negative: should not partially parse or return corrupted data
			try {
				parseCondition(condition);
			} catch (e) {
				expect(e).toBeDefined();
				if (e instanceof Error) {
					expect(e.message).toMatch(/Unexpected character|Expected value/i);
					// Error message should indicate position
					expect(e.message).toContain('position');
				}
			}
		});

		it('should reject Unicode right double quote (U+201D)', () => {
			const rightQuote = String.fromCharCode(8221);
			const condition = `status = ${rightQuote}draft${rightQuote}`;

			expect(() => parseCondition(condition)).toThrow();
		});

		it('should reject Unicode left single quote (U+2018)', () => {
			const leftQuote = String.fromCharCode(8216);
			const condition = `status = ${leftQuote}draft${leftQuote}`;

			expect(() => parseCondition(condition)).toThrow();
		});

		it('should reject Unicode right single quote (U+2019)', () => {
			const rightQuote = String.fromCharCode(8217);
			const condition = `status = ${rightQuote}draft${rightQuote}`;

			expect(() => parseCondition(condition)).toThrow();
		});

		it('should accept ASCII quotes only', () => {
			const asciiDouble = 'status = "draft"';
			const asciiSingle = "status = 'draft'";

			// Both should work
			expect(() => parseCondition(asciiDouble)).not.toThrow();
			expect(() => parseCondition(asciiSingle)).not.toThrow();

			// Verify character codes
			expect(asciiDouble.charCodeAt(9)).toBe(34); // ASCII "
			expect(asciiSingle.charCodeAt(9)).toBe(39); // ASCII '
		});
	});

	describe('Edge Cases - Ensure Nothing Changes Unexpectedly', () => {
		it('should not modify input strings during parsing', () => {
			const conditionInput = 'status = "draft"';
			const actionInput = 'SET status "published"';

			const conditionCopy = conditionInput;
			const actionCopy = actionInput;

			// Parse
			parseCondition(conditionInput);
			parseAction(actionInput);

			// Negative: inputs unchanged
			expect(conditionInput).toBe(conditionCopy);
			expect(actionInput).toBe(actionCopy);
		});

		it('should not mutate shared state between parses', () => {
			// Parse twice
			const ast1 = parseCondition('status = "draft"');
			const ast2 = parseCondition('status = "draft"');

			// Each parse should produce identical but separate objects
			expect(ast1).toEqual(ast2);
			expect(ast1).not.toBe(ast2); // Different object references

			// Modify one shouldn't affect the other
			if (ast1.type === 'comparison' && ast2.type === 'comparison') {
				const original = ast1.right;
				(ast1 as any).right = 'modified';
				expect(ast2.right).toBe(original);
				expect(ast2.right).not.toBe('modified');
			}
		});

		it('should handle empty and whitespace consistently', () => {
			// Empty should throw
			expect(() => parseCondition('')).toThrow();
			expect(() => parseCondition('   ')).toThrow();
			expect(() => parseAction('')).toThrow();
			expect(() => parseAction('   ')).toThrow();

			// Negative: shouldn't crash or hang
			const tests = ['', '   ', '\n', '\t', '  \n  '];
			for (const test of tests) {
				try {
					parseCondition(test);
				} catch (e) {
					expect(e).toBeDefined();
				}
			}
		});

		it('should preserve field path depth and format', () => {
			// Nested paths
			const condition = 'metadata.author.name = "John"';
			const ast = parseCondition(condition);

			if (ast.type === 'comparison') {
				expect(ast.left).toBe('metadata.author.name');
				expect(ast.left).not.toBe('metadata'); // Not truncated
				expect(ast.left).toContain('.'); // Dots preserved
				expect(ast.left.split('.').length).toBe(3); // Correct depth
			}

			// Array index paths
			const condition2 = 'items[0].name = "first"';
			const ast2 = parseCondition(condition2);

			if (ast2.type === 'comparison') {
				expect(ast2.left).toBe('items[0].name');
				expect(ast2.left).toContain('[0]'); // Index preserved
				expect(ast2.left).not.toContain('[ 0 ]'); // No extra spaces
			}
		});

		it('should handle special characters in values correctly', () => {
			// Values with special chars
			const special = 'description = "Status: pending (review needed)"';
			const ast = parseCondition(special);

			if (ast.type === 'comparison') {
				expect(ast.right).toContain(':');
				expect(ast.right).toContain('(');
				expect(ast.right).toContain(')');
				// But quotes should be stripped
				expect(ast.right).not.toContain('"');
			}
		});

		it('should not accept documentation syntax errors', () => {
			// These were in the OLD docs (now fixed) - should all fail
			expect(() => parseAction('status = "ready", date = NOW()')).toThrow();
			expect(() => parseAction('status = "overdue", ADD tags "urgent"')).toThrow();
			expect(() => parseAction('custom = "new", updated = TODAY()')).toThrow();

			// These should work (corrected syntax - single operations)
			expect(() => parseAction('SET status "overdue"')).not.toThrow();
			expect(() => parseAction('APPEND tags "urgent"')).not.toThrow();
		});
	});

	describe('Type Safety', () => {
		it('should preserve value types correctly', () => {
			// String values
			const str = parseCondition('status = "draft"');
			if (str.type === 'comparison') {
				expect(typeof str.right).toBe('string');
				expect(str.right).toBe('draft');
			}

			// Number values
			const num = parseCondition('priority > 5');
			if (num.type === 'comparison') {
				expect(typeof num.right).toBe('number');
				expect(num.right).toBe(5);
			}

			// Boolean values
			const bool = parseCondition('completed = true');
			if (bool.type === 'comparison') {
				expect(typeof bool.right).toBe('boolean');
				expect(bool.right).toBe(true);
			}

			// Null values
			const nul = parseCondition('value = null');
			if (nul.type === 'comparison') {
				expect(nul.right).toBeNull();
			}
		});

		it('should not coerce types unexpectedly', () => {
			// String "5" should not become number 5
			const ast = parseCondition('count = "5"');
			if (ast.type === 'comparison') {
				expect(typeof ast.right).toBe('string');
				expect(ast.right).toBe('5');
				expect(ast.right).not.toBe(5);
			}

			// Number should not become string
			const ast2 = parseCondition('count = 5');
			if (ast2.type === 'comparison') {
				expect(typeof ast2.right).toBe('number');
				expect(ast2.right).toBe(5);
				expect(ast2.right).not.toBe('5');
			}
		});
	});
});

describe('Documentation Examples - Corrected Syntax', () => {
	it('should parse corrected "Mark Drafts for Review" example (two separate rules)', () => {
		// Rule 1
		const condition1 = 'status = "draft" AND tags exists';
		const action1 = 'SET status "ready-for-review"';

		expect(() => parseCondition(condition1)).not.toThrow();
		expect(() => parseAction(action1)).not.toThrow();

		const condAst1 = parseCondition(condition1);
		const actAst1 = parseAction(action1);

		expect(condAst1.type).toBe('boolean');
		expect(actAst1.op).toBe('SET');

		// Rule 2 (same condition, different action)
		const action2 = 'SET reviewed_date "2025-11-24T21:45:00"';
		expect(() => parseAction(action2)).not.toThrow();

		const actAst2 = parseAction(action2);
		expect(actAst2.op).toBe('SET');

		// Negative: ensure we need two separate rules, not one combined action
		expect(actAst1.op).toBe('SET');
		expect(actAst2.op).toBe('SET');
		expect(actAst1).not.toEqual(actAst2); // Different actions
	});

	it('should parse corrected "Archive Old Notes" example', () => {
		const condition = 'created_date < "2024-01-01" AND NOT tags has "keep"';
		const action = 'APPEND tags "archived"';

		expect(() => parseCondition(condition)).not.toThrow();
		expect(() => parseAction(action)).not.toThrow();

		const actAst = parseAction(action);
		expect(actAst.op).toBe('APPEND');
	});

	it('should parse UPDATE_WHERE with comma-separated fields (only context where commas work)', () => {
		const action = 'UPDATE_WHERE tasks WHERE status = "pending" SET status "urgent", flagged true';

		expect(() => parseAction(action)).not.toThrow();

		const ast = parseAction(action);
		expect(ast.op).toBe('UPDATE_WHERE');
		if ('updates' in ast) {
			expect(ast.updates).toHaveLength(2);

			// Negative: this is the ONLY context where comma-separated works
			expect(ast.op).toBe('UPDATE_WHERE');
			expect(ast.op).not.toBe('SET');
			expect(ast.op).not.toBe('MERGE');
		}
	});
});
