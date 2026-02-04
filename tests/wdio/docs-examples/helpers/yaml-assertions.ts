/**
 * YAML Assertion Helpers for Documentation Tests
 * Provides functions for comparing and validating YAML frontmatter
 */

import yaml from 'js-yaml';

export interface ComparisonResult {
	equal: boolean;
	differences: string[];
}

/**
 * Parse YAML string into object
 */
export function parseYaml(content: string): any {
	try {
		return yaml.load(content);
	} catch (error) {
		throw new Error(`Failed to parse YAML: ${error}`);
	}
}

/**
 * Compare two YAML objects for equality
 * Returns detailed comparison result with differences
 */
export function compareYaml(actual: any, expected: any, path: string = ''): ComparisonResult {
	const differences: string[] = [];

	// Handle null/undefined
	if (actual === null && expected === null) {
		return { equal: true, differences: [] };
	}
	if (actual === null || expected === null) {
		differences.push(`${path}: expected ${expected}, got ${actual}`);
		return { equal: false, differences };
	}

	// Handle different types
	if (typeof actual !== typeof expected) {
		differences.push(`${path}: type mismatch - expected ${typeof expected}, got ${typeof actual}`);
		return { equal: false, differences };
	}

	// Handle arrays
	if (Array.isArray(expected)) {
		if (!Array.isArray(actual)) {
			differences.push(`${path}: expected array, got ${typeof actual}`);
			return { equal: false, differences };
		}

		if (actual.length !== expected.length) {
			differences.push(`${path}: array length mismatch - expected ${expected.length}, got ${actual.length}`);
		}

		const maxLen = Math.max(actual.length, expected.length);
		for (let i = 0; i < maxLen; i++) {
			const itemPath = `${path}[${i}]`;

			if (i >= expected.length) {
				differences.push(`${itemPath}: unexpected item ${JSON.stringify(actual[i])}`);
			} else if (i >= actual.length) {
				differences.push(`${itemPath}: missing item ${JSON.stringify(expected[i])}`);
			} else {
				const itemResult = compareYaml(actual[i], expected[i], itemPath);
				differences.push(...itemResult.differences);
			}
		}

		return { equal: differences.length === 0, differences };
	}

	// Handle objects
	if (typeof expected === 'object') {
		const actualKeys = Object.keys(actual);
		const expectedKeys = Object.keys(expected);

		// Check for missing keys
		for (const key of expectedKeys) {
			if (!(key in actual)) {
				differences.push(`${path}.${key}: missing in actual`);
			}
		}

		// Check for extra keys
		for (const key of actualKeys) {
			if (!(key in expected)) {
				differences.push(`${path}.${key}: unexpected key in actual`);
			}
		}

		// Compare common keys
		const commonKeys = expectedKeys.filter(k => k in actual);
		for (const key of commonKeys) {
			const keyPath = path ? `${path}.${key}` : key;
			const result = compareYaml(actual[key], expected[key], keyPath);
			differences.push(...result.differences);
		}

		return { equal: differences.length === 0, differences };
	}

	// Handle date markers from normalization (for flexible date comparison)
	if (typeof expected === 'object' && expected !== null && expected.__isDate &&
	    typeof actual === 'object' && actual !== null && actual.__isDate) {
		// Both are dates - allow them to match (both are dates is enough for {{today}} comparisons)
		// This allows {{today}} from different days to match
		return { equal: true, differences: [] };
	}

	// Handle primitives (string, number, boolean)
	if (actual !== expected) {
		differences.push(`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
		return { equal: false, differences };
	}

	return { equal: true, differences: [] };
}

/**
 * Unwrap date markers for display
 */
function unwrapDates(value: any): any {
	if (typeof value === 'object' && value !== null && value.__isDate) {
		// Return just the ISO value
		return value.value;
	}

	if (Array.isArray(value)) {
		return value.map(unwrapDates);
	}

	if (typeof value === 'object' && value !== null) {
		const unwrapped: any = {};
		for (const [key, val] of Object.entries(value)) {
			unwrapped[key] = unwrapDates(val);
		}
		return unwrapped;
	}

	return value;
}

/**
 * Format YAML differences for human-readable output
 */
export function formatYamlDiff(actual: any, expected: any): string {
	const result = compareYaml(actual, expected);

	if (result.equal) {
		return '✅ YAML objects are equal';
	}

	let output = '❌ YAML objects differ:\n\n';

	for (const diff of result.differences) {
		output += `  • ${diff}\n`;
	}

	output += '\n📄 Expected:\n';
	output += yaml.dump(unwrapDates(expected), { indent: 2 });

	output += '\n📄 Actual:\n';
	output += yaml.dump(unwrapDates(actual), { indent: 2 });

	return output;
}

/**
 * Assert that two YAML objects are equal
 * Throws error with detailed diff if not equal
 */
export function assertYamlEqual(actual: any, expected: any, message?: string): void {
	const result = compareYaml(actual, expected);

	if (!result.equal) {
		const diff = formatYamlDiff(actual, expected);
		const errorMessage = message ? `${message}\n\n${diff}` : diff;
		throw new Error(errorMessage);
	}
}

/**
 * Assert that actual YAML contains expected fields (partial match)
 */
export function assertYamlContains(actual: any, expected: any, message?: string): void {
	const differences: string[] = [];

	for (const [key, value] of Object.entries(expected)) {
		if (!(key in actual)) {
			differences.push(`Missing field: ${key}`);
			continue;
		}

		// For objects and arrays, do deep comparison
		if (typeof value === 'object' && value !== null) {
			const result = compareYaml(actual[key], value, key);
			if (!result.equal) {
				differences.push(...result.differences);
			}
		} else if (actual[key] !== value) {
			differences.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`);
		}
	}

	if (differences.length > 0) {
		const errorMessage = message
			? `${message}\n\n${differences.join('\n')}`
			: differences.join('\n');
		throw new Error(errorMessage);
	}
}

