# Test Coverage Gaps - Action Plan

**Date:** 2026-01-08
**Current Coverage:** 95% (1,281 tests)
**Target Coverage:** 100% (~1,311 tests)
**Estimated Effort:** 4-6 hours

---

## 🎯 Executive Summary

YAML Toolkit has **excellent test coverage (95%)** with only **5 operations** needing additional variation testing. All 43 operations from grammar.ebnf have at least basic test coverage.

**Gaps identified:**
1. DECREMENT - No dedicated tests (relies on negative INCREMENT)
2. IN operator - No evaluator tests (only parser tests)
3. REMOVE (WHERE) - Limited scenario coverage
4. .length operator - Missing edge cases
5. INSERT_BEFORE - Only basic test

**Recommended:** Add ~30 tests to close all gaps (4-6 hours effort)

---

## 📋 Detailed Action Plan

### HIGH PRIORITY (Close Critical Gaps)

#### 1. DECREMENT Operation Tests

**File to create:** `tests/unit/actions/decrement-comprehensive.test.ts`

**Tests needed:** 10

```typescript
import { executeDecrement } from '../../../src/actions/basicActions';

describe('DECREMENT Operation - Comprehensive', () => {
    // AC1: Basic decrement
    it('should decrement numeric field by specified amount', () => {
        const data = { count: 10 };
        const result = executeDecrement(data, 'count', 3);
        expect(result.success).toBe(true);
        expect(data.count).toBe(7);
    });

    // AC2: Decrement by 1 (default)
    it('should decrement by 1 when amount is 1', () => {
        const data = { stock: 50 };
        const result = executeDecrement(data, 'stock', 1);
        expect(data.stock).toBe(49);
    });

    // AC3: Large decrements
    it('should handle large decrement amounts', () => {
        const data = { balance: 1000 };
        const result = executeDecrement(data, 'balance', 750);
        expect(data.balance).toBe(250);
    });

    // AC4: Decrement to negative
    it('should allow decrement resulting in negative value', () => {
        const data = { score: 5 };
        const result = executeDecrement(data, 'score', 10);
        expect(data.score).toBe(-5);
    });

    // AC5: Decrement to zero
    it('should handle decrement to zero', () => {
        const data = { remaining: 5 };
        const result = executeDecrement(data, 'remaining', 5);
        expect(data.remaining).toBe(0);
    });

    // AC6: Missing field
    it('should treat missing field as 0', () => {
        const data = {};
        const result = executeDecrement(data, 'count', 5);
        expect(data.count).toBe(-5); // 0 - 5 = -5
    });

    // AC7: Nested paths
    it('should decrement nested field', () => {
        const data = { stats: { views: 100 } };
        const result = executeDecrement(data, 'stats.views', 25);
        expect(data.stats.views).toBe(75);
    });

    // AC8: Deeply nested with missing intermediate
    it('should create intermediate objects for nested decrement', () => {
        const data = {};
        const result = executeDecrement(data, 'metrics.visits', 10);
        expect(data.metrics?.visits).toBe(-10); // 0 - 10 = -10
    });

    // AC9: Error on non-numeric
    it('should error when field is not numeric', () => {
        const data = { count: 'not-a-number' };
        const result = executeDecrement(data, 'count', 5);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not a number');
    });

    // AC10: Decimal decrements
    it('should handle decimal decrement amounts', () => {
        const data = { price: 99.99 };
        const result = executeDecrement(data, 'price', 10.50);
        expect(data.price).toBeCloseTo(89.49, 2);
    });
});
```

**Acceptance Criteria:**
- [ ] All 10 tests pass
- [ ] Matches INCREMENT test patterns
- [ ] Covers all edge cases
- [ ] Error handling verified

---

#### 2. IN Operator Tests

**File to create:** `tests/unit/evaluator/in-operator.test.ts`

**Tests needed:** 6

