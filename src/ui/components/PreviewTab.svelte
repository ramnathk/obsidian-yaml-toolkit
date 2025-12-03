<script lang="ts">
	/**
	 * PreviewTab Component
	 * Shows preview of changes to real vault files
	 */
	import DiffViewer from './DiffViewer.svelte';

	export let results = [];
	export let isLoading = false;
	export let error = null;

	// Track expanded files
	let expandedFiles = new Set();

	$: summary = {
		success: results.filter(r => r.status === 'success').length,
		warnings: results.filter(r => r.status === 'warning').length,
		errors: results.filter(r => r.status === 'error').length,
		skipped: results.filter(r => r.status === 'skipped').length,
		total: results.length,
	};

	$: hasResults = results.length > 0;
	$: isEmpty = !isLoading && results.length === 0;

	function toggleExpand(filePath) {
		if (expandedFiles.has(filePath)) {
			expandedFiles.delete(filePath);
		} else {
			expandedFiles.add(filePath);
		}
		expandedFiles = expandedFiles; // Trigger reactivity
	}

	function getStatusIcon(status) {
		switch (status) {
			case 'success':
				return '✓';
			case 'warning':
				return '⚠';
			case 'error':
				return '✗';
			case 'skipped':
				return '○';
			default:
				return '?';
		}
	}

	function getStatusClass(status) {
		return `status-${status}`;
	}
</script>

