/**
 * Test setup file for Vitest
 * Configures DOM testing environment and mocks for Svelte components
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Obsidian globals
global.window = global.window || ({} as any);
global.document = global.document || ({} as any);

// Mock Obsidian Notice class
class MockNotice {
	constructor(public message: string) {
		// Store for test assertions
		if (typeof global !== 'undefined') {
			(global as any).__lastNotice = message;
		}
	}
}

// Make Notice available globally for require('obsidian').Notice pattern
vi.mock('obsidian', async () => {
	const actual = await vi.importActual('obsidian');
	return {
		...actual,
		Notice: MockNotice
	};
});

// Helper to get last notice message in tests
(global as any).getLastNotice = () => (global as any).__lastNotice;
(global as any).clearLastNotice = () => (global as any).__lastNotice = undefined;
