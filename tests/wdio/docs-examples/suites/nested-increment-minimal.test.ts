/**
 * MINIMAL TEST: Nested Path INCREMENT
 *
 * Isolates nested path issue by testing ONLY:
 * - One file
 * - No batch complexity
 * - Direct action application
 */

import { createNote, readFileYaml, openYamlToolkit, closeYamlToolkit } from '../helpers/obsidian-ui';
import { enterAction, clickPreview, clickApply, selectScope } from '../helpers/rule-builder';

describe('MINIMAL: Nested INCREMENT', () => {
	it('should increment nested field metadata.views', async function() {
		this.timeout(60000);
		const testFile = 'minimal-nested.md';

		try {
			console.log('\n========================================');
			console.log('MINIMAL NESTED INCREMENT TEST');
			console.log('========================================\n');

			// 1. Create ONE file with nested data
			console.log('[STEP 1] Creating file with nested data...');
			await createNote(testFile, {
				title: 'Test',
				metadata: {
					views: 20,
					likes: 5
				}
			});
			await browser.pause(2000);
			console.log('[STEP 1] ✅ File created');

			// 2. Verify initial state
			const initialYaml = await readFileYaml(testFile);
			console.log('[STEP 2] Initial YAML:', JSON.stringify(initialYaml, null, 2));
			console.log('[STEP 2] Initial metadata.views:', initialYaml.metadata?.views);

			// 3. Open modal
			console.log('[STEP 3] Opening modal...');
			await openYamlToolkit();
			await browser.pause(1000);
			console.log('[STEP 3] ✅ Modal opened');

			// 4. Select vault scope (to ensure all files are scanned)
			console.log('[STEP 4] Setting scope to vault...');
			await selectScope('vault');
			await browser.pause(500);

			// 5. Enter action (NO CONDITION - should apply to all files)
			console.log('[STEP 5] Entering action: INCREMENT metadata.views 10');
			await enterAction('INCREMENT metadata.views 10');
			await browser.pause(500);

			// 6. Preview
			console.log('[STEP 6] Clicking Preview...');
			await clickPreview();
			await browser.pause(3000);
			console.log('[STEP 6] ✅ Preview loaded');

			// Capture notices after preview
			const previewNotices = await browser.execute(() => {
				const noticeEls = document.querySelectorAll('.notice');
				return Array.from(noticeEls).map(n => n.textContent);
			});
			console.log('[STEP 6] Preview notices:', previewNotices);

			// 7. Apply
			console.log('[STEP 7] Clicking Apply...');
			await clickApply();
			await browser.pause(3000);
			console.log('[STEP 7] ✅ Apply clicked');

			// Capture notices after apply
			const applyNotices = await browser.execute(() => {
				const noticeEls = document.querySelectorAll('.notice');
				return Array.from(noticeEls).map(n => n.textContent);
			});
			console.log('[STEP 7] Apply notices:', applyNotices);

			// 8. Read result
			console.log('[STEP 8] Reading file after apply...');
			const finalYaml = await readFileYaml(testFile);
			console.log('[STEP 8] Final YAML:', JSON.stringify(finalYaml, null, 2));
			console.log('[STEP 8] Final metadata.views:', finalYaml.metadata?.views);

			// 9. Check if modified
			const wasModified = finalYaml.metadata?.views !== initialYaml.metadata?.views;
			console.log('\n========================================');
			console.log('RESULT:');
			console.log(`  Initial: metadata.views = ${initialYaml.metadata?.views}`);
			console.log(`  Final:   metadata.views = ${finalYaml.metadata?.views}`);
			console.log(`  Expected: metadata.views = 30`);
			console.log(`  Modified: ${wasModified ? '✅ YES' : '❌ NO'}`);
			console.log('========================================\n');

			// Assertions
			if (finalYaml.metadata?.views === 20) {
				console.error('❌ FAILURE: Value unchanged! INCREMENT did not apply.');
				console.error('Possible causes:');
				console.error('  1. Action not parsed correctly');
				console.error('  2. File not selected for processing');
				console.error('  3. Action failed silently');
				console.error('  4. Modification not persisted');
			}

			// Final assertion
			expect(finalYaml.metadata.views).toBe(30);
			expect(finalYaml.metadata.likes).toBe(5); // Should not change

		} finally {
			await closeYamlToolkit();
			// Cleanup
			await browser.execute(async (filepath: string) => {
				const app = (window as any).app;
				const file = app.vault.getAbstractFileByPath(filepath);
				if (file) await app.vault.delete(file);
			}, testFile);
		}
	});
});
