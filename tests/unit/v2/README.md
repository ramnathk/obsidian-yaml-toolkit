# Hybrid v2.0 Grammar Test Suite

**Status**: 🔴 **TESTS WILL FAIL** - Parser not yet updated to Hybrid v2.0

**Purpose**: Test-Driven Development (TDD) suite for Hybrid v2.0 grammar implementation

**Created**: 2024-12-05

---

## Overview

This test suite contains **comprehensive tests for the Hybrid v2.0 grammar specification** as documented in `docs/prp/grammar.ebnf`. These tests are written in **true TDD fashion**: they define the exact expected behavior of the v2.0 parser and runtime.

### Hybrid v2.0 Approach

**Two syntax modes for optimal usability**:

1. **Scalars** (simple fields): NO FOR keyword needed
   - `SET title "value"` ✅ (direct, verb-first)
   - `DELETE draft` ✅
   - `RENAME old TO new` ✅
   - `INCREMENT count 5` ✅
   - `DECREMENT count 5` ✅

2. **Collections** (arrays, objects): WITH FOR keyword
   - `FOR tasks WHERE status = "done" SET archived true` ✅
   - `FOR tags INSERT "urgent" AT -1` ✅
   - `FOR array SORT BY priority DESC` ✅

**Benefits**:
- **Simpler for common case**: 80% of operations are scalar updates (no FOR needed)
- **Clear for complex operations**: FOR signals collection operations
- **Backwards compatible**: Most v1.0 scalar syntax unchanged
- **Natural semantics**: FOR implies "for each item in collection"

### Why These Tests Will Fail

- **Current parser** implements v1.0 syntax only
- **These tests** validate Hybrid v2.0 syntax (scalars + FOR collections)
- Tests use exact expected outputs for v2.0 behavior
- Until parser is updated, new collection syntax will not be recognized

### Test Philosophy

1. **Write tests first** - Define exact behavior before implementation
2. **Precise expectations** - Every test has exact expected AST structure and data output
3. **Fail explicitly** - Tests fail with clear messages about what's missing
4. **Document by example** - Tests serve as living specification

---

## Test Files

### 1. `basic-operations.test.ts` (290 lines, ~70 tests)

**Focus**: Hybrid v2.0 syntax with basic operations

**Coverage**:
- **Scalars (no FOR)**:
  - `SET title "value"` - Direct scalar updates
  - `DELETE draft` - Direct field deletion
  - `RENAME old TO new` - Direct field renaming
  - `INCREMENT count 5` - Direct increment (unchanged from v1.0)
  - `DECREMENT count 5` - Direct decrement (unchanged from v1.0)
- **Collections (with FOR)**:
  - `FOR array SET field value` - Collection updates (requires WHERE)
  - Path notation (simple, nested, array indices)
  - Value types (strings, numbers, booleans, null, arrays, objects)

**Key Test Categories**:
- Parse tests (validates AST structure)
- Execute tests (validates data transformations)
- Error handling (invalid syntax, type mismatches)
- Edge cases (nested paths, special values)

**Example Test**:
```typescript
it('should parse: SET title "New Title" (scalar, no FOR)', () => {
  const input = 'SET title "New Title"';
  const result = parseAction(input);

  expect(result).toEqual({
    type: 'action',
    target: { type: 'path', segments: [{ type: 'property', key: 'title' }] },
    operation: { type: 'SET', value: 'New Title' }
  });
});
```

---

### 2. `array-operations.test.ts` (330 lines, ~65 tests)

**Focus**: Collection operations with FOR prefix (Hybrid v2.0)

**Coverage**:
- `FOR array INSERT value AT index` - All array insertion (replaces APPEND/PREPEND/INSERT_AT)
  - `AT -1` = append (end)
  - `AT 0` = prepend (start)
  - `AT n` = insert at specific position
- `FOR array REMOVE_ALL value` - Polymorphic (single value OR array)
- `FOR array SORT [BY field] [order]` - Array sorting
- `FOR array MOVE FROM index TO index` - Index-based repositioning
- `FOR array DEDUPLICATE` - Remove duplicates

