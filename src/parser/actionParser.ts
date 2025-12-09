/**
 * Action Parser v2.0 - Parse action tokens into Action AST using Hybrid Grammar
 *
 * Hybrid approach:
 * - Scalars (single fields): Direct verb → SET title "value"
 * - Arrays/Objects (collections): FOR specifies target → FOR tasks WHERE... SET priority 5
 */

import { ActionToken, ActionTokenType, tokenizeAction } from './actionLexer';
import { parseCondition } from './conditionParser';
import {
	ActionAST,
	SetAction,
	AddAction,
	DeleteAction,
	RenameAction,
	AppendAction,
	PrependAction,
	InsertAction,
	InsertAfterAction,
	InsertBeforeAction,
	RemoveAction,
	RemoveAllAction,
	RemoveAtAction,
	ReplaceAction,
	ReplaceAllAction,
	DeduplicateAction,
	SortAction,
	SortByAction,
	MoveAction,
	MoveWhereAction,
	UpdateWhereAction,
	MergeAction,
	MergeOverwriteAction,
	ConditionAST,
	IncrementAction,
	DecrementAction,
} from '../types';

export class ActionParserError extends Error {
	constructor(message: string, public token?: ActionToken) {
		const position = token ? ` at position ${token.position}` : '';
		super(`Action parser error${position}: ${message}`);
		this.name = 'ActionParserError';
	}
}

/**
 * Parse an action string into an ActionAST
 */
export function parseAction(input: string): ActionAST {
	const tokens = tokenizeAction(input);
	const parser = new ActionParser(tokens);
	return parser.parse();
}

class ActionParser {
	private tokens: ActionToken[];
	private position: number = 0;

	constructor(tokens: ActionToken[]) {
		this.tokens = tokens;
	}

	parse(): ActionAST {
		const firstToken = this.current();

		// Check if this starts with WHERE (invalid - WHERE requires FOR)
		if (firstToken.type === ActionTokenType.WHERE) {
			throw new ActionParserError(
				'WHERE requires FOR keyword. WHERE can only be used with collection operations (arrays/objects). ' +
				'Expected FOR keyword at start. WHERE must come after FOR and path.\n' +
				'Example: FOR tasks WHERE status = "done" SET priority 10',
				firstToken
			);
		}

		// Check for FOR (collection operation)
		if (firstToken.type === ActionTokenType.FOR) {
			return this.parseCollectionAction();
		}

		// Check if this might be a collection operation missing FOR
		if (firstToken.type === ActionTokenType.IDENTIFIER) {
			const secondToken = this.peek();
			if (secondToken) {
				// Pattern: path WHERE ... (missing FOR)
				if (secondToken.type === ActionTokenType.WHERE) {
					throw new ActionParserError(
						`Expected FOR keyword. Did you forget FOR? Use: FOR ${firstToken.value} WHERE ...`,
						firstToken
					);
				}

				// Pattern: path APPEND/PREPEND/etc (missing FOR)
				const collectionOps = [
					ActionTokenType.APPEND, ActionTokenType.PREPEND, ActionTokenType.INSERT,
					ActionTokenType.REMOVE_ALL, ActionTokenType.DEDUPLICATE, ActionTokenType.SORT,
					ActionTokenType.MERGE, ActionTokenType.MERGE_OVERWRITE
				];
				if (collectionOps.includes(secondToken.type)) {
					// Build the correct suggestion
					let suggestion = `FOR ${firstToken.value} ${secondToken.value}`;
					if (secondToken.type === ActionTokenType.APPEND) {
						suggestion += ' "item"';
					}
					throw new ActionParserError(
						`Expected FOR keyword before collection operation. Use: ${suggestion}`,
						firstToken
					);
				}
			}
		}

		// Otherwise, parse scalar operation
		return this.parseScalarAction();
	}

