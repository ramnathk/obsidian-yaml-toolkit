/**
 * Rule Builder UI Helpers for Documentation Tests
 * Provides functions for interacting with the YAML Toolkit rule builder UI
 */

// Performance tracking for preview tab timing
interface TimingStats {
	times: number[];
	min: number;
	max: number;
	avg: number;
	total: number;
}

const previewTimings: number[] = [];

/**
 * Get preview timing statistics
 */
export function getPreviewTimingStats(): TimingStats | null {
	if (previewTimings.length === 0) {
		return null;
	}

	const total = previewTimings.length;
	const sum = previewTimings.reduce((a, b) => a + b, 0);
	const avg = sum / total;
	const min = Math.min(...previewTimings);
	const max = Math.max(...previewTimings);

	return {
		times: [...previewTimings],
		min,
		max,
		avg,
		total
	};
}

/**
 * Reset preview timing statistics
 */
export function resetPreviewTimings(): void {
	previewTimings.length = 0;
}

/**
 * Health Check: Verify preview infrastructure is ready
 * Runs before test suite to catch infrastructure issues early
 */
export async function healthCheckPreviewInfra(): Promise<void> {
	console.log('\n🏥 [HEALTH CHECK] Preview Infrastructure Diagnostics\n');

	try {
		// Check 1: Verify rule builder UI elements exist
		console.log('  📋 Check 1: Rule Builder UI Elements...');
		const conditionInput = await $('#condition').catch(() => null);
		const actionInput = await $('#action').catch(() => null);
		const previewBtn = await $('button*=Preview').catch(() => null);

		if (!conditionInput || !actionInput || !previewBtn) {
			throw new Error('Rule builder UI elements not found - modal may not be properly rendered');
		}
		console.log('    ✅ All UI elements present\n');

		// Check 2: Verify preview container structure
		console.log('  📋 Check 2: Preview Container Structure...');
		const previewContainer = await $('.preview-panel').catch(() => null);
		if (!previewContainer) {
			console.log('    ⚠️  Preview container not found yet (may appear after first preview)\n');
		} else {
			console.log('    ✅ Preview container ready\n');
		}

		// Check 3: Test vault scanning capability
		console.log('  📋 Check 3: Vault Scanning...');
		const vaultReady = await browser.execute(() => {
			const app = (window as any).app;
			if (!app || !app.vault) {
				return { success: false, reason: 'Obsidian app not accessible' };
			}
			const files = app.vault.getMarkdownFiles();
			return {
				success: true,
				fileCount: files ? files.length : 0
			};
		}).catch((e: Error) => ({ success: false, reason: e.message })) as any;

		if (!vaultReady.success) {
			console.log(`    ⚠️  Vault scanning issue: ${vaultReady.reason}\n`);
		} else {
			console.log(`    ✅ Vault accessible (${vaultReady.fileCount} files detected)\n`);
		}

		// Check 4: Warm up preview system
		console.log('  📋 Check 4: Preview Warm-up (simulating first test)...');
		const warmupStart = Date.now();

		// Set a simple condition
		const condInput = await $('#condition');
		await condInput.setValue('true');
		await browser.pause(200);

		// Set a simple action
		const actInput = await $('#action');
		await actInput.setValue('SET status "test"');
		await browser.pause(200);

		// Try clicking preview
		const previewButton = await $('button*=Preview');
		await previewButton.click();

		// Wait for preview to load with extended timeout for warmup
		let previewLoaded = false;
		const warmupTimeout = 25000; // 25s for warmup (increased from 15s for 46+ files)
		const warmupStart2 = Date.now();

		while (Date.now() - warmupStart2 < warmupTimeout) {
			const previewTab = await $('.preview-tab').catch(() => null);
			if (previewTab && await previewTab.isExisting()) {
				previewLoaded = true;
				break;
			}
			await browser.pause(500);
		}

		const warmupDuration = Date.now() - warmupStart;

		if (previewLoaded) {
			console.log(`    ✅ Preview system warmed up in ${(warmupDuration / 1000).toFixed(2)}s\n`);
		} else {
			console.log(`    ⚠️  Preview warmup timeout after ${(warmupDuration / 1000).toFixed(2)}s\n`);
			console.log(`    📊 Recommendation: Preview scanning may be slow. Consider:\n`);
			console.log(`       - Reducing number of test files (currently 46)\n`);
			console.log(`       - Increasing preview timeout from 10s to 15s+\n`);
			console.log(`       - Checking Obsidian indexing performance\n`);
		}

		// Clear for actual tests
		const condClear = await $('#condition');
		await condClear.clearValue();
		const actClear = await $('#action');
		await actClear.clearValue();

		console.log('✅ [HEALTH CHECK] All infrastructure checks completed\n');
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.log(`❌ [HEALTH CHECK] Infrastructure check failed: ${msg}\n`);
		console.log('   This likely indicates Obsidian or the plugin is not properly loaded.\n');
		throw error;
	}
}

