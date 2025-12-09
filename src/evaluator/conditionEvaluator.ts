/**
 * Condition Evaluator - Evaluate condition AST against YAML data
 * Based on requirements Section 3.2, 3.2.1, 3.2.2
 *
 * Takes a parsed condition AST and evaluates it against actual frontmatter data
 */

import {
	ConditionAST,
	ComparisonNode,
	ExistenceNode,
	TypeCheckNode,
	EmptyCheckNode,
	HasNode,
	BooleanNode,
	NotNode,
	QuantifierNode,
} from '../types';
import { resolvePath, pathExists } from '../parser/pathResolver';
import { LIMITS, DANGEROUS_REGEX_PATTERNS } from '../constants';

/**
 * Evaluate a condition AST against data
 * @param ast - Parsed condition AST
 * @param data - Frontmatter data object
 * @returns true if condition matches, false otherwise
 */
export function evaluateCondition(ast: ConditionAST, data: any): boolean {
	switch (ast.type) {
		case 'comparison':
			return evaluateComparison(ast, data);
		case 'existence':
			return evaluateExistence(ast, data);
		case 'type_check':
			return evaluateTypeCheck(ast, data);
		case 'empty_check':
			return evaluateEmptyCheck(ast, data);
		case 'has':
			return evaluateHas(ast, data);
		case 'contains':
			return evaluateContains(ast, data);
		case 'in':
			return evaluateIn(ast, data);
		case 'boolean':
			return evaluateBoolean(ast, data);
		case 'not':
			return evaluateNot(ast, data);
		case 'quantifier':
			return evaluateQuantifier(ast, data);
		default:
			throw new Error(`Unknown condition type: ${(ast as any).type}`);
	}
}

/**
 * Evaluate comparison: path op value
 */
function evaluateComparison(node: ComparisonNode, data: any): boolean {
	const leftValue = resolvePath(data, node.left);

	// If path doesn't exist, comparison fails (except for != which returns true)
	if (leftValue === undefined) {
		return node.operator === '!=';
	}

	const rightValue = node.right;

	switch (node.operator) {
		case '=':
			// Use loose equality to handle common type coercions (e.g., "1984" == 1984)
			return leftValue == rightValue;
		case '!=':
			return leftValue != rightValue;
		case '>':
			// Support both number and string comparison (for dates)
			if (typeof leftValue === 'number' && typeof rightValue === 'number') {
				return leftValue > rightValue;
			}
			if (typeof leftValue === 'string' && typeof rightValue === 'string') {
				return leftValue > rightValue;
			}
			return false;
		case '<':
			// Support both number and string comparison (for dates)
			if (typeof leftValue === 'number' && typeof rightValue === 'number') {
				return leftValue < rightValue;
			}
			if (typeof leftValue === 'string' && typeof rightValue === 'string') {
				return leftValue < rightValue;
			}
			return false;
		case '>=':
			// Support both number and string comparison (for dates)
			if (typeof leftValue === 'number' && typeof rightValue === 'number') {
				return leftValue >= rightValue;
			}
			if (typeof leftValue === 'string' && typeof rightValue === 'string') {
				return leftValue >= rightValue;
			}
			return false;
		case '<=':
			// Support both number and string comparison (for dates)
			if (typeof leftValue === 'number' && typeof rightValue === 'number') {
				return leftValue <= rightValue;
			}
			if (typeof leftValue === 'string' && typeof rightValue === 'string') {
				return leftValue <= rightValue;
			}
			return false;
		case '~':
			return evaluateRegex(leftValue, rightValue);
		default:
			return false;
	}
}

/**
 * Evaluate regex matching with ReDoS protection
 */
function evaluateRegex(value: any, pattern: string): boolean {
	// Convert value to string for regex matching
	const strValue = String(value);

	// Parse regex pattern (format: /pattern/flags)
	const match = pattern.match(/^\/(.+?)\/([gimsuvy]*)$/);
	if (!match) {
		throw new Error(`Invalid regex pattern: ${pattern}`);
	}

	const [, regexPattern, flags] = match;

	// Validate regex pattern length to prevent ReDoS
	if (regexPattern.length > LIMITS.MAX_REGEX_LENGTH) {
		throw new Error(
			`Regex pattern too long (max ${LIMITS.MAX_REGEX_LENGTH} characters): ${regexPattern.substring(0, 50)}...`
		);
	}

	// Check for dangerous patterns that could cause ReDoS
	for (const dangerousPattern of DANGEROUS_REGEX_PATTERNS) {
		if (dangerousPattern.test(regexPattern)) {
			throw new Error(
				`Potentially unsafe regex pattern detected (could cause performance issues): ${regexPattern}`
			);
		}
	}

	try {
		const regex = new RegExp(regexPattern, flags);

		// Execute regex with timeout protection
		const startTime = Date.now();
		let timedOut = false;

		// Set timeout handler
		const timeoutId = setTimeout(() => {
			timedOut = true;
		}, LIMITS.REGEX_TIMEOUT_MS);

		try {
			const result = regex.test(strValue);

			// Check if we timed out during execution
			if (timedOut || Date.now() - startTime > LIMITS.REGEX_TIMEOUT_MS) {
				throw new Error(
					`Regex execution timeout (exceeded ${LIMITS.REGEX_TIMEOUT_MS}ms). Pattern may be too complex: ${regexPattern}`
				);
			}

			return result;
		} finally {
			clearTimeout(timeoutId);
		}
	} catch (e) {
		if (e instanceof Error && e.message.includes('timeout')) {
			throw e;
		}
		throw new Error(`Invalid regex: ${pattern}`);
	}
}

