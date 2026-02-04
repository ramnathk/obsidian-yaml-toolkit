/**
 * Debug INCREMENT operation
 * Test the exact failing example: "Track View Count"
 */

import { createNote, readFileYaml, openYamlToolkit, closeYamlToolkit } from '../helpers/obsidian-ui';
import { enterCondition, enterAction, clickPreview, clickApply, selectScope } from '../helpers/rule-builder';
import { assertYamlEqualNormalized } from '../helpers/yaml-assertions';

describe('INCREMENT Debug Test', () => {
	it('should increment views from 42 to 43', async function() {
		this.timeout(60000);
		const testFile = 'increment-test.md';

		try {
			console.log('\n=== INCREMENT DEBUG TEST ===');

			// Create file with views=42
			await createNote(testFile, { title: 'Popular Article', views: 42 });
			await browser.pause(3000);

			// Open modal
			await openYamlToolkit();
			await browser.pause(1000);

			// WARM-UP: Click Preview once to initialize scanner (first preview always times out)
			console.log('Warming up Preview tab...');
			const previewBtn = await $('button*=Preview');
			await previewBtn.click();
			await browser.pause(5000); // Wait for first scan to complete
			console.log('Preview warm-up complete');

			// Clear rule builder for actual test
			const conditionInput = await $('#condition');
			await conditionInput.clearValue();
			const actionInput = await $('#action');
			await actionInput.clearValue();
			await browser.pause(300);

			// Select vault scope
			await selectScope('vault');

			// Enter rule
			await enterCondition('HAS views');
			await enterAction('INCREMENT views 1');

			// Preview
			await clickPreview();
			await browser.pause(1000);

			// Apply
			await clickApply();
			await browser.pause(3000);

			// Capture notices
			const notices = await browser.execute(() => {
				const noticeEls = document.querySelectorAll('.notice');
				return Array.from(noticeEls).map(n => n.textContent);
			});
			console.log('📢 Notices:', notices);

			// Read result
			const actualYaml = await readFileYaml(testFile);
			console.log('📄 Actual:', actualYaml);
			console.log('📄 Expected:', { title: 'Popular Article', views: 43 });

			// Assert
			assertYamlEqualNormalized(actualYaml, { title: 'Popular Article', views: 43 }, 'INCREMENT');

		} finally {
			await closeYamlToolkit();
			await browser.execute(async (filepath: string) => {
				const app = (window as any).app;
				const file = app.vault.getAbstractFileByPath(filepath);
				if (file) await app.vault.delete(file);
			}, testFile);
		}
	});
});
