/**
 * DiffViewer Component - Basic Rendering Tests
 * Split into separate file to avoid memory issues
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DiffViewer from '../../../src/ui/components/DiffViewer.svelte';

describe('DiffViewer Component - Basic Rendering', () => {
	it('should render header with "Before" and "After" labels', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Original' },
				newData: { title: 'Modified' },
				changes: []
			}
		});

		expect(screen.getByText('Before')).toBeInTheDocument();
		expect(screen.getByText('After')).toBeInTheDocument();

		const header = container.querySelector('.diff-header');
		expect(header).toBeInTheDocument();
	});

	it('should render diff content container', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: { title: 'Test Modified' },
				changes: []
			}
		});

		const content = container.querySelector('.diff-content');
		expect(content).toBeInTheDocument();
	});

	it('should show no diff lines when data is identical', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Same' },
				newData: { title: 'Same' },
				changes: []
			}
		});

		// Only unchanged lines should exist (no adds/removes)
		const addedLines = container.querySelectorAll('.diff-added');
		const removedLines = container.querySelectorAll('.diff-removed');

		expect(addedLines.length).toBe(0);
		expect(removedLines.length).toBe(0);
	});

	it('should render changes list when changes provided', () => {
		render(DiffViewer, {
			props: {
				originalData: { title: 'Old' },
				newData: { title: 'New' },
				changes: ['Changed title', 'Updated status']
			}
		});

		expect(screen.getByText('Changes:')).toBeInTheDocument();
		expect(screen.getByText('Changed title')).toBeInTheDocument();
		expect(screen.getByText('Updated status')).toBeInTheDocument();
	});

	it('should not render changes section when changes array is empty', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: { title: 'Test' },
				changes: []
			}
		});

		const changesSection = container.querySelector('.diff-changes');
		expect(changesSection).not.toBeInTheDocument();
	});

	it('should apply correct CSS classes to diff viewer', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: { title: 'Modified' },
				changes: []
			}
		});

		const viewer = container.querySelector('.diff-viewer');
		expect(viewer).toBeInTheDocument();
		expect(viewer).toHaveClass('diff-viewer');
	});

	it('should render with empty data objects', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: {},
				newData: {},
				changes: []
			}
		});

		expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
	});

	it('should render multiple changes in list', () => {
		const changes = [
			'Change 1',
			'Change 2',
			'Change 3',
			'Change 4',
			'Change 5'
		];

		render(DiffViewer, {
			props: {
				originalData: { field: 'old' },
				newData: { field: 'new' },
				changes
			}
		});

		changes.forEach(change => {
			expect(screen.getByText(change)).toBeInTheDocument();
		});
	});
});
