<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Notice } from 'obsidian';
	import { createNewRule, saveRule, deleteRule, loadPluginData } from '../storage/ruleStorage';
	import { scanFiles } from '../core/fileScanner';
	import { processBatch } from '../core/batchProcessor';
	import { parseCondition } from '../parser/conditionParser';
	import { parseAction } from '../parser/actionParser';
	import PreviewTab from './components/PreviewTab.svelte';
	import TestTab from './components/TestTab.svelte';
	import FolderAutocomplete from './components/FolderAutocomplete.svelte';
	import { t as tFunc, _ as t$ } from '../i18n';

	// Use tFunc() for TypeScript code with interpolation (e.g., Notice messages)
	// Use $t$ for Svelte reactive translations in templates
	const t = tFunc;

	export let plugin;
	export let onClose;

	// Debug helper - only log if debug mode is enabled
	$: debugLog = (...args) => {
		if (plugin?.data?.settings?.debug) {
			console.log(...args);
		}
	};

	let selectedRuleId = null;
	let currentRule = createNewRule(plugin.data.settings.defaultBackup);
	let scopeType = 'vault';
	let folderPath = '';
	let condition = '';
	let action = '';
	let backup = currentRule.options.backup;  // Initialize from currentRule
	let conditionError = '';
	let actionError = '';

	// Validation state
	let showValidationSection = false;
	let activeTab = 'preview';
	let previewResults = [];
	let previewLoading = false;
	let previewError = null;
	let hasPreviewedRule = false;

	// Confirm dialog state - replaces native confirm() for testability
	let showConfirmDialog = false;
	let confirmDialogResult = null;
	let dialogResolve = null; // Store the promise resolve function

	// Create a shared dialog state object to avoid closure issues
	const dialogState = {
		result: null,
		resolve: null
	};

	// Log dialog state changes
	$: if (showConfirmDialog) {
		console.log('[CONFIRM DIALOG SVELTE] Dialog should be visible');
	}
	$: if (confirmDialogResult !== null) {
		console.log('[CONFIRM DIALOG SVELTE] Dialog result set to:', confirmDialogResult);
	}

	// Expose global function for E2E tests to interact with the dialog
	// Tests can call this directly instead of relying on event handlers
	onMount(() => {
		globalThis.__confirmDialogSetResult = (result) => {
			console.log('[CONFIRM DIALOG] Global function called with result:', result);
			console.log('[CONFIRM DIALOG] dialogState is:', typeof dialogState, Object.keys(dialogState));
			console.log('[CONFIRM DIALOG] dialogState.resolve is:', typeof dialogState.resolve);
			confirmDialogResult = result;
			dialogState.result = result;
			// If a resolve function is waiting, call it immediately
			if (dialogState.resolve) {
				console.log('[CONFIRM DIALOG] Calling resolve function with:', result);
				dialogState.resolve(result);
				dialogState.resolve = null;
			} else {
				console.log('[CONFIRM DIALOG] WARNING: No resolve function available');
			}
		};
	});

	// Global function for E2E tests to trigger preview when on:click doesn't work
	onMount(() => {
		globalThis.__triggerPreview = async () => {
			const startTime = performance.now();
			const details = {
				called: true,
				previewType: typeof preview,
				previewExists: !!preview,
				validateType: typeof validate,
				validateExists: !!validate,
				startState: {
					activeTab,
					previewLoading,
					previewError,
					conditionValue: condition,
					actionValue: action
				},
				errors: [],
				timings: {},
				endState: null
			};

			try {
				if (typeof preview !== 'function') {
					details.errors.push('preview is not a function');
					return details;
				}

				if (typeof validate !== 'function') {
					details.errors.push('validate is not a function');
					return details;
				}

				// Wait a tick to capture start state after any previous updates
				await tick();

				// Try calling validate first to see if it passes
				const isValid = validate();
				if (!isValid) {
					const conditionLength = condition?.length || 0;
					const actionLength = action?.length || 0;
					details.errors.push(`validation failed: condition="${conditionError}" (value="${condition}", len=${conditionLength}) action="${actionError}" (value="${action}", len=${actionLength})`);
					details.endState = {
						activeTab,
						previewLoading,
						previewError,
						conditionError,
						actionError,
						conditionValue: condition,
						actionValue: action,
						conditionLength,
						actionLength,
						previewResultsLength: previewResults?.length || 0
					};
					return details;
				}

				const previewStartTime = performance.now();
				const result = await preview();
				details.timings.preview = performance.now() - previewStartTime;

				// Wait for Svelte reactivity to process state changes
				await tick();
				await new Promise(resolve => setTimeout(resolve, 10));

				details.endState = {
					activeTab,
					previewLoading,
					previewError,
					previewResultsLength: previewResults?.length || 0
				};
			} catch (error) {
				if (error instanceof Error) {
					details.errors.push(`${error.name}: ${error.message}`);
				} else {
					details.errors.push(String(error));
				}
			}

			details.timings.total = performance.now() - startTime;
			return details;
		};
		console.log('[PREVIEW SETUP] Global __triggerPreview function registered');
	});

	// Make savedRules reactive to plugin.data.rules changes
	$: savedRules = (() => {
		// Defensive: ensure plugin.data.rules exists and is an array
		if (!plugin?.data?.rules || !Array.isArray(plugin.data.rules)) {
			return [];
		}

		return [...plugin.data.rules].sort((a, b) => {
			if (a.lastUsed && b.lastUsed) return b.lastUsed.localeCompare(a.lastUsed);
			if (a.lastUsed) return -1;
			if (b.lastUsed) return 1;
			return b.created.localeCompare(a.created);
		});
	})();


	function loadRule(ruleId) {
		const rule = savedRules.find(r => r.id === ruleId);
		if (!rule) return;
		currentRule = { ...rule };
		selectedRuleId = ruleId;
		scopeType = rule.scope.type;
		folderPath = rule.scope.folder || '';
		condition = rule.condition;
		action = rule.action;
		backup = rule.options.backup;
		conditionError = '';
		actionError = '';
	}

	function newRule() {
		currentRule = createNewRule(plugin.data.settings.defaultBackup);
		selectedRuleId = null;
		scopeType = 'vault';
		folderPath = '';
		condition = '';
		action = '';
		backup = currentRule.options.backup;  // Reset to match new rule's backup setting
		conditionError = '';
		actionError = '';
	}

	async function save() {
		if (!validate()) return;

		currentRule.name = currentRule.name || t('ruleBuilder.fields.ruleName.default');
		currentRule.scope = {
			type: scopeType,
			folder: scopeType === 'folder' ? folderPath : undefined,
		};
		currentRule.condition = condition;
		currentRule.action = action;
		currentRule.options.backup = backup;

		await saveRule(plugin, currentRule);
		// Reload plugin.data from disk to sync in-memory state
		plugin.data = await loadPluginData(plugin);
		selectedRuleId = currentRule.id;

		new Notice(t('notices.ruleSaved'));
	}

	async function deleteCurrentRule() {
		if (!selectedRuleId) return;
		await deleteRule(plugin, selectedRuleId);
		// Reload plugin.data from disk to sync in-memory state
		plugin.data = await loadPluginData(plugin);
		newRule();

		new Notice(t('notices.ruleDeleted'));
	}

	function validate() {
		conditionError = '';
		actionError = '';

		if (condition.trim()) {
			try {
				parseCondition(condition);
			} catch (e) {
				conditionError = e instanceof Error ? e.message : t('ruleBuilder.validation.invalidCondition');
				debugLog('Condition error:', conditionError);
				return false;
			}
		}

		if (!action.trim()) {
			actionError = t('ruleBuilder.fields.action.required');
			debugLog('Action error:', actionError);
			return false;
		}

		try {
			parseAction(action);
		} catch (e) {
			actionError = e instanceof Error ? e.message : t('ruleBuilder.validation.invalidAction');
			debugLog('Action error:', actionError);
			return false;
		}

		debugLog('Validation passed');
		new Notice(t('ruleBuilder.validation.passed'));
		return true;
	}

	async function preview() {
		console.log('[PREVIEW ENTRY] ✅ preview() function CALLED');
		debugLog('Preview clicked');
		if (!validate()) {
			console.log('[PREVIEW ENTRY] ❌ Validation FAILED - returning early');
			debugLog('Validation failed');
			return;
		}
		console.log('[PREVIEW ENTRY] ✅ Validation passed, continuing...');

		debugLog('Starting preview...');
		const startTime = performance.now();
		previewLoading = true;
		previewError = null;
		showValidationSection = true;
		activeTab = 'preview';

		try {
			const rule = {
				...currentRule,
				condition,
				action,
				scope: {
					type: scopeType,
					folder: scopeType === 'folder' ? folderPath : undefined,
				},
				options: { backup },
			};

			// Phase 1: Scan files
			const scanStart = performance.now();
			const scanResult = await scanFiles(
				plugin.app.vault,
				rule.scope
			);
			const scanTime = performance.now() - scanStart;
			console.log(`[PREVIEW TIMING] Scan: ${scanTime.toFixed(1)}ms, Files: ${scanResult.matched.length}`);

			debugLog('Files scanned:', scanResult.matched.length);

			// Phase 2: Process batch (dry-run)
			const processStart = performance.now();
			const result = await processBatch(
				plugin.app,
				scanResult.matched,
				rule,
				undefined,
				{ dryRun: true }
			);
			const processTime = performance.now() - processStart;
			console.log(`[PREVIEW TIMING] Process: ${processTime.toFixed(1)}ms`);

			// Calculate total time and log performance metrics
			const totalTime = performance.now() - startTime;
			console.log(`[PREVIEW TIMING] Total: ${totalTime.toFixed(1)}ms`);

			// Warn if slow
			if (totalTime > 7000) {
				console.warn(`[PREVIEW] Slow preview detected: ${totalTime.toFixed(0)}ms for ${scanResult.matched.length} files`);
				console.warn(`[PREVIEW] Breakdown: scan=${scanTime.toFixed(0)}ms (${(scanTime/totalTime*100).toFixed(0)}%), process=${processTime.toFixed(0)}ms (${(processTime/totalTime*100).toFixed(0)}%)`);
			}

			debugLog('Preview results:', result.results.length);
			previewResults = result.results;
			hasPreviewedRule = true;
			console.log('[PREVIEW DIAGNOSTIC] Preview completed successfully, hasPreviewedRule set to true');
		} catch (error) {
			console.error('[PREVIEW DIAGNOSTIC] Preview error:', error);
			console.error('[PREVIEW DIAGNOSTIC] hasPreviewedRule NOT set due to error');
			previewError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			previewLoading = false;
		}
	}

	// Helper: Show custom confirm dialog and return result
	// Replaces native confirm() for WebDriver testability
	async function showCustomConfirmDialog() {
		// Show the dialog
		showConfirmDialog = true;
		confirmDialogResult = null;
		dialogState.result = null;

		// Wait for Svelte to render the dialog
		await tick();

		console.log('[CONFIRM DIALOG] Dialog shown - waiting for user response');
		console.log('[CONFIRM DIALOG] Creating promise, dialogState is:', typeof dialogState, Object.keys(dialogState));

		// Return a promise that resolves when the user makes a decision
		return new Promise<boolean>((resolve) => {
			// Store the resolve function in the shared state so the global function can call it directly
			console.log('[CONFIRM DIALOG] Promise created, storing resolve function');
			dialogState.resolve = resolve;
			console.log('[CONFIRM DIALOG] Resolve function stored, dialogState.resolve is:', typeof dialogState.resolve);

			// Polling function as fallback - checks if user made a decision via button click
			const checkInterval = setInterval(() => {
				if (confirmDialogResult !== null) {
					clearInterval(checkInterval);
					showConfirmDialog = false;
					console.log('[CONFIRM DIALOG] User confirmed (polling detected):', confirmDialogResult);
					// Clear the stored resolve since we're resolving here
					dialogState.resolve = null;
					resolve(confirmDialogResult);
				}
			}, 50);

			// Timeout after 30 seconds (prevent hanging)
			setTimeout(() => {
				if (confirmDialogResult === null) {
					clearInterval(checkInterval);
					showConfirmDialog = false;
					confirmDialogResult = true;
					dialogState.result = true;
					console.log('[CONFIRM DIALOG] Timeout - defaulting to true (allowing apply)');
					// Clear the stored resolve
					dialogState.resolve = null;
					resolve(true);
				}
			}, 2000);
		});
	}

	async function apply() {
		console.log('[APPLY DIAGNOSTIC] Starting apply()');
		console.log('[APPLY DIAGNOSTIC] Condition:', condition);
		console.log('[APPLY DIAGNOSTIC] Action:', action);

		const isValid = validate();
		console.log('[APPLY DIAGNOSTIC] Validation result:', isValid);

		if (!isValid) {
			console.log('[APPLY DIAGNOSTIC] EARLY RETURN: Validation failed');
			console.log('[APPLY DIAGNOSTIC] Condition error:', conditionError);
			console.log('[APPLY DIAGNOSTIC] Action error:', actionError);
			globalThis.__applyDiagnostics = {
				reached: 'apply',
				returnReason: 'validation_failed',
				conditionError,
				actionError,
				condition,
				action,
			};
			return;
		}

		// DIAGNOSTIC: Log preview state

	// Check if we're in E2E test mode (skip confirm dialog)
	const isE2ETest = window.__isE2ETest || false;
	console.log('[APPLY DIAGNOSTIC] isE2ETest:', isE2ETest);

		console.log('[APPLY DIAGNOSTIC] hasPreviewedRule:', hasPreviewedRule);

		// Smart warning: show if user hasn't previewed
		if (!hasPreviewedRule && !isE2ETest) {
			console.log('[APPLY DIAGNOSTIC] Showing confirm dialog - preview not run');
			console.log('[APPLY DIAGNOSTIC] Dialog title:', t('confirm.applyWithoutPreview.title'));

			// Store in window for testing
			globalThis.__confirmDialogShown = true;
			globalThis.__applyDiagnostics = {
				reached: 'confirm_dialog',
				aboutToShowConfirm: true,
			};

		const confirmed = global.confirm(t('confirm.applyWithoutPreview.title'));

			console.log('[APPLY DIAGNOSTIC] confirm() returned:', confirmed);
			console.log('[APPLY DIAGNOSTIC] typeof confirmed:', typeof confirmed);

			globalThis.__applyDiagnostics = {
				...globalThis.__applyDiagnostics,
				confirmReturned: confirmed,
			};

			if (!confirmed) {
				console.log('[APPLY DIAGNOSTIC] EARLY RETURN: User declined or dialog failed');
				globalThis.__applyDiagnostics = {
					...globalThis.__applyDiagnostics,
					returnReason: 'confirm_declined',
				};
				return;
			}
			console.log('[APPLY DIAGNOSTIC] User confirmed, proceeding with apply');
		} else {
			console.log('[APPLY DIAGNOSTIC] Skipping confirm dialog - preview was run');
			globalThis.__applyDiagnostics = {
				reached: 'proceed_to_scan',
				skippedConfirmDialog: true,
			};
		}

		try {
			const rule = {
				...currentRule,
				condition,
				action,
				scope: {
					type: scopeType,
					folder: scopeType === 'folder' ? folderPath : undefined,
				},
				options: { backup },
			};

			console.log('[APPLY DIAGNOSTIC] Rule being applied:', {
				condition: rule.condition,
				action: rule.action,
				scope: rule.scope,
				backup: rule.options.backup,
			});

			globalThis.__applyDiagnostics = {
				...globalThis.__applyDiagnostics,
				rule,
			};

			const scanResult = await scanFiles(
				plugin.app.vault,
				rule.scope
			);

			console.log('[APPLY DIAGNOSTIC] Scan result:', { matched: scanResult.matched.length, files: scanResult.matched.map((f) => f.path) });

			globalThis.__applyDiagnostics = {
				...globalThis.__applyDiagnostics,
				matchedFiles: scanResult.matched.length,
			};

			if (scanResult.matched.length === 0) {
						new Notice(t('notices.noFilesMatched'));
						globalThis.__applyDiagnostics = {
							...globalThis.__applyDiagnostics,
							returnReason: 'no_files_matched',
						};
				return;
			}

				new Notice(t('notices.processing', { count: scanResult.matched.length }));

			// SAFETY: No dryRun option means writes will happen
			const fileCount = scanResult.matched.length;
			console.log('[APPLY] Calling processBatch with', fileCount, 'files');

			// Store apply state for E2E diagnostics
			globalThis.__applyState = {
				startTime: Date.now(),
				fileCount,
				status: 'in_progress'
			};

			const applyStart = Date.now();
			const result = await processBatch(plugin.app, scanResult.matched, rule);
			const applyDuration = Date.now() - applyStart;
			console.log('[APPLY] processBatch completed in', applyDuration, 'ms');
			console.log('[APPLY] Result summary:', result.summary);

			// Update apply state with results
			globalThis.__applyState = {
				...globalThis.__applyState,
				endTime: Date.now(),
				duration: applyDuration,
				status: 'completed',
				summary: result.summary,
				results: result.results
			};

			const msg = t('notices.complete', {
				success: result.summary.success,
				warnings: result.summary.warnings,
				errors: result.summary.errors
			});
			console.log('[APPLY] Creating completion notice:', msg);
			new Notice(msg, 5000);
			console.log('[APPLY] Completion notice created');

			if (selectedRuleId) {
				const { updateLastRun } = await import('../storage/ruleStorage');
				await updateLastRun(plugin, selectedRuleId);
			}

			// Reset preview flag after successful apply
			hasPreviewedRule = false;
		} catch (error) {
			console.error('[APPLY ERROR]', error);
			console.error('[APPLY ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
			const errorMsg = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;

			// Store error state for E2E diagnostics
			globalThis.__applyState = {
				...globalThis.__applyState,
				endTime: Date.now(),
				status: 'error',
				error: errorMsg,
				errorStack
			};
			globalThis.__applyDiagnostics = {
				...globalThis.__applyDiagnostics,
				error: errorMsg,
				errorStack,
			};
			new Notice(t('notices.error', { message: errorMsg }));
		}
	}

	// Track previous values to detect actual changes
	let prevCondition = condition;
	let prevAction = action;
	let prevScopeType = scopeType;
	let prevFolderPath = folderPath;

	// Reset preview flag when rule configuration changes
	$: {
		const configChanged =
			condition !== prevCondition ||
			action !== prevAction ||
			scopeType !== prevScopeType ||
			folderPath !== prevFolderPath;

		if (configChanged && hasPreviewedRule) {
			console.log('[PREVIEW DIAGNOSTIC] Config changed, resetting hasPreviewedRule to false');
			console.log('[PREVIEW DIAGNOSTIC] Changes:', {
				condition: condition !== prevCondition,
				action: action !== prevAction,
				scopeType: scopeType !== prevScopeType,
				folderPath: folderPath !== prevFolderPath
			});
			hasPreviewedRule = false;
		}

		// Update previous values
		prevCondition = condition;
		prevAction = action;
		prevScopeType = scopeType;
		prevFolderPath = folderPath;
	}

	// Build current rule for TestTab
	$: testRule = {
		...currentRule,
		condition,
		action,
		scope: {
			type: scopeType,
			folder: scopeType === 'folder' ? folderPath : undefined,
		},
		options: { backup },
	};
</script>

{#if showConfirmDialog}
	<div class="confirm-dialog-overlay">
		<div class="confirm-dialog-modal">
			<div class="confirm-dialog-header">
				<h3>{t('confirm.applyWithoutPreview.title')}</h3>
			</div>
			<div class="confirm-dialog-body">
				<p>{t('confirm.applyWithoutPreview.message')}</p>
				<p><strong>{t('confirm.applyWithoutPreview.question')}</strong></p>
			</div>
			<div class="confirm-dialog-footer">
				<button
					class="confirm-dialog-cancel-btn"
					data-testid="confirm-dialog-cancel"
					on:click={() => {
						console.log('[CONFIRM DIALOG] Cancel button clicked');
						confirmDialogResult = false;
						dialogState.result = false;
						// If a resolve function is waiting, call it immediately
						if (dialogState.resolve) {
							dialogState.resolve(false);
							dialogState.resolve = null;
						}
					}}
				>
					{t('common.cancel')}
				</button>
				<button
					class="confirm-dialog-ok-btn"
					data-testid="confirm-dialog-ok"
					on:click={() => {
						console.log('[CONFIRM DIALOG] OK button clicked');
						confirmDialogResult = true;
						dialogState.result = true;
						// If a resolve function is waiting, call it immediately
						if (dialogState.resolve) {
							dialogState.resolve(true);
							dialogState.resolve = null;
						}
					}}
				>
					{t('common.ok')}
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="yaml-toolkit-modal">
	<h2>{t('ruleBuilder.title')}</h2>

	<div class="modal-content">
		<div class="rule-selector">
			<label for="saved-rules-select">{t('ruleBuilder.savedRules.label')}</label>
			<select id="saved-rules-select" bind:value={selectedRuleId} on:change={() => selectedRuleId && loadRule(selectedRuleId)}>
				<option value={null}>{t('ruleBuilder.savedRules.newRule')}</option>
				{#each savedRules as rule (rule.id)}
					<option value={rule.id}>{rule.name}</option>
				{/each}
			</select>
			<button on:click={newRule}>{t('ruleBuilder.buttons.new')}</button>
			{#if selectedRuleId}
				<button on:click={deleteCurrentRule} class="danger">{t('ruleBuilder.buttons.delete')}</button>
			{/if}
		</div>

		<div class="field">
			<label for="rule-name">{t('ruleBuilder.fields.ruleName.label')}</label>
			<input id="rule-name" type="text" bind:value={currentRule.name} placeholder={t('ruleBuilder.fields.ruleName.placeholder')} />
		</div>

		<fieldset class="field">
			<legend>{t('ruleBuilder.fields.scope.legend')}</legend>
			<div class="radio-group">
				<label>
					<input type="radio" bind:group={scopeType} value="vault" />
					{t('ruleBuilder.fields.scope.vault')}
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="folder" />
					{t('ruleBuilder.fields.scope.folder')}
				</label>
				<label>
					<input type="radio" bind:group={scopeType} value="current" />
					{t('ruleBuilder.fields.scope.current')}
				</label>
			</div>
			{#if scopeType === 'folder'}
				<FolderAutocomplete
					app={plugin.app}
					bind:value={folderPath}
					placeholder={t('ruleBuilder.fields.scope.folderPlaceholder')}
					on:change={(e) => folderPath = e.detail}
				/>
			{/if}
		</fieldset>

		<div class="field">
			<label for="condition">
				{t('ruleBuilder.fields.condition.label')}
				<span class="help-icon" title={t('ruleBuilder.fields.condition.helpText')}>ℹ️</span>
			</label>
			<textarea
				id="condition"
				bind:value={condition}
				placeholder={t('ruleBuilder.fields.condition.placeholder')}
				rows="3"
			></textarea>
			{#if conditionError}
				<div class="error">{conditionError}</div>
			{/if}
		</div>

		<div class="field">
			<label for="action">{t('ruleBuilder.fields.action.label')}</label>
			<textarea
				id="action"
				bind:value={action}
				placeholder={t('ruleBuilder.fields.action.placeholder')}
				rows="3"
			></textarea>
			{#if actionError}
				<div class="error">{actionError}</div>
			{/if}
		</div>

		<div class="field">
			<label>
				<input type="checkbox" bind:checked={backup} />
				{t('ruleBuilder.fields.backup.label')}
			</label>
		</div>

		<div class="button-group">
			<div class="left-buttons">
				<button on:click={onClose}>{t('ruleBuilder.buttons.cancel')}</button>
			</div>
			<div class="right-buttons">
				<button on:click={save}>{t('ruleBuilder.buttons.save')}</button>
				<button on:click={validate} class="secondary">{t('ruleBuilder.buttons.validate')}</button>
				<button on:click={preview} class="secondary">{t('ruleBuilder.buttons.preview')}</button>
				<button on:click={apply} class="cta">{t('ruleBuilder.buttons.apply')}</button>
			</div>
		</div>

		{#if showValidationSection}
			<div class="validation-section">
				<div class="validation-header">
					<div class="validation-tabs">
						<button
							class="tab-btn preview-tab {activeTab === 'preview' ? 'active' : ''}"
							on:click={() => activeTab = 'preview'}
						>
							{t('ruleBuilder.tabs.preview')}
						</button>
						<button
							class="tab-btn test-tab {activeTab === 'test' ? 'active' : ''}"
							on:click={() => activeTab = 'test'}
						>
							{t('ruleBuilder.tabs.test')}
						</button>
					</div>
					<button
						class="close-validation"
						on:click={() => showValidationSection = false}
						title={t('ruleBuilder.closeValidation')}
					>
						✕
					</button>
				</div>

				<div class="validation-content">
					{#if activeTab === 'preview'}
						<PreviewTab
							results={previewResults}
							isLoading={previewLoading}
							error={previewError}
						/>
					{:else}
						<TestTab rule={testRule} app={plugin.app} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Error message styling */
	.error {
		color: var(--text-error);
		font-size: var(--font-ui-smaller);
		margin-top: var(--size-4-2);
		line-height: 1.4;
	}

	/* Validation section */
	.validation-section {
		margin-top: var(--size-4-6);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-secondary);
		overflow: hidden;
	}

	.validation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--background-secondary-alt);
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.validation-tabs {
		display: flex;
		gap: 0;
		flex: 1;
	}

	.tab-btn {
		flex: 1;
		padding: var(--size-4-3) var(--size-4-4);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-weight: var(--font-medium);
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		transition: all 0.2s;
	}

	.tab-btn:hover {
		color: var(--text-normal);
		background: var(--interactive-hover);
	}

	.tab-btn.active {
		background: var(--background-primary);
		color: var(--text-normal);
		border-bottom-color: var(--interactive-accent);
	}

	.close-validation {
		padding: var(--size-4-2) var(--size-4-3);
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 18px;
		line-height: 1;
		transition: color 0.1s;
		flex-shrink: 0;
	}

	.close-validation:hover {
		color: var(--text-error);
	}

	.validation-content {
		min-height: 300px;
		max-height: 500px;
		overflow-y: auto;
		background: var(--background-primary);
	}

	/* Help icon styling */
	.help-icon {
		display: inline-block;
		margin-left: var(--size-4-1);
		cursor: help;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.help-icon:hover {
		opacity: 1;
		color: var(--interactive-accent);
	}

	/* Custom confirm dialog - replaces native confirm() for testability */
	.confirm-dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.confirm-dialog-modal {
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		max-width: 400px;
		width: 90%;
		padding: 0;
		overflow: hidden;
	}

	.confirm-dialog-header {
		background: var(--background-secondary);
		padding: var(--size-4-6);
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.confirm-dialog-header h3 {
		margin: 0;
		font-size: var(--font-ui-medium);
		color: var(--text-normal);
	}

	.confirm-dialog-body {
		padding: var(--size-4-6);
		color: var(--text-normal);
	}

	.confirm-dialog-body p {
		margin: 0 0 var(--size-4-3) 0;
		line-height: 1.5;
	}

	.confirm-dialog-body p:last-child {
		margin-bottom: 0;
	}

	.confirm-dialog-footer {
		display: flex;
		gap: var(--size-4-3);
		justify-content: flex-end;
		padding: var(--size-4-6);
		border-top: 1px solid var(--background-modifier-border);
		background: var(--background-secondary);
	}

	.confirm-dialog-cancel-btn,
	.confirm-dialog-ok-btn {
		padding: var(--size-4-2) var(--size-4-5);
		border: none;
		border-radius: var(--radius-s);
		cursor: pointer;
		font-size: var(--font-ui-small);
		font-weight: 500;
		transition: all 0.2s;
	}

	.confirm-dialog-cancel-btn {
		background: var(--background-modifier-border);
		color: var(--text-normal);
	}

	.confirm-dialog-cancel-btn:hover {
		background: var(--background-modifier-border-hover);
	}

	.confirm-dialog-ok-btn {
		background: var(--interactive-accent);
		color: var(--interactive-accent-rgb);
	}

	.confirm-dialog-ok-btn:hover {
		background: var(--interactive-accent-hover);
	}
</style>
