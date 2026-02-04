/**
 * Array Actions - Execute array operations on YAML data
 * Based on requirements Section 4.2
 *
 * Implements all 17 array operations including conditional operations
 * (accessed via unified syntax: FOR array WHERE condition SET/MOVE/etc.)
 */

import { ActionResult } from '../types';
import { resolvePath, setPath, pathExists } from '../parser/pathResolver';
import { evaluateCondition } from '../evaluator/conditionEvaluator';
import { ConditionAST, MoveRelativeTarget } from '../types';

/**
 * APPEND - Add to end of array
 */
export function executeAppend(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		// Create array if doesn't exist
		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`APPEND ${path}: created array with value`],
			};
		}

		// Error if not an array
		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.push(value);

		return {
			success: true,
			modified: true,
			changes: [`APPEND ${path}: added value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in APPEND',
		};
	}
}

/**
 * PREPEND - Add to beginning of array
 */
export function executePrepend(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`PREPEND ${path}: created array with value`],
			};
		}

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.unshift(value);

		return {
			success: true,
			modified: true,
			changes: [`PREPEND ${path}: added value to beginning`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in PREPEND',
		};
	}
}

/**
 * INSERT_AT - Insert at specific index
 */
export function executeInsertAt(data: any, path: string, value: any, index: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (array === undefined) {
			setPath(data, path, [value]);
			return {
				success: true,
				modified: true,
				changes: [`INSERT_AT ${path}: created array with value`],
			};
		}

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		// For negative indices, add 1 to insert AFTER the referenced element
		// AT -1 appends to end, AT -2 inserts before last, etc.
		const actualIndex = index < 0
			? Math.max(0, array.length + index + 1)
			: Math.min(index, array.length);

		array.splice(actualIndex, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_AT ${path}[${index}]: inserted value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_AT',
		};
	}
}

/**
 * INSERT_AFTER - Insert after first occurrence of target
 */
export function executeInsertAfter(data: any, path: string, value: any, target: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const targetIndex = array.findIndex(item => JSON.stringify(item) === JSON.stringify(target));

		if (targetIndex === -1) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Target value not found',
			};
		}

		array.splice(targetIndex + 1, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_AFTER ${path}: inserted value after target`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_AFTER',
		};
	}
}

/**
 * INSERT_BEFORE - Insert before first occurrence of target
 */
export function executeInsertBefore(data: any, path: string, value: any, target: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const targetIndex = array.findIndex(item => JSON.stringify(item) === JSON.stringify(target));

		if (targetIndex === -1) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Target value not found',
			};
		}

		array.splice(targetIndex, 0, value);

		return {
			success: true,
			modified: true,
			changes: [`INSERT_BEFORE ${path}: inserted value before target`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in INSERT_BEFORE',
		};
	}
}

/**
 * REMOVE - Remove first occurrence of value
 */
export function executeRemove(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const index = array.findIndex(item => JSON.stringify(item) === JSON.stringify(value));

		if (index === -1) {
			// Silent success when value not found (similar to DELETE behavior)
			return {
				success: true,
				modified: true, // Mark as modified for silent success
				changes: [],
			};
		}

		array.splice(index, 1);

		return {
			success: true,
			modified: true,
			changes: [`REMOVE ${path}: removed value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE',
		};
	}
}

/**
 * REMOVE_ALL - Remove all occurrences of value(s)
 * If value is an array, removes all items matching any value in that array
 * If value is scalar, removes all items matching that value
 */
export function executeRemoveAll(data: any, path: string, value: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const originalLength = array.length;

		// Build set of values to remove (handles both scalar and array inputs)
		const valuesToRemove = Array.isArray(value) ? value : [value];
		const valueStrs = valuesToRemove.map(v => JSON.stringify(v));

		// Filter out all matching values
		const filtered = array.filter(item => !valueStrs.includes(JSON.stringify(item)));

		if (filtered.length === originalLength) {
			// Silent success when value not found
			return {
				success: true,
				modified: true, // Mark as modified for silent success
				changes: [],
			};
		}

		// Replace array contents
		array.length = 0;
		array.push(...filtered);

		const removedCount = originalLength - filtered.length;

		return {
			success: true,
			modified: true,
			changes: [`REMOVE_ALL ${path}: removed ${removedCount} occurrence(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE_ALL',
		};
	}
}

/**
 * REMOVE_AT - Remove item at index
 */
export function executeRemoveAt(data: any, path: string, index: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		const actualIndex = index < 0 ? array.length + index : index;

		if (actualIndex < 0 || actualIndex >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'Index out of bounds',
			};
		}

		array.splice(actualIndex, 1);

		return {
			success: true,
			modified: true,
			changes: [`REMOVE_AT ${path}[${index}]: removed item`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REMOVE_AT',
		};
	}
}

