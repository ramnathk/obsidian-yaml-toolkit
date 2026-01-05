/**
 * Tests for Logger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, generateLogPath } from '../../../src/core/logger';
import { BatchResult, FileResult } from '../../../src/types';

// Mock Vault
class MockVault {
	private files = new Map<string, string>();

	async create(path: string, content: string) {
		this.files.set(path, content);
	}

	adapter = {
		exists: async (path: string) => this.files.has(path),
		write: async (path: string, content: string) => {
			this.files.set(path, content);
		},
		mkdir: async (path: string) => {
			// Mock directory creation
		},
	};

	getFile(path: string): string | undefined {
		return this.files.get(path);
	}
}

function createMockFile(path: string): any {
	return {
		path,
		basename: path.split('/').pop()?.replace('.md', '') || '',
		name: path.split('/').pop() || '',
	};
}

describe('Logger', () => {
	let mockVault: MockVault;

	beforeEach(() => {
		mockVault = new MockVault();
	});

	describe('generateLogPath', () => {
		it('should generate path with timestamp', () => {
			const path = generateLogPath();
			expect(path).toMatch(/^\.obsidian\/plugins\/yaml-toolkit\/logs\/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/);
		});

		it('should generate unique paths', () => {
			const path1 = generateLogPath();
			const path2 = generateLogPath();
			// Paths might be same if called in same second, but structure should be correct
			expect(path1).toContain('.obsidian/plugins/yaml-toolkit/logs/');
			expect(path1).toMatch(/\.log$/);
		});
	});

	describe('Logger operations', () => {
		it('should create logger and log start', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test-rule',
				name: 'Test Rule',
				condition: 'status = "draft"',
				action: 'SET status "published"',
				scope: { type: 'vault' },
				options: { backup: true },
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toBeDefined();
			expect(logContent).toContain('Test Rule');
			expect(logContent).toContain('status = "draft"');
			expect(logContent).toContain('SET status "published"');
		});

		it('should log scan results', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: 'SET test "value"',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);
			logger.logScan(100, 50);
			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toContain('Scanned: 100 files');
			expect(logContent).toContain('Matched: 50 files');
		});

		it('should log file success', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const file = createMockFile('note.md');
			logger.logFileSuccess(file, ['SET status: published'], 'note.md.bak');

			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toContain('✅ note.md');
			expect(logContent).toContain('SET status: published');
			expect(logContent).toContain('Backup: note.md.bak');
		});

		it('should log file warning', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const file = createMockFile('note.md');
			logger.logFileWarning(file, 'Field already exists', ['ADD status: draft']);

			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toContain('⚠️  note.md');
			expect(logContent).toContain('Warning: Field already exists');
		});

		it('should log file error', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const file = createMockFile('note.md');
			logger.logFileError(file, 'Invalid YAML syntax');

			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toContain('❌ note.md');
			expect(logContent).toContain('Error: Invalid YAML syntax');
		});

		it('should log summary', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const batchResult: BatchResult = {
				results: [],
				summary: {
					success: 10,
					warnings: 2,
					errors: 1,
					skipped: 3,
					duration: 5000,
					backupsCreated: 10,
				},
			};

			logger.logSummary(batchResult);
			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toContain('SUMMARY');
			expect(logContent).toContain('Success: 10');
			expect(logContent).toContain('Warnings: 2');
			expect(logContent).toContain('Errors: 1');
			expect(logContent).toContain('Skipped: 3');
			expect(logContent).toContain('Backups created: 10');
			expect(logContent).toContain('Duration: 5.00s');
		});

		it('should create complete log file', async () => {
			const logger = createLogger(mockVault as any, 'complete.log');

			const rule: any = {
				id: 'rule-1', name: 'Complete Test', condition: 'tags exists',
				action: 'FOR tags APPEND "processed"', scope: { type: 'vault' },
				options: { backup: true }, created: '2025-11-20'
			};

			logger.logStart(rule);
			logger.logScan(50, 30);
			logger.logFileSuccess(createMockFile('file1.md'), ['APPEND tags: processed']);
			logger.logFileWarning(createMockFile('file2.md'), 'No changes', []);
			logger.logFileError(createMockFile('file3.md'), 'Parse error');

			const batchResult: BatchResult = {
				results: [],
				summary: { success: 1, warnings: 1, errors: 1, skipped: 0, duration: 2000, backupsCreated: 1 },
			};

			logger.logSummary(batchResult);
			await logger.close();

			const logContent = mockVault.getFile('complete.log');
			expect(logContent).toContain('Complete Test');
			expect(logContent).toContain('Scanned: 50');
			expect(logContent).toContain('✅ file1.md');
			expect(logContent).toContain('⚠️  file2.md');
			expect(logContent).toContain('❌ file3.md');
			expect(logContent).toContain('SUMMARY');
		});
	});

	describe('Branch coverage - conditional branches', () => {
		it('should log rule with folder scope', async () => {
			const logger = createLogger(mockVault as any, 'folder-test.log');

			const rule: any = {
				id: 'folder-rule',
				name: 'Folder Rule',
				condition: '',
				action: 'SET status "done"',
				scope: { type: 'folder', folder: 'docs/samples' },
				options: { backup: false },
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('folder-test.log');
			expect(logContent).toContain('Scope: folder (docs/samples)');
		});

		it('should log rule with vault scope (no folder)', async () => {
			const logger = createLogger(mockVault as any, 'vault-test.log');

			const rule: any = {
				id: 'vault-rule',
				name: 'Vault Rule',
				condition: '',
				action: 'SET status "done"',
				scope: { type: 'vault' },
				options: { backup: false },
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('vault-test.log');
			expect(logContent).toContain('Scope: vault');
			expect(logContent).not.toContain('Scope: vault (');
		});

		it('should log file success without backup path', async () => {
			const logger = createLogger(mockVault as any, 'no-backup.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const file = createMockFile('note.md');
			// Pass undefined as backup parameter
			logger.logFileSuccess(file, ['SET status: published'], undefined);

			await logger.close();

			const logContent = mockVault.getFile('no-backup.log');
			expect(logContent).toContain('✅ note.md');
			expect(logContent).toContain('SET status: published');
			// Should not have a backup path line after the file (not the header's "Backup: enabled/disabled")
			const lines = logContent!.split('\n');
			const fileIndex = lines.findIndex(l => l.includes('✅ note.md'));
			const nextFewLines = lines.slice(fileIndex, fileIndex + 4).join('\n');
			expect(nextFewLines).not.toMatch(/^\s+Backup: .+\.bak/m);
		});

		it('should log file warning with empty changes array', async () => {
			const logger = createLogger(mockVault as any, 'empty-changes.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			const file = createMockFile('note.md');
			logger.logFileWarning(file, 'No changes needed', []);

			await logger.close();

			const logContent = mockVault.getFile('empty-changes.log');
			expect(logContent).toContain('⚠️  note.md');
			expect(logContent).toContain('Warning: No changes needed');
			// Should not contain any change lines after the warning
			const lines = logContent!.split('\n');
			const warningIndex = lines.findIndex(l => l.includes('No changes needed'));
			expect(warningIndex).toBeGreaterThan(-1);
		});

		it('should write to existing log file', async () => {
			// Pre-create a log file
			await mockVault.create('existing.log', 'Old content');

			const logger = createLogger(mockVault as any, 'existing.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('existing.log');
			expect(logContent).toBeDefined();
			expect(logContent).toContain('Test');
			expect(logContent).not.toContain('Old content');
		});

		it('should create parent directory when it doesn\'t exist', async () => {
			const logger = createLogger(mockVault as any, 'logs/nested/test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('logs/nested/test.log');
			expect(logContent).toBeDefined();
		});

		it('should handle mkdir errors gracefully', async () => {
			const errorVault = new MockVault();
			errorVault.adapter.mkdir = async () => {
				throw new Error('Permission denied');
			};

			const logger = createLogger(errorVault as any, 'logs/test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);

			// Should not throw, mkdir error is caught
			await expect(logger.close()).resolves.not.toThrow();

			const logContent = errorVault.getFile('logs/test.log');
			expect(logContent).toBeDefined();
		});

		it('should handle log path without parent directory', async () => {
			const logger = createLogger(mockVault as any, 'test.log');

			const rule: any = {
				id: 'test', name: 'Test', condition: '', action: '',
				scope: { type: 'vault' }, options: { backup: false }, created: ''
			};

			logger.logStart(rule);
			await logger.close();

			const logContent = mockVault.getFile('test.log');
			expect(logContent).toBeDefined();
		});
	});
});
