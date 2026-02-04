/**
 * Debug test for MOVE TO bug in E2E
 * Isolates MOVE TO START operation
 */

import {
  createNote,
  readFileYaml,
  deleteNote,
  openYamlToolkit,
  closeYamlToolkit,
  screenshot
} from '../helpers/obsidian-ui';

import {
  enterCondition,
  enterActions,
  clickPreview,
  clickApply,
  clearRuleBuilder,
  verifyPreviewFile
} from '../helpers/rule-builder';

import {
  assertYamlEqualNormalized,
  formatYamlDiff
} from '../helpers/yaml-assertions';

describe('MOVE TO Debug - Isolated Test', function() {
  this.timeout(120000);

  before(async function() {
    this.timeout(30000);
    console.log('\n🐛 MOVE TO Debug Suite\n');
    
    // Wait for vault
    await browser.pause(3000);
    
    try {
      await browser.execute(() => {
        const app = (window as any).app;
        if (!app?.vault?.getMarkdownFiles) {
          throw new Error('Vault not ready');
        }
      });
      console.log('✅ Vault ready\n');
    } catch (e) {
      console.error('❌ Vault not ready:', e);
      throw e;
    }
  });

  it('should move high-priority books to START', async function() {
    const testData = {
      title: 'My Reading List',
      books: [
        { title: 'Casual Read', priority: 'normal' },
        { title: 'Important Research', priority: 'high' },
        { title: 'Quick Reference', priority: 'low' },
        { title: 'Critical Paper', priority: 'high' }
      ]
    };

    const expectedOutput = {
      title: 'My Reading List',
      books: [
        { title: 'Important Research', priority: 'high' },
        { title: 'Critical Paper', priority: 'high' },
        { title: 'Casual Read', priority: 'normal' },
        { title: 'Quick Reference', priority: 'low' }
      ]
    };

    try {
      const testFile = 'move-to-debug-test.md';

      // Create test file
      console.log(`📝 Creating test file: ${testFile}`);
      await createNote(testFile, testData);

      // Open rule builder
      console.log('🔨 Opening rule builder...');
      await openYamlToolkit();

      // Enter condition
      console.log('📝 Entering condition: HAS books');
      await enterCondition('HAS books');

      // Enter action
      console.log('📝 Entering action: FOR books WHERE priority = "high" MOVE TO START');
      await enterActions(['FOR books WHERE priority = "high" MOVE TO START']);

      // Preview
      console.log('👁️ Clicking preview...');
      await clickPreview();

      // Wait for preview to render
      await browser.pause(2000);

      console.log('✅ Verifying preview output...');
      try {
        await verifyPreviewFile(testFile, expectedOutput);
        console.log('✅ Preview matches expected output!');
      } catch (previewError) {
        console.error('❌ Preview mismatch:', previewError);
        await screenshot('move-to-preview-mismatch');
        throw previewError;
      }

      // Apply
      console.log('🚀 Applying rule...');
      await clickApply();

      // Wait for apply
      await browser.pause(1500);

      // Read actual result
      console.log('📖 Reading actual file after apply...');
      const actualYaml = await readFileYaml(testFile);

      console.log('📊 Comparing results...');
      console.log('Expected books order:', expectedOutput.books.map((b: any) => b.title));
      console.log('Actual books order:', actualYaml.books?.map((b: any) => b.title));

      try {
        assertYamlEqualNormalized(actualYaml, expectedOutput, 'MOVE TO output mismatch');
        console.log('✅ MOVE TO test PASSED!\n');
      } catch (matchError) {
        console.error('❌ Output mismatch:');
        console.error(formatYamlDiff(actualYaml, expectedOutput));
        await screenshot('move-to-output-mismatch');
        throw matchError;
      }

    } finally {
      // Cleanup
      try {
        await deleteNote('move-to-debug-test.md');
        await closeYamlToolkit();
      } catch (e) {
        console.warn('Cleanup failed:', e);
      }
    }
  });
});
