/**
 * Tests for PreviewTab Component
 * Tests file preview display, summary statistics, and expand/collapse
 */

import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import PreviewTab from '../../../src/ui/components/PreviewTab.svelte';
import type { FileResult } from '../../../src/types';

describe('PreviewTab Component', () => {
	describe('TC-1.1: Loading State', () => {
		it('should show loading indicator when isLoading is true', () => {
			const { container } = render(PreviewTab, {
				props: {
					results: [],
					isLoading: true,
					error: null
				}
			});

			expect(screen.getByText(/Scanning files and previewing changes/i)).toBeInTheDocument();
			const spinner = container.querySelector('.spinner');
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass('spinner');
		});
	});

	describe('TC-1.2: Error State', () => {
		it('should show error message when error is provided', () => {
			render(PreviewTab, {
				props: {
					results: [],
					isLoading: false,
					error: 'Failed to scan files: Permission denied'
				}
			});

			expect(screen.getByText(/Preview Failed/i)).toBeInTheDocument();
			expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
		});
	});

	describe('TC-4.3: Empty State', () => {
		it('should show empty state when no results', () => {
			render(PreviewTab, {
				props: {
					results: [],
					isLoading: false,
					error: null
				}
			});

			expect(screen.getByText(/No markdown files found/i)).toBeInTheDocument();
			expect(screen.getByText(/Try selecting a different folder/i)).toBeInTheDocument();
		});
	});

	describe('TC-1.1: Summary Statistics', () => {
		it('should display summary statistics correctly', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Set status to "published"'],
					originalData: { status: 'draft' },
					newData: { status: 'published' },
					duration: 10
				},
				{
					file: { path: 'file2.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Set priority to 5'],
					originalData: { priority: 3 },
					newData: { priority: 5 },
					duration: 8
				},
				{
					file: { path: 'file3.md' } as any,
					status: 'skipped',
					modified: false,
					changes: [],
					duration: 2
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Check summary
			expect(screen.getByText(/2 matched/i)).toBeInTheDocument();
			expect(screen.getByText(/1 skipped/i)).toBeInTheDocument();
		});

		it('should show warning count in summary', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'warning',
					modified: false,
					changes: [],
					warning: 'Condition matched but no changes needed',
					duration: 5
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			expect(screen.getByText(/1 warning/i)).toBeInTheDocument();
		});

		it('should show error count in summary', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'error',
					modified: false,
					changes: [],
					error: 'Parse error: Invalid YAML',
					duration: 3
				},
				{
					file: { path: 'file2.md' } as any,
					status: 'error',
					modified: false,
					changes: [],
					error: 'Missing field',
					duration: 2
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			expect(screen.getByText(/2 errors/i)).toBeInTheDocument();
		});

		it('should pluralize summary counts correctly', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'warning',
					modified: false,
					changes: [],
					warning: 'Warning 1',
					duration: 1
				},
				{
					file: { path: 'file2.md' } as any,
					status: 'warning',
					modified: false,
					changes: [],
					warning: 'Warning 2',
					duration: 1
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should say "warnings" not "warning"
			expect(screen.getByText(/2 warnings/i)).toBeInTheDocument();
		});
	});

	describe('TC-1.1: File List Display', () => {
		it('should display file results with status icons', () => {
			const results: FileResult[] = [
				{
					file: { path: 'success.md', basename: 'success', name: 'success.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Changed field'],
					originalData: {},
					newData: {},
					duration: 5
				},
				{
					file: { path: 'skipped.md', basename: 'skipped', name: 'skipped.md' } as any,
					status: 'skipped',
					modified: false,
					changes: [],
					duration: 1
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Check files are listed
			expect(screen.getByText(/success\.md/i)).toBeInTheDocument();
			expect(screen.getByText(/skipped\.md/i)).toBeInTheDocument();

			// Check status indicators
			const successElements = screen.getAllByText('✓');
			expect(successElements.length).toBeGreaterThan(0);

			const skippedElements = screen.getAllByText('○');
			expect(skippedElements.length).toBeGreaterThan(0);
		});

		it('should show changes list for modified files', async () => {
			const results: FileResult[] = [
				{
					file: { path: 'file.md', basename: 'file', name: 'file.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Set status to "published"', 'Set priority to 5'],
					originalData: { status: 'draft', priority: 3 },
					newData: { status: 'published', priority: 5 },
					duration: 10
				}
			];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Click to expand file details
			const fileHeader = container.querySelector('.file-header');
			await fireEvent.click(fileHeader as Element);

			// Now changes should be visible
			expect(screen.getByText(/Set status to "published"/i)).toBeInTheDocument();
			expect(screen.getByText(/Set priority to 5/i)).toBeInTheDocument();
		});
	});

	describe('TC-1.1: Expand/Collapse Functionality', () => {
		it('should expand file details when clicked', async () => {
			const results: FileResult[] = [
				{
					file: { path: 'file.md', basename: 'file', name: 'file.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Changed field'],
					originalData: { status: 'draft' },
					newData: { status: 'published' },
					duration: 10
				}
			];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Find the file header button (clickable element)
			const fileHeader = container.querySelector('.file-header');
			expect(fileHeader).toBeTruthy();

			// Initially file details should not be visible
			let fileDetails = container.querySelector('.file-details');
			expect(fileDetails).toBeFalsy();

			// Click to expand
			await fireEvent.click(fileHeader as Element);

			// Now file details should be visible
			fileDetails = container.querySelector('.file-details');
			expect(fileDetails).toBeTruthy();

			// Click again to collapse
			await fireEvent.click(fileHeader as Element);

			// File details should be hidden again
			fileDetails = container.querySelector('.file-details');
			expect(fileDetails).toBeFalsy();
		});
	});

	describe('Status Icon Mapping', () => {
		it('should show correct icon for each status type', () => {
			const results: FileResult[] = [
				{
					file: { path: 'success.md', basename: 'success', name: 'success.md' } as any,
					status: 'success',
					modified: true,
					changes: [],
					duration: 1
				},
				{
					file: { path: 'warning.md', basename: 'warning', name: 'warning.md' } as any,
					status: 'warning',
					modified: false,
					changes: [],
					warning: 'Some warning',
					duration: 1
				},
				{
					file: { path: 'error.md', basename: 'error', name: 'error.md' } as any,
					status: 'error',
					modified: false,
					changes: [],
					error: 'Some error',
					duration: 1
				},
				{
					file: { path: 'skipped.md', basename: 'skipped', name: 'skipped.md' } as any,
					status: 'skipped',
					modified: false,
					changes: [],
					duration: 1
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Check all icons are present
			expect(screen.getAllByText('✓').length).toBeGreaterThan(0); // success
			expect(screen.getAllByText('⚠').length).toBeGreaterThan(0); // warning
			expect(screen.getAllByText('✗').length).toBeGreaterThan(0); // error
			expect(screen.getAllByText('○').length).toBeGreaterThan(0); // skipped
		});
	});

	// ========================================================================
	// LARGE DATASETS (2 tests) - Performance and scalability
	// ========================================================================

	describe('Large Datasets', () => {
		it('should render 100 file results without crashing', () => {
			const results: FileResult[] = Array.from({ length: 100 }, (_, i) => ({
				file: { path: `file${i}.md`, basename: `file${i}`, name: `file${i}.md` } as any,
				status: 'success',
				modified: true,
				changes: [`Change ${i}`],
				originalData: { field: `old${i}` },
				newData: { field: `new${i}` },
				duration: Math.floor(Math.random() * 50) + 1
			}));

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should render preview files container
			expect(container.querySelector('.preview-files')).toBeInTheDocument();
			// Summary should show 100 matched
			expect(screen.getByText(/100 matched/i)).toBeInTheDocument();
		});

		it('should handle single file with 50+ changes', () => {
			const manyChanges = Array.from({ length: 50 }, (_, i) => `Changed field${i}`);
			const results: FileResult[] = [{
				file: { path: 'big-file.md' } as any,
				status: 'success',
				modified: true,
				changes: manyChanges,
				originalData: { field1: 'old' },
				newData: { field1: 'new' },
				duration: 100
			}];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should show file
			expect(screen.getByText(/big-file\.md/i)).toBeInTheDocument();
			// Should render without crashing (changes displayed when file expanded)
			expect(container.querySelector('.file-item')).toBeInTheDocument();
		});
	});

	// ========================================================================
	// EDGE CASES (5 tests) - Handling unusual data
	// ========================================================================

	describe('Edge Cases', () => {
		it('should handle undefined status as unknown', () => {
			const results: FileResult[] = [{
				file: { path: 'file.md' } as any,
				status: undefined as any,
				modified: false,
				changes: [],
				duration: 5
			}];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should render without crashing - shows "?" icon for unknown status
			expect(screen.getByText(/file\.md/i)).toBeInTheDocument();
			const text = container.textContent || '';
			expect(text).toContain('?');
		});

		it('should render file with no modifications without crashing', () => {
			const results: FileResult[] = [{
				file: { path: 'file.md' } as any,
				status: 'success',
				modified: false,
				changes: [],
				duration: 5
			}];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should render file without crashing
			expect(screen.getByText(/file\.md/i)).toBeInTheDocument();
			// File should be clickable
			const fileHeader = screen.getByText(/file\.md/i).closest('button');
			expect(fileHeader).toBeInTheDocument();
		});

		it('should render very long file paths', () => {
			const longPath = 'very/long/path/that/goes/on/and/on/and/should/be/truncated/or/wrapped/file.md';
			const results: FileResult[] = [{
				file: { path: longPath } as any,
				status: 'success',
				modified: true,
				changes: ['Change'],
				duration: 10
			}];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should render the full path (may be wrapped in UI)
			expect(screen.getByText(longPath)).toBeInTheDocument();
		});

		it('should handle unicode filenames correctly', () => {
			const results: FileResult[] = [{
				file: { path: '文档/测试文件.md' } as any,
				status: 'success',
				modified: true,
				changes: ['Change'],
				duration: 10
			}];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			expect(screen.getByText('文档/测试文件.md')).toBeInTheDocument();
		});

		it('should render when originalData or newData missing', () => {
			const results: FileResult[] = [{
				file: { path: 'file.md' } as any,
				status: 'success',
				modified: true,
				changes: ['Change'],
				originalData: undefined,
				newData: { field: 'value' },
				duration: 10
			}];

			expect(() => {
				render(PreviewTab, {
					props: {
						results,
						isLoading: false,
						error: null
					}
				});
			}).not.toThrow();

			// Should render file
			expect(screen.getByText(/file\.md/i)).toBeInTheDocument();
		});
	});

	// ========================================================================
	// SUMMARY EDGE CASES (5 tests) - Summary calculation edge cases
	// ========================================================================

	describe('Summary Edge Cases', () => {
		it('should use singular "warning" for 1 warning', () => {
			const results: FileResult[] = [{
				file: { path: 'file.md' } as any,
				status: 'warning',
				modified: false,
				changes: [],
				warning: 'Warning message',
				duration: 5
			}];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should be "1 warning" not "1 warnings"
			const text = container.textContent || '';
			expect(text).toMatch(/1 warning(?!s)/i);
		});

		it('should show empty state for 0 files', () => {
			render(PreviewTab, {
				props: {
					results: [],
					isLoading: false,
					error: null
				}
			});

			// Should show empty state message
			expect(screen.getByText(/no markdown files found/i)).toBeInTheDocument();
		});

		it('should show only skipped count when all skipped', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'skipped',
					modified: false,
					changes: [],
					duration: 2
				},
				{
					file: { path: 'file2.md' } as any,
					status: 'skipped',
					modified: false,
					changes: [],
					duration: 3
				}
			];

			const { container } = render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should show 2 skipped (no "matched" text when success count is 0)
			expect(screen.getByText(/2 skipped/i)).toBeInTheDocument();
			// Should NOT show "0 matched" or "matched" (only shows when success > 0)
			const text = container.textContent || '';
			expect(text).not.toMatch(/\d+ matched/i);
		});

		it('should show error count when all errored', () => {
			const results: FileResult[] = [
				{
					file: { path: 'file1.md' } as any,
					status: 'error',
					modified: false,
					changes: [],
					error: 'Error 1',
					duration: 2
				},
				{
					file: { path: 'file2.md' } as any,
					status: 'error',
					modified: false,
					changes: [],
					error: 'Error 2',
					duration: 3
				}
			];

			render(PreviewTab, {
				props: {
					results,
					isLoading: false,
					error: null
				}
			});

			// Should show 2 errors
			expect(screen.getByText(/2 errors/i)).toBeInTheDocument();
		});

		it('should update summary when props change', async () => {
			const initialResults: FileResult[] = [{
				file: { path: 'file1.md' } as any,
				status: 'success',
				modified: true,
				changes: ['Change'],
				duration: 10
			}];

			const { component } = render(PreviewTab, {
				props: {
					results: initialResults,
					isLoading: false,
					error: null
				}
			});

			// Initial: 1 matched
			expect(screen.getByText(/1 matched/i)).toBeInTheDocument();

			// Update with more results
			const updatedResults: FileResult[] = [
				...initialResults,
				{
					file: { path: 'file2.md' } as any,
					status: 'success',
					modified: true,
					changes: ['Change 2'],
					duration: 15
				}
			];

			// Update props directly on component
			component.$set({
				results: updatedResults,
				isLoading: false,
				error: null
			});

			// Wait for Svelte to update DOM
			await new Promise(resolve => setTimeout(resolve, 10));

			// Should now show 2 matched
			expect(screen.getByText(/2 matched/i)).toBeInTheDocument();
		});
	});
});
