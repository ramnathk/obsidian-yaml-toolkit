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
 *
 * @param key - Translation key (e.g., 'notices.ruleSaved')
 * @param values - Optional interpolation values (e.g., { count: 5 })
 * @returns Translated string
 */
export function t(key: string, values?: Record<string, any>): string {
	return get(_)(key, values);
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
