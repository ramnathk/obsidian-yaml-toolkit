/**
 * Tests for FolderAutocomplete Component
 * Tests folder listing, filtering, keyboard navigation, and selection
 */

import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import { tick } from 'svelte';
import FolderAutocomplete from '../../../src/ui/components/FolderAutocomplete.svelte';

// Mock Obsidian App with vault API
const createMockApp = (folders: string[] = []) => ({
	vault: {
		getAllFolders: vi.fn(() => folders.map(path => ({ path })))
	}
});

describe('FolderAutocomplete Component', () => {
	describe('TC-1.1: Component Rendering', () => {
		it('should render input field with placeholder', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: []
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('type', 'text');
			expect(input).toHaveAttribute('autocomplete', 'off');
		});

		it('should render with initial value', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: 'Projects/Work',
					placeholder: 'Enter folder path...',
					testFolders: []
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;
			expect(input.value).toBe('Projects/Work');
		});
	});

	describe('TC-2.1: Folder Filtering', () => {
		it('should filter folders based on input', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal', 'Notes/Daily', 'Archive']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "proj" to filter
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Should show Projects folders
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			expect(screen.getByText('Projects/Personal')).toBeInTheDocument();

			// Should not show non-matching folders
			expect(screen.queryByText('Notes/Daily')).not.toBeInTheDocument();
			expect(screen.queryByText('Archive')).not.toBeInTheDocument();
		});

		it('should perform case-insensitive filtering', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Notes/Daily']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "WORK" in uppercase
			await fireEvent.input(input, { target: { value: 'WORK' } });

			// Should match case-insensitively
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();
		});

		it('should show root folder in suggestions', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "/" to show root
			await fireEvent.input(input, { target: { value: '/' } });

			// Should show root folder
			expect(screen.getByText('/')).toBeInTheDocument();
		});

		it('should hide suggestions when no matches found', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects', 'Notes']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type something that doesn't match
			await fireEvent.input(input, { target: { value: 'xyz123notfound' } });

			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-3.1: Mouse Selection', () => {
		it('should select folder on click', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Notes/Daily']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Click on suggestion
			const suggestion = screen.getByText('Projects/Work');
			await fireEvent.mouseDown(suggestion);

			// Value should be updated
			expect(input.value).toBe('Projects/Work');
		});

		it('should hide suggestions after selection', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();

			// Click on suggestion
			const suggestion = screen.getByText('Projects/Work');
			await fireEvent.mouseDown(suggestion);

			// Suggestions should be hidden
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-4.1: Keyboard Navigation', () => {
		it('should navigate with arrow keys and select with Enter', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Navigate down
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// First item should be selected
			let selectedItem = container.querySelector('.suggestion-item.selected');
			expect(selectedItem?.textContent).toContain('Projects/Work');

			// Navigate down again
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// Second item should be selected
			selectedItem = container.querySelector('.suggestion-item.selected');
			expect(selectedItem?.textContent).toContain('Projects/Personal');

			// Press Enter to select
			await fireEvent.keyDown(input, { key: 'Enter' });

			// Value should be updated
			expect(input.value).toBe('Projects/Personal');
		});

		it('should close suggestions with Escape key', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();

			// Press Escape
			await fireEvent.keyDown(input, { key: 'Escape' });

			// Suggestions should be hidden
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-5.1: Accessibility', () => {
		it('should have proper ARIA roles and tabindex', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Check ARIA role and tabindex
			const suggestionItem = container.querySelector('.suggestion-item');
			expect(suggestionItem).toHaveAttribute('role', 'button');
			expect(suggestionItem).toHaveAttribute('tabindex', '0');
		});
	});

	describe('Branch Coverage Tests (lines 24, 53-105, 118)', () => {
		it('should use testFolders when provided (line 24 - first branch)', async () => {
			const mockApp = createMockApp();
			const customFolders = ['Custom/Path', 'Another/Path'];

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: customFolders
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'custom' } });

			// Should show custom folders, not vault folders
			expect(screen.getByText('Custom/Path')).toBeInTheDocument();
		});

		it('should use app.vault.getAllFolders when testFolders is null (line 24 - second branch)', async () => {
			// Create mock app WITH vault folders
			const mockApp = createMockApp(['Projects/Work', 'Projects/Personal']);

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: null  // null means use app.vault
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Should use vault folders (from mockApp.vault.getAllFolders)
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();
		});

		it('should handle missing app.vault gracefully (line 24 - fallback)', () => {
			const appWithoutVault = {};

			render(FolderAutocomplete, {
				props: {
					app: appWithoutVault,
					value: '',
					testFolders: null
				}
			});

			// Should not crash, default to ['/']
			expect(screen.getByPlaceholderText('Enter folder path...')).toBeInTheDocument();
		});

		it('should not show suggestions when showSuggestions is false (line 53 guard)', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Initially showSuggestions = false
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// Keyboard navigation should not work (guard clause prevents it)
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});

		it('should not process keys when filteredFolders is empty (line 53 guard)', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type something that matches nothing
			await fireEvent.input(input, { target: { value: 'zzz-no-match' } });

			// Try keyboard navigation
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// Nothing should happen (no suggestions to navigate)
			expect(input.value).toBe('zzz-no-match');
		});

		it('should handle ArrowDown at end of list (line 58 - Math.min)', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Folder1', 'Folder2']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'folder' } });

			// Press ArrowDown multiple times (more than items available)
			await fireEvent.keyDown(input, { key: 'ArrowDown' });
			await fireEvent.keyDown(input, { key: 'ArrowDown' });
			await fireEvent.keyDown(input, { key: 'ArrowDown' }); // Should stay at last item

			// Should not go beyond last index
			expect(screen.getAllByRole('button')[1].className).toContain('selected');
		});

		it('should handle ArrowUp at start of list (line 62 - Math.max)', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Folder1', 'Folder2']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'folder' } });

			// Press ArrowUp (should stay at -1, not go negative)
			await fireEvent.keyDown(input, { key: 'ArrowUp' });

			// Should not select any item (selectedIndex = -1)
			const items = screen.getAllByRole('button');
			items.forEach(item => {
				expect(item.className).not.toContain('selected');
			});
		});

		it('should select folder on Enter when index is valid (line 66 condition)', async () => {
			const mockApp = createMockApp();
			const handleChange = vi.fn();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Navigate down to select first item
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// Press Enter to select
			await fireEvent.keyDown(input, { key: 'Enter' });

			// Should select the folder
			expect(input.value).toBe('Projects/Work');
		});

		it('should not select on Enter when selectedIndex is -1 (line 66 guard)', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Don't navigate, just press Enter
			await fireEvent.keyDown(input, { key: 'Enter' });

			// Should not select anything (selectedIndex = -1)
			expect(input.value).toBe('proj');
		});

		it('should hide suggestions on Escape (line 71-72)', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Suggestions should be visible
			expect(screen.getByText('Projects')).toBeInTheDocument();

			// Press Escape
			await fireEvent.keyDown(input, { key: 'Escape' });

			// Suggestions should be hidden
			await waitFor(() => {
				const dropdown = container.querySelector('.suggestions-dropdown');
				expect(dropdown).not.toBeInTheDocument();
			});
		});

		it('should not show suggestions when filteredFolders is empty (line 105 condition)', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type something that doesn't match
			await fireEvent.input(input, { target: { value: 'zzz-no-match' } });

			// Dropdown should not appear (filteredFolders.length === 0)
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});

		it('should handle mouseenter to update selectedIndex (line 114)', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					testFolders: ['Folder1', 'Folder2', 'Folder3']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			await fireEvent.input(input, { target: { value: 'folder' } });

			// Get all suggestion items
			const items = screen.getAllByRole('button');

			// Hover over second item
			await fireEvent.mouseEnter(items[1]);

			// Second item should have selected class
			expect(items[1].className).toContain('selected');
		});
	});
});
