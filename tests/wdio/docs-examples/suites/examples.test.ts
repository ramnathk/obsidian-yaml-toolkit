/**
 * Documentation Examples E2E Test Suite
 * Tests all 46 examples from reference/examples.md
 * Ensures plugin behavior matches published documentation
 */

import {
	createNote,
	readFileYaml,
	deleteNote,
	openYamlToolkit,
	closeYamlToolkit,
	screenshot,
	cleanupDocsExamples
} from '../helpers/obsidian-ui';

import {
	enterCondition,
	enterActions,
	clickPreview,
	clickApply,
	clearRuleBuilder,
	selectScope,
	getPreviewFiles,
	verifyPreviewFile,
	logPreviewTimingsSummary,
	healthCheckPreviewInfra
} from '../helpers/rule-builder';

import {
	assertYamlEqual,
	assertYamlEqualNormalized,
	formatYamlDiff
} from '../helpers/yaml-assertions';

// Load extracted examples from documentation
const fixtures = require('../fixtures/extracted-examples.json');

describe('Documentation Examples - E2E', function() {
	this.timeout(120000); // 120s timeout for entire suite (includes before hook with 46+ file creation)

	before(async function() {
		this.timeout(90000); // 90s for before hook (creating 46+ files takes time)

		console.log(`\n📚 Testing ${fixtures.examples.length} documentation examples\n`);

		// WAIT FOR VAULT: Ensure Obsidian and vault are fully loaded before tests
		// The wdio.conf.js launches Obsidian with vault URI, but it may take time to process
		console.log('⏳ Waiting for Obsidian vault to load...');
		let vaultReady = false;
		let attempts = 0;
		const maxAttempts = 20; // 10 seconds with 500ms intervals

		while (!vaultReady && attempts < maxAttempts) {
			try {
				await browser.execute(() => {
					const app = (window as any).app;
					if (!app || !app.vault || !app.vault.getMarkdownFiles) {
						throw new Error('Vault not ready');
					}
					const files = app.vault.getMarkdownFiles();
					if (!files) {
						throw new Error('getMarkdownFiles returned null');
					}
				});
				vaultReady = true;
				console.log(`✅ Vault is ready!\n`);
			} catch (e) {
				attempts++;
				await browser.pause(500);
			}
		}

		if (!vaultReady) {
			throw new Error('Vault failed to load after 10 seconds');
		}

		// CLEANUP: Remove any leftover files from previous runs
		console.log('🧹 Cleaning up leftover files from previous runs...');
		const cleanupStartTime = Date.now();
		await cleanupDocsExamples();
		await browser.pause(200); // Brief pause for cleanup to complete
		const cleanupTime = Date.now() - cleanupStartTime;
		console.log(`✅ Cleanup complete (${cleanupTime}ms)\n`);

		// Create all test files upfront to avoid per-test file creation overhead
		console.log(`📝 Creating ${fixtures.examples.length} test files...`);
		const createStartTime = Date.now();
		let filesCreated = 0;
		for (const example of fixtures.examples) {
			const testFilename = `docs-examples/${example.id}.md`;
			try {
				await createNote(testFilename, example.input);
				filesCreated++;
			} catch (e) {
				console.warn(`⚠️  Failed to create ${testFilename}:`, e.message);
			}
		}
		const createTime = Date.now() - createStartTime;
		console.log(`✅ Created ${filesCreated}/${fixtures.examples.length} test files (${createTime}ms)\n`);

		// CRITICAL: Wait for Obsidian to detect and index all new files
		// Without this, the vault scan won't find files or their frontmatter
		// Scale wait time based on number of files: ~100ms per file
		const indexWaitTime = Math.max(3000, Math.min(8000, filesCreated * 100));
		console.log(`⏳ Waiting ${indexWaitTime}ms for Obsidian to index ${filesCreated} files...`);
		await browser.pause(indexWaitTime);
		console.log('✅ File indexing complete\n');

		// Open modal once at the start instead of for each test (saves ~1.8s per test)
		console.log('🔧 Opening YAML Toolkit modal...');
		const modalStartTime = Date.now();
		await openYamlToolkit();
		const modalTime = Date.now() - modalStartTime;
		console.log(`✅ Modal ready for testing (${modalTime}ms)\n`);

		// Run health check on preview infrastructure
		try {
			await healthCheckPreviewInfra();
		} catch (e) {
			console.warn('⚠️  Health check failed, but continuing with tests...\n');
		}
	});

	after(async () => {
		// Log preview timing statistics
		logPreviewTimingsSummary();

		// Close modal at the end
		try {
			await closeYamlToolkit();
		} catch (e) {
			// Already closed
		}

		// CLEANUP: Remove all test files (including any that failed to delete)
		console.log('\n🧹 Final cleanup of all docs-examples files...');
		await cleanupDocsExamples();
		console.log('✅ All docs-examples files cleaned up\n');
	});

	afterEach(async () => {
		// Just clear the rule builder, don't close/reopen modal
		await clearRuleBuilder();
		await browser.pause(100);
	});

	// Group examples by section for better organization
	const examplesBySection = fixtures.examples.reduce((acc: any, example: any) => {
		if (!acc[example.section]) {
			acc[example.section] = [];
		}
		acc[example.section].push(example);
		return acc;
	}, {});

	// Iterate through each section
	for (const [section, examples] of Object.entries(examplesBySection)) {
		describe(section, () => {
			for (const example of examples as any[]) {
				// TEMP: Skip multi-step examples until parser supports comma-separated actions
				const actions = Array.isArray(example.actions) ? example.actions : [example.actions];
				// Check if multi-step: either multiple array elements OR comma-separated in single string
				const hasMultipleElements = actions.length > 1;
				const hasCommaInAction = actions.some(a => {
					// Detect comma followed by action keyword (SET, FOR, DELETE, etc.)
					return /,\s*(SET|FOR|DELETE|ADD|RENAME|INCREMENT|DECREMENT|REPLACE|INSERT)\s/.test(a);
				});
				const isMultiStep = hasMultipleElements || hasCommaInAction;

				const testTitle = isMultiStep
					? `should match docs: ${example.title} (SKIPPED - multi-step)`
					: `should match docs: ${example.title}`;

				it(testTitle, async function() {
					this.timeout(35000); // 35 seconds per test (20s preview + 10s apply + 5s margin)

					const testFilename = `docs-examples/${example.id}.md`;

					try {
						// STEP 0: Recreate file with fresh input (previous test may have deleted it)
						await createNote(testFilename, example.input);
						await browser.pause(200); // Brief pause for file creation

						// Modal already open from before() hook

						// STEP 1: Select vault scope (default)
						await selectScope('vault');

						// STEP 2: Enter condition
						console.log(`  📋 Condition: ${example.condition || '(none)'}`);
						await enterCondition(example.condition);

						// STEP 3: Enter action(s)
						const actions = Array.isArray(example.actions) ? example.actions : [example.actions];
						console.log(`  ⚡ Action(s): ${actions.join(' | ')}`);
						await enterActions(actions);

						// STEP 4: Click Preview
						console.log(`  👁️  Previewing changes...`);
						await clickPreview();

						// STEP 5: Verify preview shows the file
						const previewFiles = await getPreviewFiles();
						if (!previewFiles.some(f => f.includes(example.id))) {
							await screenshot(`${example.id}-preview-missing`);
							throw new Error(`Preview did not show file ${testFilename}`);
						}

						// STEP 9: Verify preview content matches expected output
						console.log(`  ✅ Verifying preview content...`);
						try {
							await verifyPreviewFile(testFilename, example.output);
						} catch (error) {
							await screenshot(`${example.id}-preview-mismatch`);
							throw error;
						}

						// STEP 10: Apply rule
						console.log(`  🚀 Applying rule...`);
						await clickApply();

						// Wait for apply to complete
						await browser.pause(1500);

						// STEP 11: Read actual file YAML
						console.log(`  📖 Reading applied changes...`);
						const actualYaml = await readFileYaml(testFilename);

						// STEP 12: Assert exact match with expected output
						console.log(`  🔍 Comparing actual vs expected...`);
						try {
							// Use normalized comparison for dates/timestamps
							assertYamlEqualNormalized(actualYaml, example.output, `Output mismatch for ${example.title}`);
							console.log(`  ✅ ${example.title} - PASS\n`);
						} catch (error) {
							// Save outputs for debugging
							const diff = formatYamlDiff(actualYaml, example.output);
							console.error(`\n❌ ${example.title} - FAIL`);
							console.error(diff);

							await screenshot(`${example.id}-output-mismatch`);

							throw error;
						}

					} catch (error) {
						console.error(`\n❌ Test failed for: ${example.title}`);
						console.error(`   Source: ${example.source}:${example.lineNumber}`);
						console.error(`   Error: ${error}`);

						await screenshot(`${example.id}-error`);
						throw error;

					} finally {
						// Clean up: delete test file
						try {
							await deleteNote(testFilename);
						} catch (e) {
							console.warn(`Failed to delete ${testFilename}:`, e);
						}
					}
				});
			}
		});
	}
});
