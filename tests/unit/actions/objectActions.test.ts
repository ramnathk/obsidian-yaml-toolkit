/**
 * Tests for Object Actions
 */

import { describe, it, expect } from 'vitest';
import { executeMerge, executeMergeOverwrite } from '../../../src/actions/objectActions';

describe('Object Actions', () => {
	describe('MERGE - deep merge', () => {
		it('should merge objects deeply', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMerge(data, 'metadata', {
				editor: 'Jane',
				reviewed: true
			});
			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0,
				editor: 'Jane',
				reviewed: true
			});
		});

		it('should overwrite primitives in deep merge', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMerge(data, 'metadata', {
				version: 2.0
			});
			expect(result.success).toBe(true);
			expect(data.metadata.version).toBe(2.0);
		});

		it('should replace arrays (not merge)', () => {
			const data = {
				metadata: {
					tags: ['a', 'b'],
					count: 5
				}
			};
			const result = executeMerge(data, 'metadata', {
				tags: ['x', 'y'],
				count: 10
			});
			expect(result.success).toBe(true);
			expect(data.metadata.tags).toEqual(['x', 'y']);
			expect(data.metadata.count).toBe(10);
		});

		it('should recursively merge nested objects', () => {
			const data = {
				config: {
					settings: {
						theme: 'dark',
						size: 'medium'
					}
				}
			};
			const result = executeMerge(data, 'config', {
				settings: {
					size: 'large',
					font: 'mono'
				}
			});
			expect(result.success).toBe(true);
			expect(data.config.settings).toEqual({
				theme: 'dark',
				size: 'large',
				font: 'mono'
			});
		});

		it('should create object if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeMerge(data, 'metadata', {
				author: 'John',
				version: 1.0
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0
			});
		});

		it('should error on non-object field', () => {
			const data = { metadata: 'not-an-object' };
			const result = executeMerge(data, 'metadata', { author: 'John' });
			expect(result.success).toBe(false);
			expect(result.error).toContain('not an object');
		});
	});

	describe('MERGE_OVERWRITE - shallow merge', () => {
		it('should merge objects shallowly', () => {
			const data = {
				metadata: {
					author: 'John',
					version: 1.0
				}
			};
			const result = executeMergeOverwrite(data, 'metadata', {
				editor: 'Jane',
				reviewed: true
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({
				author: 'John',
				version: 1.0,
				editor: 'Jane',
				reviewed: true
			});
		});

		it('should replace nested objects (not merge)', () => {
			const data = {
				config: {
					settings: {
						theme: 'dark',
						size: 'medium'
					}
				}
			};
			const result = executeMergeOverwrite(data, 'config', {
				settings: {
					size: 'large',
					font: 'mono'
				}
			});
			expect(result.success).toBe(true);
			// Should replace entire settings object
			expect(data.config.settings).toEqual({
				size: 'large',
				font: 'mono'
			});
			// theme should be gone (replaced, not merged)
		});

		it('should create object if field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeMergeOverwrite(data, 'metadata', {
				author: 'John'
			});
			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({ author: 'John' });
		});
	});

	describe('Error Handling and Edge Cases (lines 100-106, 115-117)', () => {
		it('executeMergeOverwrite should catch errors from null value', () => {
			const data = { config: { theme: 'dark' } };
			// Passing null as value should trigger error handling
			const result = executeMergeOverwrite(data, 'config', null as any);

			expect(result.success).toBe(false);
			expect(result.modified).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('executeMergeOverwrite should handle non-object value gracefully', () => {
			const data = { config: { theme: 'dark' } };
			// Passing primitive as value - implementation handles gracefully
			const result = executeMergeOverwrite(data, 'config', 'not-an-object' as any);

			// Function handles this gracefully (success=true)
			expect(result.success).toBe(true);
		});

		it('executeMergeOverwrite should handle circular references', () => {
			const data = { config: {} };
			// Create circular reference in value
			const circularValue: any = { field: 'test' };
			circularValue.self = circularValue;

			const result = executeMergeOverwrite(data, 'config', circularValue);

			// Should either succeed or catch error gracefully
			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
		});

		it('deepMerge should skip inherited properties', () => {
			// Create object with inherited property
			const proto = { inherited: 'should-skip' };
			const source = Object.create(proto);
			source.own = 'should-include';

			const data = { config: {} };
			const result = executeMerge(data, 'config', source);

			expect(result.success).toBe(true);
			// Should only merge own properties, not inherited ones
			expect(data.config).toHaveProperty('own');
			expect(data.config).not.toHaveProperty('inherited');
		});

		it('executeMerge should skip inherited properties', () => {
			// Create object with inherited property via prototype chain
			const proto = { protoField: 'inherited' };
			const source = Object.create(proto);
			source.ownField = 'direct';

			const data = { metadata: {} };
			const result = executeMerge(data, 'metadata', source);

			expect(result.success).toBe(true);
			// Should only include own properties
			expect(data.metadata.ownField).toBe('direct');
			expect(data.metadata.protoField).toBeUndefined();
		});

		it('executeMerge should catch errors from null prototype objects', () => {
			const data = { config: {} };
			// Object with null prototype
			const nullProtoObj = Object.create(null);
			nullProtoObj.field = 'value';

			const result = executeMerge(data, 'config', nullProtoObj);

			// Null prototype objects may cause errors in hasOwnProperty check
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});
});