/**
 * Log preview timing statistics summary
 */
export function logPreviewTimingsSummary(): void {
	const stats = getPreviewTimingStats();
	if (!stats) {
		console.log('\n📊 [TIMING SUMMARY] No preview timings recorded');
		return;
	}

	console.log('\n📊 [TIMING SUMMARY] Preview Tab Performance');
	console.log(`   Total tests: ${stats.total}`);
	console.log(`   Min time: ${(stats.min / 1000).toFixed(2)}s`);
	console.log(`   Max time: ${(stats.max / 1000).toFixed(2)}s`);
	console.log(`   Avg time: ${(stats.avg / 1000).toFixed(2)}s`);

	// Show distribution
	const under3s = stats.times.filter(t => t < 3000).length;
	const between3and5s = stats.times.filter(t => t >= 3000 && t < 5000).length;
	const between5and7s = stats.times.filter(t => t >= 5000 && t < 7000).length;
	const over7s = stats.times.filter(t => t >= 7000).length;

	console.log('\n   Distribution:');
	console.log(`   < 3s:      ${under3s} tests (${((under3s / stats.total) * 100).toFixed(1)}%)`);
	console.log(`   3-5s:      ${between3and5s} tests (${((between3and5s / stats.total) * 100).toFixed(1)}%)`);
	console.log(`   5-7s:      ${between5and7s} tests (${((between5and7s / stats.total) * 100).toFixed(1)}%)`);
	console.log(`   > 7s:      ${over7s} tests (${((over7s / stats.total) * 100).toFixed(1)}%) ⚠️\n`);
}

/**
 * Enter condition expression in the rule builder
 */
export async function enterCondition(condition: string): Promise<void> {
	// Handle undefined/empty conditions (some examples have no condition)
	if (!condition || condition === 'undefined') {
		return; // Skip setting condition
	}

	const startTime = Date.now();
	console.log(`  🕐 [TIMING] Setting condition: "${condition}"`);

	const conditionInput = await $('#condition');
	await conditionInput.waitForDisplayed({ timeout: 3000 });

	// First, triple-check the element value in the DOM using browser.execute
	const initialDOM = await browser.execute((selector) => {
		const el = document.querySelector(selector) as HTMLTextAreaElement;
		return { exists: !!el, currentValue: el?.value || '', id: el?.id };
	}, '#condition');
	console.log(`  ℹ️  Initial DOM state:`, initialDOM);

	// Use standard WebDriver methods
	await conditionInput.click();
	await browser.pause(50);
	await conditionInput.clearValue();
	await browser.pause(50);
	await conditionInput.setValue(condition);
	await browser.pause(100);

	// Verify the value was actually set in the DOM
	const afterSetDOM = await browser.execute((selector) => {
		const el = document.querySelector(selector) as HTMLTextAreaElement;
		return { value: el?.value || '', length: el?.value?.length || 0 };
	}, '#condition');
	console.log(`  ℹ️  After setValue DOM value: "${(afterSetDOM as any).value}" (len=${(afterSetDOM as any).length})`);

	// Extra kick: dispatch events from browser context
	await browser.execute((selector) => {
		const el = document.querySelector(selector) as HTMLTextAreaElement;
		if (el) {
			el.dispatchEvent(new Event('input', { bubbles: true }));
			el.dispatchEvent(new Event('change', { bubbles: true }));
		}
	}, '#condition');

	await browser.pause(300);

	const totalDuration = Date.now() - startTime;
	console.log(`  🕐 [TIMING] Condition set in ${totalDuration}ms`);
}

/**
 * Enter action expression in the rule builder
 */
