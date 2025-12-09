/**
 * Test helper to execute rules on plain data objects
 * Used by generated tests from examples.md
 *
 * This is a simplified version of ruleEngine.ts that works without Obsidian App instance
 */

import { parseCondition } from '../../src/parser/conditionParser';
import { parseAction } from '../../src/parser/actionParser';
import { evaluateCondition } from '../../src/evaluator/conditionEvaluator';
import { resolveTestTemplates } from './testTemplateEngine';
import { ActionAST } from '../../src/types';
import { executeSet, executeAdd, executeDelete, executeRename } from '../../src/actions/basicActions';
import {
	executeAppend,
	executePrepend,
	executeInsertAt,
	executeInsertAfter,
	executeInsertBefore,
	executeRemove,
	executeRemoveAll,
	executeRemoveAt,
	executeReplace,
	executeReplaceAll,
	executeDeduplicate,
	executeSort,
	executeSortBy,
	executeMove,
	executeMoveWhere,
	executeUpdateWhere,
} from '../../src/actions/arrayActions';
import { executeMerge, executeMergeOverwrite } from '../../src/actions/objectActions';

export interface TestRule {
	condition?: string;
	action: string;
}

export interface TestRuleResult {
	status: 'success' | 'skipped' | 'error' | 'warning';
	modified: boolean;
	newData: any;
	changes: string[];
	error?: string;
	warning?: string;
}

/**
 * Compare two values with lenient type checking for common edge cases
 * Handles: "1.0" == 1.0, "true" == true, etc.
 */
export function lenientDeepEqual(actual: any, expected: any): boolean {
	// Exact match
	if (actual === expected) return true;

	// Both null/undefined
	if (actual == null && expected == null) return true;
	if (actual == null || expected == null) return false;

	// Type mismatch but value equivalence (string vs number)
	if (typeof actual !== typeof expected) {
		// Try converting to same type
		if (typeof actual === 'string' && typeof expected === 'number') {
			const num = parseFloat(actual);
			if (!isNaN(num) && num === expected) return true;
		}
		if (typeof actual === 'number' && typeof expected === 'string') {
			const num = parseFloat(expected);
			if (!isNaN(num) && num === actual) return true;
		}
		// Boolean string comparisons
		if (typeof actual === 'string' && typeof expected === 'boolean') {
			if ((actual === 'true' && expected === true) || (actual === 'false' && expected === false)) return true;
		}
		if (typeof actual === 'boolean' && typeof expected === 'string') {
			if ((actual === true && expected === 'true') || (actual === false && expected === 'false')) return true;
		}
		return false;
	}

	// Arrays
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) return false;
		return actual.every((item, idx) => lenientDeepEqual(item, expected[idx]));
	}

	// Objects
	if (typeof actual === 'object' && typeof expected === 'object') {
		const actualKeys = Object.keys(actual).sort();
		const expectedKeys = Object.keys(expected).sort();
		if (actualKeys.length !== expectedKeys.length) return false;
		if (actualKeys.some((key, idx) => key !== expectedKeys[idx])) return false;
		return actualKeys.every(key => lenientDeepEqual(actual[key], expected[key]));
	}

	// Primitives
	return actual === expected;
}

/**
 * Execute a rule on plain data object for testing
 */