	/**
	 * Parse collection action: FOR path [WHERE condition] operation
	 */
	private parseCollectionAction(): ActionAST {
		this.advance(); // consume FOR

		// Expect path after FOR
		const pathToken = this.current();
		if (pathToken.type === ActionTokenType.WHERE) {
			throw new ActionParserError('Expected path after FOR, found WHERE', pathToken);
		}
		if (pathToken.type === ActionTokenType.SET) {
			throw new ActionParserError(
				`Expected path after FOR, found SET. FOR keyword not allowed for scalar operations like SET.`,
				pathToken
			);
		}
		if (pathToken.type === ActionTokenType.DELETE) {
			throw new ActionParserError(
				`Expected path after FOR, found DELETE. FOR keyword not allowed for scalar operations like DELETE.`,
				pathToken
			);
		}
		if (pathToken.type === ActionTokenType.RENAME || pathToken.type === ActionTokenType.INCREMENT ||
		    pathToken.type === ActionTokenType.DECREMENT) {
			throw new ActionParserError(
				`Expected path after FOR, found ${pathToken.type}. ${pathToken.type} is a scalar operation and cannot be used with FOR.`,
				pathToken
			);
		}
		if (pathToken.type === ActionTokenType.EOF) {
			throw new ActionParserError('Expected path after FOR', pathToken);
		}

		const path = this.parsePath();

		// Check for WHERE clause
		let condition: ConditionAST | undefined = undefined;
		if (this.current().type === ActionTokenType.WHERE) {
			this.advance(); // consume WHERE

			// Collect condition tokens until we hit an operation keyword or position keyword
			const conditionTokens: ActionToken[] = [];
			const operationKeywords = [
				ActionTokenType.SET, ActionTokenType.REMOVE, ActionTokenType.APPEND,
				ActionTokenType.PREPEND, ActionTokenType.INSERT, ActionTokenType.REMOVE_ALL,
				ActionTokenType.REPLACE, ActionTokenType.REPLACE_ALL,
				ActionTokenType.SORT, ActionTokenType.MOVE, ActionTokenType.DEDUPLICATE,
				ActionTokenType.MERGE, ActionTokenType.MERGE_OVERWRITE,
				ActionTokenType.AFTER, ActionTokenType.BEFORE, ActionTokenType.TO, // Position keywords for implicit MOVE
				ActionTokenType.EOF
			];

			while (!operationKeywords.includes(this.current().type)) {
				// Check for duplicate WHERE
				if (this.current().type === ActionTokenType.WHERE) {
					throw new ActionParserError(
						'Unexpected WHERE. Multiple WHERE clauses not allowed. Use AND to combine conditions. Use: WHERE a = 1 AND b = 2',
						this.current()
					);
				}
				conditionTokens.push(this.current());
				this.advance();
			}

			if (conditionTokens.length === 0) {
				throw new ActionParserError('Syntax error: Expected condition after WHERE', this.current());
			}

			const conditionStr = this.reconstructConditionString(conditionTokens);
			condition = parseCondition(conditionStr);
		}

		// Parse operation
		const opToken = this.current();

		// Handle implicit MOVE when WHERE is followed by position keywords (AFTER/BEFORE/TO)
		if (condition && (opToken.type === ActionTokenType.AFTER || opToken.type === ActionTokenType.BEFORE || opToken.type === ActionTokenType.TO)) {
			// Implicit MOVE: FOR path WHERE condition AFTER/BEFORE/TO target
			// This is shorthand for: FOR path WHERE condition MOVE TO AFTER/BEFORE target
			return this.parseForMove(path, condition);
		}

		if (opToken.type === ActionTokenType.EOF) {
			if (condition) {
				throw new ActionParserError('Expected operation keyword after WHERE condition', opToken);
			} else {
				throw new ActionParserError('Expected operation keyword after path', opToken);
			}
		}

		// Check for scalar operations with FOR (invalid)
		// Note: SET can be used with FOR if there's a WHERE clause (conditional update)
		// So only reject if it's a simple SET without WHERE
		if (opToken.type === ActionTokenType.DELETE) {
			throw new ActionParserError(
				`FOR keyword not allowed for scalar operations. Use: DELETE ${path}`,
				opToken
			);
		}
		if (opToken.type === ActionTokenType.RENAME) {
			// Try to extract the TO and newName for better error message
			const toToken = this.peek(1);
			const newNameToken = this.peek(2);
			const newNameHint = newNameToken?.type === ActionTokenType.IDENTIFIER
				? String(newNameToken.value)
				: 'creator';
			throw new ActionParserError(
				`FOR keyword not allowed for scalar operations. Use: RENAME ${path} TO ${newNameHint}`,
				opToken
			);
		}

		// Dispatch to specific operation parsers with WHERE validation
		switch (opToken.type) {
			case ActionTokenType.SET:
				return this.parseConditionalSet(path, condition);
			case ActionTokenType.REMOVE:
				return this.parseConditionalRemove(path, condition);
			case ActionTokenType.APPEND:
				this.validateNoWhere(condition, 'APPEND');
				return this.parseForAppend(path);
			case ActionTokenType.PREPEND:
				this.validateNoWhere(condition, 'PREPEND');
				return this.parseForPrepend(path);
			case ActionTokenType.INSERT:
				this.validateNoWhere(condition, 'INSERT', 'Use conditional SET instead');
				return this.parseForInsert(path);
			case ActionTokenType.REMOVE_ALL:
				this.validateNoWhere(condition, 'REMOVE_ALL');
				return this.parseForRemoveAll(path);
			case ActionTokenType.REMOVE_AT:
				this.validateNoWhere(condition, 'REMOVE_AT');
				return this.parseForRemoveAt(path);
			case ActionTokenType.REPLACE:
				this.validateNoWhere(condition, 'REPLACE');
				return this.parseForReplace(path);
			case ActionTokenType.REPLACE_ALL:
				this.validateNoWhere(condition, 'REPLACE_ALL');
				return this.parseForReplaceAll(path);
			case ActionTokenType.SORT:
				this.validateNoWhere(condition, 'SORT');
				return this.parseForSort(path);
			case ActionTokenType.MOVE:
				return this.parseForMove(path, condition);
			case ActionTokenType.DEDUPLICATE:
				this.validateNoWhere(condition, 'DEDUPLICATE');
				return this.parseForDeduplicate(path);
			case ActionTokenType.MERGE:
				this.validateNoWhere(condition, 'MERGE');
				return this.parseForMerge(path);
			case ActionTokenType.MERGE_OVERWRITE:
				this.validateNoWhere(condition, 'MERGE_OVERWRITE');
				return this.parseForMergeOverwrite(path);
			default:
				throw new ActionParserError(
					`Unexpected operation keyword. Expected: SET, DELETE, RENAME, INSERT, REMOVE, SORT, MOVE, DEDUPLICATE, MERGE, REPLACE`,
					opToken
				);
		}
	}

