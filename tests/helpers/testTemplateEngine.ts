/**
 * Simplified template engine for test execution
 * Resolves template variables like {{today}}, {{now}}, etc.
 */

import { DateTime } from 'luxon';

/**
 * Resolve templates in action string for tests
 * This is a simplified version of src/core/templateEngine.ts
 */
export function resolveTestTemplates(action: string, frontmatter: any): string {
	let resolved = action;

	// Use fixed date for tests to match generated test expectations
	// Tests were generated on 2025-11-19, so use that date
	const now = DateTime.fromISO('2025-11-19T12:00:00');

	// Date/time templates
	resolved = resolved.replace(/\{\{today\}\}/gi, now.toISODate() || '');
	resolved = resolved.replace(/\{\{now\}\}/gi, now.toISO() || '');
	resolved = resolved.replace(/\{\{timestamp\}\}/gi, now.toMillis().toString());
	resolved = resolved.replace(/\{\{year\}\}/gi, now.year.toString());
	resolved = resolved.replace(/\{\{month\}\}/gi, now.month.toString().padStart(2, '0'));
	resolved = resolved.replace(/\{\{day\}\}/gi, now.day.toString().padStart(2, '0'));
	resolved = resolved.replace(/\{\{time\}\}/gi, now.toFormat('HH:mm:ss'));

	// File-related templates (use placeholder values for tests)
	resolved = resolved.replace(/\{\{filename\}\}/gi, 'test-file');
	resolved = resolved.replace(/\{\{filepath\}\}/gi, 'test/path/test-file.md');
	resolved = resolved.replace(/\{\{folder\}\}/gi, 'test/path');
	resolved = resolved.replace(/\{\{vault\}\}/gi, 'test-vault');

	// Frontmatter templates: {{fm:fieldname}}
	const fmRegex = /\{\{fm:([a-zA-Z0-9_-]+)\}\}/gi;
	resolved = resolved.replace(fmRegex, (match, fieldName) => {
		const value = frontmatter[fieldName];
		return value !== undefined ? String(value) : match;
	});

	// Custom date format: {{date:FORMAT}}
	const dateFormatRegex = /\{\{date:([^}]+)\}\}/gi;
	resolved = resolved.replace(dateFormatRegex, (match, format) => {
		try {
			return now.toFormat(format);
		} catch {
			return match;
		}
	});

	return resolved;
}

/**
 * Normalize date values for test comparisons
 * Handles cases like "2025-11-24T21:45:00" → "2025-11-24T21:45:00"
 */
export function normalizeDateForTest(value: any): any {
	if (typeof value === 'string') {
		// Check if it's an ISO date string
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
			// Normalize to ISO format without milliseconds or timezone
			const dt = DateTime.fromISO(value);
			if (dt.isValid) {
				return dt.toFormat("yyyy-MM-dd'T'HH:mm:ss");
			}
		}
		// Check if it's a date-only string
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			const dt = DateTime.fromISO(value);
			if (dt.isValid) {
				return dt.toISODate();
			}
		}
	}
	return value;
}

/**
 * Deep compare objects, normalizing dates
 */
export function deepEqualWithDateNormalization(actual: any, expected: any): boolean {
	// Handle null/undefined
	if (actual === expected) return true;
	if (actual == null || expected == null) return false;
	if (typeof actual !== typeof expected) return false;

	// Handle primitives
	if (typeof actual !== 'object') {
		return normalizeDateForTest(actual) === normalizeDateForTest(expected);
	}

	// Handle arrays
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) return false;
		return actual.every((item, idx) => deepEqualWithDateNormalization(item, expected[idx]));
	}

	// Handle objects
	const actualKeys = Object.keys(actual);
	const expectedKeys = Object.keys(expected);
	if (actualKeys.length !== expectedKeys.length) return false;

	return actualKeys.every(key => {
		if (!expectedKeys.includes(key)) return false;
		return deepEqualWithDateNormalization(actual[key], expected[key]);
	});
}
