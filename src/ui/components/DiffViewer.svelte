<script lang="ts">
	/**
	 * DiffViewer Component
	 * Shows before/after comparison of YAML frontmatter
	 */
	import { diffLines } from 'diff';
	import * as yaml from 'js-yaml';

	export let originalData;
	export let newData;
	export let changes = [];

	// Generate YAML strings for diff
	$: originalYaml = yaml.dump(originalData, { lineWidth: -1, noRefs: true });
	$: newYaml = yaml.dump(newData, { lineWidth: -1, noRefs: true });

	// Calculate diff
	$: diff = diffLines(originalYaml, newYaml);

	function getDiffClass(change) {
		if (change.added) return 'diff-added';
		if (change.removed) return 'diff-removed';
		return 'diff-unchanged';
	}

	function getDiffSymbol(change) {
		if (change.added) return '+';
		if (change.removed) return '-';
		return ' ';
	}
</script>

<div class="diff-viewer">
	<div class="diff-header">
		<span class="diff-label">Before</span>
		<span class="diff-label">After</span>
	</div>

	<div class="diff-content">
		{#each diff as change}
			{#each change.value.split('\n').filter(line => line.length > 0) as line}
				<div class="diff-line {getDiffClass(change)}">
					<span class="diff-symbol">{getDiffSymbol(change)}</span>
					<span class="diff-text">{line}</span>
				</div>
			{/each}
		{/each}
	</div>

	{#if changes.length > 0}
		<div class="diff-changes">
			<div class="diff-changes-header">Changes:</div>
			<ul class="diff-changes-list">
				{#each changes as change}
					<li>{change}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.diff-viewer {
		font-family: var(--font-monospace);
		font-size: var(--font-ui-small);
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		overflow: hidden;
	}

	.diff-header {
		display: flex;
		padding: var(--size-4-2) var(--size-4-3);
		background: var(--background-primary);
		border-bottom: 1px solid var(--background-modifier-border);
		font-weight: var(--font-semibold);
		color: var(--text-muted);
	}

	.diff-label {
		flex: 1;
		text-align: center;
	}

	.diff-content {
		max-height: 300px;
		overflow-y: auto;
		padding: var(--size-4-2);
	}

	.diff-line {
		display: flex;
		padding: 2px var(--size-4-2);
		line-height: 1.4;
	}

	.diff-symbol {
		width: 20px;
		flex-shrink: 0;
		font-weight: var(--font-bold);
		user-select: none;
	}

	.diff-text {
		flex: 1;
		white-space: pre;
	}

	.diff-added {
		background: rgba(81, 207, 102, 0.15);
		color: var(--text-success);
	}

	.diff-added .diff-symbol {
		color: var(--text-success);
	}

	.diff-removed {
		background: rgba(255, 107, 107, 0.15);
		color: var(--text-error);
	}

	.diff-removed .diff-symbol {
		color: var(--text-error);
	}

	.diff-unchanged {
		color: var(--text-muted);
	}

	.diff-changes {
		padding: var(--size-4-3);
		border-top: 1px solid var(--background-modifier-border);
		background: var(--background-primary);
	}

	.diff-changes-header {
		font-weight: var(--font-semibold);
		margin-bottom: var(--size-2-2);
		color: var(--text-normal);
	}

	.diff-changes-list {
		margin: 0;
		padding-left: var(--size-4-4);
		color: var(--text-muted);
	}

	.diff-changes-list li {
		margin-bottom: var(--size-2-2);
	}
</style>