	/**
	 * Parse scalar action: SET/DELETE/RENAME/INCREMENT/DECREMENT
	 */
	private parseScalarAction(): ActionAST {
		const operation = this.current();

		switch (operation.type) {
			case ActionTokenType.SET:
				return this.parseScalarSet();
			case ActionTokenType.DELETE:
				return this.parseScalarDelete();
			case ActionTokenType.RENAME:
				return this.parseScalarRename();
			case ActionTokenType.INCREMENT:
				return this.parseIncrement();
			case ActionTokenType.DECREMENT:
				return this.parseDecrement();
			case ActionTokenType.ADD:
				return this.parseAdd();
			default:
				throw new ActionParserError(`Unknown operation: ${operation.type}`, operation);
		}
	}

	// ===== SCALAR OPERATIONS =====

	/**
	 * SET path value [, path2 value2, ...]
	 */
	private parseScalarSet(): SetAction {
		this.advance(); // consume SET

		// Check for WHERE immediately after SET (invalid)
		if (this.current().type === ActionTokenType.WHERE) {
			throw new ActionParserError(
				'Unexpected WHERE in operation. WHERE must come immediately after path, before operation.\n' +
				'Use: FOR tasks WHERE condition SET ...',
				this.current()
			);
		}

		const path = this.parsePath();

		// Check for WHERE after path but before value (invalid on scalar SET)
		if (this.current().type === ActionTokenType.WHERE) {
			throw new ActionParserError(
				'WHERE not allowed on scalar operations. WHERE is only for collection operations (arrays/objects).\n' +
				'Did you mean to use FOR? Example: FOR tasks WHERE ... SET ...',
				this.current()
			);
		}

		const value = this.parseValue();

		// Check for WHERE after value (invalid - wrong position)
		if (this.current().type === ActionTokenType.WHERE) {
			throw new ActionParserError(
				`WHERE must come before operation. Use: FOR ${path} WHERE status = "done" SET ...`,
				this.current()
			);
		}

		// Check for additional field-value pairs (multi-SET support)
		const fields: Array<{ path: string; value: any }> = [{ path, value }];

		while (this.current().type === ActionTokenType.COMMA) {
			this.advance(); // consume COMMA
			const additionalPath = this.parsePath();
			const additionalValue = this.parseValue();
			fields.push({ path: additionalPath, value: additionalValue });
		}

		// Return v2.0 AST structure (pure, no backward compat)
		const result: any = {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'SET',
				value
			}
		};

		// If multiple fields, add fields array to operation
		if (fields.length > 1) {
			result.operation.fields = fields.map(f => ({
				path: f.path,
				segments: this.pathToSegments(f.path),
				value: f.value
			}));
		}

