/**
 * Debug logger for E2E testing
 * Writes debug output to test-vault/debug.log
 */

import { App, TFile } from 'obsidian';

let debugLogPath = 'debug.log';
let app: App | null = null;

export function initDebugLogger(obsidianApp: App, logPath = 'debug.log') {
	app = obsidianApp;
	debugLogPath = logPath;
}

export async function debugLog(category: string, message: string, data?: any) {
	if (!app) {
		console.log(`[DEBUG ${category}] ${message}`, data);
		return;
	}

	const timestamp = new Date().toISOString();
	const dataStr = data !== undefined ? `\n${JSON.stringify(data, null, 2)}` : '';
	const logLine = `[${timestamp}] [${category}] ${message}${dataStr}\n`;

	try {
		// Check if file exists
		const file = app.vault.getAbstractFileByPath(debugLogPath);

		if (file instanceof TFile) {
			// Append to existing file
			const content = await app.vault.read(file);
			await app.vault.modify(file, content + logLine);
		} else {
			// Create new file
			await app.vault.create(debugLogPath, logLine);
		}
	} catch (error) {
		// Fallback to console if file logging fails
		console.log(`[DEBUG ${category}] ${message}`, data);
		console.error('Debug log write failed:', error);
	}
}

export async function clearDebugLog() {
	if (!app) return;

	try {
		const file = app.vault.getAbstractFileByPath(debugLogPath);
		if (file instanceof TFile) {
			await app.vault.delete(file);
		}
	} catch (error) {
		console.error('Failed to clear debug log:', error);
	}
}