```typescript
import { evaluateCondition } from '../../../src/evaluator/conditionEvaluator';
import { parseCondition } from '../../../src/parser/conditionParser';

describe('IN Operator - Comprehensive', () => {
    // AC1: Basic IN check
    it('should return true when value in array', () => {
        const data = { status: 'draft', validStatuses: ['draft', 'review', 'published'] };
        const ast = parseCondition('status IN validStatuses');
        expect(evaluateCondition(ast, data)).toBe(true);
    });

    // AC2: Value not in array
    it('should return false when value not in array', () => {
        const data = { status: 'archived', validStatuses: ['draft', 'review'] };
        const ast = parseCondition('status IN validStatuses');
        expect(evaluateCondition(ast, data)).toBe(false);
    });

    // AC3: Empty array
    it('should return false for empty array', () => {
        const data = { status: 'draft', validStatuses: [] };
        const ast = parseCondition('status IN validStatuses');
        expect(evaluateCondition(ast, data)).toBe(false);
    });

    // AC4: Non-existent field
    it('should return false when array field missing', () => {
        const data = { status: 'draft' };
        const ast = parseCondition('status IN validStatuses');
        expect(evaluateCondition(ast, data)).toBe(false);
    });

    // AC5: Literal array syntax
    it('should work with literal array', () => {
        const data = { status: 'draft' };
        const ast = parseCondition('status IN ["draft", "review", "published"]');
        expect(evaluateCondition(ast, data)).toBe(true);
    });

    // AC6: Different types
    it('should handle mixed types in array', () => {
        const data = { value: 42, options: [1, 'two', 42, true] };
        const ast = parseCondition('value IN options');
        expect(evaluateCondition(ast, data)).toBe(true);
    });

    // AC7: Nested paths
    it('should work with nested path IN nested array', () => {
        const data = {
            user: { role: 'admin' },
            permissions: { validRoles: ['admin', 'editor', 'viewer'] }
        };
        const ast = parseCondition('user.role IN permissions.validRoles');
        expect(evaluateCondition(ast, data)).toBe(true);
    });
});
```

**Acceptance Criteria:**
- [ ] All 6-7 tests pass
- [ ] Parser integration verified
- [ ] Evaluator logic tested
- [ ] Edge cases covered

---

#### 3. REMOVE (with WHERE) Scenarios

**File to update:** `tests/unit/actions/arrayActions.test.ts`

**Tests to add:** 6-8 (add to existing file)

```typescript
describe('REMOVE with WHERE - Additional Scenarios', () => {
    // AC1: Remove all matching items
    it('should remove all items matching WHERE condition', () => {
        const data = {
            tasks: [
                { name: 'Task 1', status: 'done' },
                { name: 'Task 2', status: 'pending' },
                { name: 'Task 3', status: 'done' }
            ]
        };
        const condition = parseCondition('status = "done"');
        const result = executeRemove(data, 'tasks', condition);
        expect(result.success).toBe(true);
        expect(data.tasks).toEqual([{ name: 'Task 2', status: 'pending' }]);
    });

    // AC2: Complex WHERE conditions
    it('should handle complex WHERE with AND/OR', () => {
        const data = {
            items: [
                { priority: 1, archived: false },
                { priority: 2, archived: true },
                { priority: 3, archived: false }
            ]
        };
        const condition = parseCondition('priority < 2 OR archived = true');
        const result = executeRemove(data, 'items', condition);
        expect(data.items).toEqual([{ priority: 3, archived: false }]);
    });

    // AC3: No matching items
    it('should warn when no items match WHERE condition', () => {
        const data = {
            tasks: [{ status: 'active' }, { status: 'pending' }]
        };
        const condition = parseCondition('status = "done"');
        const result = executeRemove(data, 'tasks', condition);
        expect(result.success).toBe(true);
        expect(result.modified).toBe(false);
        expect(result.warning).toContain('No items matched');
    });

    // AC4: Nested object conditions
    it('should remove based on nested object properties', () => {
        const data = {
            users: [
                { name: 'Alice', profile: { active: true } },
                { name: 'Bob', profile: { active: false } }
            ]
        };
        const condition = parseCondition('profile.active = false');
        const result = executeRemove(data, 'users', condition);
        expect(data.users.length).toBe(1);
        expect(data.users[0].name).toBe('Alice');
    });

    // AC5: Remove with ANY quantifier
    it('should work with ANY in WHERE clause', () => {
        const data = {
            projects: [
                { name: 'P1', tags: ['urgent', 'work'] },
                { name: 'P2', tags: ['personal'] },
                { name: 'P3', tags: ['urgent', 'personal'] }
            ]
        };
        const condition = parseCondition('ANY tags WHERE $ = "urgent"');
        const result = executeRemove(data, 'projects', condition);
        expect(data.projects.length).toBe(1);
        expect(data.projects[0].name).toBe('P2');
    });

    // AC6: Preserve order
    it('should preserve order of non-matching items', () => {
        const data = {
            items: [
                { id: 1, keep: true },
                { id: 2, keep: false },
                { id: 3, keep: true },
                { id: 4, keep: false }
            ]
        };
        const condition = parseCondition('keep = false');
        const result = executeRemove(data, 'items', condition);
        expect(data.items.map(i => i.id)).toEqual([1, 3]);
    });
});
```

**Acceptance Criteria:**
- [ ] All 6 tests pass
- [ ] Complex WHERE conditions tested
- [ ] Quantifiers (ANY/ALL) integration verified
- [ ] Order preservation tested

