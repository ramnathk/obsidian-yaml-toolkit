/**
 * TypeScript types for i18n translation keys
 * These types provide autocomplete and type safety for translation keys
 *
 * NOTE: These are manually maintained to match locales/en.json structure
 * If you add new translation keys, update these types accordingly
 */

/**
 * All valid translation keys
 * Use these with t() or $t() functions
 *
 * @example
 * t('plugin.name')  // Type-safe ✓
 * t('invalid.key')  // Type error ✗
 */
export type TranslationKey =
	// Plugin
	| 'plugin.name'
	| 'plugin.loading'
	// Commands
	| 'commands.openRuleBuilder'
	// Settings
	| 'settings.title'
	| 'settings.defaultBackup.name'
	| 'settings.defaultBackup.description'
	| 'settings.debugMode.name'
	| 'settings.debugMode.description'
	// Rule Builder
	| 'ruleBuilder.title'
	| 'ruleBuilder.savedRules.label'
	| 'ruleBuilder.savedRules.newRule'
	| 'ruleBuilder.buttons.new'
	| 'ruleBuilder.buttons.delete'
	| 'ruleBuilder.buttons.cancel'
	| 'ruleBuilder.buttons.save'
	| 'ruleBuilder.buttons.validate'
	| 'ruleBuilder.buttons.preview'
	| 'ruleBuilder.buttons.apply'
	| 'ruleBuilder.buttons.test'
	| 'ruleBuilder.buttons.testing'
	| 'ruleBuilder.fields.ruleName.label'
	| 'ruleBuilder.fields.ruleName.placeholder'
	| 'ruleBuilder.fields.ruleName.default'
	| 'ruleBuilder.fields.scope.legend'
	| 'ruleBuilder.fields.scope.vault'
	| 'ruleBuilder.fields.scope.folder'
	| 'ruleBuilder.fields.scope.current'
	| 'ruleBuilder.fields.scope.folderPlaceholder'
	| 'ruleBuilder.fields.condition.label'
	| 'ruleBuilder.fields.condition.helpText'
	| 'ruleBuilder.fields.condition.placeholder'
	| 'ruleBuilder.fields.action.label'
	| 'ruleBuilder.fields.action.placeholder'
	| 'ruleBuilder.fields.action.required'
	| 'ruleBuilder.fields.backup.label'
	| 'ruleBuilder.validation.passed'
	| 'ruleBuilder.validation.invalidCondition'
	| 'ruleBuilder.validation.invalidAction'
	| 'ruleBuilder.tabs.preview'
	| 'ruleBuilder.tabs.test'
	| 'ruleBuilder.closeValidation'
	// Preview
	| 'preview.loading'
	| 'preview.failed'
	| 'preview.empty.title'
	| 'preview.empty.message'
	| 'preview.summary.title'
	| 'preview.summary.matched'
	| 'preview.summary.warning'
	| 'preview.summary.warnings'
	| 'preview.summary.error'
	| 'preview.summary.errors'
	| 'preview.summary.skipped'
	| 'preview.fileDetails.error'
	| 'preview.fileDetails.reason'
	| 'preview.fileDetails.conditionNotMatch'
	| 'preview.fileDetails.noChanges'
	| 'preview.fileDetails.unknownError'
	| 'preview.note.text'
	| 'preview.note.action'
	| 'preview.note.continuation'
	// Test
	| 'test.instructions'
	| 'test.examples.draftNote'
	| 'test.examples.publishedNote'
	| 'test.examples.minimalNote'
	| 'test.examples.complexNote'
	| 'test.sampleYaml.label'
	| 'test.sampleYaml.placeholder'
	| 'test.result.error'
	| 'test.result.conditionNotMatch'
	| 'test.result.conditionEvaluationMessage'
	| 'test.result.match'
	| 'test.result.matched'
	| 'test.result.warning'
	| 'test.result.noChanges'
	| 'test.result.note'
	| 'test.yamlError.parse'
	| 'test.yamlError.invalid'
	| 'test.executionError.prefix'
	| 'test.executionError.unknown'
	// Diff
	| 'diff.headers.before'
	| 'diff.headers.after'
	| 'diff.changes.title'
	// Notices
	| 'notices.ruleSaved'
	| 'notices.ruleDeleted'
	| 'notices.noFilesMatched'
	| 'notices.processing'
	| 'notices.complete'
	| 'notices.error'
	// Confirm dialogs
	| 'confirm.applyWithoutPreview.title'
	| 'confirm.applyWithoutPreview.message'
	| 'confirm.applyWithoutPreview.question'
	// Status
	| 'status.success'
	| 'status.warning'
	| 'status.error'
	| 'status.skipped';

/**
 * Helper type for interpolation values
 */
export interface TranslationValues {
	[key: string]: string | number;
}
