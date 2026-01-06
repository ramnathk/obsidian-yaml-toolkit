/**
 * Rule Engine - Orchestrate condition evaluation and action execution
 * Based on requirements Section 2.2 (workflow)
 *
 * Flow: Read file → Resolve templates → Evaluate condition → Execute action → Return result
 */

import { App, TFile } from 'obsidian';
import { FileResult, Rule, ActionAST, ConditionAST } from '../types';
import { readFrontmatter } from '../yaml/yamlProcessor';
import { parseCondition } from '../parser/conditionParser';
import { parseAction } from '../parser/actionParser';
import { evaluateCondition } from '../evaluator/conditionEvaluator';
import { resolveTemplates, TemplateContext } from './templateEngine';
import { executeSet, executeAdd, executeDelete, executeRename, executeIncrement, executeDecrement } from '../actions/basicActions';
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
} from '../actions/arrayActions';
import { executeMerge, executeMergeOverwrite } from '../actions/objectActions';

/**
 * Execute a rule on a single file (dry-run - does not write to disk)
 *
 * @param app - Obsidian App instance
 * @param rule - Rule to execute
 * @param file - File to process
 * @returns FileResult with changes (but file not modified)
 */
export async function executeRule(app: App, rule: Rule, file: TFile): Promise<FileResult> {
	const startTime = Date.now();

	try {
		// Read frontmatter
		const { data, content } = await readFrontmatter(app, file);
		const originalData = JSON.parse(JSON.stringify(data)); // Deep copy for comparison

		// Evaluate condition (if present)
		if (rule.condition && rule.condition.trim().length > 0) {
			const conditionAST = parseCondition(rule.condition);
			const matches = evaluateCondition(conditionAST, data);

			if (!matches) {
				return {
					file,
					status: 'skipped',
					modified: false,
					changes: [],
					originalData,
					newData: data,
					duration: Date.now() - startTime,
				};
			}
		}

		// Resolve templates in action
		const templateContext: TemplateContext = {
			file,
			vault: app.vault,
			frontmatter: data,
		};
		const resolvedAction = resolveTemplates(rule.action, templateContext);

		// Parse and execute action
		const actionAST = parseAction(resolvedAction);
		const actionResult = executeAction(actionAST, data);

		if (!actionResult.success) {
			return {
				file,
				status: 'error',
				modified: false,
				changes: actionResult.changes,
				originalData,
				newData: data,
				error: actionResult.error,
				duration: Date.now() - startTime,
			};
		}

		if (!actionResult.modified) {
			return {
				file,
				status: actionResult.warning ? 'warning' : 'skipped',
				modified: false,
				changes: actionResult.changes,
				originalData,
				newData: data,
				warning: actionResult.warning,
				duration: Date.now() - startTime,
			};
		}

		return {
			file,
			status: actionResult.warning ? 'warning' : 'success',
			modified: true,
			changes: actionResult.changes,
			originalData,
			newData: data,
			warning: actionResult.warning,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		return {
			file,
			status: 'error',
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error',
			duration: Date.now() - startTime,
		};
	}
}

/**
 * Convert v2.0 path segments to string path
 * [{ type: 'property', key: 'title' }] -> "title"
 * [{ type: 'property', key: 'tasks' }, { type: 'index', index: 0 }] -> "tasks[0]"
 * [{ type: 'property', key: 'metadata' }, { type: 'property', key: 'author' }] -> "metadata.author"
 */
function segmentsToPath(segments: Array<{ type: string; key?: string; index?: number }>): string {
	let path = '';
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		if (seg.type === 'property') {
			if (path && !path.endsWith(']')) path += '.';  // Add dot before property (except after index)
			path += seg.key;
		} else if (seg.type === 'index') {
			path += `[${seg.index}]`;
		}
	}
	return path;
}

/**
 * Execute an action AST on data (supports v2.0 Hybrid Grammar AST structure)
 */
export function executeAction(ast: ActionAST, data: any): import('../types').ActionResult {
	// Handle v2.0 AST structure: { type: 'action', target, operation }
	if ((ast as any).type === 'action') {
		const v2ast = ast as any;
		const operation = v2ast.operation;
		const path = segmentsToPath(v2ast.target.segments);

		switch (operation.type) {
			case 'SET':
				// Check if conditional (has 'where' and 'updates')
				if (operation.where && operation.updates) {
					// Conditional SET uses UPDATE_WHERE: FOR items WHERE ... SET field value
					return executeUpdateWhere(data, path, operation.where, operation.updates);
				}
				return executeSet(data, path, operation.value);
			case 'ADD':
				return executeAdd(data, path, operation.value);
			case 'DELETE':
				return executeDelete(data, path);
			case 'RENAME':
				return executeRename(data, path, operation.to);
			case 'INCREMENT':
				return executeIncrement(data, path, operation.amount || 1);
			case 'DECREMENT':
				return executeDecrement(data, path, operation.amount || 1);
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
				// Check if conditional (has 'where')
				if (operation.where) {
					// Conditional REMOVE uses special handling - remove items matching WHERE
					// This is v2.0 behavior: FOR items WHERE ... REMOVE
					// Execute by iterating array and removing matching items
					const result = executeUpdateWhere(data, path, operation.where, []);
					// Empty updates array means "remove the item"
					// Return with appropriate changes message
					return {
						...result,
						changes: result.changes.map(c => c.replace('UPDATE_WHERE', 'REMOVE WHERE'))
					};
				}
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
				// Check if it's SORT BY (has 'by' field)
				if (operation.by) {
					return executeSortBy(data, path, operation.by, operation.order || 'ASC');
				}
				return executeSort(data, path, operation.order || 'ASC');
			case 'MOVE':
				// Check if conditional (has 'where') or index-based (has 'from')
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
					error: `Unknown v2.0 operation: ${operation.type}`,
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
