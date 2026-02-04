/**
 * Obsidian UI Helpers for Documentation Tests
 * Provides functions for interacting with Obsidian vault and files
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const VAULT_PATH = path.join(__dirname, '../../../../test-vaults/default');

/**
 * Create a note in the test vault with given frontmatter
 */
export async function createNote(filename: string, frontmatter: any, content: string = ''): Promise<void> {
	const filePath = path.join(VAULT_PATH, filename);

	// Ensure directory exists
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	// Generate file content with frontmatter
	const fileContent = matter.stringify(content, frontmatter);
	fs.writeFileSync(filePath, fileContent, 'utf8');

	// CRITICAL: Wait for Obsidian to detect the file
	// Without this, newly created files won't be included in vault.getMarkdownFiles()
	// 1000ms ensures file is detected even in busy test runs
	await browser.pause(1000);
}

/**
 * Read frontmatter from a note in the test vault using Obsidian's API
 * IMPORTANT: Must use Obsidian's API to read the latest state,
 * not fs.readFileSync(), because writes may not be flushed to disk yet
 */
export async function readFileYaml(filename: string): Promise<any> {
	// Wait for file to be indexed by Obsidian (ensures write is complete)
	// Use aggressive wait to ensure vault has processed the file
	await browser.pause(1000);

	// Use Obsidian's API to read the file (reads from memory/cache, not disk)
	// With retry logic in case vault is still indexing
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const content = await browser.execute(async (filepath: string) => {
				const app = (window as any).app;
				if (!app || !app.vault) {
					throw new Error('Vault not available');
				}
				const file = app.vault.getAbstractFileByPath(filepath);
				if (!file) {
					throw new Error(`File not found in vault: ${filepath}`);
				}
				return await app.vault.read(file);
			}, filename);

			// Parse frontmatter
			const parsed = matter(content);
			return parsed.data;
		} catch (error) {
			lastError = error as Error;
			if (attempt < 4) {
				// Retry after increasing delays: 200ms, 400ms, 600ms, 800ms
				const delayMs = (attempt + 1) * 200;
				await browser.pause(delayMs);
			}
		}
	}

	// If all retries failed, throw the error
	throw new Error(`Failed to read file "${filename}" after 5 attempts: ${lastError?.message}`);
}

/**
 * Delete a note from the test vault
 */
export async function deleteNote(filename: string): Promise<void> {
	const filePath = path.join(VAULT_PATH, filename);

	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
		await browser.pause(300);
	}
}

/**
 * Open YAML Toolkit modal using command palette
 */
export async function openYamlToolkit(): Promise<void> {
	const isMac = process.platform === 'darwin';
	const cmdKeys = isMac ? ['Meta', 'p'] : ['Control', 'p'];

	// First, close any open dialogs to ensure clean state
	await browser.keys(['Escape']);
	await browser.pause(200);

	// Open command palette
	console.log(`  🎹 Opening command palette...`);
	await browser.keys(cmdKeys);
	await browser.pause(400);

	// Type the command name
	await browser.keys('Open Rule Builder'.split(''));
	await browser.pause(200);

	// Execute command with Enter
	await browser.keys(['Enter']);
	await browser.pause(400);

	// Wait for modal to appear
	const modal = await $('.yaml-toolkit-modal');
	await modal.waitForDisplayed({ timeout: 3000 });
	console.log(`  ✅ Rule Builder modal opened`);
}

/**
 * Close YAML Toolkit modal
 */
export async function closeYamlToolkit(): Promise<void> {
	await browser.keys(['Escape']);
	await browser.pause(300);

	// Verify modal is closed
	const modal = await $('.yaml-toolkit-modal');
	await modal.waitForDisplayed({ timeout: 3000, reverse: true });
}

/**
 * Wait for Obsidian notice to appear
 */
export async function waitForNotice(timeout: number = 3000): Promise<WebdriverIO.Element> {
	const notice = await $('.notice');
	await notice.waitForDisplayed({ timeout });
	return notice;
}

/**
 * Get text from Obsidian notice
 */
export async function getNoticeText(): Promise<string> {
	const notice = await waitForNotice();
	return await notice.getText();
}

/**
 * Wait for notice to disappear
 */
export async function waitForNoticeToDisappear(timeout: number = 3000): Promise<void> {
	const notice = await $('.notice');
	await notice.waitForDisplayed({ timeout, reverse: true });
}

/**
 * Take a screenshot with a descriptive name
 * Automatically adds timestamp to filename
 */
export async function screenshot(name: string): Promise<void> {
	// Add timestamp to filename: YYYYMMDD-HHMMSS
	const timestamp = new Date().toISOString()
		.replace(/T/, '-')
		.replace(/\..+/, '')
		.replace(/:/g, '');

	const filename = `${name}-${timestamp}.png`;
	const filepath = `./test-results/docs-e2e/${filename}`;

	// Ensure directory exists
	const dir = path.dirname(filepath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	await browser.saveScreenshot(filepath);

	// Track screenshot for cleanup (using global function from wdio.conf.js)
	if (typeof (global as any).trackScreenshot === 'function') {
		(global as any).trackScreenshot(filepath);
	}
}

/**
 * Create multiple notes from test fixtures
 */
export async function createNotesFromFixtures(fixtures: any[]): Promise<void> {
	for (const fixture of fixtures) {
		const filename = `docs-examples/${fixture.id}.md`;
		await createNote(filename, fixture.input, fixture.description || '');
	}
}

/**
 * Clean up all docs-examples notes
 */
export async function cleanupDocsExamples(): Promise<void> {
	const docsExamplesDir = path.join(VAULT_PATH, 'docs-examples');

	if (fs.existsSync(docsExamplesDir)) {
		fs.rmSync(docsExamplesDir, { recursive: true, force: true });
	}

	// Also clean up any backup files in vault root from previous test runs
	const vaultRootFiles = fs.readdirSync(VAULT_PATH);
	for (const file of vaultRootFiles) {
		if (file.endsWith('.bak') || file.endsWith('.backup')) {
			try {
				const filePath = path.join(VAULT_PATH, file);
				fs.unlinkSync(filePath);
			} catch (e) {
				// Ignore cleanup errors
			}
		}
	}
}

/**
 * Get vault path for file operations
 */
export function getVaultPath(): string {
	return VAULT_PATH;
}