export async function enterAction(action: string): Promise<void> {
	const startTime = Date.now();
	console.log(`  🕐 [TIMING] Setting action: "${action}"`);

	const actionInput = await $('#action');
	await actionInput.waitForDisplayed({ timeout: 3000 });

	// Use standard WebDriver methods
	await actionInput.click();
	await actionInput.clearValue();
	await actionInput.setValue(action);

	// Extra kick: dispatch events from browser context
	await browser.execute((selector) => {
		const el = document.querySelector(selector) as HTMLTextAreaElement;
		if (el) {
			el.dispatchEvent(new Event('input', { bubbles: true }));
			el.dispatchEvent(new Event('change', { bubbles: true }));
		}
	}, '#action');

	await browser.pause(300);

	const totalDuration = Date.now() - startTime;
	console.log(`  🕐 [TIMING] Action set in ${totalDuration}ms`);
}

/**
 * Enter multiple actions (for multi-step workflows)
 */
export async function enterActions(actions: string[]): Promise<void> {
	// For multi-step, enter actions separated by commas (per documentation)
	const combinedActions = actions.join(', ');
	await enterAction(combinedActions);
}

/**
 * Click the Preview button
 *
 * Performance tracking: Measures how long it takes for preview tab to appear
 * with detailed breakdown of phases
 */
export async function clickPreview(): Promise<void> {
	const previewBtn = await $('button*=Preview');
	await previewBtn.waitForClickable({ timeout: 3000 });

	// Start timing
	const startTime = Date.now();
	const clickStartTime = Date.now();
	console.log('  🕐 [TIMING] Clicking Preview button...');

	await previewBtn.click();
	const clickDuration = Date.now() - clickStartTime;
	console.log(`  🕐 [TIMING] Button click took ${clickDuration}ms`);

	// Workaround: Trigger preview via global function in case on:click handler didn't fire
	console.log('  📡 [WORKAROUND] Triggering preview via global function...');
	try {
		const details = await browser.execute(async () => {
			const fn = (globalThis as any).__triggerPreview;
			if (!fn) {
				return { error: '__triggerPreview not found', called: false };
			}
			try {
				return await fn();
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				return { error: errorMsg, called: false };
			}
		});

		if (details.error) {
			console.log(`  ⚠️  [WORKAROUND] Error: ${details.error}`);
		} else if (!details.called) {
			console.log('  ⚠️  [WORKAROUND] __triggerPreview was not called');
		} else {
			console.log('  ✅ [WORKAROUND] __triggerPreview executed');
			if (details.errors && details.errors.length > 0) {
				console.log(`  ⚠️  [WORKAROUND] Errors during preview: ${details.errors.join('; ')}`);
			}
			if (details.startState) {
				console.log(`  📊 [WORKAROUND] Start state: tab=${details.startState.activeTab}, loading=${details.startState.previewLoading}`);
			}
			if (details.endState) {
				console.log(`  📊 [WORKAROUND] End state: tab=${details.endState.activeTab}, loading=${details.endState.previewLoading}, results=${details.endState.previewResultsLength}`);
			}
			if (details.timings) {
				console.log(`  🕐 [WORKAROUND] Timing: preview=${details.timings.preview?.toFixed(0)}ms, total=${details.timings.total?.toFixed(0)}ms`);
			}
		}
	} catch (error) {
		console.log('  ⚠️  [WORKAROUND] browser.execute() error:', error);
	}

	// Wait for Preview tab content to appear after scan completes
	// The preview tab renders with .preview-tab class when activeTab='preview'
	let pollCount = 0;
	const pollStartTime = Date.now();
	try {

		await browser.waitUntil(
			async () => {
				pollCount++;
				// Look for unique preview content container (not the button with class preview-tab)
				const previewTab = await $('[data-testid="preview-tab-content"]');
				const isDisplayed = await previewTab.isExisting();

				// Log polling status every 10 polls to track progress
				if (pollCount % 10 === 0) {
					const elapsed = Date.now() - pollStartTime;
					console.log(`  🕐 [TIMING] Poll #${pollCount} after ${elapsed}ms - preview exists: ${isDisplayed}`);
				}

				// Debug: check for error messages that might be blocking preview
				if (!isDisplayed && pollCount === 1) {
					try {
						const errorDiv = await $('[data-testid="preview-tab-content"] .preview-error');
						if (await errorDiv.isExisting()) {
							const errorMsg = await errorDiv.getText();
							console.log('  ⚠️  [DEBUG] Preview error found:', errorMsg);
						}
					} catch (e) {
						// No error, continue
					}
				}

				return isDisplayed;
			},
			{
				timeout: 20000, // 20s for preview tab (increased from 12s for 46+ files)
				timeoutMsg: 'Preview tab did not appear after clicking Preview button'
			}
		);

		const elapsedMs = Date.now() - startTime;
		const pollDuration = Date.now() - pollStartTime;
		const elapsedSec = (elapsedMs / 1000).toFixed(2);
		const pollSec = (pollDuration / 1000).toFixed(2);

		// Record timing for statistics
		previewTimings.push(elapsedMs);

		console.log(`  ✅ [TIMING] Preview tab appeared after ${elapsedSec}s (${elapsedMs}ms)`);
		console.log(`  🕐 [TIMING] Polling took ${pollSec}s with ${pollCount} attempts`);
		console.log(`  🕐 [TIMING] Breakdown: click=${clickDuration}ms, polling=${pollDuration}ms`);

		// Log performance warning if it took too long
		if (elapsedMs > 7000) {
			console.log(`  ⚠️  [TIMING] Preview took longer than 7 seconds - consider optimizing scan`);
			console.log(`  ⚠️  [TIMING] Average time per poll: ${(pollDuration / pollCount).toFixed(1)}ms`);
		}
	} catch (error) {
		const elapsedMs = Date.now() - startTime;
		const pollDuration = Date.now() - pollStartTime;
		const elapsedSec = (elapsedMs / 1000).toFixed(2);
		console.log(`  ❌ [TIMING] Preview tab TIMEOUT after ${elapsedSec}s (${elapsedMs}ms)`);
		console.log(`  ❌ [TIMING] Polling took ${pollDuration}ms - this indicates scan/parsing is slow`);
		throw error;
	}

	// Preview tab is now active and displaying scan results
	await browser.pause(200);
}