/**
 * REPLACE - Replace first occurrence
 */
export function executeReplace(data: any, path: string, oldValue: any, newValue: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const index = array.findIndex(item => JSON.stringify(item) === JSON.stringify(oldValue));

		if (index === -1) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		array[index] = newValue;

		return {
			success: true,
			modified: true,
			changes: [`REPLACE ${path}: replaced value`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REPLACE',
		};
	}
}

/**
 * REPLACE_ALL - Replace all occurrences
 */
export function executeReplaceAll(data: any, path: string, oldValue: any, newValue: any): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const oldValueStr = JSON.stringify(oldValue);
		let replacedCount = 0;

		for (let i = 0; i < array.length; i++) {
			if (JSON.stringify(array[i]) === oldValueStr) {
				array[i] = newValue;
				replacedCount++;
			}
		}

		if (replacedCount === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'Value not found',
			};
		}

		return {
			success: true,
			modified: true,
			changes: [`REPLACE_ALL ${path}: replaced ${replacedCount} occurrence(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in REPLACE_ALL',
		};
	}
}

/**
 * DEDUPLICATE - Remove duplicate values
 */
export function executeDeduplicate(data: any, path: string): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		const originalLength = array.length;
		const seen = new Set<string>();
		const unique: any[] = [];

		for (const item of array) {
			const itemStr = JSON.stringify(item);
			if (!seen.has(itemStr)) {
				seen.add(itemStr);
				unique.push(item);
			}
		}

		if (unique.length === originalLength) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No duplicates found',
			};
		}

		// Replace array contents
		array.length = 0;
		array.push(...unique);

		const removedCount = originalLength - unique.length;

		return {
			success: true,
			modified: true,
			changes: [`DEDUPLICATE ${path}: removed ${removedCount} duplicate(s)`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in DEDUPLICATE',
		};
	}
}

/**
 * SORT - Sort simple array
 */
export function executeSort(data: any, path: string, order: 'ASC' | 'DESC'): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.sort((a, b) => {
			if (typeof a === 'string' && typeof b === 'string') {
				return order === 'ASC' ? a.localeCompare(b) : b.localeCompare(a);
			}
			if (typeof a === 'number' && typeof b === 'number') {
				return order === 'ASC' ? a - b : b - a;
			}
			// Mixed types: convert to string
			return order === 'ASC'
				? String(a).localeCompare(String(b))
				: String(b).localeCompare(String(a));
		});

		return {
			success: true,
			modified: true,
			changes: [`SORT ${path}: sorted ${order}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in SORT',
		};
	}
}

/**
 * SORT_BY - Sort array of objects by field
 */