---

### MEDIUM PRIORITY (Polish Coverage)

#### 4. .length Operator Edge Cases

**File to create:** `tests/unit/evaluator/length-operator.test.ts`

**Tests needed:** 5

```typescript
describe('.length Operator - Edge Cases', () => {
    // AC1: length on null
    it('should handle length check on null field', () => {
        const data = { field: null };
        const ast = parseCondition('field.length = 0');
        expect(evaluateCondition(ast, data)).toBe(false); // null has no length
    });

    // AC2: length on undefined
    it('should return false for missing field.length', () => {
        const data = {};
        const ast = parseCondition('field.length > 0');
        expect(evaluateCondition(ast, data)).toBe(false);
    });

    // AC3: length on non-collection
    it('should handle length on non-collection types', () => {
        const data = { value: 42 };
        const ast = parseCondition('value.length = 2');
        expect(evaluateCondition(ast, data)).toBe(false); // numbers have no length
    });

    // AC4: Nested path.length
    it('should work with nested path.length', () => {
        const data = { metadata: { tags: ['a', 'b', 'c'] } };
        const ast = parseCondition('metadata.tags.length = 3');
        expect(evaluateCondition(ast, data)).toBe(true);
    });

    // AC5: All comparison operators with length
    it('should work with all comparison operators', () => {
        const data = { items: [1, 2, 3, 4, 5] };

        expect(evaluateCondition(parseCondition('items.length = 5'), data)).toBe(true);
        expect(evaluateCondition(parseCondition('items.length != 3'), data)).toBe(true);
        expect(evaluateCondition(parseCondition('items.length > 3'), data)).toBe(true);
        expect(evaluateCondition(parseCondition('items.length < 10'), data)).toBe(true);
        expect(evaluateCondition(parseCondition('items.length >= 5'), data)).toBe(true);
        expect(evaluateCondition(parseCondition('items.length <= 5'), data)).toBe(true);
    });
});
```

---

#### 5. INSERT_BEFORE Edge Cases

**File to update:** `tests/unit/actions/arrayActions.test.ts`

**Tests to add:** 4

```typescript
describe('INSERT_BEFORE - Edge Cases', () => {
    // AC1: Target not found
    it('should error when target value not found', () => {
        const data = { tags: ['a', 'b', 'c'] };
        const result = executeInsertBefore(data, 'tags', 'new', 'nonexistent');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    // AC2: Multiple target occurrences
    it('should insert before first occurrence of target', () => {
        const data = { tags: ['a', 'target', 'b', 'target', 'c'] };
        const result = executeInsertBefore(data, 'tags', 'new', 'target');
        expect(data.tags).toEqual(['a', 'new', 'target', 'b', 'target', 'c']);
    });

    // AC3: Empty array
    it('should error when inserting before in empty array', () => {
        const data = { tags: [] };
        const result = executeInsertBefore(data, 'tags', 'new', 'target');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    // AC4: Complex object target
    it('should insert before complex object target', () => {
        const data = {
            items: [{ id: 1 }, { id: 2 }, { id: 3 }]
        };
        const result = executeInsertBefore(data, 'items', { id: 0 }, { id: 2 });
        expect(data.items[1]).toEqual({ id: 0 });
        expect(data.items[2]).toEqual({ id: 2 });
    });
});
```

---

### MEDIUM PRIORITY (Improve Robustness)

#### Test Case Template for Missing Coverage

**Total additional tests recommended:** ~30

| Operation | Current Tests | Add Tests | Priority | Effort |
|-----------|--------------|-----------|----------|--------|
| DECREMENT | 1 | 10 | HIGH | 2h |
| IN operator | 0 | 6 | HIGH | 1h |
| REMOVE (WHERE) | 2 | 6 | HIGH | 1.5h |
| .length edge cases | 3 | 5 | MEDIUM | 0.5h |
| INSERT_BEFORE | 1 | 4 | MEDIUM | 0.5h |
| **TOTAL** | **7** | **31** | - | **5.5h** |

---

## 🔍 Verification Checklist

### Before Adding Tests

- [ ] Read existing test files to understand patterns
- [ ] Check implementation to verify expected behavior
- [ ] Confirm operation exists in grammar.ebnf
- [ ] Review documentation for expected use cases

### While Adding Tests

- [ ] Follow existing test naming conventions
- [ ] Use describe/it pattern consistently
- [ ] Test happy path first, then edge cases
- [ ] Include error scenarios
- [ ] Add comments explaining complex scenarios

### After Adding Tests

- [ ] Run new tests in isolation: `npm test <file>`
- [ ] Run full test suite: `npm test`
- [ ] Verify 100% pass rate
- [ ] Update test count in documentation
- [ ] Update coverage matrix

