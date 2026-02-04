import fs from 'fs';
import path from 'path';

/**
 * TestLogger - Comprehensive logging for E2E tests
 *
 * Problem: console.log() from Obsidian plugin code is not captured by WebDriverIO output
 * Solution: Write structured logs to dedicated files with timestamps and phases
 *
 * Usage:
 *   const logger = new TestLogger(testName);
 *   logger.log('SETUP', 'Creating test file');
 *   logger.logAssertion('views should be 15', 15, actualValue, actualValue === 15);
 *   logger.end(testPassed);
 */
export class TestLogger {
	private logFile: string;
	private testName: string;
	private startTime: number;

	constructor(testName: string) {
		this.testName = testName;
		this.startTime = Date.now();

		const logDir = path.join(process.cwd(), 'tests/wdio/test-logs');
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		// Create unique log file per test with timestamp
		const timestamp = Date.now();
		const sanitizedName = testName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
		this.logFile = path.join(logDir, `${sanitizedName}-${timestamp}.log`);

		this.log('TEST START', `Starting test: ${testName}`);
	}

	/**
	 * Log a message with phase and optional data
	 * @param phase - Test phase (SETUP, ACTION, VERIFY, ASSERT, etc.)
	 * @param message - Log message
	 * @param data - Optional structured data to log as JSON
	 */
	log(phase: string, message: string, data?: any) {
		const timestamp = new Date().toISOString();
		const elapsed = Date.now() - this.startTime;
		const entry = `[${timestamp}] [+${elapsed}ms] [${this.testName}] [${phase}] ${message}`;

		let fullEntry = entry;
		if (data !== undefined) {
			fullEntry += '\n' + JSON.stringify(data, null, 2);
		}
		fullEntry += '\n';

		// Write to file
		fs.appendFileSync(this.logFile, fullEntry);

		// Also log to console for real-time feedback
		console.log(entry);
		if (data !== undefined) {
			console.log(JSON.stringify(data, null, 2));
		}
	}

	/**
	 * Log file state (content) at a specific phase
	 * @param phase - Test phase
	 * @param filename - File name to read
	 * @param vault - Obsidian vault object with read() method
	 */
	async logFileState(phase: string, filename: string, vault: any) {
		try {
			const content = await vault.read(filename);
			this.log(phase, `File state: ${filename}`, {
				filename,
				content,
				length: content.length
			});
		} catch (error: any) {
			this.log(phase, `Failed to read file: ${filename}`, {
				filename,
				error: error.message,
				stack: error.stack
			});
		}
	}

	/**
	 * Log an action with details
	 * @param action - Action description
	 * @param details - Action details
	 */
	logAction(action: string, details: any) {
		this.log('ACTION', action, details);
	}

	/**
	 * Log an assertion with expected/actual values and result
	 * @param assertion - Assertion description
	 * @param expected - Expected value
	 * @param actual - Actual value
	 * @param passed - Whether assertion passed
	 */
	logAssertion(assertion: string, expected: any, actual: any, passed: boolean) {
		this.log('ASSERT', `${passed ? '✅' : '❌'} ${assertion}`, {
			expected,
			actual,
			passed,
			diff: passed ? null : this.generateDiff(expected, actual)
		});
	}

	/**
	 * Generate a human-readable diff between expected and actual values
	 */
	private generateDiff(expected: any, actual: any): string {
		const expectedStr = JSON.stringify(expected, null, 2);
		const actualStr = JSON.stringify(actual, null, 2);

		return `Expected:\n${expectedStr}\n\nActual:\n${actualStr}`;
	}

	/**
	 * Log error with stack trace
	 * @param phase - Test phase where error occurred
	 * @param error - Error object
	 */
	logError(phase: string, error: any) {
		this.log(phase, '❌ ERROR', {
			message: error.message,
			stack: error.stack,
			name: error.name,
			...(error.cause && { cause: error.cause })
		});
	}

	/**
	 * Log test completion with final status
	 * @param passed - Whether test passed
	 */
	end(passed: boolean) {
		const elapsed = Date.now() - this.startTime;
		const status = passed ? '✅ PASSED' : '❌ FAILED';

		this.log('TEST END', `${status}: ${this.testName}`, {
			passed,
			duration: `${elapsed}ms`,
			logFile: this.logFile
		});

		console.log(`\n${'='.repeat(60)}`);
		console.log(`Test: ${this.testName}`);
		console.log(`Status: ${status}`);
		console.log(`Duration: ${elapsed}ms`);
		console.log(`Log file: ${this.logFile}`);
		console.log('='.repeat(60) + '\n');
	}

	/**
	 * Get the log file path
	 */
	getLogFile(): string {
		return this.logFile;
	}
}