		return result as SetAction;
	}

	/**
	 * DELETE path
	 */
	private parseScalarDelete(): DeleteAction {
		this.advance(); // consume DELETE

		// Check for WHERE (invalid on DELETE)
		const nextToken = this.current();
		if (nextToken.type === ActionTokenType.IDENTIFIER) {
			const pathStart = this.position;
			this.parsePath();
			if (this.current().type === ActionTokenType.WHERE) {
				this.position = pathStart;
				throw new ActionParserError(
					'WHERE not allowed on scalar operations (DELETE is for single fields).\n' +
					'Did you mean array REMOVE? Use: FOR array WHERE condition REMOVE',
					this.current()
				);
			}
			this.position = pathStart;
		}

		const path = this.parsePath();

		// Return v2.0 AST structure (pure)
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'DELETE'
			}
		} as any;
	}

	/**
	 * RENAME oldPath TO newPath
	 */
	private parseScalarRename(): RenameAction {
		this.advance(); // consume RENAME
		const oldPath = this.parsePath();
		
		// Support two syntaxes:
		// 1. RENAME oldPath TO newPath (with TO keyword - user-facing docs)
		// 2. RENAME oldPath newPath (without TO keyword - test suite format)
		const nextToken = this.current();
		let newPath: string;
		
		if (nextToken.type === ActionTokenType.TO) {
			// Syntax 1: RENAME oldPath TO newPath
			this.advance(); // consume TO
			newPath = this.parsePath(); // Support nested paths: metadata.newField
		} else if (nextToken.type === ActionTokenType.IDENTIFIER) {
			// Syntax 2: RENAME oldPath newPath (direct, no TO keyword)
			// Support both simple identifiers and nested paths
			newPath = this.parsePath();
		} else {
			throw new ActionParserError(
				'Expected TO keyword or new field name after path in RENAME. ' +
				'Syntax: RENAME oldPath TO newPath OR RENAME oldPath newPath',
				nextToken
			);
		}

		// Return v2.0 AST structure (pure)
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(oldPath)
			},
			operation: {
				type: 'RENAME',
				to: newPath
			}
		} as any;
	}

	/**
	 * INCREMENT path amount
	 */
	private parseIncrement(): IncrementAction {
		this.advance(); // consume INCREMENT
		const path = this.parsePath();
		const amount = this.expectNumber('Expected number for INCREMENT amount');

		// Return v2.0 AST structure
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'INCREMENT',
				amount
			}
		} as any;
	}

	/**
	 * DECREMENT path amount
	 */
	private parseDecrement(): DecrementAction {
		this.advance(); // consume DECREMENT
		const path = this.parsePath();
		const amount = this.expectNumber('Expected number for DECREMENT amount');

		// Return v2.0 AST structure
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'DECREMENT',
				amount
			}
		} as any;
	}

	/**
	 * ADD path value - Add field only if it doesn't exist
	 * Behavior: Warns if field already exists, doesn't overwrite
	 */
	private parseAdd(): AddAction {
		this.advance(); // consume ADD
		const path = this.parsePath();
		const value = this.parseValue();

		// Return v2.0 AST structure with ADD operation
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'ADD',
				value
			}
		} as any;
	}

	// ===== COLLECTION OPERATIONS (FOR-based) =====

	/**
	 * FOR path WHERE condition SET field value [, field2 value2, ...]
	 */
	private parseConditionalSet(path: string, condition: ConditionAST | undefined): UpdateWhereAction {
		if (!condition) {
			// Check if WHERE appears later in the token stream (wrong position)
			let whereFoundLater = false;
			for (let i = this.position + 1; i < this.tokens.length; i++) {
				if (this.tokens[i].type === ActionTokenType.WHERE) {
					whereFoundLater = true;
					break;
				}
				if (this.tokens[i].type === ActionTokenType.EOF) {
					break;
				}
			}

			if (whereFoundLater) {
				// WHERE appears after operation started - check if it's immediately after SET
				const wherePosition = this.tokens.findIndex((t, i) => i > this.position && t.type === ActionTokenType.WHERE);
				const tokensBeforeWhere = wherePosition - this.position - 1; // -1 for SET itself

				if (tokensBeforeWhere === 0) {
					// WHERE immediately after SET: FOR tasks SET WHERE...
					throw new ActionParserError(
						`Unexpected WHERE in operation. WHERE must come immediately after path, before operation.\n` +
						`Use: FOR ${path} WHERE condition SET ...`,
						this.current()
					);
				} else {
					// WHERE after some tokens: FOR tasks SET priority 10 WHERE...
					throw new ActionParserError(
						`WHERE must come before operation. Use: FOR ${path} WHERE status = "done" SET priority 10`,
						this.current()
					);
				}
			}

			// When FOR is used with SET but no WHERE, determine if this looks like:
			// 1. Scalar operation: FOR title SET "value" → suggest removing FOR
			// 2. Array operation: FOR tasks SET priority 10 → suggest adding WHERE

			const firstToken = this.peek(1); // token after SET
			const secondToken = this.peek(2); // token after first

			// If first token is a direct value (STRING/NUMBER/BOOLEAN), likely scalar misuse
			const isDirectValue = firstToken?.type === ActionTokenType.STRING ||
			                      firstToken?.type === ActionTokenType.NUMBER ||
			                      firstToken?.type === ActionTokenType.BOOLEAN ||
			                      firstToken?.type === ActionTokenType.NULL;

			if (isDirectValue) {
				// Looks like scalar: FOR title SET "value"
				let valueStr = '"value"';
				if (firstToken?.type === ActionTokenType.STRING) {
					valueStr = `"${firstToken.value}"`;
				} else if (firstToken?.value !== undefined) {
					valueStr = String(firstToken.value);
				}

				throw new ActionParserError(
					`FOR keyword not allowed for scalar operations. Use: SET ${path} ${valueStr}`,
					this.current()
				);
			} else {
				// Looks like array operation missing WHERE: FOR tasks SET priority 10
				throw new ActionParserError(
					`SET on array requires WHERE clause to specify which items to update. Specify which items: FOR ${path} WHERE status = "pending" SET priority 10`,
					this.current()
				);
			}
		}

		this.advance(); // consume SET

		// Check for WHERE immediately after SET (wrong position)
		if (this.current().type === ActionTokenType.WHERE) {
			throw new ActionParserError(
				`Unexpected WHERE in operation. WHERE must come immediately after path, before operation.\n` +
				`Use: FOR ${path} WHERE condition SET ...`,
				this.current()
			);
		}

		// Parse updates (field value pairs)
		const updates: Array<{ field: string; value: any }> = [];

		while (true) {
			const field = this.expectIdentifier('Expected field name');
			const value = this.parseValue();
			updates.push({ field, value });

			// Check for WHERE after value (wrong position)
			if (this.current().type === ActionTokenType.WHERE) {
				throw new ActionParserError(
					`WHERE must come before operation. Use: FOR ${path} WHERE status = "done" SET priority 10`,
					this.current()
				);
			}

			if (this.current().type === ActionTokenType.COMMA) {
				this.advance();
				continue;
			} else if (this.current().type === ActionTokenType.EOF) {
				break;
			} else {
				throw new ActionParserError('Expected comma or end after field update', this.current());
			}
		}

		// Return v2.0 AST structure
		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'SET',
				where: condition,
				updates
			}
		} as any;
	}

	/**
	 * FOR path WHERE condition REMOVE
	 */
	private parseConditionalRemove(path: string, condition: ConditionAST | undefined): RemoveAction {
		this.advance(); // consume REMOVE

		// v2.0: REMOVE supports two syntaxes:
		// 1. FOR array WHERE condition REMOVE - removes items matching condition
		// 2. FOR array REMOVE value - removes first occurrence of value
		
		if (condition) {
			// Conditional REMOVE: FOR array WHERE condition REMOVE
			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'REMOVE',
					where: condition
				}
			} as any;
		} else {
			// Value REMOVE: FOR array REMOVE value
			const value = this.parseValue();
			
			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'REMOVE',
					value
				}
			} as any;
		}
	}

	/**
	 * FOR path APPEND value
	 */
	private parseForAppend(path: string): AppendAction {
		this.advance(); // consume APPEND
		const value = this.parseValue();

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'APPEND',
				value
			}
		} as any;
	}

	/**
	 * FOR path PREPEND value
	 */
	private parseForPrepend(path: string): PrependAction {
		this.advance(); // consume PREPEND
		const value = this.parseValue();

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'PREPEND',
				value
			}
		} as any;
	}

	/**
	 * FOR path INSERT value AT index | AFTER reference | BEFORE reference
	 */
	private parseForInsert(path: string): InsertAction | InsertAfterAction | InsertBeforeAction {
		this.advance(); // consume INSERT
		const value = this.parseValue();

		const keyword = this.current();

		// Check for AFTER variant
		if (keyword.type === ActionTokenType.AFTER) {
			this.advance(); // consume AFTER
			const referenceValue = this.parseValue();

			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'INSERT_AFTER',
					value,
					referenceValue
				}
			} as any;
		}

		// Check for BEFORE variant
		if (keyword.type === ActionTokenType.BEFORE) {
			this.advance(); // consume BEFORE
			const referenceValue = this.parseValue();

			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'INSERT_BEFORE',
					value,
					referenceValue
				}
			} as any;
		}

		// Default: AT variant
		this.expect(ActionTokenType.AT, 'Expected AT, AFTER, or BEFORE keyword after value in INSERT');
		const index = this.expectNumber('Expected index number after AT');

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'INSERT',
				value,
				index
			}
		} as any;
	}

	/**
	 * FOR path REMOVE_ALL value (value can be single or array)
	 */
	private parseForRemoveAll(path: string): RemoveAllAction {
		this.advance(); // consume REMOVE_ALL
		const value = this.parseValue();

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'REMOVE_ALL',
				value
			}
		} as any;
	}

	private parseForRemoveAt(path: string): RemoveAtAction {
		this.advance(); // consume REMOVE_AT
		const index = this.expectNumber('index for REMOVE_AT');

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'REMOVE_AT',
				index
			}
		} as any;
	}

	/**
	 * FOR path REPLACE oldValue WITH newValue (first occurrence only)
	 */
	private parseForReplace(path: string): ReplaceAction {
		this.advance(); // consume REPLACE
		const oldValue = this.parseValue();
		this.expect(ActionTokenType.WITH, 'Expected WITH keyword after old value in REPLACE');
		const newValue = this.parseValue();

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'REPLACE',
				oldValue,
				newValue
			}
		} as any;
	}

	/**
	 * FOR path REPLACE_ALL oldValue WITH newValue (all occurrences)
	 */
	private parseForReplaceAll(path: string): ReplaceAllAction {
		this.advance(); // consume REPLACE_ALL
		const oldValue = this.parseValue();
		this.expect(ActionTokenType.WITH, 'Expected WITH keyword after old value in REPLACE_ALL');
		const newValue = this.parseValue();

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'REPLACE_ALL',
				oldValue,
				newValue
			}
		} as any;
	}

	/**
	 * FOR path SORT [BY field] [ASC|DESC]
	 */
	private parseForSort(path: string): SortAction | SortByAction {
		this.advance(); // consume SORT

		const nextToken = this.current();

		// Check for BY field (SORT BY)
		if (nextToken.type === ActionTokenType.BY) {
			this.advance(); // consume BY
			const field = this.expectIdentifier('Expected field name after BY');

			// Optional order
			let order: 'ASC' | 'DESC' = 'ASC';
			const orderToken = this.current();
			if (orderToken.type === ActionTokenType.ASC || orderToken.type === ActionTokenType.DESC) {
				order = orderToken.type === ActionTokenType.DESC ? 'DESC' : 'ASC';
				this.advance();
			}

			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'SORT',
					by: field,
					order
				}
			} as any;
		}

		// Simple SORT with optional order
		let order: 'ASC' | 'DESC' = 'ASC';
		if (nextToken.type === ActionTokenType.ASC || nextToken.type === ActionTokenType.DESC) {
			order = nextToken.type === ActionTokenType.DESC ? 'DESC' : 'ASC';
			this.advance();
		}

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'SORT',
				order
			}
		} as any;
	}

	/**
	 * FOR path MOVE FROM index TO index
	 * OR
	 * FOR path WHERE condition MOVE TO target
	 * OR
	 * FOR path WHERE condition AFTER/BEFORE target (implicit MOVE)
	 */
	private parseForMove(path: string, condition: ConditionAST | undefined): MoveAction | MoveWhereAction {
		// Check if MOVE token is present or if this is implicit MOVE
		const currentToken = this.current();
		const isImplicitMove = (currentToken.type === ActionTokenType.AFTER ||
		                        currentToken.type === ActionTokenType.BEFORE ||
		                        currentToken.type === ActionTokenType.TO);

		if (!isImplicitMove) {
			this.advance(); // consume MOVE token
		}

		const nextToken = this.current();

		// Index-based move: MOVE FROM index TO index
		if (nextToken.type === ActionTokenType.FROM) {
			if (condition) {
				throw new ActionParserError(
					'WHERE clause not allowed with index-based MOVE FROM/TO.\n' +
					'Use: FOR path MOVE FROM n TO m (without WHERE)',
					nextToken
				);
			}

			this.advance(); // consume FROM
			const fromIndex = this.expectNumber('Expected from index');
			this.expect(ActionTokenType.TO, 'Expected TO keyword');
			const toIndex = this.expectNumber('Expected to index');

			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'MOVE',
					from: fromIndex,
					to: toIndex
				}
			} as any;
		}

		// v2.0 syntax: Direct AFTER/BEFORE (without TO)
		// FOR countsLog WHERE count > 5 AFTER book="The Hobbit"
		if (nextToken.type === ActionTokenType.AFTER || nextToken.type === ActionTokenType.BEFORE) {
			if (!condition) {
				throw new ActionParserError(
					`${nextToken.type} requires WHERE clause. For index-based move, use: FOR ${path} MOVE FROM index TO index`,
					nextToken
				);
			}

			const position = nextToken.type;
			this.advance(); // consume AFTER/BEFORE

			// Parse reference condition (everything until EOF)
			const refTokens: ActionToken[] = [];
			while (this.current().type !== ActionTokenType.EOF) {
				refTokens.push(this.current());
				this.advance();
			}

			const refConditionStr = this.reconstructConditionString(refTokens);
			const reference = parseCondition(refConditionStr);

			return {
				type: 'action',
				target: {
					type: 'path',
					segments: this.pathToSegments(path)
				},
				operation: {
					type: 'MOVE',
					where: condition,
					to: { position, reference }
				}
			} as any;
		}

		// Conditional move: MOVE TO target (with TO keyword)
		if (nextToken.type === ActionTokenType.TO) {
			if (!condition) {
				throw new ActionParserError(
					`MOVE TO requires WHERE clause. Use MOVE FROM/TO for index-based move. For index-based move, use: FOR ${path} MOVE FROM index TO index`,
					nextToken
				);
			}

			this.advance(); // consume TO
			const targetToken = this.current();

			// TO index (numeric)
			if (targetToken.type === ActionTokenType.NUMBER) {
				const toIndex = Number(targetToken.value);
				this.advance();
				return {
					type: 'action',
					target: {
						type: 'path',
						segments: this.pathToSegments(path)
					},
					operation: {
						type: 'MOVE',
						where: condition,
						to: toIndex
					}
				} as any;
			}

			if (targetToken.type === ActionTokenType.START) {
				this.advance();
				return {
					type: 'action',
					target: {
						type: 'path',
						segments: this.pathToSegments(path)
					},
					operation: {
						type: 'MOVE',
						where: condition,
						to: 'START'
					}
				} as any;
			} else if (targetToken.type === ActionTokenType.END) {
				this.advance();
				return {
					type: 'action',
					target: {
						type: 'path',
						segments: this.pathToSegments(path)
					},
					operation: {
						type: 'MOVE',
						where: condition,
						to: 'END'
					}
				} as any;
			} else if (targetToken.type === ActionTokenType.AFTER || targetToken.type === ActionTokenType.BEFORE) {
				const position = targetToken.type;
				this.advance();

				// Parse reference condition
				const refTokens: ActionToken[] = [];
				while (this.current().type !== ActionTokenType.EOF) {
					refTokens.push(this.current());
					this.advance();
				}

				const refConditionStr = this.reconstructConditionString(refTokens);
				const reference = parseCondition(refConditionStr);

				return {
					type: 'action',
					target: {
						type: 'path',
						segments: this.pathToSegments(path)
					},
					operation: {
						type: 'MOVE',
						where: condition,
						to: { position, reference }
					}
				} as any;
			} else {
				throw new ActionParserError('Expected index, START, END, AFTER, or BEFORE after TO', targetToken);
			}
		}

		throw new ActionParserError('Expected FROM, TO, AFTER, or BEFORE after MOVE', nextToken);
	}

	/**
	 * FOR path DEDUPLICATE
	 */
	private parseForDeduplicate(path: string): DeduplicateAction {
		this.advance(); // consume DEDUPLICATE

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'DEDUPLICATE'
			}
		} as any;
	}

	/**
	 * FOR path MERGE object
	 */
	private parseForMerge(path: string): MergeAction {
		this.advance(); // consume MERGE
		const value = this.parseValue();

		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new ActionParserError('MERGE requires an object value', this.current());
		}

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'MERGE',
				value
			}
		} as any;
	}

	/**
	 * FOR path MERGE_OVERWRITE object
	 */
	private parseForMergeOverwrite(path: string): MergeOverwriteAction {
		this.advance(); // consume MERGE_OVERWRITE
		const value = this.parseValue();

		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new ActionParserError('MERGE_OVERWRITE requires an object value', this.current());
		}

		return {
			type: 'action',
			target: {
				type: 'path',
				segments: this.pathToSegments(path)
			},
			operation: {
				type: 'MERGE_OVERWRITE',
				value
			}
		} as any;
	}

	// ===== HELPER METHODS =====

	/**
	 * Validate that WHERE clause is not present for operations that forbid it
	 */
	private validateNoWhere(condition: ConditionAST | undefined, operation: string, suggestion?: string): void {
		if (condition) {
			const msg = `WHERE clause not allowed with ${operation}.` +
				(suggestion ? ` ${suggestion}.` : '');
			throw new ActionParserError(msg, this.current());
		}
	}


	/**
	 * Parse path (supports dot notation and array indices)
	 */
	/**
	 * Parse path and return both string (for backward compat) and segments (for v2.0)
	 */
	private parsePath(): string {
		let path = '';

		const startToken = this.current();
		if (startToken.type !== ActionTokenType.IDENTIFIER) {
			throw new ActionParserError('Expected identifier for path', startToken);
		}

		path = String(startToken.value);
		this.advance();

		// Continue building path with dots and brackets
		while (true) {
			const token = this.current();

			if (token.type === ActionTokenType.DOT) {
				this.advance();
				const next = this.current();

				if (next.type === ActionTokenType.IDENTIFIER) {
					path += '.' + next.value;
					this.advance();
				} else {
					throw new ActionParserError('Expected identifier after dot', next);
				}
			} else if (token.type === ActionTokenType.LBRACKET) {
				this.advance();
				const indexToken = this.current();

				if (indexToken.type === ActionTokenType.NUMBER) {
					path += `[${indexToken.value}]`;
					this.advance();
				} else {
					throw new ActionParserError('Expected number in array index', indexToken);
				}

				this.expect(ActionTokenType.RBRACKET, 'Expected closing bracket');
			} else {
				break;
			}
		}

		return path;
	}

	/**
	 * Convert string path to v2.0 path segments structure
	 * "title" -> [{ type: 'property', key: 'title' }]
	 * "metadata.author" -> [{ type: 'property', key: 'metadata' }, { type: 'property', key: 'author' }]
	 * "tasks[0]" -> [{ type: 'property', key: 'tasks' }, { type: 'index', index: 0 }]
	 */
	private pathToSegments(path: string): Array<{ type: string; key?: string; index?: number }> {
		const segments: Array<{ type: string; key?: string; index?: number }> = [];

		// Split by dots, but handle array indices
		const parts = path.split(/\.(?![^\[]*\])/); // Split on dots not inside brackets

		for (const part of parts) {
			// Check if this part has an array index
			const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
			if (arrayMatch) {
				// Property with array index: "tasks[0]"
				segments.push({ type: 'property', key: arrayMatch[1] });
				segments.push({ type: 'index', index: parseInt(arrayMatch[2]) });
			} else {
				// Simple property: "title" or "author"
				segments.push({ type: 'property', key: part });
			}
		}

		return segments;
	}

	/**
	 * Parse value (string, number, boolean, null, object, array)
	 */
	private parseValue(): any {
		const token = this.current();

		if (token.type === ActionTokenType.STRING) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.NUMBER) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.BOOLEAN) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.NULL) {
			this.advance();
			return null;
		}

		if (token.type === ActionTokenType.OBJECT) {
			this.advance();
			return token.value;
		}

		if (token.type === ActionTokenType.ARRAY) {
			this.advance();
			return token.value;
		}

		throw new ActionParserError('Expected value', token);
	}

	/**
	 * Reconstruct condition string from tokens
	 */
	private reconstructConditionString(tokens: ActionToken[]): string {
		return tokens.map(t => {
			if (t.type === ActionTokenType.STRING) {
				return `"${t.value}"`;
			}
			const operatorMap: Record<string, string> = {
				[ActionTokenType.EQUALS]: '=',
				[ActionTokenType.NOT_EQUALS]: '!=',
				[ActionTokenType.GREATER_THAN]: '>',
				[ActionTokenType.LESS_THAN]: '<',
				[ActionTokenType.GREATER_EQUAL]: '>=',
				[ActionTokenType.LESS_EQUAL]: '<=',
				[ActionTokenType.REGEX_MATCH]: '~',
				[ActionTokenType.EXCLAMATION]: '!',
			};
			if (operatorMap[t.type]) {
				return operatorMap[t.type];
			}
			return String(t.value);
		}).join(' ');
	}

	/**
	 * Get current token
	 */
	private current(): ActionToken {
		return this.tokens[this.position];
	}

	/**
	 * Peek at next token without consuming
	 */
	private peek(offset: number = 1): ActionToken | undefined {
		const pos = this.position + offset;
		return pos < this.tokens.length ? this.tokens[pos] : undefined;
	}

	/**
	 * Advance to next token
	 */
	private advance(): void {
		if (this.position < this.tokens.length - 1) {
			this.position++;
		}
	}

	/**
	 * Expect a specific token type and advance
	 */
	private expect(type: ActionTokenType, message: string): void {
		const token = this.current();
		if (token.type !== type) {
			throw new ActionParserError(message, token);
		}
		this.advance();
	}

	/**
	 * Expect an identifier and return its value
	 */
	private expectIdentifier(message: string): string {
		const token = this.current();
		if (token.type !== ActionTokenType.IDENTIFIER) {
			throw new ActionParserError(message, token);
		}
		const value = String(token.value);
		this.advance();
		return value;
	}

	/**
	 * Expect a number and return its value
	 */
	private expectNumber(message: string): number {
		const token = this.current();
		if (token.type !== ActionTokenType.NUMBER) {
			throw new ActionParserError(message, token);
		}
		const value = token.value as number;
		this.advance();
		return value;
	}
}
