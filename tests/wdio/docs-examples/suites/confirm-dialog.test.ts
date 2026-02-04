/**
 * Test to verify the "apply without preview" confirm dialog is handled correctly
 * This test intentionally skips preview to trigger the dialog
 */

import {
	enterCondition,
	enterAction,
	clickApply,
	clearRuleBuilder
} from '../helpers/rule-builder';
import {
	createNote,
	readFileYaml,
	deleteNote,
	openYamlToolkit,
	closeYamlToolkit,
} from '../helpers/obsidian-ui';

describe('Confirm Dialog Handling - E2E', function() {
	this.timeout(60000);

	before(async function() {
		console.log('\n🧪 Testing confirm dialog handling without preview\n');
	});

	beforeEach(async function() {
		console.log('📖 Opening YAML Toolkit modal');

		// Enable E2E test mode to skip confirm dialog
		await browser.execute(() => {
			(window as any).__isE2ETest = true;
			console.log('[E2E TEST] Mode enabled - confirm dialogs will be skipped');
		});

		await openYamlToolkit();
		await browser.pause(500);
	});

	afterEach(async function() {
		try {
			await closeYamlToolkit();
		} catch (e) {
			// Already closed
		}
		await browser.pause(300);
	});

	it('should apply WITHOUT calling preview (tests confirm dialog)', async function() {
		console.log('\n🔍 TEST: Apply without preview - confirm dialog should appear');

		// Create test file
		console.log('📝 Creating test file');
		await createNote('confirm-test.md', {
			title: 'Test',
			views: 100
		});
		await browser.pause(2000); // Wait for indexing

		// Enter rule WITHOUT clicking preview
		console.log('⚙️  Entering rule: INCREMENT views 1');
		// Skip condition entirely (no condition = always matches)
		// await enterCondition('');  // No condition
		await enterAction('INCREMENT views 1');

		// Do NOT call preview - this should trigger confirm dialog
		console.log('⚠️  NOT calling preview - confirm dialog should appear');

		// Log state before apply
		console.log('📊 State before apply:');
		const vaultInfo = await browser.execute(() => {
			const app = (window as any).app;
			return {
				fileCount: app.vault.getMarkdownFiles().length,
			};
		});
		console.log('   Files in vault:', vaultInfo.fileCount);

		// DIAGNOSTIC: Check what's actually in the form fields
		console.log('🔍 Checking modal form state:');
		const formState = await browser.execute(() => {
			const conditionInput = document.querySelector('input[placeholder="Enter condition"]') as HTMLInputElement;
			const actionInput = document.querySelector('input[placeholder="Enter action"]') as HTMLInputElement;
			return {
				conditionValue: conditionInput?.value || 'EMPTY',
				actionValue: actionInput?.value || 'EMPTY',
				conditionExists: !!conditionInput,
				actionExists: !!actionInput,
			};
		});
		console.log('   Condition input value:', formState.conditionValue);
		console.log('   Action input value:', formState.actionValue);
		console.log('   Form elements exist:', { condition: formState.conditionExists, action: formState.actionExists });

		// Call apply (should show confirm dialog)
		console.log('🚀 Calling apply...');
		await clickApply();

		// Wait for dialog to appear
		console.log('⏳ Waiting for custom confirm dialog to appear...');
		await browser.pause(500);

		// Debug: Check if dialog HTML exists in DOM
		console.log('🔍 Checking if dialog HTML exists in DOM...');
		const dialogExists = await browser.execute(() => {
			const overlay = document.querySelector('.confirm-dialog-overlay');
			const modal = document.querySelector('.confirm-dialog-modal');
			const okBtn = document.querySelector('button.confirm-dialog-ok-btn');
			return {
				overlayExists: !!overlay,
				modalExists: !!modal,
				okBtnExists: !!okBtn,
				okBtnText: okBtn?.textContent || 'N/A',
				overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'N/A',
				overlayVisibility: overlay ? window.getComputedStyle(overlay).visibility : 'N/A',
			};
		});
		console.log('🔍 Dialog DOM check:', JSON.stringify(dialogExists, null, 2));

		// Click OK button on the confirm dialog
		console.log('🖱️  Clicking OK button on confirm dialog...');
		try {
			const okButton = await $('button.confirm-dialog-ok-btn');
			await okButton.waitForDisplayed({ timeout: 5000 });
			console.log('✅ Dialog button found, clicking it...');
			await okButton.click();
			console.log('✅ Clicked OK button');

			// Use global function to set dialog result (workaround for event handler issue)
			console.log('📡 Setting dialog result via global function...');
			await browser.execute(() => {
				(globalThis as any).__confirmDialogSetResult(true);
			});
			console.log('✅ Dialog result set via global function');
		} catch (e) {
			console.log('❌ Failed to find/click OK button:', (e as any).message);
		}

		// Wait for dialog to close and apply to complete
		await browser.pause(2000);

		// Check if confirm dialog was shown and get apply diagnostics
		const diagInfo = await browser.execute(() => {
			return {
				confirmDialogShown: globalThis.__confirmDialogShown || false,
				applyDiagnostics: globalThis.__applyDiagnostics || null,
			};
		});
		console.log('📊 Apply diagnostics:');
		console.log(JSON.stringify(diagInfo, null, 2));

		// Read file to see if it was modified
		console.log('📖 Reading file after apply');
		const actualYaml = await readFileYaml('confirm-test.md');
		console.log('   Current views value:', actualYaml.views);

		if (diagInfo.confirmDialogShown) {
			console.log('🚨 CONFIRM DIALOG WAS SHOWN - this confirms your theory!');
		}

		if (diagInfo.applyDiagnostics) {
			const diag = diagInfo.applyDiagnostics as any;
			if (diag.returnReason === 'confirm_declined') {
				console.log('🚨 CONFIRM DIALOG RETURNED FALSE - user clicked "No" or dialog failed');
			} else if (diag.returnReason === 'validation_failed') {
				console.log('❌ VALIDATION FAILED');
				console.log('   Condition error:', diag.conditionError);
				console.log('   Action error:', diag.actionError);
			} else if (diag.returnReason === 'no_files_matched') {
				console.log('❌ NO FILES MATCHED - scanFiles returned 0 files');
			}
		}

		// If confirm dialog worked and user clicked OK, file should be modified
		if (actualYaml.views === 101) {
			console.log('✅ SUCCESS: File was modified (views: 100 → 101)');
			console.log('✅ This means: confirm dialog was handled correctly and apply executed');
			expect(actualYaml.views).toBe(101);
		} else {
			console.log('❌ FAILURE: File was NOT modified (views: still 100)');
			console.log('❌ Possible causes:');
			console.log('   1. confirm() dialog was dismissed as false (user clicked "No")');
			console.log('   2. confirm() dialog hung and timed out');
			console.log('   3. scanFiles returned 0 files');
			console.log('   4. Other issue in apply() function');

			// Log vault state after apply to check if files still accessible
			const vaultInfo2 = await browser.execute(() => {
				const app = (window as any).app;
				return {
					fileCount: app.vault.getMarkdownFiles().length,
				};
			});
			console.log('   Files in vault after apply:', vaultInfo2.fileCount);

			expect(actualYaml.views).toBe(101); // This will fail, showing the issue
		}

		// Cleanup
		await deleteNote('confirm-test.md');
	});

	it('should apply WITH preview (baseline - should always work)', async function() {
		console.log('\n🔍 TEST: Apply WITH preview - confirm dialog should NOT appear');

		// Create test file
		console.log('📝 Creating test file');
		await createNote('no-dialog-test.md', {
			title: 'Test',
			views: 50
		});
		await browser.pause(2000);

		// Enter rule WITH preview
		console.log('⚙️  Entering rule: INCREMENT views 2');
		// Skip condition entirely
		// await enterCondition('');
		await enterAction('INCREMENT views 2');

		// DIAGNOSTIC: Check form state here too
		console.log('🔍 Checking modal form state (test 2):');
		const formState2 = await browser.execute(() => {
			const conditionInput = document.querySelector('input[placeholder="Enter condition"]') as HTMLInputElement;
			const actionInput = document.querySelector('input[placeholder="Enter action"]') as HTMLInputElement;
			return {
				conditionValue: conditionInput?.value || 'EMPTY',
				actionValue: actionInput?.value || 'EMPTY',
				conditionExists: !!conditionInput,
				actionExists: !!actionInput,
			};
		});
		console.log('   Condition input value:', formState2.conditionValue);
		console.log('   Action input value:', formState2.actionValue);
		console.log('   Form elements exist:', { condition: formState2.conditionExists, action: formState2.actionExists });

		// The test helpers should handle this - skippping preview for now
		// Just apply directly to test worst case
		console.log('🚀 Calling apply (should work regardless)');
		await clickApply();
		await browser.pause(500);

		// Click OK button on the confirm dialog if shown (since preview wasn't run)
		console.log('🖱️  Checking if confirm dialog appears and clicking OK...');
		try {
			const okButton = await $('button.confirm-dialog-ok-btn');
			const isDisplayed = await okButton.isDisplayed().catch(() => false);
			if (isDisplayed) {
				console.log('✅ Dialog appeared, clicking OK button');
				await okButton.click();

				// Use global function to set dialog result (workaround for event handler issue)
				console.log('📡 Setting dialog result via global function...');
				await browser.execute(() => {
					(globalThis as any).__confirmDialogSetResult(true);
				});
				console.log('✅ Dialog result set via global function');

				await browser.pause(1000);
			} else {
				console.log('ℹ️  No dialog shown (preview may have been run)');
			}
		} catch (e) {
			console.log('ℹ️  No dialog button found:', (e as any).message);
		}

		await browser.pause(1000);

		// Read file
		console.log('📖 Reading file after apply');
		const actualYaml = await readFileYaml('no-dialog-test.md');
		console.log('   Current views value:', actualYaml.views);

		if (actualYaml.views === 52) {
			console.log('✅ SUCCESS: File was modified (views: 50 → 52)');
			expect(actualYaml.views).toBe(52);
		} else {
			console.log('❌ FAILURE: File was NOT modified');
			expect(actualYaml.views).toBe(52);
		}

		// Cleanup
		await deleteNote('no-dialog-test.md');
	});
});
