/**
 * Tests for Path Resolver - Edge Cases and Full Coverage
 */

import { describe, it, expect } from 'vitest';
import {
	resolvePath,
	setPath,
	deletePath,
	pathExists,
	parsePathSegments,
	pathPointsToElement,
	extractArrayIndex
} from '../../../src/parser/pathResolver';

describe('Path Resolver - Comprehensive', () => {
	describe('parsePathSegments', () => {
		it('should parse simple property', () => {
			const segments = parsePathSegments('field');
			expect(segments).toEqual([{ type: 'property', key: 'field' }]);
		});

		it('should parse nested properties', () => {
			const segments = parsePathSegments('metadata.author');
			expect(segments).toEqual([
				{ type: 'property', key: 'metadata' },
				{ type: 'property', key: 'author' }
			]);
		});

		it('should parse array index', () => {
			const segments = parsePathSegments('items[0]');
			expect(segments).toEqual([
				{ type: 'property', key: 'items' },
				{ type: 'index', index: 0 }
			]);
		});

		it('should parse negative array index', () => {
			const segments = parsePathSegments('items[-1]');
			expect(segments).toEqual([
				{ type: 'property', key: 'items' },
				{ type: 'index', index: -1 }
			]);
		});

		it('should parse nested array path', () => {
			const segments = parsePathSegments('countsLog[0].mantra');
			expect(segments).toEqual([
				{ type: 'property', key: 'countsLog' },
				{ type: 'index', index: 0 },
				{ type: 'property', key: 'mantra' }
			]);
		});

		it('should parse complex nested path', () => {
			const segments = parsePathSegments('data.items[2].tags[0]');
			expect(segments).toHaveLength(5);
		});

		it('should throw on unclosed bracket', () => {
			expect(() => parsePathSegments('items[0')).toThrow('Unclosed bracket');
		});

		it('should throw on invalid array index', () => {
			expect(() => parsePathSegments('items[abc]')).toThrow('Invalid array index');
		});

		it('should handle empty string', () => {
			const segments = parsePathSegments('');
			expect(segments).toEqual([]);
		});
	});

	describe('resolvePath - Edge Cases', () => {
		it('should return undefined for non-existent path', () => {
			const data = { title: 'Test' };
			expect(resolvePath(data, 'missing')).toBeUndefined();
			expect(resolvePath(data, 'nested.missing')).toBeUndefined();
		});

		it('should return undefined for null parent', () => {
			const data = { parent: null };
			expect(resolvePath(data, 'parent.child')).toBeUndefined();
		});

		it('should handle negative array indices', () => {
			const data = { items: ['a', 'b', 'c'] };
			expect(resolvePath(data, 'items[-1]')).toBe('c');
			expect(resolvePath(data, 'items[-2]')).toBe('b');
			expect(resolvePath(data, 'items[-3]')).toBe('a');
		});

		it('should return undefined for out of bounds negative index', () => {
			const data = { items: ['a', 'b'] };
			expect(resolvePath(data, 'items[-10]')).toBeUndefined();
		});

		it('should return undefined for out of bounds positive index', () => {
			const data = { items: ['a', 'b'] };
			expect(resolvePath(data, 'items[10]')).toBeUndefined();
		});

		it('should return undefined when indexing non-array', () => {
			const data = { field: 'string' };
			expect(resolvePath(data, 'field[0]')).toBeUndefined();
		});

		it('should handle deeply nested paths', () => {
			const data = {
				level1: {
					level2: {
						level3: {
							value: 'deep'
						}
					}
				}
			};
			expect(resolvePath(data, 'level1.level2.level3.value')).toBe('deep');
		});
	});

	describe('setPath - Edge Cases', () => {
		it('should create parent objects when missing', () => {
			const data = {};
			setPath(data, 'metadata.author', 'John');
			expect(data).toEqual({ metadata: { author: 'John' } });
		});

		it('should create nested parents', () => {
			const data = {};
			setPath(data, 'a.b.c.d', 'value');
			expect(resolvePath(data, 'a.b.c.d')).toBe('value');
		});

		it('should create array when next segment is index', () => {
			const data = {};
			setPath(data, 'items[0]', 'first');
			expect(Array.isArray((data as any).items)).toBe(true);
			expect((data as any).items[0]).toBe('first');
		});

		it('should extend array when setting beyond length', () => {
			const data = { items: ['a'] };
			setPath(data, 'items[3]', 'd');
			expect(data.items).toHaveLength(4);
			expect(data.items[3]).toBe('d');
			expect(data.items[1]).toBe(null);
			expect(data.items[2]).toBe(null);
		});

		it('should handle negative indices when setting', () => {
			const data = { items: ['a', 'b', 'c'] };
			setPath(data, 'items[-1]', 'last');
			expect(data.items[2]).toBe('last');
		});

		it('should create nested object in array', () => {
			const data = { items: [{}] };
			setPath(data, 'items[0].name', 'test');
			expect(data.items[0]).toEqual({ name: 'test' });
		});

		it('should overwrite existing values', () => {
			const data = { field: 'old' };
			setPath(data, 'field', 'new');
			expect(data.field).toBe('new');
		});

		it('should handle empty path', () => {
			const data = { field: 'value' };
			setPath(data, '', 'new');
			// Should not crash, but also not modify
			expect(data.field).toBe('value');
		});
	});

	describe('deletePath - Edge Cases', () => {
		it('should return false for non-existent path', () => {
			const data = { field: 'value' };
			expect(deletePath(data, 'missing')).toBe(false);
		});

		it('should return false for empty path', () => {
			const data = { field: 'value' };
			expect(deletePath(data, '')).toBe(false);
		});

		it('should delete from array using index', () => {
			const data = { items: ['a', 'b', 'c'] };
			const result = deletePath(data, 'items[1]');
			expect(result).toBe(true);
			expect(data.items).toEqual(['a', 'c']);
		});

		it('should handle negative index deletion', () => {
			const data = { items: ['a', 'b', 'c'] };
			deletePath(data, 'items[-1]');
			expect(data.items).toEqual(['a', 'b']);
		});

		it('should return false for out of bounds index', () => {
			const data = { items: ['a', 'b'] };
			expect(deletePath(data, 'items[10]')).toBe(false);
		});

		it('should delete nested property', () => {
			const data = { metadata: { author: 'John', version: 1.0 } };
			deletePath(data, 'metadata.version');
			expect(data.metadata).toEqual({ author: 'John' });
		});

		it('should return false when parent doesnt exist', () => {
			const data = { field: 'value' };
			expect(deletePath(data, 'missing.nested')).toBe(false);
		});

		it('should return false when trying to delete from null', () => {
			const data = { parent: null };
			expect(deletePath(data, 'parent.child')).toBe(false);
		});

		it('should return false when indexing non-array', () => {
			const data = { field: 'string' };
			expect(deletePath(data, 'field[0]')).toBe(false);
		});
	});

	describe('pathExists', () => {
		it('should return true for existing paths', () => {
			const data = { field: 'value', nested: { prop: 'test' } };
			expect(pathExists(data, 'field')).toBe(true);
			expect(pathExists(data, 'nested.prop')).toBe(true);
		});

		it('should return false for non-existent paths', () => {
			const data = { field: 'value' };
			expect(pathExists(data, 'missing')).toBe(false);
			expect(pathExists(data, 'field.nested')).toBe(false);
		});

		it('should return true for null values', () => {
			const data = { field: null };
			expect(pathExists(data, 'field')).toBe(true);
		});

		it('should return true for array elements', () => {
			const data = { items: ['a', 'b', 'c'] };
			expect(pathExists(data, 'items[0]')).toBe(true);
			expect(pathExists(data, 'items[-1]')).toBe(true);
		});

		it('should return false for out of bounds indices', () => {
			const data = { items: ['a', 'b'] };
			expect(pathExists(data, 'items[10]')).toBe(false);
			expect(pathExists(data, 'items[-10]')).toBe(false);
		});
	});

	describe('Element detection utilities (Phase 2)', () => {
		describe('pathPointsToElement', () => {
			it('should return true when path points to array element (positive index)', () => {
				const data = {
					history: [
						{ date: '2026-01-01', reviewed: false },
						{ date: '2026-01-02', reviewed: false }
					]
				};
				expect(pathPointsToElement(data, 'history[0]')).toBe(true);
				expect(pathPointsToElement(data, 'history[1]')).toBe(true);
			});

			it('should return true when path points to array element (negative index)', () => {
				const data = {
					history: [
						{ date: '2026-01-01', reviewed: false },
						{ date: '2026-01-02', reviewed: false }
					]
				};
				expect(pathPointsToElement(data, 'history[-1]')).toBe(true);
				expect(pathPointsToElement(data, 'history[-2]')).toBe(true);
			});

			it('should return false when path points to array (no index)', () => {
				const data = {
					history: [
						{ date: '2026-01-01', reviewed: false },
						{ date: '2026-01-02', reviewed: false }
					]
				};
				expect(pathPointsToElement(data, 'history')).toBe(false);
			});

			it('should return false when path returns array', () => {
				const data = {
					nested: {
						items: [[1, 2], [3, 4]]
					}
				};
				expect(pathPointsToElement(data, 'nested.items[0]')).toBe(false);
			});

			it('should handle nested paths with indices', () => {
				const data = {
					teams: [
						{
							name: 'Alpha',
							members: [
								{ id: 1, name: 'Alice' },
								{ id: 2, name: 'Bob' }
							]
						}
					]
				};
				expect(pathPointsToElement(data, 'teams[0].members[0]')).toBe(true);
				expect(pathPointsToElement(data, 'teams[0].members[-1]')).toBe(true);
			});

			it('should return false for missing paths', () => {
				const data = {
					history: [{ date: '2026-01-01' }]
				};
				expect(pathPointsToElement(data, 'missing[0]')).toBe(false);
			});

			it('should return true for nested paths without final index', () => {
				const data = {
					items: [
						{ value: 'first' },
						{ value: 'second' }
					]
				};
				expect(pathPointsToElement(data, 'items[0].value')).toBe(true);
			});
		});

		describe('extractArrayIndex', () => {
			it('should extract positive array index from path', () => {
				expect(extractArrayIndex('history[0]')).toBe(0);
				expect(extractArrayIndex('items[5]')).toBe(5);
				expect(extractArrayIndex('array[999]')).toBe(999);
			});

			it('should extract negative array index from path', () => {
				expect(extractArrayIndex('history[-1]')).toBe(-1);
				expect(extractArrayIndex('items[-2]')).toBe(-2);
				expect(extractArrayIndex('array[-999]')).toBe(-999);
			});

			it('should return null when path has no index', () => {
				expect(extractArrayIndex('history')).toBeNull();
				expect(extractArrayIndex('nested.path')).toBeNull();
			});

			it('should return null for nested paths without final index', () => {
				expect(extractArrayIndex('teams[0].members')).toBeNull();
				expect(extractArrayIndex('history[5].value')).toBeNull();
			});

			it('should extract index from end of nested path', () => {
				expect(extractArrayIndex('teams[0].members[1]')).toBe(1);
				expect(extractArrayIndex('nested.deep.array[-1]')).toBe(-1);
			});

			it('should handle edge cases correctly', () => {
				expect(extractArrayIndex('[0]')).toBe(0);
				expect(extractArrayIndex('path[0].nested[1]')).toBe(1);
			});
		});
	});
});