export function executeTestRule(rule: TestRule, inputData: any): TestRuleResult {
	try {
		// Deep clone input to avoid mutations
		const data = JSON.parse(JSON.stringify(inputData));
		const originalData = JSON.parse(JSON.stringify(inputData));

		// Evaluate condition (if present)
		if (rule.condition && rule.condition.trim() !== '(none)' && rule.condition.trim().length > 0) {
			const conditionAST = parseCondition(rule.condition);
			const matches = evaluateCondition(conditionAST, data);

			if (!matches) {
				// Condition evaluated to false - return success (rule evaluated correctly)
				// rather than 'skipped' (which implies rule wasn't considered)
				return {
					status: 'success',
					modified: false,
					newData: data,
					changes: [],
				};
			}
		}

		// Resolve templates in action (for tests, use simple template resolution)
		const resolvedAction = resolveTestTemplates(rule.action, data);

		// Parse and execute action
		const actionAST = parseAction(resolvedAction);
		const actionResult = executeActionForTest(actionAST, data);

		if (!actionResult.success) {
			return {
				status: 'error',
				modified: false,
				newData: data,
				changes: actionResult.changes,
				error: actionResult.error,
			};
		}

		if (!actionResult.modified) {
			return {
				status: actionResult.warning ? 'warning' : 'skipped',
				modified: false,
				newData: data,
				changes: actionResult.changes,
				warning: actionResult.warning,
			};
		}

		return {
			status: actionResult.warning ? 'warning' : 'success',
			modified: true,
			newData: data,
			changes: actionResult.changes,
			warning: actionResult.warning,
		};
	} catch (error) {
		return {
			status: 'error',
			modified: false,
			newData: inputData,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Convert v2.0 path segments to string path (same as ruleEngine)
 */
function segmentsToPath(segments: Array<{ type: string; key?: string; index?: number }>): string {
	let path = '';
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		if (seg.type === 'property') {
			if (path && !path.endsWith(']')) path += '.';
			path += seg.key;
		} else if (seg.type === 'index') {
			path += `[${seg.index}]`;
		}
	}
	return path;
}

/**
 * Execute an action AST on data (test version, supports v2.0 AST)
 */
function executeActionForTest(ast: ActionAST, data: any): import('../../src/types').ActionResult {
	// Handle v2.0 AST structure
	if ((ast as any).type === 'action') {
		const v2ast = ast as any;
		const operation = v2ast.operation;
		const path = segmentsToPath(v2ast.target.segments);

		switch (operation.type) {
			case 'SET':
				// Check if this is UPDATE_WHERE (SET with WHERE clause)
				if (operation.where) {
					return executeUpdateWhere(data, path, operation.where, operation.updates || []);
				}
				return executeSet(data, path, operation.value);
			case 'ADD':
				return executeAdd(data, path, operation.value);
			case 'DELETE':
				return executeDelete(data, path);
			case 'RENAME':
				return executeRename(data, path, operation.to);
			case 'INCREMENT':
				// INCREMENT not directly available, use add operation
				return executeAdd(data, path, operation.amount || 1);
			case 'DECREMENT':
				// DECREMENT not directly available, subtract
				return executeAdd(data, path, -(operation.amount || 1));
			case 'APPEND':
				return executeAppend(data, path, operation.value);
			case 'PREPEND':
				return executePrepend(data, path, operation.value);
			case 'INSERT':
				return executeInsertAt(data, path, operation.value, operation.index);
			case 'INSERT_AFTER':
				return executeInsertAfter(data, path, operation.value, operation.referenceValue);
			case 'INSERT_BEFORE':
				return executeInsertBefore(data, path, operation.value, operation.referenceValue);
			case 'REMOVE':
				return executeRemove(data, path, operation.value);
			case 'REMOVE_ALL':
				return executeRemoveAll(data, path, operation.value);
			case 'REMOVE_AT':
				return executeRemoveAt(data, path, operation.index);
			case 'REPLACE':
				return executeReplace(data, path, operation.oldValue, operation.newValue);
			case 'REPLACE_ALL':
				return executeReplaceAll(data, path, operation.oldValue, operation.newValue);
			case 'DEDUPLICATE':
				return executeDeduplicate(data, path);
			case 'SORT':
				if (operation.by) {
					return executeSortBy(data, path, operation.by, operation.order || 'ASC');
				}
				return executeSort(data, path, operation.order || 'ASC');
			case 'MOVE':
				if (operation.where) {
					return executeMoveWhere(data, path, operation.where, operation.to);
				}
				return executeMove(data, path, operation.from, operation.to);
			case 'MERGE':
				return executeMerge(data, path, operation.value);
			case 'MERGE_OVERWRITE':
				return executeMergeOverwrite(data, path, operation.value);
			default:
				return {
					success: false,
					modified: false,
					changes: [],
					error: `Unknown v2.0 operation in test: ${operation.type}`,
				};
		}
	}

	// If we get here, AST is invalid
	return {
		success: false,
		modified: false,
		changes: [],
		error: `Invalid AST structure - expected v2.0 format with type='action'`,
	};
}

/**
 * Simplified wrapper for v2.0 tests: execute a rule on data
 * Usage: executeRule(data, { action: 'SET title "value"' })
 */
export function executeRule(data: any, rule: TestRule): TestRuleResult {
	return executeTestRule(rule, data);
}

/**
 * Simplified wrapper for v2.0 tests: execute parsed actions on data
 * Usage: executeActions(data, [parseAction('SET title "value"')])
 */
export function executeActions(data: any, actions: ActionAST[]): {
	success: boolean;
	data: any;
	changes: string[];
} {
	const allChanges: string[] = [];
	let success = true;

	for (const action of actions) {
		const result = executeActionForTest(action, data);
		if (!result.success) {
			success = false;
			break;
		}
		allChanges.push(...result.changes);
	}

	return {
		success,
		data,
		changes: allChanges
	};
}