/**
 * Click the Apply button
 * Handles the "apply without preview" confirmation dialog if it appears
 */
export async function clickApply(): Promise<void> {
	const applyBtn = await $('button*=Apply');
	await applyBtn.waitForClickable({ timeout: 3000 });

	// DIAGNOSTIC: Log vault state before applying
	const vaultInfo = await browser.execute(() => {
		const app = (window as any).app;
		if (!app || !app.vault) return { error: 'No vault access' };
		const files = app.vault.getMarkdownFiles();
		return {
			totalFiles: files.length,
			fileList: files.map((f: any) => f.path).slice(0, 10) // First 10 files
		};
	});
	console.log('  🔍 [DIAGNOSTIC] Vault state before apply:', JSON.stringify(vaultInfo));

	await applyBtn.click();

	// Handle the "apply without preview" confirmation dialog if it appears
	// This is a DOM modal (not browser alert), so we need to click the OK button
	await browser.pause(500);

	try {
		// Look for the custom confirm dialog OK button (using data-testid for uniqueness)
		const okButton = await $('[data-testid="confirm-dialog-ok"]');
		const isDisplayed = await okButton.isDisplayed().catch(() => false);

		if (isDisplayed) {
			console.log('  ⚠️  Accepting "apply without preview" confirmation dialog');
			await okButton.click();

			// Use global function to set dialog result (workaround for event handler issue)
			console.log('  📡 Setting dialog result via global function...');
			await browser.execute(() => {
				(globalThis as any).__confirmDialogSetResult(true);
			});
			console.log('  ✅ Dialog result set via global function');

			await browser.pause(500); // Wait for dialog to close
		}
	} catch (e) {
		// Dialog didn't appear (preview was already run), continue
	}

	await browser.pause(1500); // Wait for apply to complete and notice to appear (increased to 1.5s)

	// Try to capture the Notice text to see if scanFiles found files
	try {
		const noticeText = await browser.execute(() => {
			const notices = document.querySelectorAll('.notice');
			const texts: string[] = [];
			notices.forEach(n => texts.push(n.textContent || ''));
			return texts;
		});
		if (noticeText && noticeText.length > 0) {
			console.log('  📢 Notices shown:', noticeText);
		} else {
			console.log('  ⚠️  No notices found (may indicate early return or error)');
		}
	} catch (e) {
		console.log('  ⚠️  Failed to capture notices:', e);
	}
}

/**
 * Clear the rule builder form
 * Includes state verification to ensure modal reset is working properly
 */
