/**
 * Tests for i18n initialization and translation helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initI18n, t } from '../../../src/i18n';

// Mock svelte-i18n
vi.mock('svelte-i18n', () => ({
	addMessages: vi.fn(),
	init: vi.fn(),
	getLocaleFromNavigator: vi.fn(),
	_: {
		subscribe: vi.fn((callback) => {
			callback((key: string, values?: Record<string, any>) => {
				// Simple mock translation function
				if (values) {
					let result = key;
					Object.entries(values).forEach(([k, v]) => {
						result = result.replace(`{${k}}`, String(v));
					});
					return result;
				}
				return key;
			});
			return () => {};
		}),
	},
}));

// Mock svelte/store
vi.mock('svelte/store', () => ({
	get: vi.fn((store) => {
		// Return a mock translation function
		return (key: string, values?: Record<string, any>) => {
			if (values) {
				let result = key;
				Object.entries(values).forEach(([k, v]) => {
					result = result.replace(`{${k}}`, String(v));
				});
				return result;
			}
			return key;
		};
	}),
}));

describe('i18n', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('initI18n', () => {
		it('should initialize with English translations', async () => {
			const { addMessages, init } = await import('svelte-i18n');

			initI18n();

			expect(addMessages).toHaveBeenCalledWith('en', expect.any(Object));
			expect(init).toHaveBeenCalled();
		});

		it('should use navigator locale when available', async () => {
			const { init, getLocaleFromNavigator } = await import('svelte-i18n');
			vi.mocked(getLocaleFromNavigator).mockReturnValue('fr');

			initI18n();

			expect(init).toHaveBeenCalledWith({
				fallbackLocale: 'en',
				initialLocale: 'fr',
			});
		});

		it('should fallback to en when navigator locale is null', async () => {
			const { init, getLocaleFromNavigator } = await import('svelte-i18n');
			vi.mocked(getLocaleFromNavigator).mockReturnValue(null);

			initI18n();

			expect(init).toHaveBeenCalledWith({
				fallbackLocale: 'en',
				initialLocale: 'en',
			});
		});

		it('should fallback to en when navigator locale is undefined', async () => {
			const { init, getLocaleFromNavigator } = await import('svelte-i18n');
			vi.mocked(getLocaleFromNavigator).mockReturnValue(undefined as any);

			initI18n();

			expect(init).toHaveBeenCalledWith({
				fallbackLocale: 'en',
				initialLocale: 'en',
			});
		});
	});

	describe('t (translation helper)', () => {
		it('should translate simple keys', () => {
			const result = t('notices.ruleSaved');
			expect(result).toBe('notices.ruleSaved');
		});

		it('should handle interpolation values', () => {
			const result = t('message.count', { count: 5 });
			expect(result).toBe('message.count'); // Simple mock doesn't do actual translation
		});

		it('should handle missing values gracefully', () => {
			const result = t('some.key');
			expect(result).toBe('some.key');
		});
	});
});