export function executeSortBy(data: any, path: string, field: string, order: 'ASC' | 'DESC'): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		array.sort((a, b) => {
			const aVal = a[field];
			const bVal = b[field];

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return order === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return order === 'ASC' ? aVal - bVal : bVal - aVal;
			}
			// Mixed or undefined: convert to string
			return order === 'ASC'
				? String(aVal).localeCompare(String(bVal))
				: String(bVal).localeCompare(String(aVal));
		});

		return {
			success: true,
			modified: true,
			changes: [`SORT_BY ${path} BY ${field}: sorted ${order}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in SORT_BY',
		};
	}
}

/**
 * MOVE - Move item from one index to another
 */
export function executeMove(data: any, path: string, fromIndex: number, toIndex: number): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Handle negative indices
		const actualFrom = fromIndex < 0 ? array.length + fromIndex : fromIndex;
		const actualTo = toIndex < 0 ? array.length + toIndex : toIndex;

		if (actualFrom < 0 || actualFrom >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'From index out of bounds',
			};
		}

		if (actualTo < 0 || actualTo >= array.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: 'To index out of bounds',
			};
		}

		// Remove item from fromIndex
		const [item] = array.splice(actualFrom, 1);
		// Insert at toIndex
		array.splice(actualTo, 0, item);

		return {
			success: true,
			modified: true,
			changes: [`MOVE ${path}: moved item from ${fromIndex} to ${toIndex}`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MOVE',
		};
	}
}

/**
 * MOVE_WHERE - Move items matching condition
 */
export function executeMoveWhere(
	data: any,
	path: string,
	condition: ConditionAST,
	target: number | 'START' | 'END' | MoveRelativeTarget
): ActionResult {
	try {
		// DEBUG: Log entry
		console.log('[MOVE_WHERE_DEBUG] Entry:', { path, target, conditionType: condition?.type });
		
		const array = resolvePath(data, path);
		console.log('[MOVE_WHERE_DEBUG] Resolved array:', { 
			isArray: Array.isArray(array), 
			length: Array.isArray(array) ? array.length : 'N/A',
			arrayItems: Array.isArray(array) ? array.map((item: any) => item.title || item) : 'N/A'
		});

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// For relative positioning, find reference first (before removing items)
		let refIndex = -1;
		if (typeof target === 'object' && 'reference' in target) {
			refIndex = array.findIndex(item => evaluateCondition(target.reference, item));
			if (refIndex === -1) {
				return {
					success: false,
					modified: false,
					changes: [],
					error: 'Target condition matched no items',
				};
			}
		}

		// Find items matching condition (excluding reference if it matches)
		const matchingIndices: number[] = [];
		for (let i = 0; i < array.length; i++) {
			// Skip the reference item itself
			if (i === refIndex) continue;

			const item = array[i];
			const matches = evaluateCondition(condition, item);
			console.log('[MOVE_WHERE_DEBUG] Item', i, ':', item, '-> matches:', matches);
			if (matches) {
				matchingIndices.push(i);
			}
		}

		console.log('[MOVE_WHERE_DEBUG] Matching items found:', { 
			count: matchingIndices.length, 
			indices: matchingIndices,
			items: matchingIndices.map(i => array[i].title || array[i])
		});

		if (matchingIndices.length === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No items matched WHERE condition',
			};
		}

		// Extract matching items (in reverse order to preserve indices)
		const matchingItems = matchingIndices.reverse().map(i => array.splice(i, 1)[0]).reverse();

		console.log('[MOVE_WHERE_DEBUG] After removal:', { 
			arrayItems: array.map((item: any) => item.title || item),
			matchingItems: matchingItems.map((item: any) => item.title || item)
		});

		// Adjust refIndex after removals (items before it were removed)
		if (refIndex !== -1) {
			const removedBefore = matchingIndices.filter(idx => idx < refIndex).length;
			refIndex -= removedBefore;
		}

		// Determine target position
		if (target === 'START') {
			array.unshift(...matchingItems);
		} else if (target === 'END') {
			array.push(...matchingItems);
		} else if (typeof target === 'number') {
			// Numeric index: TO 0, TO 1, etc.
			array.splice(target, 0, ...matchingItems);
		} else {
			// Relative positioning (AFTER/BEFORE)
			const insertIndex = target.position === 'AFTER' ? refIndex + 1 : refIndex;
			array.splice(insertIndex, 0, ...matchingItems);
		}

		console.log('[MOVE_WHERE_DEBUG] Final array:', { 
			arrayItems: array.map((item: any) => item.title || item)
		});

		return {
			success: true,
			modified: true,
			changes: [`MOVE_WHERE ${path}: moved ${matchingItems.length} item(s)`],
		};
	} catch (error) {
		console.log('[MOVE_WHERE_DEBUG] Error:', error);
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in MOVE_WHERE',
		};
	}
}

/**
 * UPDATE_WHERE - Update fields in items matching condition
 */
export function executeUpdateWhere(
	data: any,
	path: string,
	condition: ConditionAST,
	updates: Array<{ field: string; value: any }>
): ActionResult {
	try {
		const array = resolvePath(data, path);

		if (!Array.isArray(array)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		let updatedCount = 0;

		for (const item of array) {
			if (evaluateCondition(condition, item)) {
				for (const update of updates) {
					item[update.field] = update.value;
				}
				updatedCount++;
			}
		}

		if (updatedCount === 0) {
			return {
				success: true,
				modified: false,
				changes: [],
				warning: 'No items matched condition',
			};
		}

		const fieldNames = updates.map(u => u.field).join(', ');

		return {
			success: true,
			modified: true,
			changes: [`UPDATE_WHERE ${path}: updated ${updatedCount} item(s) (${fieldNames})`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in UPDATE_WHERE',
		};
	}
}


/**
 * DIRECT ELEMENT SET - Set fields on a specific array element by index
 * For paths like: history[0] or teams[-1].members[0]
 */
export function executeDirectElementSet(
	data: any,
	path: string,
	updates: Array<{ field: string; value: any }>
): ActionResult {
	try {
		// Parse path segments to find array indices
		const segments = parsePathSegmentsHelper(path);
		
		if (segments.length === 0) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Invalid path: ${path}`,
			};
		}

		// Check if the path contains at least one array index
		const lastIndexSegment = findLastIndexSegment(segments);
		if (lastIndexSegment === null) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Path '${path}' does not contain array index. Direct element SET requires an index (e.g., array[0] or array[-1])`,
			};
		}

		// Resolve to parent of the indexed element
		let current = data;
		
		for (let i = 0; i < lastIndexSegment.segmentIndex; i++) {
			const segment = segments[i];
			
			if (segment.type === 'property') {
				if (!segment.key) {
					return {
						success: false,
						modified: false,
						changes: [],
						error: `Invalid property in path`,
					};
				}
				current = current[segment.key];
			} else if (segment.type === 'index') {
				if (!Array.isArray(current)) {
					return {
						success: false,
						modified: false,
						changes: [],
						error: `Cannot index into non-array: ${path}`,
					};
				}
				const idx = segment.index;
				if (idx === undefined) {
					return {
						success: false,
						modified: false,
						changes: [],
						error: `Invalid index in path: ${path}`,
					};
				}
				const actualIndex = idx < 0 ? current.length + idx : idx;
				if (actualIndex < 0 || actualIndex >= current.length) {
					return {
						success: false,
						modified: false,
						changes: [],
						error: `Array index out of bounds in path '${path}'`,
					};
				}
				current = current[actualIndex];
			}

			if (current === undefined || current === null) {
				return {
					success: false,
					modified: false,
					changes: [],
					error: `Path does not exist: ${path}`,
				};
			}
		}

		// Now process the final index segment
		const finalIndexSegment = segments[lastIndexSegment.segmentIndex];
		if (finalIndexSegment.type !== 'index') {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Internal error: expected index segment`,
			};
		}

		// Validate current is an array
		if (!Array.isArray(current)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Field '${path}' is not an array`,
			};
		}

		// Get the actual index
		const finalIdx = finalIndexSegment.index;
		if (finalIdx === undefined) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Invalid index in path: ${path}`,
			};
		}
		const actualIndex = finalIdx < 0
			? current.length + finalIdx
			: finalIdx;

		// Validate index is in bounds
		if (actualIndex < 0 || actualIndex >= current.length) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Array index out of bounds: [${finalIdx}] (array length: ${current.length})`,
			};
		}

		// Get the element
		const element = current[actualIndex];

		// Validate element is an object
		if (typeof element !== 'object' || element === null || Array.isArray(element)) {
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Element at '${path}' is not an object`,
			};
		}

		// Apply updates
		for (const update of updates) {
			element[update.field] = update.value;
		}

		const fieldNames = updates.map(u => u.field).join(', ');

		return {
			success: true,
			modified: true,
			changes: [`SET ${path}[${finalIdx}]: updated (${fieldNames})`],
		};
	} catch (error) {
		return {
			success: false,
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error in direct element SET',
		};
	}
}