**Key Changes from v1.0** (collections only):
- ❌ `APPEND array value` → ✅ `FOR array INSERT value AT -1`
- ❌ `PREPEND array value` → ✅ `FOR array INSERT value AT 0`
- ❌ `INSERT_AT array value AT n` → ✅ `FOR array INSERT value AT n`
- ❌ `REMOVE_ANY array [values]` → ✅ `FOR array REMOVE_ALL [values]`
- ❌ `SORT_BY array BY field` → ✅ `FOR array SORT BY field`

**Example Test**:
```typescript
it('should execute: FOR tags INSERT "urgent" AT -1 (append)', () => {
  const data = { tags: ['work', 'project'] };
  const actions = [parseAction('FOR tags INSERT "urgent" AT -1')];
  const result = executeActions(data, actions);

  expect(result.success).toBe(true);
  expect(result.data.tags).toEqual(['work', 'project', 'urgent']);
});
```

---

### 3. `conditional-operations.test.ts` (450 lines, ~75 tests)

**Focus**: Conditional operations with WHERE clauses (collections only)

**Coverage**:
- `FOR array WHERE condition SET field value` - Conditional updates on collections
- `FOR array WHERE condition REMOVE` - Conditional deletion from collections
- `FOR array WHERE condition MOVE TO target` - Conditional repositioning
- Complex WHERE conditions (AND, OR, NOT, parentheses)
- Special operators (HAS, NOT HAS, contains, IN)

**Key Changes from v1.0** (collections only):
- ❌ `UPDATE_WHERE array WHERE... SET` → ✅ `FOR array WHERE... SET`
- ❌ `MOVE_WHERE array WHERE... TO` → ✅ `FOR array WHERE... MOVE TO`

**Note**: WHERE clauses only work on collections (arrays, objects). Scalar operations do not support WHERE.

**Example Test**:
```typescript
it('should execute: FOR tasks WHERE status = "pending" SET priority 10', () => {
  const data = {
    tasks: [
      { title: 'Task 1', status: 'pending', priority: 1 },
      { title: 'Task 2', status: 'done', priority: 1 },
      { title: 'Task 3', status: 'pending', priority: 1 }
    ]
  };
  const actions = [parseAction('FOR tasks WHERE status = "pending" SET priority 10')];
  const result = executeActions(data, actions);

  expect(result.success).toBe(true);
  expect(result.data.tasks[0].priority).toBe(10);
  expect(result.data.tasks[1].priority).toBe(1);
  expect(result.data.tasks[2].priority).toBe(10);
});
```

---

### 4. `migration-v1-to-v2.test.ts` (520 lines, ~50 pairs)

**Focus**: Side-by-side comparison of v1.0 vs Hybrid v2.0 syntax

**Coverage**:
- Every v1.0 operation mapped to Hybrid v2.0 equivalent
- Both syntaxes tested with identical data and expected results
- Migration table documenting syntax changes (scalars vs collections)
- Complex real-world migration scenarios

**Key Migration Insights**:
- **Scalars**: Most v1.0 syntax UNCHANGED (SET, DELETE, RENAME, INCREMENT, DECREMENT)
- **Collections**: v1.0 syntax updated to use FOR prefix

**Purpose**:
- Document migration path
- Verify behavioral equivalence
- Provide upgrade guide for users
- Show that most operations stay the same

**Example Test Pair**:
```typescript
describe('Migration: Scalar operations (unchanged)', () => {
  it('v1.0: INCREMENT count 1 (current parser)', () => {
    const data = { count: 5 };
    const actions = [parseAction('INCREMENT count 1')];
    const result = executeActions(data, actions);

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(6);
  });

  it('v2.0: INCREMENT count 1 (same syntax, no change)', () => {
    const data = { count: 5 };
    const actions = [parseAction('INCREMENT count 1')];
    const result = executeActions(data, actions);

    expect(result.success).toBe(true);
    expect(result.data.count).toBe(6);
  });
});
```

