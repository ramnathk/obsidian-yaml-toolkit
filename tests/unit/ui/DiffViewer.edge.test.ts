/**
 * DiffViewer Component - Edge Cases Tests
 * Split into separate file to avoid memory issues
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DiffViewer from '../../../src/ui/components/DiffViewer.svelte';
import { UNICODE_TEST_CASES } from '../../helpers/componentHelpers';

describe('DiffViewer Component - Edge Cases', () => {
	it('should handle null originalData gracefully', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: null as any,
				newData: { title: 'Test' },
				changes: []
			}
		});

		// Should render without crashing
		expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
	});

	it('should handle undefined newData gracefully', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: undefined as any,
				changes: []
			}
		});

		// Should render without crashing
		expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
	});

	it('should display unicode emoji correctly', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: UNICODE_TEST_CASES.emoji,
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('🚀');
		expect(text).toContain('✅');
	});

	it('should display Chinese characters correctly', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: UNICODE_TEST_CASES.chinese,
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('项目标题');
		expect(text).toContain('作者名');
	});

	it('should display Arabic characters correctly', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { title: 'Test' },
				newData: UNICODE_TEST_CASES.arabic,
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('عنوان المشروع');
		expect(text).toContain('نشط');
	});

	it('should handle moderately long field values', () => {
		const mediumValue = 'x'.repeat(100);
		const { container } = render(DiffViewer, {
			props: {
				originalData: { description: 'short' },
				newData: { description: mediumValue },
				changes: []
			}
		});

		// Should render without crashing, content should scroll
		const diffContent = container.querySelector('.diff-content');
		expect(diffContent).toBeInTheDocument();

		const text = container.textContent || '';
		expect(text).toContain('description');
	});

	it('should handle moderate YAML with 10 fields', () => {
		const mediumData: Record<string, string> = {};
		for (let i = 0; i < 10; i++) {
			mediumData[`field${i}`] = `value${i}`;
		}

		const { container } = render(DiffViewer, {
			props: {
				originalData: {},
				newData: mediumData,
				changes: []
			}
		});

		// Should render all fields
		const addedLines = container.querySelectorAll('.diff-added');
		expect(addedLines.length).toBeGreaterThan(5);
	});

	it('should handle moderately nested objects', () => {
		const nested = {
			level: 1,
			child: {
				level: 2,
				child: {
					level: 3,
					value: 'deep'
				}
			}
		};

		const { container } = render(DiffViewer, {
			props: {
				originalData: {},
				newData: { nested },
				changes: []
			}
		});

		// Should flatten and display all levels
		const text = container.textContent || '';
		expect(text).toContain('level');
		expect(text).toContain('child');
	});

	it('should handle arrays with 10 items', () => {
		const smallArray = Array.from({ length: 10 }, (_, i) => `item${i}`);
		const { container } = render(DiffViewer, {
			props: {
				originalData: { items: [] },
				newData: { items: smallArray },
				changes: []
			}
		});

		// Should show array content in YAML format
		const text = container.textContent || '';
		expect(text).toContain('items');
	});

	it('should render boolean values as strings', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { published: false },
				newData: { published: true },
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('true');
		expect(text).toContain('false');
	});

	it('should render null values as "null" string', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { status: 'active' },
				newData: { status: null as any },
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('null');
	});

	it('should handle numeric values correctly', () => {
		const { container } = render(DiffViewer, {
			props: {
				originalData: { priority: 3, rating: 4.5 },
				newData: { priority: 5, rating: 4.8 },
				changes: []
			}
		});

		const text = container.textContent || '';
		expect(text).toContain('3');
		expect(text).toContain('5');
		expect(text).toContain('4.5');
		expect(text).toContain('4.8');
	});
});
