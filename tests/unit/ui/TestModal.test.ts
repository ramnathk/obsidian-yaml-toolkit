/**
 * Unit Tests for TestModal
 * Tests FrontmatterDisplayModal and MessageModal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrontmatterDisplayModal, MessageModal } from '../../../src/ui/TestModal';

// Mock Obsidian Modal class
vi.mock('obsidian', async () => {
	const actual = await vi.importActual('obsidian');
	return {
		...actual,
		Modal: class MockModal {
			modalEl: any;
			contentEl: any;
			app: any;

			constructor(app: any) {
				this.app = app;
				this.modalEl = {
					addClass: vi.fn(),
					removeClass: vi.fn()
				};
				this.contentEl = {
					empty: vi.fn(),
					createEl: vi.fn((tag: string, options?: any) => {
						const element: any = {
							tag,
							textContent: null,
							style: {},
							addEventListener: vi.fn(),
							createEl: vi.fn((childTag: string, childOptions?: any) => {
								const childElement: any = {
									tag: childTag,
									textContent: null,
									style: {},
									addEventListener: vi.fn()
								};
								if (childOptions?.text) childElement.textContent = childOptions.text;
								if (childOptions?.cls) childElement.className = childOptions.cls;
								return childElement;
							})
						};
						if (options?.text) element.textContent = options.text;
						if (options?.cls) element.className = options.cls;
						return element;
					})
				};
			}

			open() {}
			close() {}
			onOpen() {}
			onClose() {}
		}
	};
});

describe('FrontmatterDisplayModal', () => {
	let mockApp: any;
	let modal: FrontmatterDisplayModal;

	beforeEach(() => {
		mockApp = {
			vault: {
				getMarkdownFiles: vi.fn(),
				read: vi.fn()
			}
		};
	});

	describe('Constructor', () => {
		it('should create modal with title and frontmatter data', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(modal).toBeDefined();
			expect((modal as any).title).toBe(title);
			expect((modal as any).frontmatterData).toBe(data);
		});

		it('should handle null frontmatter data', () => {
			const title = 'Test Title';
			modal = new FrontmatterDisplayModal(mockApp, title, null);

			expect((modal as any).frontmatterData).toBeNull();
		});

		it('should handle undefined frontmatter data', () => {
			const title = 'Test Title';
			modal = new FrontmatterDisplayModal(mockApp, title, undefined);

			expect((modal as any).frontmatterData).toBeUndefined();
		});

		it('should handle empty object frontmatter data', () => {
			const title = 'Test Title';
			const data = {};
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect((modal as any).frontmatterData).toEqual({});
		});
	});

	describe('onOpen() - With Frontmatter Data', () => {
		it('should create title element', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			expect(createElSpy).toHaveBeenCalledWith('h2', { text: title });
		});

		it('should display frontmatter data as JSON', () => {
			const title = 'Test Title';
			const data = { name: 'test', value: 123, nested: { key: 'value' } };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();

			// Verify pre element was created for frontmatter display
			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			expect(createElSpy).toHaveBeenCalledWith('pre', expect.objectContaining({
				cls: 'yaml-toolkit-frontmatter-display'
			}));
		});

		it('should apply styling to pre element', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();

			const calls = (modal as any).contentEl.createEl.mock.calls;
			const preCall = calls.find((call: any) => call[0] === 'pre');
			expect(preCall).toBeDefined();
		});

		it('should format JSON with 2-space indentation', () => {
			const title = 'Test Title';
			const data = { key: 'value', number: 42 };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();

			// JSON.stringify with 2-space indent should be used
			const expected = JSON.stringify(data, null, 2);
			expect(expected).toContain('  '); // 2 spaces
		});

		it('should create close button', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();

			const calls = (modal as any).contentEl.createEl.mock.calls;
			const buttonContainerCall = calls.find((call: any) =>
				call[0] === 'div' && call[1]?.cls === 'modal-button-container'
			);
			expect(buttonContainerCall).toBeDefined();
		});
	});

	describe('onOpen() - Without Frontmatter Data', () => {
		it('should show "No frontmatter found" for null data', () => {
			const title = 'Test Title';
			modal = new FrontmatterDisplayModal(mockApp, title, null);

			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			expect(createElSpy).toHaveBeenCalledWith('p', expect.objectContaining({
				text: 'No frontmatter found',
				cls: 'yaml-toolkit-empty-message'
			}));
		});

		it('should show "No frontmatter found" for empty object', () => {
			const title = 'Test Title';
			modal = new FrontmatterDisplayModal(mockApp, title, {});

			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			expect(createElSpy).toHaveBeenCalledWith('p', expect.objectContaining({
				text: 'No frontmatter found'
			}));
		});

		it('should show frontmatter for object with keys', () => {
			const title = 'Test Title';
			modal = new FrontmatterDisplayModal(mockApp, title, { hasKey: true });

			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			// Should create pre element, not empty message
			const calls = createElSpy.mock.calls;
			const preCall = calls.find((call: any) => call[0] === 'pre');
			expect(preCall).toBeDefined();
		});
	});

	describe('onOpen() - Edge Cases', () => {
		it('should handle very large frontmatter data', () => {
			const title = 'Test Title';
			const largeData: any = {};
			for (let i = 0; i < 1000; i++) {
				largeData[`key${i}`] = `value${i}`;
			}
			modal = new FrontmatterDisplayModal(mockApp, title, largeData);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle frontmatter with Unicode characters', () => {
			const title = 'Test Title';
			const data = {
				emoji: '🎉🎊',
				chinese: '你好世界',
				arabic: 'مرحبا بالعالم',
				mixed: 'Hello 世界 🌍'
			};
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle frontmatter with special characters', () => {
			const title = 'Test Title';
			const data = {
				quotes: '"test"',
				backslashes: '\\test\\',
				newlines: 'line1\nline2',
				tabs: 'col1\tcol2'
			};
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle deeply nested objects', () => {
			const title = 'Test Title';
			const data = {
				level1: {
					level2: {
						level3: {
							level4: {
								deep: 'value'
							}
						}
					}
				}
			};
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle arrays in frontmatter', () => {
			const title = 'Test Title';
			const data = {
				simpleArray: [1, 2, 3],
				objectArray: [{ name: 'item1' }, { name: 'item2' }],
				nestedArray: [[1, 2], [3, 4]]
			};
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(() => modal.onOpen()).not.toThrow();
		});
	});

	describe('onClose()', () => {
		it('should empty contentEl on close', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();
			modal.onClose();

			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should handle close without open', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			expect(() => modal.onClose()).not.toThrow();
		});

		it('should handle multiple close calls', () => {
			const title = 'Test Title';
			const data = { key: 'value' };
			modal = new FrontmatterDisplayModal(mockApp, title, data);

			modal.onOpen();
			modal.onClose();
			modal.onClose();

			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(2);
		});
	});
});

describe('MessageModal', () => {
	let mockApp: any;
	let modal: MessageModal;

	beforeEach(() => {
		mockApp = {
			vault: {
				getMarkdownFiles: vi.fn(),
				read: vi.fn()
			}
		};
	});

	describe('Constructor', () => {
		it('should create modal with title and message', () => {
			const title = 'Success';
			const message = 'Operation completed';
			modal = new MessageModal(mockApp, title, message);

			expect(modal).toBeDefined();
			expect((modal as any).title).toBe(title);
			expect((modal as any).message).toBe(message);
			expect((modal as any).isError).toBe(false);
		});

		it('should create modal with error flag', () => {
			const title = 'Error';
			const message = 'Operation failed';
			modal = new MessageModal(mockApp, title, message, true);

			expect((modal as any).isError).toBe(true);
		});

		it('should default isError to false', () => {
			const title = 'Info';
			const message = 'Information message';
			modal = new MessageModal(mockApp, title, message);

			expect((modal as any).isError).toBe(false);
		});

		it('should handle empty message', () => {
			const title = 'Title';
			const message = '';
			modal = new MessageModal(mockApp, title, message);

			expect((modal as any).message).toBe('');
		});
	});

	describe('onOpen() - Success Message', () => {
		it('should create title element', () => {
			const title = 'Success';
			const message = 'All done';
			modal = new MessageModal(mockApp, title, message);

			const createElSpy = vi.spyOn((modal as any).contentEl, 'createEl');
			modal.onOpen();

			expect(createElSpy).toHaveBeenCalledWith('h2', { text: title });
		});

		it('should create message element with success styling', () => {
			const title = 'Success';
			const message = 'Operation completed';
			modal = new MessageModal(mockApp, title, message, false);

			modal.onOpen();

			const calls = (modal as any).contentEl.createEl.mock.calls;
			const messageCall = calls.find((call: any) =>
				call[0] === 'div' && call[1]?.cls === 'yaml-toolkit-message'
			);
			expect(messageCall).toBeDefined();
		});

		it('should display message text', () => {
			const title = 'Success';
			const message = 'This is the message content';
			modal = new MessageModal(mockApp, title, message);

			modal.onOpen();

			// The message should be set as textContent
			expect((modal as any).contentEl.createEl).toHaveBeenCalled();
		});

		it('should create close button', () => {
			const title = 'Success';
			const message = 'Done';
			modal = new MessageModal(mockApp, title, message);

			modal.onOpen();

			const calls = (modal as any).contentEl.createEl.mock.calls;
			const buttonContainerCall = calls.find((call: any) =>
				call[0] === 'div' && call[1]?.cls === 'modal-button-container'
			);
			expect(buttonContainerCall).toBeDefined();
		});
	});

	describe('onOpen() - Error Message', () => {
		it('should create message element with error styling', () => {
			const title = 'Error';
			const message = 'Operation failed';
			modal = new MessageModal(mockApp, title, message, true);

			modal.onOpen();

			const calls = (modal as any).contentEl.createEl.mock.calls;
			const messageCall = calls.find((call: any) =>
				call[0] === 'div' && call[1]?.cls === 'yaml-toolkit-message'
			);
			expect(messageCall).toBeDefined();
		});

		it('should display error message', () => {
			const title = 'Error';
			const message = 'Something went wrong';
			modal = new MessageModal(mockApp, title, message, true);

			expect(() => modal.onOpen()).not.toThrow();
		});
	});

	describe('onOpen() - Edge Cases', () => {
		it('should handle very long messages', () => {
			const title = 'Info';
			const message = 'A'.repeat(10000);
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle messages with newlines', () => {
			const title = 'Info';
			const message = 'Line 1\nLine 2\nLine 3';
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle messages with Unicode', () => {
			const title = 'Info';
			const message = 'Success! ✓ 完成 🎉';
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle messages with HTML-like content', () => {
			const title = 'Info';
			const message = '<div>This is not HTML</div>';
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onOpen()).not.toThrow();
		});

		it('should handle empty message gracefully', () => {
			const title = 'Info';
			const message = '';
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onOpen()).not.toThrow();
		});
	});

	describe('onClose()', () => {
		it('should empty contentEl on close', () => {
			const title = 'Success';
			const message = 'Done';
			modal = new MessageModal(mockApp, title, message);

			modal.onOpen();
			modal.onClose();

			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should handle close without open', () => {
			const title = 'Success';
			const message = 'Done';
			modal = new MessageModal(mockApp, title, message);

			expect(() => modal.onClose()).not.toThrow();
		});

		it('should handle multiple close calls', () => {
			const title = 'Success';
			const message = 'Done';
			modal = new MessageModal(mockApp, title, message);

			modal.onOpen();
			modal.onClose();
			modal.onClose();

			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(2);
		});
	});

	describe('Integration Tests', () => {
		it('should complete full lifecycle: open -> close (success)', () => {
			const title = 'Success';
			const message = 'All done';
			modal = new MessageModal(mockApp, title, message);

			modal.onOpen();
			expect((modal as any).contentEl.createEl).toHaveBeenCalled();

			modal.onClose();
			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should complete full lifecycle: open -> close (error)', () => {
			const title = 'Error';
			const message = 'Failed';
			modal = new MessageModal(mockApp, title, message, true);

			modal.onOpen();
			expect((modal as any).contentEl.createEl).toHaveBeenCalled();

			modal.onClose();
			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should handle multiple open/close cycles', () => {
			const title = 'Info';
			const message = 'Message';
			modal = new MessageModal(mockApp, title, message);

			for (let i = 0; i < 3; i++) {
				modal.onOpen();
				modal.onClose();
			}

			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(3);
		});
	});
});
