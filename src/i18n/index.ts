/**
 * i18n (Internationalization) Setup
 * Provides translation support for the plugin
 */

import { addMessages, init, getLocaleFromNavigator, _ } from 'svelte-i18n';
import { get } from 'svelte/store';
import enTranslations from './locales/en.json';

/**
 * Initialize i18n system
 * Should be called once during plugin load
 */
export function initI18n() {
	// Register English translations (fallback language)
	addMessages('en', enTranslations);

	// Initialize with English as default
	// Note: Obsidian doesn't expose its locale directly, so we use browser locale
	// which should match Obsidian's setting in most cases
	init({
		fallbackLocale: 'en',
		initialLocale: getLocaleFromNavigator() || 'en',
	});
}

/**
 * Translation helper for non-Svelte code (TypeScript files)
 * Use this in regular TypeScript files where you can't use the Svelte $t store
 *
 * @example
 * import { t } from './i18n';
 * const message = t('notices.ruleSaved');
 * const processed = t('notices.processing', { count: 5 });
 *
 * @param key - Translation key (e.g., 'notices.ruleSaved')
 * @param values - Optional interpolation values (e.g., { count: 5 })
 * @returns Translated string with interpolated values
 */
export function t(key: string, values?: Record<string, any>): string {
	// Get the translated string by navigating the key path
	// e.g., 'notices.processing' -> enTranslations['notices']['processing']
	const keyParts = key.split('.');
	let message: any = enTranslations;

	for (const part of keyParts) {
		message = message[part];
		if (!message) {
			console.warn(`[i18n] Missing translation key: ${key}`);
			return key; // Return the key itself as fallback
		}
	}

	// Convert to string if needed
	if (typeof message !== 'string') {
		console.warn(`[i18n] Translation for ${key} is not a string`);
		return String(message);
	}

	// If no values provided, return the translated string as-is
	if (!values || Object.keys(values).length === 0) {
		return message;
	}

	// Manually interpolate values into the message
	// Replace {variableName} with the corresponding value
	let result = message;
	for (const [varName, value] of Object.entries(values)) {
		// Convert value to string, handling undefined/null cases
		const stringValue = value === undefined || value === null ? '' : String(value);
		// Replace all occurrences of {variableName} with the stringified value
		const placeholder = `{${varName}}`;
		if (result.includes(placeholder)) {
			result = result.split(placeholder).join(stringValue);
		}
	}

	return result;
}

/**
 * Re-export Svelte i18n stores and utilities for Svelte components
 * Use these in .svelte files:
 *
 * @example
 * <script>
 * import { t as $t } from './i18n';
 * </script>
 * <button>{$t('ruleBuilder.buttons.save')}</button>
 */
export { _ as t$ } from 'svelte-i18n';
