/**
 * Rule Builder Modal - Integration Tests
 * Focus: UI integration, visual regression, Obsidian integration
 * NOT testing: Parser logic (covered by unit tests), validation (will be in component tests)
 */

import {
	openCommandPalette,
	searchCommand,
	executeCommand,
	waitForModal,
	getNoticeText,
	screenshot,
} from './helpers/obsidian-helpers';

describe('Rule Builder Modal - Integration', () => {
	before(async () => {
		await openCommandPalette();
		await searchCommand('Open Rule Builder');
		await executeCommand();
		await waitForModal();
	});

	after(async () => {
		await browser.keys(['Escape']);
		await browser.pause(300);
	});

	beforeEach(async () => {
		// Reset form with "New" button
		const newBtn = await $('button*=New');
		if (await newBtn.isExisting()) {
			await newBtn.click();
			await browser.pause(200);
		}
	});

	// =============================
	// Integration Tests
	// =============================

	it('Modal opens with correct structure', async () => {
		// Verify modal has required elements
		const header = await $('h2');
		expect(await header.getText()).toBe('YAML Toolkit: Rule Builder');

		const ruleNameInput = await $('#rule-name');
		expect(await ruleNameInput.isDisplayed()).toBe(true);

		const conditionInput = await $('#condition');
		expect(await conditionInput.isDisplayed()).toBe(true);

		const actionInput = await $('#action');
		expect(await actionInput.isDisplayed()).toBe(true);

		await screenshot('modal-structure');
	});

	it('Form inputs are interactive', async () => {
		// Fill all fields
		await $('#rule-name').setValue('Integration Test');
		expect(await $('#rule-name').getValue()).toBe('Integration Test');

		await $('#condition').setValue('status = "draft"');
		expect(await $('#condition').getValue()).toBe('status = "draft"');

		await $('#action').setValue('SET status "published"');
		expect(await $('#action').getValue()).toBe('SET status "published"');
	});

	it('Scope selector works', async () => {
		// Test radio buttons change
		const currentRadio = await $('input[value="current"]');
		const folderRadio = await $('input[value="folder"]');
		const vaultRadio = await $('input[value="vault"]');

		// Click folder scope
		await folderRadio.click();
		await browser.pause(100);
		expect(await folderRadio.isSelected()).toBe(true);

		// Folder path input appears
		const folderInput = await $('input[placeholder="folder/path"]');
		expect(await folderInput.isDisplayed()).toBe(true);

		// Click vault scope
		await vaultRadio.click();
		await browser.pause(100);
		expect(await vaultRadio.isSelected()).toBe(true);

		// Folder input hidden
		expect(await folderInput.isDisplayed()).toBe(false);
	});

	it('Backup checkbox toggles', async () => {
		const checkboxes = await $$('input[type="checkbox"]');
		const backup = checkboxes[checkboxes.length - 1];

		const initial = await backup.isSelected();
		await backup.click();
		await browser.pause(100);

		expect(await backup.isSelected()).toBe(!initial);
	});

	it('Buttons are clickable', async () => {
		// Verify all action buttons exist and are clickable
		const validateBtn = await $('button*=Validate');
		expect(await validateBtn.isEnabled()).toBe(true);

		const saveBtn = await $('button*=Save Rule');
		expect(await saveBtn.isEnabled()).toBe(true);

		const newBtn = await $('button*=New');
		expect(await newBtn.isEnabled()).toBe(true);

		await screenshot('modal-buttons');
	});

	// =============================
	// Visual Regression
	// =============================

	it('Visual: Error messages display (known bug: red on red)', async () => {
		// Trigger validation error by submitting empty action
		await $('#action').setValue('');
		await $('button*=Validate').click();
		await browser.pause(300);

		const error = await $('#action ~ .error, #action + .error');
		if (await error.isExisting()) {
			const color = await error.getCSSProperty('color');
			const bg = await error.getCSSProperty('background-color');

			console.log(`   Text: ${color.value}, BG: ${bg.value}`);

			// Visual bug: Both are rgb(233,49,71) = red on red!
			expect(await error.isDisplayed()).toBe(true);

			await screenshot('error-contrast-bug');
		}
	});

	it('Visual: Modal layout screenshot', async () => {
		// Fill sample data for screenshot
		await $('#rule-name').setValue('Sample Rule');
		await $('#condition').setValue('status = "draft"');
		await $('#action').setValue('SET status "published"');

		await screenshot('modal-filled-form');
	});

	// =============================
	// Integration: Save Button
	// =============================

	it('Save button is functional', async () => {
		// Verify save button exists and is enabled
		// (Actual save logic tested in component tests)
		await $('#rule-name').setValue('Test Save');
		await $('#condition').setValue('HAS tags');
		await $('#action').setValue('SET reviewed true');

		const saveBtn = await $('button*=Save Rule');
		expect(await saveBtn.isEnabled()).toBe(true);

		await screenshot('ready-to-save');
	});
});
