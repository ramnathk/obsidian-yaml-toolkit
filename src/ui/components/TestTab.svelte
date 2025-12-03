<script lang="ts">
	/**
	 * TestTab Component
	 * Test rules against sample YAML without touching vault
	 */
	import { TFile } from 'obsidian';
	import { executeRule } from '../../core/ruleEngine';
	import { parseYamlString } from '../../yaml/yamlProcessor';
	import DiffViewer from './DiffViewer.svelte';

	export let rule;
	export let app; // Obsidian App instance

	let sampleYaml = '';
	let result = null;
	let error = null;
	let isExecuting = false;

	// Example YAML samples
	const examples = {
		'Draft Note': `title: My Draft Note
status: draft
priority: 5
tags:
  - work
  - urgent
author: John Doe`,
		'Published Note': `title: Published Article
status: published
date: 2024-01-15
tags:
  - article
  - tech`,
		'Minimal Note': `title: Simple Note
status: draft`,
		'Complex Note': `title: Complex Example
status: draft
priority: 8
metadata:
  author:
    name: Jane Smith
    email: jane@example.com
  version: 2.1
tags:
  - project
  - important
dates:
  created: 2024-01-01
  updated: 2024-01-15`,
	};

	function loadExample(key) {
		sampleYaml = examples[key];
		result = null;
		error = null;
	}

	async function testRule() {
		error = null;
		result = null;
		isExecuting = true;

		try {
			// Validate YAML syntax
			let yamlData;
			try {
				yamlData = parseYamlString(sampleYaml);
			} catch (parseError) {
				error = `YAML parse error: ${parseError instanceof Error ? parseError.message : 'Invalid YAML'}`;
				isExecuting = false;
				return;
			}

			// Create mock TFile for testing (entirely in-memory)
			const mockFile = {
				path: 'sample.md',
				basename: 'sample',
				name: 'sample.md',
				extension: 'md',
			};

			// Mock app with in-memory vault operations
			const mockApp = {
				...app,
				vault: {
					...app.vault,
					read: async () => `---\n${sampleYaml}\n---\n\nSample content`,
				},
			};

			// Execute rule (dry-run only - never touches real vault)
			result = await executeRule(mockApp, rule, mockFile);
		} catch (execError) {
			error = `Rule execution error: ${execError instanceof Error ? execError.message : 'Unknown error'}`;
		} finally {
			isExecuting = false;
		}
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

	// Real-time YAML validation
	$: yamlError = (() => {
		if (!sampleYaml.trim()) return null;
		try {
			parseYamlString(sampleYaml);
			return null;
		} catch (e) {
			return e instanceof Error ? e.message : 'Invalid YAML';
		}
	})();

	$: canTest = sampleYaml.trim().length > 0 && !yamlError && !isExecuting;
</script>

<div class="test-tab">
	<div class="test-instructions">
		<p>
			Test your rule against sample YAML without modifying any files in your vault. Enter YAML
			frontmatter below or load an example.
		</p>
	</div>

	<div class="example-buttons">
		{#each Object.keys(examples) as exampleKey}
			<button class="example-btn" on:click={() => loadExample(exampleKey)}>
				{exampleKey}
			</button>
		{/each}
	</div>

	<div class="sample-input">
		<label for="sample-yaml">
			<strong>Sample YAML:</strong>
		</label>
		<textarea
			id="sample-yaml"
			bind:value={sampleYaml}
			placeholder="title: My Note&#10;status: draft&#10;priority: 5&#10;tags:&#10;  - work"
			rows="10"
		></textarea>
		{#if yamlError}
			<div class="yaml-error">{yamlError}</div>
		{/if}
	</div>

	<div class="test-actions">
		<button class="test-btn" on:click={testRule} disabled={!canTest}>
			{isExecuting ? 'Testing...' : 'Test Rule'}
		</button>
	</div>

	{#if error}
		<div class="test-error">
			<span class="error-icon">✗</span>
			<div class="error-content">
				<strong>Error:</strong>
				{error}
			</div>
		</div>
	{/if}

	{#if result}
		<div class="test-result">
			<div class="result-header {getStatusClass(result.status)}">
				<span class="result-icon">{getStatusIcon(result.status)}</span>
				<span class="result-status">
					{result.status.charAt(0).toUpperCase() + result.status.slice(1)}
				</span>
			</div>

			{#if result.status === 'error'}
				<div class="result-details">
					<strong>Error:</strong>
					{result.error || 'Unknown error'}
				</div>
			{:else if result.status === 'skipped'}
				<div class="result-details">
					<strong>Condition did not match</strong>
					<p>{result.error || 'The condition evaluated to false for this sample.'}</p>
				</div>
			{:else if result.modified && result.originalData && result.newData}
				<div class="result-details">
					<div class="result-match">
						<strong>Match:</strong> ✓ Condition matched
					</div>
					<DiffViewer
						originalData={result.originalData}
						newData={result.newData}
						changes={result.changes}
					/>
				</div>
			{:else if result.status === 'warning'}
				<div class="result-details">
					<strong>Warning:</strong>
					{result.error || 'No changes needed - values already match target.'}
				</div>
			{/if}

			<div class="result-note">
				<strong>Note:</strong> This test ran entirely in-memory. No vault files were accessed or modified.
			</div>
		</div>
	{/if}
</div>

<style>
	.test-tab {
		padding: var(--size-4-3);
	}

	.test-instructions {
		margin-bottom: var(--size-4-4);
		padding: var(--size-4-3);
		background: var(--background-secondary);
		border-radius: var(--radius-s);
		color: var(--text-muted);
	}

	.example-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--size-4-2);
		margin-bottom: var(--size-4-4);
	}

	.example-btn {
		padding: var(--size-2-2) var(--size-4-3);
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		cursor: pointer;
		font-size: var(--font-ui-small);
		transition: all 0.1s;
	}

	.example-btn:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.sample-input {
		margin-bottom: var(--size-4-4);
	}

	.sample-input label {
		display: block;
		margin-bottom: var(--size-4-2);
		color: var(--text-normal);
	}

	textarea {
		width: 100%;
		min-height: 200px;
		padding: var(--size-4-2);
		font-family: var(--font-monospace);
		font-size: var(--font-ui-small);
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		color: var(--text-normal);
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.yaml-error {
		margin-top: var(--size-4-2);
		padding: var(--size-4-2);
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid var(--text-error);
		border-radius: var(--radius-s);
		color: var(--text-error);
		font-size: var(--font-ui-small);
	}

	.test-actions {
		margin-bottom: var(--size-4-4);
	}

	.test-btn {
		padding: var(--size-4-2) var(--size-4-4);
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-s);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: opacity 0.1s;
	}

	.test-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.test-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.test-error {
		display: flex;
		gap: var(--size-4-3);
		margin-bottom: var(--size-4-4);
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

	.test-result {
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		overflow: hidden;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
		padding: var(--size-4-3);
		background: var(--background-secondary);
		font-weight: var(--font-semibold);
	}

	.result-icon {
		font-size: 20px;
	}

	.result-details {
		padding: var(--size-4-3);
	}

	.result-match {
		margin-bottom: var(--size-4-3);
		padding: var(--size-4-2);
		background: rgba(81, 207, 102, 0.1);
		border-left: 3px solid var(--text-success);
		border-radius: var(--radius-s);
		color: var(--text-success);
	}

	.result-note {
		padding: var(--size-4-3);
		background: var(--background-secondary);
		border-top: 1px solid var(--background-modifier-border);
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}

	.result-note strong {
		color: var(--text-normal);
	}

	/* Status colors */
	.status-success .result-icon {
		color: var(--text-success);
	}

	.status-warning .result-icon {
		color: var(--text-warning);
	}

	.status-error .result-icon {
		color: var(--text-error);
	}

	.status-skipped .result-icon {
		color: var(--text-muted);
	}
</style>