---

### 5. `edge-cases-errors.test.ts` (580 lines, ~95 tests)

**Focus**: Error handling, boundary conditions, edge cases

**Coverage**:
- Parser errors (invalid syntax, incomplete operations)
- Runtime errors (type mismatches, invalid operations)
- Edge cases (empty arrays, boundary indices, deeply nested paths)
- Special characters and escaping (quotes, newlines, unicode, emoji)
- Numeric precision (floats, very large/small numbers)
- Complex WHERE conditions (deeply nested logic, multiple NOT)
- Error message quality (helpful messages, suggestions, context)

**Example Test**:
```typescript
it('should reject invalid syntax: FOR without operation', () => {
  expect(() => parseAction('FOR tasks'))
    .toThrow(/Expected operation after FOR/i);
});

it('should provide helpful error for type mismatch', () => {
  expect(() => parseAction('FOR title INSERT "value" AT 0'))
    .toThrow(/INSERT requires array target/i);
});
```

---

### 6. `syntax-validation.test.ts` (480 lines, ~60 tests)

**Focus**: Cross-keyword dependencies and syntax rules (Hybrid v2.0)

**Coverage**:
- WHERE without FOR (e.g., `WHERE status = "done" SET ...`) ❌
- FOR without required components (e.g., `FOR tasks` with no operation) ❌
- Scalar operations that forbid WHERE:
  - `SET title "value"` ✅ (no FOR, no WHERE)
  - `DELETE draft` ✅ (no FOR, no WHERE)
  - `RENAME old TO new` ✅ (no FOR, no WHERE)
  - `INCREMENT count 5` ✅ (no FOR, no WHERE)
  - `DECREMENT count 5` ✅ (no FOR, no WHERE)
- Collection operations requiring WHERE:
  - `FOR tasks REMOVE` ❌ (requires WHERE)
  - `FOR tasks WHERE... REMOVE` ✅
  - `FOR tasks SET field value` ❌ (requires WHERE)
  - `FOR tasks WHERE... SET field value` ✅
- Collection operations forbidding WHERE:
  - `FOR tags INSERT "value" AT 0` ✅ (no WHERE)
  - `FOR tags WHERE... INSERT "value" AT 0` ❌ (INSERT forbids WHERE)
  - `FOR tags DEDUPLICATE` ✅ (no WHERE)
  - `FOR tags WHERE... DEDUPLICATE` ❌ (DEDUPLICATE forbids WHERE)
- Multiple WHERE clauses (invalid)
- WHERE in wrong positions (before FOR, after operation)
- Context-sensitive validation (scalar vs array operations)
- Helpful error messages with suggestions

**Validation Rules Matrix** (Hybrid v2.0):

| Operation | Uses FOR | Requires WHERE | Allows WHERE | Example |
|-----------|----------|----------------|--------------|---------|
| SET (scalar) | ❌ | ❌ | ❌ | `SET title "value"` |
| SET (array) | ✅ | ✅ | ✅ | `FOR tasks WHERE... SET priority 10` |
| DELETE (scalar) | ❌ | ❌ | ❌ | `DELETE draft` |
| RENAME | ❌ | ❌ | ❌ | `RENAME old TO new` |
| INCREMENT | ❌ | ❌ | ❌ | `INCREMENT count 5` |
| DECREMENT | ❌ | ❌ | ❌ | `DECREMENT count 5` |
| INSERT | ✅ | ❌ | ❌ | `FOR tags INSERT "value" AT 0` |
| REMOVE (array) | ✅ | ✅ | ✅ | `FOR tasks WHERE... REMOVE` |
| REMOVE_ALL | ✅ | ❌ | ❌ | `FOR tags REMOVE_ALL "old"` |
| SORT | ✅ | ❌ | ❌ | `FOR tasks SORT BY priority` |
| MOVE (index) | ✅ | ❌ | ❌ | `FOR tasks MOVE FROM 0 TO 5` |
| MOVE (target) | ✅ | ✅ | ✅ | `FOR tasks WHERE... MOVE TO START` |
| DEDUPLICATE | ✅ | ❌ | ❌ | `FOR tags DEDUPLICATE` |
| MERGE | ✅ | ❌ | ❌ | `FOR metadata MERGE {...}` |