/**
 * Normalize YAML values for comparison
 * Handles date strings, ISO timestamps, and template variables like {{today}}
 * Marks dates with a special type for flexible comparison
 */
export function normalizeYamlValue(value: any): any {
	if (typeof value === 'string') {
		// Handle template variables like {{today}}
		if (value === '{{today}}') {
			const today = new Date();
			const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
			return { __isDate: true, value: new Date(dateString).toISOString() };
		}

		// Try to parse as date - both simple dates (YYYY-MM-DD) and ISO timestamps
		const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
		if (dateRegex.test(value)) {
			// Mark as date with a special wrapper so we can do flexible comparison
			return { __isDate: true, value: new Date(value).toISOString() };
		}
	}

	if (Array.isArray(value)) {
		return value.map(normalizeYamlValue);
	}

	if (typeof value === 'object' && value !== null) {
		const normalized: any = {};
		for (const [key, val] of Object.entries(value)) {
			normalized[key] = normalizeYamlValue(val);
		}
		return normalized;
	}

	return value;
}

/**
 * Compare YAML with normalization (handles date formats, etc.)
 */
export function compareYamlNormalized(actual: any, expected: any): ComparisonResult {
	const normalizedActual = normalizeYamlValue(actual);
	const normalizedExpected = normalizeYamlValue(expected);
	return compareYaml(normalizedActual, normalizedExpected);
}

/**
 * Assert YAML equal with normalization
 */
export function assertYamlEqualNormalized(actual: any, expected: any, message?: string): void {
	const result = compareYamlNormalized(actual, expected);

	if (!result.equal) {
		const diff = formatYamlDiff(actual, expected);
		const errorMessage = message ? `${message}\n\n${diff}` : diff;
		throw new Error(errorMessage);
	}
}

/**
 * Check if YAML field exists
 */
export function hasField(yaml: any, fieldPath: string): boolean {
	const parts = fieldPath.split('.');
	let current = yaml;

	for (const part of parts) {
		if (typeof current !== 'object' || current === null) {
			return false;
		}

		if (!(part in current)) {
			return false;
		}

		current = current[part];
	}

	return true;
}

/**
 * Get nested field value from YAML
 */
export function getField(yaml: any, fieldPath: string): any {
	const parts = fieldPath.split('.');
	let current = yaml;

	for (const part of parts) {
		if (typeof current !== 'object' || current === null) {
			return undefined;
		}

		if (!(part in current)) {
			return undefined;
		}

		current = current[part];
	}

	return current;
}

/**
 * Pretty print YAML for debugging
 */
export function prettyPrintYaml(data: any): string {
	return yaml.dump(data, {
		indent: 2,
		lineWidth: 80,
		noRefs: true,
		sortKeys: true
	});
}