<div class="preview-tab">
	{#if isLoading}
		<div class="preview-loading">
			<div class="spinner"></div>
			<p>Scanning files and previewing changes...</p>
		</div>
	{:else if error}
		<div class="preview-error">
			<span class="error-icon">✗</span>
			<div class="error-content">
				<div class="error-title">Preview Failed</div>
				<div class="error-message">{error}</div>
			</div>
		</div>
	{:else if isEmpty}
		<div class="preview-empty">
			<div class="empty-icon">○</div>
			<div class="empty-message">
				<strong>No markdown files found in the selected scope.</strong>
				<p>Try selecting a different folder or check your file filters.</p>
			</div>
		</div>
	{:else}
		<div class="preview-summary">
			<div class="summary-title">Summary</div>
			<div class="summary-stats">
				{#if summary.success > 0}
					<span class="stat status-success">
						✓ {summary.success} matched
					</span>
				{/if}
				{#if summary.warnings > 0}
					<span class="stat status-warning">
						⚠ {summary.warnings} warning{summary.warnings !== 1 ? 's' : ''}
					</span>
				{/if}
				{#if summary.errors > 0}
					<span class="stat status-error">
						✗ {summary.errors} error{summary.errors !== 1 ? 's' : ''}
					</span>
				{/if}
				{#if summary.skipped > 0}
					<span class="stat status-skipped">
						○ {summary.skipped} skipped
					</span>
				{/if}
			</div>
		</div>

		<div class="preview-files">
			{#each results as result (result.file.path)}
				<div class="file-item">
					<button
						class="file-header {getStatusClass(result.status)}"
						on:click={() => toggleExpand(result.file.path)}
					>
						<span class="file-status">{getStatusIcon(result.status)}</span>
						<span class="file-path">{result.file.path}</span>
						<span class="expand-icon">
							{expandedFiles.has(result.file.path) ? '▼' : '▶'}
						</span>
					</button>

					{#if expandedFiles.has(result.file.path)}
						<div class="file-details">
							{#if result.status === 'error'}
								<div class="error-details">
									<strong>Error:</strong>
									{result.error || 'Unknown error'}
								</div>
							{:else if result.status === 'skipped'}
								<div class="skip-reason">
									<strong>Reason:</strong>
									{result.error || 'Condition did not match'}
								</div>
							{:else if result.modified && result.originalData && result.newData}
								<DiffViewer
									originalData={result.originalData}
									newData={result.newData}
									changes={result.changes}
								/>
							{:else}
								<div class="no-changes">No changes to display</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="preview-note">
			<strong>Note:</strong> These are preview results only. No files have been modified. Click
			<strong>Apply</strong> to write these changes to disk.
		</div>
	{/if}
</div>

<style>
	.preview-tab {
		padding: var(--size-4-3);
	}

	/* Loading state */
	.preview-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--size-4-6);
		color: var(--text-muted);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--background-modifier-border);
		border-top-color: var(--interactive-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--size-4-3);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Error state */
	.preview-error {
		display: flex;
		gap: var(--size-4-3);
		padding: var(--size-4-4);
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid var(--text-error);
		border-radius: var(--radius-s);
		color: var(--text-error);
	}

	.error-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.error-title {
		font-weight: var(--font-semibold);
		margin-bottom: var(--size-2-2);
	}

	/* Empty state */
	.preview-empty {
		text-align: center;
		padding: var(--size-4-6);
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: var(--size-4-3);
	}

	.empty-message strong {
		display: block;
		margin-bottom: var(--size-4-2);
		color: var(--text-normal);
	}

	/* Summary */
	.preview-summary {
		margin-bottom: var(--size-4-4);
		padding: var(--size-4-3);
		background: var(--background-secondary);
		border-radius: var(--radius-s);
	}

	.summary-title {
		font-weight: var(--font-semibold);
		margin-bottom: var(--size-4-2);
		color: var(--text-normal);
	}

	.summary-stats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--size-4-4);
	}

	.stat {
		font-weight: var(--font-semibold);
		display: flex;
		align-items: center;
		gap: var(--size-2-2);
	}

	.stat.status-success {
		color: var(--text-success);
	}

	.stat.status-warning {
		color: var(--text-warning);
	}

	.stat.status-error {
		color: var(--text-error);
	}

	.stat.status-skipped {
		color: var(--text-muted);
	}

	/* File list */
	.preview-files {
		margin-bottom: var(--size-4-4);
	}

	.file-item {
		margin-bottom: var(--size-4-2);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		overflow: hidden;
	}

	/* Add accent border for modified files */
	.file-item:has(.status-success) {
		border-left: 3px solid var(--interactive-accent);
	}

	.file-header {
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
		width: 100%;
		padding: var(--size-4-2) var(--size-4-3);
		background: var(--background-secondary);
		border: none;
		cursor: pointer;
		text-align: left;
		color: var(--text-normal);
		font-size: var(--font-ui-small);
		transition: background 0.1s;
	}

	.file-header:hover {
		background: var(--interactive-hover);
	}

	.file-status {
		font-size: 14px;
		flex-shrink: 0;
	}

	.file-path {
		flex: 1;
		font-family: var(--font-monospace);
		font-size: var(--font-ui-smaller);
	}

	.expand-icon {
		color: var(--text-faint);
		font-size: 10px;
		flex-shrink: 0;
	}

	.file-details {
		padding: var(--size-4-3);
		background: var(--background-primary);
		border-top: 1px solid var(--background-modifier-border);
	}

	.error-details,
	.skip-reason {
		padding: var(--size-4-2);
		border-left: 3px solid var(--text-muted);
		color: var(--text-muted);
	}

	.no-changes {
		text-align: center;
		padding: var(--size-4-4);
		color: var(--text-muted);
	}

	/* Status colors */
	.status-success .file-status {
		color: var(--text-success);
	}

	.status-warning .file-status {
		color: var(--text-warning);
	}

	.status-error .file-status {
		color: var(--text-error);
	}

	.status-skipped .file-status {
		color: var(--text-muted);
	}

	/* Preview note */
	.preview-note {
		padding: var(--size-4-3);
		background: var(--background-secondary);
		border-left: 3px solid var(--interactive-accent);
		border-radius: var(--radius-s);
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}

	.preview-note strong {
		color: var(--text-normal);
	}
</style>
