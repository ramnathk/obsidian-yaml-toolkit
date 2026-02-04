/**
 * i18n Interpolation Tests
 *
 * Tests the t() function's ability to replace placeholders with actual values
 * This is critical for Notice messages that display counts and status summaries
 */

import { describe, it, expect } from 'vitest';
import { t } from '../../../src/i18n';

describe('i18n - Placeholder Interpolation', () => {
	it('should replace {count} placeholder with actual value', () => {
		const result = t('notices.processing', { count: 5 });
		expect(result).toBe('Processing 5 file(s)...');
	});

	it('should replace {count} with 1 file', () => {
		const result = t('notices.processing', { count: 1 });
		expect(result).toBe('Processing 1 file(s)...');
	});

	it('should replace {count} with 0 files', () => {
		const result = t('notices.processing', { count: 0 });
		expect(result).toBe('Processing 0 file(s)...');
	});

	it('should replace {count} with large numbers', () => {
		const result = t('notices.processing', { count: 1000 });
		expect(result).toBe('Processing 1000 file(s)...');
	});

	it('should replace multiple placeholders in completion message', () => {
		const result = t('notices.complete', {
			success: 25,
			warnings: 3,
			errors: 0
		});
		expect(result).toBe('✅ Complete: 25 success, 3 warnings, 0 errors');
	});

	it('should handle all placeholders being 0', () => {
		const result = t('notices.complete', {
			success: 0,
			warnings: 0,
			errors: 0
		});
		expect(result).toBe('✅ Complete: 0 success, 0 warnings, 0 errors');
	});

	it('should handle large numbers in completion message', () => {
		const result = t('notices.complete', {
			success: 999,
			warnings: 99,
			errors: 9
		});
		expect(result).toBe('✅ Complete: 999 success, 99 warnings, 9 errors');
	});

	it('should replace {message} placeholder in error message', () => {
		const result = t('notices.error', { message: 'File not found' });
		expect(result).toBe('Error: File not found');
	});

	it('should handle error messages with special characters', () => {
		const result = t('notices.error', { message: 'Parse error: Expected "string"' });
		expect(result).toBe('Error: Parse error: Expected "string"');
	});

	it('should return original string when no values provided', () => {
		const result = t('notices.ruleSaved');
		expect(result).toBe('Rule saved successfully');
	});

	it('should return original string when empty values object provided', () => {
		const result = t('notices.ruleSaved', {});
		expect(result).toBe('Rule saved successfully');
	});

	it('should ignore unused placeholder values', () => {
		const result = t('notices.processing', { count: 5, unused: 'value' });
		expect(result).toBe('Processing 5 file(s)...');
	});

	it('should handle undefined placeholder values', () => {
		const result = t('notices.processing', { count: undefined } as any);
		expect(result).toBe('Processing  file(s)...');
	});

	it('should handle null placeholder values', () => {
		const result = t('notices.processing', { count: null } as any);
		expect(result).toBe('Processing  file(s)...');
	});

	it('should convert number strings to values', () => {
		const result = t('notices.processing', { count: '42' } as any);
		expect(result).toBe('Processing 42 file(s)...');
	});

	it('should handle boolean values as strings', () => {
		const result = t('notices.error', { message: true } as any);
		expect(result).toBe('Error: true');
	});

	it('should return key on missing translation', () => {
		const result = t('nonexistent.key', { value: 123 });
		expect(result).toBe('nonexistent.key');
	});
});
