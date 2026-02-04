/**
 * Minimal test to verify scanFiles() hypothesis
 * Tests if files created via Obsidian API are found by scanFiles()
 */

import { createNote, readFileYaml, deleteNote, openYamlToolkit } from '../helpers/obsidian-ui';
import { enterCondition, enterAction, clickPreview, clickApply } from '../helpers/rule-builder';
import { assertYamlEqualNormalized } from '../helpers/yaml-assertions';

describe('Minimal scanFiles Test', () => {
	it('should find and modify file created via Obsidian API', async () => {
		const testFile = 'test-scan-minimal.md';

		try {
			// Create file using Obsidian's API (not fs.writeFileSync)
			await browser.execute(async (filepath: string) => {
				const app = (window as any).app;
				const content = `---
status: draft
tags:
  - test
---

Test content`;
				await app.vault.create(filepath, content);
			}, testFile);

			console.log('✅ Created test file via Obsidian API');

			// Wait for Obsidian to index
			await browser.pause(1000);

			// Open modal
			await openYamlToolkit();
			await browser.pause(500);

			// Enter simple rule
			await enterCondition('status = "draft"');
			await enterAction('SET status "published"');

			// Preview first to verify rule matches files
			await clickPreview();
			await browser.pause(500);

			// Apply after preview
			await clickApply();

			// Wait for processing
			await browser.pause(2000);

			// Read file to verify changes
			const actualYaml = await readFileYaml(testFile);

			console.log('Actual YAML after apply:', actualYaml);

			// Assert
			assertYamlEqualNormalized(actualYaml, {
				status: 'published',
				tags: ['test']
			}, 'Minimal test');

		} finally {
			// Cleanup
			await browser.execute(async (filepath: string) => {
				const app = (window as any).app;
				const file = app.vault.getAbstractFileByPath(filepath);
				if (file) {
					await app.vault.delete(file);
				}
			}, testFile);
		}
	});
});
