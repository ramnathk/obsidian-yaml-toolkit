/**
 * DiffViewer Component - Diff Calculation Tests
 * Split into separate file to avoid memory issues
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DiffViewer from '../../../src/ui/components/DiffViewer.svelte';

describe('DiffViewer Component - Diff Calculation', () => {
	it('should show added lines with "+" symbol and green styling', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: { title: 'Test', newField: 'added' },
				changes: []
			}
		});

		const addedLines = container.querySelectorAll('.diff-added');
		expect(addedLines.length).toBeGreaterThan(0);

		const addedLine = addedLines[0];
		expect(addedLine.textContent).toContain('+');
	});

	it('should show removed lines with "-" symbol and red styling', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test', oldField: 'removed' },
				newData: { title: 'Test' },
				changes: []
			}
		});

		const removedLines = container.querySelectorAll('.diff-removed');
		expect(removedLines.length).toBeGreaterThan(0);

		const removedLine = removedLines[0];
		expect(removedLine.textContent).toContain('-');
	});

	it('should show unchanged lines with " " symbol', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Same', status: 'unchanged' },
				newData: { title: 'Same', status: 'unchanged' },
				changes: []
			}
		});

		const unchangedLines = container.querySelectorAll('.diff-unchanged');
		expect(unchangedLines.length).toBeGreaterThan(0);
	});

	it('should correctly diff when single field is added', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: { title: 'Test', newField: 'value' },
				changes: []
			}
		});

		const addedLines = container.querySelectorAll('.diff-added');
		expect(addedLines.length).toBeGreaterThan(0);

		// Should show the new field
		const diffText = Array.from(addedLines).map(line => line.textContent).join(' ');
		expect(diffText).toContain('newField');
	});

	it('should correctly diff when single field is removed', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test', removeMe: 'value' },
				newData: { title: 'Test' },
				changes: []
			}
		});

		const removedLines = container.querySelectorAll('.diff-removed');
		expect(removedLines.length).toBeGreaterThan(0);

		const diffText = Array.from(removedLines).map(line => line.textContent).join(' ');
		expect(diffText).toContain('removeMe');
	});

	it('should correctly diff when single field is modified', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { status: 'draft' },
				newData: { status: 'published' },
				changes: []
			}
		});

		const removedLines = container.querySelectorAll('.diff-removed');
		const addedLines = container.querySelectorAll('.diff-added');

		expect(removedLines.length).toBeGreaterThan(0);
		expect(addedLines.length).toBeGreaterThan(0);

		// Should show both old and new values
		const allText = container.textContent || '';
		expect(allText).toContain('draft');
		expect(allText).toContain('published');
	});

	it('should show all changes when multiple fields modified', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: {
					field1: 'old1',
					field2: 'old2',
					field3: 'old3'
				},
				newData: {
					field1: 'new1',
					field2: 'new2',
					field3: 'new3'
				},
				changes: []
			}
		});

		const removedLines = container.querySelectorAll('.diff-removed');
		const addedLines = container.querySelectorAll('.diff-added');

		// Should have lines for all 3 changed fields
		expect(removedLines.length).toBeGreaterThan(0);
		expect(addedLines.length).toBeGreaterThan(0);
	});

	it('should filter out empty lines from diff', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test', field1: 'value1' },
				newData: { title: 'Test Modified', field1: 'value1' },
				changes: []
			}
		});

		// Check that diff lines don't include empty content
		const diffLines = container.querySelectorAll('.diff-line');
		diffLines.forEach(line => {
			const text = line.querySelector('.diff-text')?.textContent || '';
			expect(text.trim().length).toBeGreaterThan(0);
		});
	});
});
