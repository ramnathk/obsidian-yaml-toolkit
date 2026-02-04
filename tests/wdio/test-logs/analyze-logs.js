/**
 * Log Analysis Helper
 *
 * Analyzes test logs for failures and provides summary
 *
 * Usage:
 *   node tests/wdio/test-logs/analyze-logs.js
 */

const fs = require('fs');
const path = require('path');

const logsDir = __dirname;

function analyzeLogs() {
	console.log('\n' + '='.repeat(70));
	console.log('📊 TEST LOG ANALYSIS');
	console.log('='.repeat(70) + '\n');

	// Find all log files
	const logFiles = fs.readdirSync(logsDir)
		.filter(f => f.endsWith('.log'))
		.sort();

	if (logFiles.length === 0) {
		console.log('ℹ️  No log files found in', logsDir);
		console.log('   Run tests first to generate logs.\n');
		return;
	}

	console.log(`Found ${logFiles.length} log file(s)\n`);

	let totalTests = 0;
	let passedTests = 0;
	let failedTests = 0;
	const failureDetails = [];

	// Analyze each log file
	for (const logFile of logFiles) {
		const logPath = path.join(logsDir, logFile);
		const content = fs.readFileSync(logPath, 'utf-8');
		const lines = content.split('\n');

		// Extract test name from first line
		const firstLine = lines[0] || '';
		const testNameMatch = firstLine.match(/\[TEST START\] Starting test: (.+)/);
		const testName = testNameMatch ? testNameMatch[1] : logFile;

		// Find test result
		const endLine = lines.find(l => l.includes('[TEST END]'));
		const passed = endLine && endLine.includes('✅ PASSED');
		const failed = endLine && endLine.includes('❌ FAILED');

		if (passed || failed) {
			totalTests++;
			if (passed) passedTests++;
			if (failed) failedTests++;
		}

		// Find failed assertions
		const failedAssertions = lines.filter(l =>
			l.includes('[ASSERT]') && l.includes('"passed":false')
		);

		// Find errors
		const errors = lines.filter(l =>
			l.includes('[ERROR]') || l.includes('❌ ERROR')
		);

		// Display result
		const status = passed ? '✅ PASS' : failed ? '❌ FAIL' : '⚠️  INCOMPLETE';
		console.log(`${status} ${testName}`);

		if (failed || errors.length > 0) {
			console.log(`     Log: ${logFile}`);

			if (failedAssertions.length > 0) {
				console.log(`     Failed assertions: ${failedAssertions.length}`);
				failureDetails.push({
					test: testName,
					file: logFile,
					assertions: failedAssertions.length,
					errors: errors.length
				});

				// Show first failed assertion
				const firstFailure = failedAssertions[0];
				const assertionMatch = firstFailure.match(/\[ASSERT\] ❌ (.+)/);
				if (assertionMatch) {
					console.log(`     First failure: ${assertionMatch[1]}`);
				}
			}

			if (errors.length > 0) {
				console.log(`     Errors: ${errors.length}`);
			}

			console.log(); // Empty line for readability
		}
	}

	// Summary
	console.log('\n' + '='.repeat(70));
	console.log('📈 SUMMARY');
	console.log('='.repeat(70));
	console.log(`Total tests:  ${totalTests}`);
	console.log(`Passed:       ${passedTests} ✅`);
	console.log(`Failed:       ${failedTests} ❌`);

	if (totalTests > 0) {
		const passRate = ((passedTests / totalTests) * 100).toFixed(1);
		console.log(`Pass rate:    ${passRate}%`);
	}

	if (failureDetails.length > 0) {
		console.log('\n' + '-'.repeat(70));
		console.log('FAILURE DETAILS:');
		console.log('-'.repeat(70));

		for (const failure of failureDetails) {
			console.log(`\n❌ ${failure.test}`);
			console.log(`   File: ${failure.file}`);
			console.log(`   Failed assertions: ${failure.assertions}`);
			console.log(`   Errors: ${failure.errors}`);
			console.log(`   Full log: tests/wdio/test-logs/${failure.file}`);
		}
	}

	console.log('\n' + '='.repeat(70) + '\n');

	// Exit with error code if any tests failed
	if (failedTests > 0) {
		process.exit(1);
	}
}

// Run analysis
try {
	analyzeLogs();
} catch (error) {
	console.error('Error analyzing logs:', error.message);
	console.error(error.stack);
	process.exit(1);
}
