/**
 * Tests for defaultBackup setting
 */

import { describe, it, expect } from 'vitest';
import { createNewRule } from '../../../src/storage/ruleStorage';

describe('defaultBackup Setting', () => {
	it('should create rule with backup enabled when defaultBackup is true', () => {
		const rule = createNewRule(true);

		expect(rule.options.backup).toBe(true);
	});

	it('should create rule with backup disabled when defaultBackup is false', () => {
		const rule = createNewRule(false);

		expect(rule.options.backup).toBe(false);
	});

	it('should default to backup enabled when no parameter provided', () => {
		const rule = createNewRule();

		expect(rule.options.backup).toBe(true);
	});

	it('should create rule with all other defaults regardless of backup setting', () => {
		const ruleWithBackup = createNewRule(true);
		const ruleWithoutBackup = createNewRule(false);

		// Both should have same structure except for backup option
		expect(ruleWithBackup.name).toBe('New Rule');
		expect(ruleWithBackup.condition).toBe('');
		expect(ruleWithBackup.action).toBe('');
		expect(ruleWithBackup.scope).toEqual({ type: 'vault' });
		expect(ruleWithBackup.created).toBeDefined();
		expect(ruleWithBackup.id).toBeDefined();

		expect(ruleWithoutBackup.name).toBe('New Rule');
		expect(ruleWithoutBackup.condition).toBe('');
		expect(ruleWithoutBackup.action).toBe('');
		expect(ruleWithoutBackup.scope).toEqual({ type: 'vault' });
		expect(ruleWithoutBackup.created).toBeDefined();
		expect(ruleWithoutBackup.id).toBeDefined();

		// Only backup should differ
		expect(ruleWithBackup.options.backup).toBe(true);
		expect(ruleWithoutBackup.options.backup).toBe(false);
	});
});
