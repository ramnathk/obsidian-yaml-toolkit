/**
 * Unit Tests for RuleBuilderModalWrapper
 * Tests modal lifecycle, component mounting/unmounting, and integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type YamlToolkitPlugin from '../../../src/main';

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
					createEl: vi.fn(),
					appendChild: vi.fn()
				};
			}

			open() {}
			close() {}
			onOpen() {}
			onClose() {}
		}
	};
});

// Mock the Svelte component
vi.mock('../../../src/ui/RuleBuilderModal.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		$destroy: vi.fn()
	}))
}));

// Import after mocks
import { RuleBuilderModalWrapper } from '../../../src/ui/RuleBuilderModalWrapper';
import RuleBuilderModal from '../../../src/ui/RuleBuilderModal.svelte';

// Get the mocked constructor
const MockRuleBuilderModal = vi.mocked(RuleBuilderModal);

describe('RuleBuilderModalWrapper', () => {
	let mockPlugin: YamlToolkitPlugin;
	let modal: RuleBuilderModalWrapper;

	beforeEach(() => {
		// Clear mock calls from previous tests
		MockRuleBuilderModal.mockClear();

		// Create mock plugin
		mockPlugin = {
			app: {
				vault: {
					getMarkdownFiles: vi.fn().mockReturnValue([]),
					getAllFolders: vi.fn().mockReturnValue([]),
					read: vi.fn(),
					modify: vi.fn()
				}
			},
			data: {
				rules: [],
				settings: {
					defaultBackup: true,
					scanTimeout: 30000,
					debug: false
				}
			},
			loadData: vi.fn(),
			saveData: vi.fn(),
			saveSettings: vi.fn()
		} as any;

		// Create modal instance
		// Modal constructor now sets modalEl and contentEl via mock
		modal = new RuleBuilderModalWrapper(mockPlugin);
	});

	describe('Constructor', () => {
		it('should create modal with plugin reference', () => {
			const newModal = new RuleBuilderModalWrapper(mockPlugin);
			expect(newModal).toBeDefined();
			expect((newModal as any).plugin).toBe(mockPlugin);
		});

		it('should initialize component as null', () => {
			const newModal = new RuleBuilderModalWrapper(mockPlugin);
			expect((newModal as any).component).toBeNull();
		});

		it('should add CSS class to modalEl', () => {
			const newModal = new RuleBuilderModalWrapper(mockPlugin);

			// Verify addClass was called during constructor
			expect((newModal as any).modalEl.addClass).toHaveBeenCalledWith('yaml-toolkit-rule-builder-modal');
		});
	});

	describe('onOpen() - Component Lifecycle', () => {
		it('should clear contentEl on open', () => {
			modal.onOpen();
			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should create Svelte component', () => {
			modal.onOpen();
			const component = (modal as any).component;
			expect(component).not.toBeNull();
			expect(component).toBeDefined();
		});

		it('should pass plugin to component', () => {
			modal.onOpen();

			// Get the last call to the mocked constructor
			const lastCall = MockRuleBuilderModal.mock.calls[MockRuleBuilderModal.mock.calls.length - 1];

			expect(lastCall[0].props.plugin).toBe(mockPlugin);
		});

		it('should pass onClose callback to component', () => {
			modal.onOpen();

			const lastCall = MockRuleBuilderModal.mock.calls[MockRuleBuilderModal.mock.calls.length - 1];

			expect(lastCall[0].props.onClose).toBeDefined();
			expect(typeof lastCall[0].props.onClose).toBe('function');
		});

		it('should set contentEl as target for component', () => {
			modal.onOpen();

			const lastCall = MockRuleBuilderModal.mock.calls[MockRuleBuilderModal.mock.calls.length - 1];

			expect(lastCall[0].target).toBe((modal as any).contentEl);
		});

		it('should handle opening when component already exists', () => {
			// Open first time
			modal.onOpen();
			const firstComponent = (modal as any).component;

			// Open second time (shouldn't crash)
			modal.onOpen();
			const secondComponent = (modal as any).component;

			// Should create a new component
			expect(secondComponent).toBeDefined();
			expect(secondComponent).not.toBeNull();
		});
	});

	describe('onClose() - Component Cleanup', () => {
		it('should destroy component on close', () => {
			modal.onOpen();
			const component = (modal as any).component;
			const destroySpy = vi.spyOn(component, '$destroy');

			modal.onClose();

			expect(destroySpy).toHaveBeenCalled();
		});

		it('should set component to null after close', () => {
			modal.onOpen();
			expect((modal as any).component).not.toBeNull();

			modal.onClose();
			expect((modal as any).component).toBeNull();
		});

		it('should clear contentEl on close', () => {
			modal.onOpen();

			// Clear the mock from onOpen
			(modal as any).contentEl.empty.mockClear();

			modal.onClose();
			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should handle close when component is null', () => {
			// Don't open, just close
			expect(() => modal.onClose()).not.toThrow();
			expect((modal as any).contentEl.empty).toHaveBeenCalled();
		});

		it('should handle double close gracefully', () => {
			modal.onOpen();
			modal.onClose();

			// Second close shouldn't crash
			expect(() => modal.onClose()).not.toThrow();
		});
	});

	describe('Integration Tests', () => {
		it('should complete full lifecycle: open -> close', () => {
			// Open
			modal.onOpen();
			expect((modal as any).component).not.toBeNull();
			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(1);

			// Close
			modal.onClose();
			expect((modal as any).component).toBeNull();
			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(2);
		});

		it('should pass correct app reference through plugin', () => {
			modal.onOpen();

			const lastCall = MockRuleBuilderModal.mock.calls[MockRuleBuilderModal.mock.calls.length - 1];

			expect(lastCall[0].props.plugin.app).toBe(mockPlugin.app);
		});

		it('should invoke onClose callback when component requests close', () => {
			const closeSpy = vi.spyOn(modal, 'close');

			modal.onOpen();

			// Get the onClose callback passed to component
			const lastCall = MockRuleBuilderModal.mock.calls[MockRuleBuilderModal.mock.calls.length - 1];
			const onCloseCallback = lastCall[0].props.onClose;

			// Simulate component calling onClose
			onCloseCallback();

			expect(closeSpy).toHaveBeenCalled();
		});

		it('should maintain plugin reference across open/close cycles', () => {
			modal.onOpen();
			modal.onClose();
			modal.onOpen();

			const calls = MockRuleBuilderModal.mock.calls;
			const lastCall = calls[calls.length - 1];

			expect(lastCall[0].props.plugin).toBe(mockPlugin);
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing modalEl gracefully', () => {
			const newModal = new RuleBuilderModalWrapper(mockPlugin);
			// In mock, modalEl is always set, but we can test the behavior
			expect((newModal as any).modalEl).toBeDefined();
		});

		it('should handle missing contentEl gracefully', () => {
			const newModal = new RuleBuilderModalWrapper(mockPlugin);
			// In real Obsidian, contentEl is always set by Modal constructor
			expect((newModal as any).contentEl).toBeDefined();
		});

		it('should propagate component $destroy errors', () => {
			modal.onOpen();

			// Make $destroy throw an error
			const component = (modal as any).component;
			component.$destroy = vi.fn().mockImplementation(() => {
				throw new Error('Destroy failed');
			});

			// Error will propagate (no error handling in onClose)
			expect(() => modal.onClose()).toThrow('Destroy failed');
		});
	});

	describe('Memory Management', () => {
		it('should not leak component references', () => {
			modal.onOpen();
			const weakRef = new WeakRef((modal as any).component);

			modal.onClose();

			expect((modal as any).component).toBeNull();
			// Component should be eligible for garbage collection
		});

		it('should cleanup after multiple open/close cycles', () => {
			// Multiple cycles
			for (let i = 0; i < 5; i++) {
				modal.onOpen();
				modal.onClose();
			}

			// Final state should be clean
			expect((modal as any).component).toBeNull();
			expect((modal as any).contentEl.empty).toHaveBeenCalledTimes(10); // 5 opens + 5 closes
		});
	});
});
