/**
 * i18n Interpolation Debug Test
 * Isolate and debug the i18n interpolation issue
 */

import { openYamlToolkit, createNote, readFileYaml, deleteNote } from './docs-examples/helpers/obsidian-ui';
import { enterAction, clickPreview, clickApply, clearRuleBuilder } from './docs-examples/helpers/rule-builder';

describe('i18n Interpolation Debug', () => {
	before(async function() {
		this.timeout(60000);
		await openYamlToolkit();
	});

	it('should show interpolated values in completion notice', async function() {
		this.timeout(30000);

		// Create simple test file
		await createNote('i18n-test.md', {
			views: 10
		});

		// Enter simple INCREMENT
		await enterAction('INCREMENT views 1');

		// Preview
		await clickPreview();
		await browser.pause(2000);

		// Capture console logs via browser.execute
		const logs = await browser.execute(() => {
			const consoleLogs = [];
			const originalLog = console.log;
			console.log = function(...args) {
				consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
				originalLog.apply(console, args);
			};
			return consoleLogs;
		});

		// Apply
		await clickApply();
		await browser.pause(3000);

		// Check notices
		const notices = await browser.execute(() => {
			// Try to capture notice text from DOM
			const noticeEls = document.querySelectorAll('.notice');
			return Array.from(noticeEls).map(el => el.textContent);
		});

		console.log('Notices shown:', notices);
		console.log('Expected: Numbers instead of {success}, {warnings}, {errors}');

		// Check console logs
		const consoleLogs = await browser.execute(() => {
			// Get recent console logs if available
			return (window as any).__consoleLogs || [];
		});

		console.log('Console logs:', consoleLogs);

		// Cleanup
		await deleteNote('i18n-test.md');
		await clearRuleBuilder();
	});
});