// Helper function to parse path segments (similar to parsePathSegments but returns more info)
function parsePathSegmentsHelper(path: string): Array<{ type: string; key?: string; index?: number }> {
	const segments: Array<{ type: string; key?: string; index?: number }> = [];
	let current = '';
	let i = 0;

	while (i < path.length) {
		const char = path[i];

		if (char === '.') {
			// End of property segment
			if (current.length > 0) {
				segments.push({ type: 'property', key: current });
				current = '';
			}
			i++;
		} else if (char === '[') {
			// Start of index segment
			if (current.length > 0) {
				segments.push({ type: 'property', key: current });
				current = '';
			}

			// Find closing ]
			const closeIndex = path.indexOf(']', i);
			if (closeIndex === -1) {
				throw new Error(`Unclosed bracket in path: ${path}`);
			}

			const indexStr = path.substring(i + 1, closeIndex);
			const index = parseInt(indexStr, 10);

			if (isNaN(index)) {
				throw new Error(`Invalid array index: ${indexStr}`);
			}

			segments.push({ type: 'index', index });
			i = closeIndex + 1;
		} else {
			// Regular character
			current += char;
			i++;
		}
	}

	// Add final segment
	if (current.length > 0) {
		segments.push({ type: 'property', key: current });
	}

	return segments;
}

// Helper to find the last index segment
function findLastIndexSegment(segments: Array<{ type: string; key?: string; index?: number }>): { segmentIndex: number } | null {
	for (let i = segments.length - 1; i >= 0; i--) {
		if (segments[i].type === 'index') {
			return { segmentIndex: i };
		}
	}
	return null;
}
