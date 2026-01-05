/**
 * Unit Tests for ruleEngine Error Paths and Edge Cases
 * Focuses on increasing branch coverage for uncovered error handling code
 */

import { describe, it, expect } from 'vitest';
import { executeAction } from '../../../src/core/ruleEngine';

describe('ruleEngine - Error Paths and Edge Cases', () => {
	describe('Unknown Operation Types', () => {
		it('should handle unknown v2.0 operation type', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'UNKNOWN_OPERATION',
					value: 'test'
				}
			};

			const data = { field: 'value' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('Unknown v2.0 operation');
			expect(result.error).toContain('UNKNOWN_OPERATION');
		});

		it('should handle typo in operation type', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'status' }]
				},
				operation: {
					type: 'SETT', // Typo: should be SET
					value: 'published'
				}
			};

			const data = { status: 'draft' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unknown v2.0 operation: SETT');
		});

		it('should handle lowercase operation type', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'set', // Should be uppercase SET
					value: 'value'
				}
			};

			const data = { field: 'old' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unknown v2.0 operation: set');
		});

		it('should handle misspelled operation', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'count' }]
				},
				operation: {
					type: 'INCREAMENT', // Typo: should be INCREMENT
					amount: 1
				}
			};

			const data = { count: 10 };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unknown v2.0 operation: INCREAMENT');
		});

		it('should handle empty operation type', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: '',
					value: 'test'
				}
			};

			const data = { field: 'value' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unknown v2.0 operation');
		});

		it('should handle null operation type', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: null,
					value: 'test'
				}
			};

			const data = { field: 'value' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('Invalid AST Structure', () => {
		it('should handle missing type field', () => {
			const invalidAst: any = {
				// Missing type: 'action'
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const data = { field: 'value' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toContain('Invalid AST structure');
			expect(result.error).toContain('expected v2.0 format');
		});

		it('should handle wrong type value', () => {
			const invalidAst: any = {
				type: 'condition', // Wrong: should be 'action'
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const data = { field: 'value' };
			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Invalid AST structure');
		});

		it('should throw on null AST', () => {
			const invalidAst: any = null;
			const data = { field: 'value' };

			// null AST will cause TypeError when accessing properties
			expect(() => executeAction(invalidAst, data)).toThrow();
		});

		it('should throw on undefined AST', () => {
			const invalidAst: any = undefined;
			const data = { field: 'value' };

			// undefined AST will cause TypeError when accessing properties
			expect(() => executeAction(invalidAst, data)).toThrow();
		});

		it('should handle empty object AST', () => {
			const invalidAst: any = {};
			const data = { field: 'value' };

			const result = executeAction(invalidAst, data);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Invalid AST structure');
		});

		it('should throw when AST has only type field', () => {
			const invalidAst: any = {
				type: 'action'
				// Missing target and operation
			};

			const data = { field: 'value' };

			// Missing operation will cause TypeError
			expect(() => executeAction(invalidAst, data)).toThrow();
		});

		it('should throw when AST has missing target', () => {
			const invalidAst: any = {
				type: 'action',
				// Missing target
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const data = { field: 'value' };

			// Missing target will cause TypeError
			expect(() => executeAction(invalidAst, data)).toThrow();
		});

		it('should throw when AST has missing operation', () => {
			const invalidAst: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				}
				// Missing operation
			};

			const data = { field: 'value' };

			// Missing operation will cause TypeError
			expect(() => executeAction(invalidAst, data)).toThrow();
		});
	});

	describe('Edge Cases for Operation Variants', () => {
		it('should handle SET with conditional but malformed where', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'items' }]
				},
				operation: {
					type: 'SET',
					where: null, // Malformed where
					updates: []
				}
			};

			const data = { items: [{ id: 1 }] };

			// Should handle gracefully without crashing
			expect(() => executeAction(ast, data)).not.toThrow();
		});

		it('should handle REMOVE with conditional but missing where', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'items' }]
				},
				operation: {
					type: 'REMOVE',
					// Missing where even though it checks for it
					value: 'test'
				}
			};

			const data = { items: ['test', 'other'] };
			const result = executeAction(ast, data);

			// Should use non-conditional REMOVE
			expect(result.success).toBe(true);
		});

		it('should handle SORT with missing order', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'numbers' }]
				},
				operation: {
					type: 'SORT'
					// Missing order, should default to 'ASC'
				}
			};

			const data = { numbers: [3, 1, 2] };
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
		});

		it('should handle SORT BY with missing order', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'items' }]
				},
				operation: {
					type: 'SORT',
					by: 'name'
					// Missing order, should default to 'ASC'
				}
			};

			const data = {
				items: [
					{ name: 'C' },
					{ name: 'A' },
					{ name: 'B' }
				]
			};
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
		});

		it('should handle MOVE with where clause', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'items' }]
				},
				operation: {
					type: 'MOVE',
					where: {
						type: 'comparison',
						operator: 'EQUALS',
						left: { type: 'path', segments: [{ type: 'property', key: 'id' }] },
						right: { type: 'literal', value: 1 }
					},
					to: 2
				}
			};

			const data = {
				items: [
					{ id: 1, name: 'first' },
					{ id: 2, name: 'second' },
					{ id: 3, name: 'third' }
				]
			};

			const result = executeAction(ast, data);
			// Should use executeMoveWhere
			expect(result).toBeDefined();
		});

		it('should handle MOVE with from index', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'items' }]
				},
				operation: {
					type: 'MOVE',
					from: 0,
					to: 2
				}
			};

			const data = {
				items: ['first', 'second', 'third']
			};

			const result = executeAction(ast, data);
			expect(result.success).toBe(true);
		});

		it('should handle INCREMENT with missing amount', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'count' }]
				},
				operation: {
					type: 'INCREMENT'
					// Missing amount, should default to 1
				}
			};

			const data = { count: 10 };
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
		});

		it('should handle DECREMENT with missing amount', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'count' }]
				},
				operation: {
					type: 'DECREMENT'
					// Missing amount, should default to 1
				}
			};

			const data = { count: 10 };
			const result = executeAction(ast, data);

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
		});
	});

	describe('Data Type Edge Cases', () => {
		it('should handle action on null data', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const result = executeAction(ast, null);
			// Should handle null data gracefully
			expect(result).toBeDefined();
		});

		it('should handle action on undefined data', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'field' }]
				},
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const result = executeAction(ast, undefined);
			expect(result).toBeDefined();
		});

		it('should handle action on empty object', () => {
			const ast: any = {
				type: 'action',
				target: {
					type: 'path',
					segments: [{ type: 'property', key: 'newField' }]
				},
				operation: {
					type: 'SET',
					value: 'test'
				}
			};

			const result = executeAction(ast, {});
			expect(result.success).toBe(true);
		});
	});
});