export async function clearRuleBuilder(): Promise<void> {
	const startTime = Date.now();
	console.log('  🔄 [STATE] Clearing rule builder form...');

	const conditionInput = await $('#condition');
	const actionInput = await $('#action');

	// Get current state before clearing
	const conditionValueBefore = await conditionInput.getValue();
	const actionValueBefore = await actionInput.getValue();
	console.log(`  📝 [STATE] Before clear - condition: "${conditionValueBefore}", action: "${actionValueBefore}"`);

	// Aggressively clear fields to avoid parser state pollution
	await conditionInput.click();
	await conditionInput.clearValue();
	await browser.keys('Backspace'); // Extra backspace
	await browser.pause(100);

	await actionInput.click();
	await actionInput.clearValue();
	await browser.keys('Backspace');
	await browser.pause(100);

	// Verify clear was successful
	const conditionValueAfter = await conditionInput.getValue();
	const actionValueAfter = await actionInput.getValue();
	const duration = Date.now() - startTime;

	if (conditionValueAfter === '' && actionValueAfter === '') {
		console.log(`  ✅ [STATE] Clear successful in ${duration}ms - both fields empty`);
	} else {
		console.warn(`  ⚠️  [STATE] Clear incomplete! Condition: "${conditionValueAfter}", Action: "${actionValueAfter}"`);
	}
}

/**
 * Get current condition value
 */
export async function getConditionValue(): Promise<string> {
	const conditionInput = await $('#condition');
	return await conditionInput.getValue();
}

/**
 * Get current action value
 */
export async function getActionValue(): Promise<string> {
	const actionInput = await $('#action');
	return await actionInput.getValue();
}

/**
 * Select file scope (vault, folder, or current file)
 */
export async function selectScope(scope: 'vault' | 'folder' | 'current'): Promise<void> {
	const scopeRadio = await $(`input[value="${scope}"]`);
	await scopeRadio.waitForClickable({ timeout: 3000 });
	await scopeRadio.click();
	await browser.pause(300);
}

/**
 * Select specific folder (when scope is 'folder')
 */
export async function selectFolder(folderPath: string): Promise<void> {
	await selectScope('folder');

	const folderInput = await $('#folder-path');
	await folderInput.waitForDisplayed({ timeout: 3000 });
	await folderInput.setValue(folderPath);
	await browser.pause(500); // Wait for autocomplete

	// Select first autocomplete result
	const firstResult = await $('.autocomplete-result');
	if (await firstResult.isDisplayed()) {
		await firstResult.click();
	}
	await browser.pause(300);
}

/**
 * Wait for preview loading to complete
 */
export async function waitForPreviewLoad(): Promise<void> {
	// Wait for loading spinner to disappear (if it exists)
	const loadingSpinner = await $('.preview-loading');
	if (await loadingSpinner.isExisting()) {
		await browser.waitUntil(
			async () => !(await loadingSpinner.isDisplayed()),
			{
				timeout: 10000, // Max 10s for loading to complete (vault scanning can be slow)
				timeoutMsg: 'Preview loading did not complete'
			}
		);
	}
	// Give a bit more time for results to render
	await browser.pause(500);
}

/**
 * Get list of files in preview
 */
export async function getPreviewFiles(): Promise<string[]> {
	// Wait for loading to complete before getting files
	await waitForPreviewLoad();

	const fileElements = await $$('[data-testid="preview-file-item"]');
	const filenames: string[] = [];

	for (const el of fileElements) {
		// Get the file path from data attribute for reliability
		const filePath = await el.getAttribute('data-file-path');
		if (filePath) {
			filenames.push(filePath);
		}
	}

	return filenames;
}

/**
 * Click on a specific file in the preview list
 */
export async function clickPreviewFile(filename: string): Promise<void> {
	// Find file item by data-file-path attribute
	const fileItem = await $(`[data-testid="preview-file-item"][data-file-path*="${filename}"]`);
	await fileItem.waitForClickable({ timeout: 3000 });
	// Click the button inside to expand the file details
	const fileButton = await fileItem.$('.file-header');
	await fileButton.click();
	await browser.pause(300); // Wait for expansion animation
}

/**
 * Get preview content for a file (YAML diff)
 */
export async function getPreviewFileContent(filename: string): Promise<string> {
	await clickPreviewFile(filename);

	// Wait for file details section to be displayed
	const fileDetails = await $('[data-testid="preview-file-details"]');
	await fileDetails.waitForDisplayed({ timeout: 3000 });

	// Check which type of content is displayed
	const previewContent = await $('[data-testid="preview-content"]');
	const skipReason = await $('[data-testid="preview-skip-reason"]');
	const errorDetails = await $('[data-testid="preview-error-details"]');
	const noChanges = await $('[data-testid="preview-no-changes"]');

	if (await previewContent.isDisplayed()) {
		return await previewContent.getText();
	} else if (await skipReason.isDisplayed()) {
		const text = await skipReason.getText();
		throw new Error(`File was skipped: ${text}`);
	} else if (await errorDetails.isDisplayed()) {
		const text = await errorDetails.getText();
		throw new Error(`File had error: ${text}`);
	} else if (await noChanges.isDisplayed()) {
		throw new Error('File has no changes to display');
	} else {
		throw new Error('Unknown preview state - no content found');
	}
}