**Example Tests**:
```typescript
// WHERE without FOR
it('should reject: WHERE status = "done" SET priority 10', () => {
  expect(() => parseAction('WHERE status = "done" SET priority 10'))
    .toThrow(/Expected operation keyword/);
});

// REMOVE without WHERE (collection operation)
it('should reject: FOR tasks REMOVE (requires WHERE)', () => {
  expect(() => parseAction('FOR tasks REMOVE'))
    .toThrow(/REMOVE requires WHERE clause/);
});

// WHERE on INSERT (forbidden)
it('should reject: FOR tags WHERE... INSERT "value" AT 0', () => {
  expect(() => parseAction('FOR tags WHERE status = "done" INSERT "value" AT 0'))
    .toThrow(/INSERT does not allow WHERE clause/);
});
```

---

### 7. `real-world-scenarios.test.ts` (450 lines, ~25 scenarios)

**Focus**: Complete end-to-end workflows demonstrating Hybrid v2.0 usage

**Coverage**:
- Task Management System (completion workflow, prioritization, cleanup)
- Content Management System (publishing workflow, categorization)
- E-Commerce Product Management (discounts, inventory, pricing)
- Project Tracking and Sprints (sprint workflow, team workload)
- Personal Knowledge Management (note organization, reading list)
- Analytics and Metrics (performance metrics, campaign ROI)
- Multi-step Complex Workflows (complete pipelines with 10+ actions)
- Mix of scalar and collection operations

**Purpose**:
- Validate complete user workflows
- Test action composition (scalars + collections)
- Ensure operations work together correctly
- Document best practices for Hybrid v2.0

**Example Scenario**:
```typescript
it('should complete task workflow: mark done, archive, update metrics', () => {
  const data = {
    status: 'active',
    completedCount: 10,
    tasks: [
      { title: 'Task 1', status: 'pending', priority: 5, assignee: 'Alice' },
      { title: 'Task 2', status: 'in-progress', priority: 8, assignee: 'Bob' },
      { title: 'Task 3', status: 'pending', priority: 3, assignee: 'Alice' }
    ]
  };

  const actions = [
    // Collection operations (use FOR)
    parseAction('FOR tasks WHERE status = "pending" AND assignee = "Alice" SET status "in-progress"'),
    parseAction('FOR tasks WHERE priority > 7 SET urgent true'),
    parseAction('FOR tasks SORT BY priority DESC'),
    // Scalar operations (no FOR)
    parseAction('INCREMENT completedCount 2'),
    parseAction('SET status "processing"')
  ];

  const result = executeActions(data, actions);

  expect(result.success).toBe(true);
  expect(result.data.status).toBe('processing');
  expect(result.data.completedCount).toBe(12);
  // ... additional assertions
});
```

---

## Test Statistics

| File | Lines | Tests | Focus |
|------|-------|-------|-------|
| `basic-operations.test.ts` | 290 | ~70 | Hybrid v2.0 basics (scalars + collections) |
| `array-operations.test.ts` | 330 | ~65 | Collection operations with FOR |
| `conditional-operations.test.ts` | 450 | ~75 | WHERE clauses (collections only) |
| `migration-v1-to-v2.test.ts` | 520 | ~50 | v1.0 → Hybrid v2.0 migration |
| `edge-cases-errors.test.ts` | 580 | ~95 | Error handling & edge cases |
| `syntax-validation.test.ts` | 480 | ~60 | Cross-keyword dependencies |
| `real-world-scenarios.test.ts` | 450 | ~25 | End-to-end workflows |
| **TOTAL** | **3,100** | **~440** | **Complete Hybrid v2.0 coverage** |

---

## Running the Tests

### Current Behavior (Parser at v1.0)