---

## 📊 Expected Impact

### Before Gap Closure
```
Total tests: 1,281
Coverage: 95%
Gaps: 5 operations with limited coverage
```

### After Gap Closure
```
Total tests: ~1,311 (+30)
Coverage: 100%
Gaps: 0 (all operations comprehensive)
```

### Quality Metrics
```
Operations with comprehensive coverage: 11 → 14 (+27%)
Operations with limited coverage: 5 → 0 (-100%)
Average tests per operation: 29.8 → 30.5 (+2.3%)
```

---

## 🎯 Implementation Plan

### Session 1: Critical Gaps (3-4 hours)

**Hour 1-2: DECREMENT Tests**
1. Create `tests/unit/actions/decrement-comprehensive.test.ts`
2. Implement 10 tests following template above
3. Run and verify all pass
4. Match coverage level with INCREMENT (19 tests)

**Hour 2-3: IN Operator Tests**
1. Create `tests/unit/evaluator/in-operator.test.ts`
2. Implement 6-7 tests following template above
3. Verify parser integration
4. Test with nested paths and literals

**Hour 3-4: REMOVE (WHERE) Scenarios**
1. Update `tests/unit/actions/arrayActions.test.ts`
2. Add 6 new scenarios following template
3. Test complex WHERE conditions
4. Verify quantifier integration

### Session 2: Polish (1-2 hours)

**Hour 1: Length & Insert Edge Cases**
1. Create `tests/unit/evaluator/length-operator.test.ts` (5 tests)
2. Update `tests/unit/actions/arrayActions.test.ts` with INSERT_BEFORE (4 tests)
3. Run full test suite
4. Verify 100% pass rate

---

## 🏆 Success Criteria

**All acceptance criteria must be met:**

- [ ] **AC1:** All 30+ new tests added
- [ ] **AC2:** All new tests pass (100% pass rate)
- [ ] **AC3:** Full test suite still passes (1,311/1,311)
- [ ] **AC4:** Coverage matrix updated to show 100%
- [ ] **AC5:** All 5 gap operations now "Comprehensive" or "Complete"
- [ ] **AC6:** No new gaps introduced
- [ ] **AC7:** Test patterns match existing conventions
- [ ] **AC8:** Documentation updated with new test count

---

## 📁 Files to Create/Update

### New Files (3)
```
tests/unit/actions/decrement-comprehensive.test.ts       (10 tests, ~200 lines)
tests/unit/evaluator/in-operator.test.ts                 (6 tests, ~150 lines)
tests/unit/evaluator/length-operator.test.ts             (5 tests, ~120 lines)
```

### Updated Files (1)
```
tests/unit/actions/arrayActions.test.ts                  (+10 tests, ~200 lines added)
```

### Documentation Updates (2)
```
tests/TEST-COVERAGE-MATRIX.md                            (Update with 100% status)
README.md or project docs                                (Update test count: 1,281 → 1,311)
```

---

## 💡 Key Insights

### Why Gaps Exist

1. **DECREMENT** - Shares implementation with INCREMENT, so basic functionality works
   - Tested implicitly via negative INCREMENT
   - Never got dedicated tests because it "just works"

2. **IN operator** - Parser tested, evaluator logic exists
   - Works in practice but never explicitly verified
   - Documentation shows IN usage but no dedicated tests

3. **REMOVE (WHERE)** - Core functionality tested
   - Error handling covered
   - Complex scenarios not tested (quantifiers, nested conditions)

4. **.length** - Basic usage tested
   - Works for common cases
   - Edge cases (null, undefined, non-collections) not verified

5. **INSERT_BEFORE** - Basic test exists
   - Happy path covered
   - Error cases not tested

### Lessons Learned

- ✅ **Generated tests** ensure docs match reality (excellent strategy)
- ✅ **Error-dedicated files** make error coverage explicit
- ✅ **Real-world scenarios** (tasks, meetings) test integration
- ⚠️ **Implicit coverage** (DECREMENT via INCREMENT) creates gaps
- ⚠️ **Parser tests ≠ evaluator tests** (IN operator has parser tests but no evaluator tests)

---

## 🔗 Related Documentation

- **Full coverage matrix:** `tests/TEST-COVERAGE-MATRIX.md`
- **Testing summary:** `tests/README-INCREMENT-TESTING.md`
- **Grammar specification:** `docs/prp/grammar.ebnf`
- **Test suite docs:** `docs/dev/test-suite.md` (generates 106 tests)

---

**Created:** 2026-01-08
**Status:** Action plan ready for implementation
**Estimated completion:** 4-6 hours for 100% coverage