/**
 * Evaluate existence check: path exists / path !exists
 */
function evaluateExistence(node: ExistenceNode, data: any): boolean {
	const exists = pathExists(data, node.path);
	return node.operator === 'exists' ? exists : !exists;
}

/**
 * Evaluate type check: path :type
 */
function evaluateTypeCheck(node: TypeCheckNode, data: any): boolean {
	const value = resolvePath(data, node.path);

	// Non-existent paths fail type checks
	if (value === undefined) {
		return false;
	}

	let matches = false;

	switch (node.typeCheck) {
		case 'string':
			matches = typeof value === 'string';
			break;
		case 'number':
			matches = typeof value === 'number';
			break;
		case 'boolean':
			matches = typeof value === 'boolean';
			break;
		case 'array':
			matches = Array.isArray(value);
			break;
		case 'object':
			matches = typeof value === 'object' && value !== null && !Array.isArray(value);
			break;
		case 'null':
			matches = value === null;
			break;
	}

	return node.negated ? !matches : matches;
}

/**
 * Evaluate empty check: path empty / path !empty
 *
 * Truth table from requirements Section 3.2.1:
 * - Field missing: empty = false, !empty = true
 * - Field is null: empty = false, !empty = true
 * - Empty array []: empty = true, !empty = false
 * - Empty string "": empty = true, !empty = false
 * - Empty object {}: empty = true, !empty = false
 */
function evaluateEmptyCheck(node: EmptyCheckNode, data: any): boolean {
	const value = resolvePath(data, node.path);

	// Non-existent fields: empty = false
	if (value === undefined) {
		return node.operator === 'empty' ? false : true;
	}

	// Null: empty = false
	if (value === null) {
		return node.operator === 'empty' ? false : true;
	}

	let isEmpty = false;

	if (Array.isArray(value)) {
		isEmpty = value.length === 0;
	} else if (typeof value === 'string') {
		isEmpty = value.length === 0;
	} else if (typeof value === 'object') {
		isEmpty = Object.keys(value).length === 0;
	}

	return node.operator === 'empty' ? isEmpty : !isEmpty;
}

/**
 * Evaluate has operator: array has value
 */
function evaluateHas(node: HasNode, data: any): boolean {
	const array = resolvePath(data, node.path);

	// Non-existent or non-array: has = false
	if (!Array.isArray(array)) {
		return node.operator === 'has' ? false : true;
	}

	// Check if array contains the value
	const hasValue = array.includes(node.value);

	return node.operator === 'has' ? hasValue : !hasValue;
}

/**
 * Evaluate contains: path[*].field CONTAINS value
 * Checks if ANY item in an array has a field containing the value
 * Supports wildcard syntax: tasks[*].assignee CONTAINS "bob"
 */
function evaluateContains(node: any, data: any): boolean {
	const path = node.path;

	// Check if path contains [*] wildcard
	if (path.includes('[*]')) {
		// Parse path: "tasks[*].assignee" => { arrayPath: "tasks", field: "assignee" }
		const wildcardMatch = path.match(/^([^[]+)\[\*\]\.(.+)$/);

		if (wildcardMatch) {
			const [, arrayPath, field] = wildcardMatch;
			const array = resolvePath(data, arrayPath);

			if (!Array.isArray(array)) {
				return false;
			}

			// Check if ANY item in array has the field value matching
			return array.some(item => {
				if (typeof item === 'object' && item !== null) {
					return item[field] === node.value;
				}
				return false;
			});
		}

		// If no match on the wildcard pattern, just check simple [*] (no field accessor)
		// e.g., "array[*]" CONTAINS value
		const simpleWildcard = path.match(/^([^[]+)\[\*\]$/);
		if (simpleWildcard) {
			const [, arrayPath] = simpleWildcard;
			const array = resolvePath(data, arrayPath);

			if (!Array.isArray(array)) {
				return false;
			}

			return array.includes(node.value);
		}
	}

	// No wildcard - resolve normally
	const value = resolvePath(data, path);

	// If path doesn't exist or isn't an array, return false
	if (!Array.isArray(value)) {
		return false;
	}

	// Check if array contains the value
	const hasValue = value.includes(node.value);
	return hasValue;
}

/**
 * Evaluate in: value IN array
 * Checks if value is in the provided array
 */
function evaluateIn(node: any, data: any): boolean {
	const leftValue = resolvePath(data, node.path);
	const arrayValue = node.array;
	
	if (!Array.isArray(arrayValue)) {
		return false;
	}
	
	return arrayValue.includes(leftValue);
}

/**
 * Evaluate boolean operator: AND / OR
 */
function evaluateBoolean(node: BooleanNode, data: any): boolean {
	const left = evaluateCondition(node.left, data);
	const right = evaluateCondition(node.right, data);

	if (node.operator === 'AND') {
		return left && right;
	} else {
		return left || right;
	}
}

/**
 * Evaluate NOT operator
 */
function evaluateNot(node: NotNode, data: any): boolean {
	return !evaluateCondition(node.operand, data);
}

/**
 * Evaluate quantifier: ANY / ALL
 */
function evaluateQuantifier(node: QuantifierNode, data: any): boolean {
	const array = resolvePath(data, node.array);

	// Non-existent or non-array: return false
	if (!Array.isArray(array)) {
		return false;
	}

	// Empty array: ANY = false, ALL = false (per spec)
	if (array.length === 0) {
		return false;
	}

	if (node.quantifier === 'ANY') {
		// Return true if at least one item matches
		return array.some(item => evaluateCondition(node.condition, item));
	} else {
		// Return true if all items match
		return array.every(item => evaluateCondition(node.condition, item));
	}
}