```bash
npm test tests/unit/v2/

# Expected output:
# ❌ FAIL  tests/unit/v2/array-operations.test.ts
#    Expected FOR keyword for collection operations
# ❌ FAIL  tests/unit/v2/conditional-operations.test.ts
#    Expected FOR keyword for collection operations
# ⚠️  PARTIAL  tests/unit/v2/basic-operations.test.ts
#    Scalar tests pass, collection tests fail
# (... collection-related tests fail)
#
# Test Suites: 5 failed, 0 passed, 7 total
# Tests:       ~300 failed, ~140 passed, ~440 total
```

**Note**: In Hybrid v2.0, scalar operations (SET, DELETE, RENAME, INCREMENT, DECREMENT) are unchanged from v1.0, so those tests should pass. Collection operations (FOR prefix) will fail until parser is updated.

### Expected Behavior (After Parser Update to Hybrid v2.0)

```bash
npm test tests/unit/v2/

# Expected output:
# ✅ PASS  tests/unit/v2/basic-operations.test.ts (70 tests)
# ✅ PASS  tests/unit/v2/array-operations.test.ts (65 tests)
# ✅ PASS  tests/unit/v2/conditional-operations.test.ts (75 tests)
# ✅ PASS  tests/unit/v2/migration-v1-to-v2.test.ts (50 tests)
# ✅ PASS  tests/unit/v2/edge-cases-errors.test.ts (95 tests)
# ✅ PASS  tests/unit/v2/syntax-validation.test.ts (60 tests)
# ✅ PASS  tests/unit/v2/real-world-scenarios.test.ts (25 tests)
#
# Test Suites: 7 passed, 7 total
# Tests:       ~440 passed, ~440 total
```

---

## Implementation Roadmap

### Phase 1: Lexer Updates
- Add `FOR` keyword to lexer
- Ensure all existing keywords still recognized (SET, DELETE, RENAME, INCREMENT, DECREMENT)
- Update token types

### Phase 2: Parser Updates (Hybrid Approach)
- **Scalar operations**: Keep existing v1.0 parsing (no changes)
  - `SET field value`
  - `DELETE field`
  - `RENAME old TO new`
  - `INCREMENT field amount`
  - `DECREMENT field amount`
- **Collection operations**: Add FOR prefix parsing
  - `FOR array INSERT value AT index`
  - `FOR array WHERE... SET field value`
  - `FOR array REMOVE_ALL value`
  - `FOR array SORT BY field`
  - `FOR array DEDUPLICATE`
  - `FOR array MOVE FROM index TO index`
- Remove v1.0 composite operations (UPDATE_WHERE, SORT_BY, MOVE_WHERE, APPEND, PREPEND, INSERT_AT, REMOVE_ANY)

### Phase 3: Type System Updates
- Update ActionAST types for FOR prefix
- Keep existing scalar operation types unchanged
- Update collection operation types

### Phase 4: Execution Engine Updates
- **Scalar operations**: No changes needed (keep existing executors)
- **Collection operations**: Update executors
  - Update `executeInsert()` to handle special indices (-1, 0)
  - Update `executeRemoveAll()` to be polymorphic
  - Update conditional operation handlers for FOR prefix

### Phase 5: Error Messages
- Add helpful error messages for incorrect FOR usage
- Provide migration suggestions for collection operations
- Include syntax examples in error messages
- Clarify scalar vs collection operation rules

### Phase 6: Verification
- Run all v2.0 tests → expect 100% pass
- Run all v1.0 tests → expect scalar tests to pass (unchanged)
- Run migration tests → verify behavioral equivalence
- Update documentation

---

## Hybrid v2.0 Grammar Summary

### Hybrid Approach: Scalars vs Collections

**Scalars (simple fields)**: Direct verb-first syntax (NO FOR)
```
SET <field> <value>
DELETE <field>
RENAME <oldField> TO <newField>
INCREMENT <field> <amount>
DECREMENT <field> <amount>
```

**Collections (arrays, objects)**: FOR prefix syntax
```
FOR <collection> [WHERE <condition>] <operation>
```

### Key Changes from v1.0

