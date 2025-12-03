/**
 * DiffViewer Component - Negative Assertions Tests
 * Split into separate file to avoid memory issues
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DiffViewer from '../../../src/ui/components/DiffViewer.svelte';

describe('DiffViewer Component - Negative Assertions', () => {
	it('should NOT modify originalData prop', () => {
		const originalData = { title: 'Original', status: 'draft' };
		const originalDataCopy = JSON.parse(JSON.stringify(originalData));

		render(DiffViewer, {
			props: {
				originalData,
				newData: { title: 'Modified', status: 'published' },
				changes: []
			}
		});

		// Original data should remain unchanged
		expect(originalData).toEqual(originalDataCopy);
	});

	it('should NOT modify newData prop', () => {
		const newData = { title: 'New', status: 'published' };
		const newDataCopy = JSON.parse(JSON.stringify(newData));

		render(DiffViewer, {
			props: {
				originalData: { title: 'Old', status: 'draft' },
				newData,
				changes: []
			}
		});

		// New data should remain unchanged
		expect(newData).toEqual(newDataCopy);
	});

	it('should be pure (no side effects in diff calculation)', () => {
		const original = { title: 'Test', count: 5 };
		const modified = { title: 'Modified', count: 10 };
		const originalCopy = JSON.parse(JSON.stringify(original));
		const modifiedCopy = JSON.parse(JSON.stringify(modified));

		const { rerender } = render(DiffViewer, {
			props: {
				originalData: original,
				newData: modified,
				changes: []
			}
		});

		// Rerender with same props
		rerender({
			originalData: original,
			newData: modified,
			changes: []
		});

		// Data should remain unchanged after multiple renders
		expect(original).toEqual(originalCopy);
		expect(modified).toEqual(modifiedCopy);
	});
});
