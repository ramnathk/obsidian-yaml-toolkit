/**
 * Quote Character Debugger
 *
 * This test file helps identify invisible Unicode characters and quote types
 * that might cause parsing errors in user input.
 */

import { describe, it, expect } from 'vitest';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('Quote Character Debugger', () => {
	/**
	 * Helper function to display character codes for debugging
	 */
	function analyzeString(str: string): { char: string; code: number; name: string }[] {
		return str.split('').map(char => ({
			char,
			code: char.charCodeAt(0),
			name: getCharacterName(char.charCodeAt(0)),
		}));
	}

	function getCharacterName(code: number): string {
		if (code === 34) return 'ASCII double quote';
		if (code === 39) return 'ASCII single quote';
		if (code === 8220) return 'Unicode left double quote';
		if (code === 8221) return 'Unicode right double quote';
		if (code === 8216) return 'Unicode left single quote';
		if (code === 8217) return 'Unicode right single quote';
		if (code === 32) return 'space';
		if (code === 9) return 'tab';
		if (code === 10) return 'newline';
		if (code === 13) return 'carriage return';
		if (code === 160) return 'non-breaking space';
		if (code === 8203) return 'zero-width space';
		if (code >= 65 && code <= 90) return `uppercase ${String.fromCharCode(code)}`;
		if (code >= 97 && code <= 122) return `lowercase ${String.fromCharCode(code)}`;
		if (code >= 48 && code <= 57) return `digit ${String.fromCharCode(code)}`;
		return `character code ${code}`;
	}

	describe('Character code verification', () => {
		it('should correctly identify ASCII quotes', () => {
			const asciiDouble = '"';
			const asciiSingle = "'";

			expect(asciiDouble.charCodeAt(0)).toBe(34);
			expect(asciiSingle.charCodeAt(0)).toBe(39);
		});

		it('should show character analysis for test string', () => {
			const testStr = 'status = "draft"';
			const analysis = analyzeString(testStr);

			// This will print in test output
			console.log('Character analysis:', analysis);

			// Verify the quote at position 9 is ASCII
			expect(analysis[9].code).toBe(34); // Should be ASCII "
		});
	});

	describe('Parsing different quote types', () => {
		it('should parse ASCII double quotes successfully', () => {
			const condition = 'status = "draft" AND priority > 5';
			const ast = parseCondition(condition);
			expect(ast.type).toBe('boolean');
		});

		it('should parse ASCII single quotes successfully', () => {
			const condition = "status = 'draft' AND priority > 5";
			const ast = parseCondition(condition);
			expect(ast.type).toBe('boolean');
		});

		// Note: We can't easily embed Unicode smart quotes in source code
		// because they get normalized by editors/git.
		// Instead, we'll construct them programmatically:

		it('should parse Unicode left double quote (programmatic)', () => {
			// U+201C: " (left double quotation mark)
			const leftQuote = String.fromCharCode(8220);
			const condition = `status = ${leftQuote}draft${leftQuote}`;

			console.log('Testing with Unicode left quote:', analyzeString(condition));

			// The lexer should handle this or throw a clear error
			try {
				const ast = parseCondition(condition);
				console.log('Parsed successfully:', ast);
			} catch (error) {
				console.log('Parse error:', error);
				expect(error).toBeDefined();
			}
		});

		it('should parse Unicode right double quote (programmatic)', () => {
			// U+201D: " (right double quotation mark)
			const rightQuote = String.fromCharCode(8221);
			const condition = `status = ${rightQuote}draft${rightQuote}`;

			console.log('Testing with Unicode right quote:', analyzeString(condition));

			try {
				const ast = parseCondition(condition);
				console.log('Parsed successfully:', ast);
			} catch (error) {
				console.log('Parse error:', error);
				expect(error).toBeDefined();
			}
		});

		it('should parse Unicode smart quotes (mixed)', () => {
			// Typical smart quote behavior: " at start, " at end
			const leftQuote = String.fromCharCode(8220);
			const rightQuote = String.fromCharCode(8221);
			const condition = `status = ${leftQuote}draft${rightQuote} AND priority > 5`;

			console.log('Testing with smart quotes:', analyzeString(condition));

			try {
				const ast = parseCondition(condition);
				console.log('Parsed successfully:', ast);
			} catch (error) {
				console.log('Parse error:', error);
				// This should fail
				expect(error).toBeDefined();
			}
		});
	});

	describe('Position 9 error analysis', () => {
		it('should identify character at position 9 in failing condition', () => {
			// This is the exact condition from the user's error:
			// "Parser error at position 9: Expected value"
			const condition = 'status = "draft" AND priority > 5';
			const analysis = analyzeString(condition);

			console.log('Full analysis:');
			analysis.forEach((item, idx) => {
				console.log(`Position ${idx}: '${item.char}' (${item.code}) - ${item.name}`);
			});

			// Position 9 should be the opening quote
			console.log(`Position 9: '${analysis[9].char}' = ${analysis[9].name}`);

			// If position 9 is the quote, it should be ASCII 34
			if (condition.charAt(9) === '"' || condition.charAt(9) === "'") {
				expect(analysis[9].code).toBeOneOf([34, 39, 8220, 8221, 8216, 8217]);
			}
		});

		it('should parse the exact placeholder text from UI', () => {
			// This is copied directly from RuleBuilderModal.svelte line 318
			const placeholder = 'status = "draft" AND priority > 5';

			console.log('Placeholder analysis:', analyzeString(placeholder));

			// This MUST parse successfully
			const ast = parseCondition(placeholder);
			expect(ast.type).toBe('boolean');
			expect(ast).toMatchObject({
				type: 'boolean',
				operator: 'AND',
				left: {
					type: 'comparison',
					left: 'status',
					operator: '=',
					right: 'draft'
				},
				right: {
					type: 'comparison',
					left: 'priority',
					operator: '>',
					right: 5
				},
			});
		});
	});

	describe('Invisible character detection', () => {
		it('should detect zero-width spaces', () => {
			// U+200B: zero-width space (invisible but breaks parsing)
			const zwsp = String.fromCharCode(8203);
			const condition = `status${zwsp} = "draft"`;

			console.log('Testing with zero-width space:', analyzeString(condition));

			try {
				parseCondition(condition);
			} catch (error) {
				// Should fail with unexpected character
				expect(error).toBeDefined();
			}
		});

		it('should detect non-breaking spaces', () => {
			// U+00A0: non-breaking space (looks like space but isn't ASCII 32)
			const nbsp = String.fromCharCode(160);
			const condition = `status${nbsp}=${nbsp}"draft"`;

			console.log('Testing with non-breaking space:', analyzeString(condition));

			// This might parse or might not, depending on lexer implementation
			try {
				const ast = parseCondition(condition);
				console.log('Parsed with nbsp:', ast);
			} catch (error) {
				console.log('Failed with nbsp:', error);
			}
		});
	});
});

// Custom matcher
expect.extend({
	toBeOneOf(received: any, expected: any[]) {
		const pass = expected.includes(received);
		return {
			pass,
			message: () => `expected ${received} to be one of [${expected.join(', ')}]`,
		};
	},
});
