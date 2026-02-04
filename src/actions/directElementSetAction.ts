/**
 * Execute Direct Element SET actions (Phase 2 - Direct Array Element Access)
 *
 * Converts DirectElementSetAction AST to execution format and delegates to arrayActions.executeDirectElementSet
 *
 * Syntax: FOR path[index] SET field value [, field2 value2, ...]
 * Example: FOR history[0] SET reviewed true, status "done"
 *
 * Based on grammar section: Direct Element Access Operations (lines 173-207)
 */

import { DirectElementSetAction, ActionResult } from '../types';
import { executeDirectElementSet as executeDirectElementSetLegacy } from './arrayActions';

/**
 * Execute a direct element SET action
 *
 * @param data - Object to modify
 * @param action - DirectElementSetAction from parser
 * @returns ActionResult with success, modified, changes, and optional error
 *
 * @example
 * const action: DirectElementSetAction = {
 *   type: 'DIRECT_ELEMENT_SET',
 *   path: 'history[0]',
 *   updates: { reviewed: true, status: 'done' }
 * };
 * const result = executeDirectElementSet(data, action);
 */
export function executeDirectElementSet(
	data: any,
	action: DirectElementSetAction
): ActionResult {
	// Convert Record<string, any> format to Array<{ field, value }> format expected by legacy function
	const updates = Object.entries(action.updates).map(([field, value]) => ({
		field,
		value
	}));

	// Delegate to existing implementation
	return executeDirectElementSetLegacy(data, action.path, updates);
}