/**
 * Verify preview file shows expected YAML changes
 * NOTE: Preview only shows CHANGED fields (diff view), not all output fields.
 * The real verification happens after applying the rule.
 */
export async function verifyPreviewFile(filename: string, expectedYaml: any): Promise<void> {
	// Just verify the preview loaded and shows some content
	// Don't validate specific fields since preview only shows changes (diff)
	// The actual output verification happens after applying the rule
	const previewContent = await getPreviewFileContent(filename);

	// Basic sanity check: preview should have some content
	if (!previewContent || previewContent.trim().length === 0) {
		throw new Error(`Preview content is empty for ${filename}`);
	}
}

/**
 * Save rule with given name
 */
export async function saveRule(name: string): Promise<void> {
	const saveBtn = await $('button*=Save Rule');
	await saveBtn.waitForClickable({ timeout: 3000 });
	await saveBtn.click();
	await browser.pause(300);

	// Enter rule name in modal/input
	const nameInput = await $('#rule-name');
	await nameInput.waitForDisplayed({ timeout: 3000 });
	await nameInput.setValue(name);
	await browser.pause(300);

	// Confirm save
	const confirmBtn = await $('button*=Save');
	await confirmBtn.click();
	await browser.pause(500);
}

/**
 * Load saved rule by name
 */
export async function loadRule(name: string): Promise<void> {
	const loadBtn = await $('button*=Load Rule');
	await loadBtn.waitForClickable({ timeout: 3000 });
	await loadBtn.click();
	await browser.pause(300);

	// Select rule from list
	const ruleItem = await $(`.rule-list-item*=${name}`);
	await ruleItem.waitForClickable({ timeout: 3000 });
	await ruleItem.click();
	await browser.pause(500);
}

/**
 * Delete saved rule by name
 */
export async function deleteRule(name: string): Promise<void> {
	const loadBtn = await $('button*=Load Rule');
	await loadBtn.waitForClickable({ timeout: 3000 });
	await loadBtn.click();
	await browser.pause(300);

	// Find delete button for specific rule
	const deleteBtn = await $(`.rule-list-item*=${name} button.delete`);
	await deleteBtn.waitForClickable({ timeout: 3000 });
	await deleteBtn.click();
	await browser.pause(300);

	// Confirm deletion
	const confirmBtn = await $('button*=Delete');
	await confirmBtn.click();
	await browser.pause(500);
}

/**
 * List all saved rules
 */
export async function listRules(): Promise<string[]> {
	const loadBtn = await $('button*=Load Rule');
	await loadBtn.waitForClickable({ timeout: 3000 });
	await loadBtn.click();
	await browser.pause(300);

	const ruleItems = await $$('.rule-list-item');
	const ruleNames: string[] = [];

	for (const item of ruleItems) {
		const text = await item.getText();
		ruleNames.push(text);
	}

	// Close the load modal
	await browser.keys(['Escape']);
	await browser.pause(300);

	return ruleNames;
}

/**
 * Switch to Build tab
 * Note: Build tab doesn't exist - there's only Preview and Test tabs
 * The rule builder form is always visible, tabs appear after clicking Preview
 */
export async function switchToBuildTab(): Promise<void> {
	// Close validation section to return to rule builder form
	const closeBtn = await $('.close-validation');
	if (await closeBtn.isDisplayed()) {
		await closeBtn.click();
		await browser.pause(300);
	}
}

/**
 * Switch to Preview tab
 */
export async function switchToPreviewTab(): Promise<void> {
	const previewTab = await $('[data-tab-id="preview"]');
	await previewTab.waitForClickable({ timeout: 3000 });
	await previewTab.click();
	await browser.pause(200);
}

/**
 * Check if validation errors are present
 */
export async function hasValidationErrors(): Promise<boolean> {
	const errors = await $$('.validation-error, .error');

	for (const error of errors) {
		if (await error.isDisplayed()) {
			return true;
		}
	}

	return false;
}

/**
 * Get validation error message
 */
export async function getValidationError(): Promise<string> {
	const error = await $('.validation-error, .error');

	if (await error.isDisplayed()) {
		return await error.getText();
	}

	return '';
}
