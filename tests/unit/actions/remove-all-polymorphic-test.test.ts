/**
 * Test to verify REMOVE_ALL polymorphic behavior
 * Testing whether REMOVE_ALL can accept array of values to remove
 */

import { executeRemoveAll } from '../../../src/actions/arrayActions';

describe('REMOVE_ALL Polymorphic Behavior Test', () => {
	describe('Single value (current behavior)', () => {
		it('should remove single value', () => {
			const data = { tags: ['draft', 'work', 'project', 'draft'] };
			const result = executeRemoveAll(data, 'tags', 'draft');
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'project']);
		});
	});

	describe('Array of values (polymorphic behavior)', () => {
		it('should remove multiple values when given array', () => {
			const data = { tags: ['draft', 'wip', 'temp', 'work', 'project'] };
			const result = executeRemoveAll(data, 'tags', ['draft', 'wip', 'temp']);

			// Polymorphic behavior: REMOVE_ALL with array removes all matching values
			expect(result.success).toBe(true);
			expect(data.tags).toEqual(['work', 'project']);
		});

		it('should not match literal array elements', () => {
			// When array contains another array as an element, it's NOT removed
			// because REMOVE_ALL with array value only removes matching SCALAR values
			const data = {
				things: ['a', 'b', ['draft', 'wip', 'temp'], 'c']
			};
			const result = executeRemoveAll(data, 'things', ['draft', 'wip', 'temp']);

			// Only scalar 'a' and 'b' would be removed if they matched, but 'draft', 'wip', 'temp' don't exist as scalars
			// The literal array element is NOT removed
			expect(result.success).toBe(true);
			expect(data.things).toEqual(['a', 'b', ['draft', 'wip', 'temp'], 'c']);
		});
	});

	describe('Workaround: Multiple REMOVE_ALL calls', () => {
		it('requires separate calls for each value', () => {
			const data = { tags: ['draft', 'wip', 'temp', 'work', 'project'] };

			// Need multiple operations to remove multiple values
			executeRemoveAll(data, 'tags', 'draft');
			executeRemoveAll(data, 'tags', 'wip');
			executeRemoveAll(data, 'tags', 'temp');

			expect(data.tags).toEqual(['work', 'project']);
		});
	});
});