| Operation | v1.0 | Hybrid v2.0 | Change |
|-----------|------|-------------|--------|
| Set field | `SET field value` | `SET field value` | ✅ **NO CHANGE** |
| Delete field | `DELETE field` | `DELETE field` | ✅ **NO CHANGE** |
| Rename field | `RENAME old TO new` | `RENAME old TO new` | ✅ **NO CHANGE** |
| Increment | `INCREMENT count n` | `INCREMENT count n` | ✅ **NO CHANGE** |
| Decrement | `DECREMENT count n` | `DECREMENT count n` | ✅ **NO CHANGE** |
| Append array | `APPEND array value` | `FOR array INSERT value AT -1` | ⚠️ Collection |
| Prepend array | `PREPEND array value` | `FOR array INSERT value AT 0` | ⚠️ Collection |
| Insert at index | `INSERT_AT array value AT n` | `FOR array INSERT value AT n` | ⚠️ Collection |
| Remove single | `REMOVE_ALL array value` | `FOR array REMOVE_ALL value` | ⚠️ Collection |
| Remove multiple | `REMOVE_ANY array [values]` | `FOR array REMOVE_ALL [values]` | ⚠️ Collection |
| Sort array | `SORT_BY array BY field` | `FOR array SORT BY field` | ⚠️ Collection |
| Conditional update | `UPDATE_WHERE array WHERE... SET` | `FOR array WHERE... SET` | ⚠️ Collection |
| Conditional move | `MOVE_WHERE array WHERE... TO` | `FOR array WHERE... MOVE TO` | ⚠️ Collection |
| Merge object | `MERGE object data` | `FOR object MERGE data` | ⚠️ Collection |
| Deduplicate | `DEDUPLICATE array` | `FOR array DEDUPLICATE` | ⚠️ Collection |

### Benefits of Hybrid v2.0

1. **Backwards Compatible**: 80% of operations (scalars) unchanged from v1.0
2. **Simpler for Common Case**: No FOR needed for simple field updates
3. **Clear Semantics**: FOR signals "for each item in collection"
4. **Easy Migration**: Only collection operations need updating
5. **Natural English**: "For tasks where status is done, set archived to true"
6. **Reduced Learning Curve**: Most operations work exactly as before

---

## References

- **Grammar Specification**: `docs/prp/grammar.ebnf` (Hybrid v2.0 EBNF)
- **Implementation Plan**: `docs/prp/IMPLEMENTATION-PLAN.md`
- **Syntax Plan**: `docs/prp/v2.0-syntax-plan.md` (updated with Hybrid approach)

---

## Notes for Developers

### Using These Tests

1. **Don't modify test expectations** - They define the Hybrid v2.0 spec
2. **Update parser/lexer** to make tests pass
3. **Run tests frequently** during implementation
4. **Use test output** to guide development
5. **Remember**: Scalar operations unchanged, collections get FOR prefix

### Test-Driven Development Flow

```
1. Run test → See failure
2. Read failure message → Understand what's missing
3. Implement feature → Make test pass
4. Repeat for next test
```

### Test Organization

Each test file is **self-contained** and can be run independently:

```bash
npm test tests/unit/v2/basic-operations.test.ts
npm test tests/unit/v2/array-operations.test.ts
npm test tests/unit/v2/conditional-operations.test.ts
# etc.
```

### Key Implementation Notes

- **Scalar operations**: Keep existing v1.0 parser logic (no changes)
- **Collection operations**: Add FOR prefix parsing
- **WHERE clauses**: Only valid for collection operations
- **Error messages**: Clarify scalar vs collection operation rules

---

## Contact

For questions about this test suite or Hybrid v2.0 grammar:
- See `docs/prp/` for complete specification
- Review `docs/prp/grammar.ebnf` for formal grammar
- Check `docs/prp/v2.0-syntax-plan.md` for Hybrid approach rationale

---

**Last Updated**: 2024-12-05

**Status**: 🔴 Ready for implementation (collection tests failing, scalar tests may pass)
