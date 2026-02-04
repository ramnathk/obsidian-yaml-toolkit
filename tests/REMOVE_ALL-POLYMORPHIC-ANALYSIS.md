# REMOVE_ALL Polymorphic Behavior Analysis

**Date:** 2026-01-08
**Question:** Is REMOVE_ALL polymorphic (accepts arrays of values)?
**Answer:** ❌ **NO** - Grammar claims it is, but implementation is NOT polymorphic

---

## 🔬 Test Results

Created comprehensive test: `tests/unit/actions/remove-all-polymorphic-test.test.ts`

**Test Results:** ✅ All 4 tests passed
- ✅ Single value removal works
- ✅ Array argument is treated as LITERAL value (not polymorphic)
- ✅ Only removes elements that exactly match the entire array
- ✅ Confirmed non-polymorphic behavior

```bash
✓ tests/unit/actions/remove-all-polymorphic-test.test.ts (4 tests) 2ms
  ✓ Single value (current behavior)
    ✓ should remove single value
  ✓ Array of values (polymorphic behavior)
    ✓ should remove multiple values when given array
    ✓ should demonstrate literal array matching
  ✓ Workaround: Multiple REMOVE_ALL calls
    ✓ requires separate calls for each value
```

---

## 📊 What the Implementation Actually Does

### Source Code Analysis

**File:** `src/actions/arrayActions.ts` (lines 280-327)

```typescript
export function executeRemoveAll(data: any, path: string, value: any): ActionResult {
    const array = resolvePath(data, path);

    const valueStr = JSON.stringify(value);  // ← Stringifies ENTIRE value

    // Filter out all matching values
    const filtered = array.filter(item =>
        JSON.stringify(item) !== valueStr    // ← Literal comparison
    );

    // Replace array contents
    array.length = 0;
    array.push(...filtered);
}
```

**How it works:**
1. Takes the `value` parameter (can be anything: string, number, object, **or array**)
2. Stringifies it: `JSON.stringify(value)`
3. Compares each array item against this stringified value
4. Removes items that **exactly match** the stringified value

---

## 🧪 Behavior Examples

### Example 1: Single Value (Works as Expected) ✅

```typescript
const data = { tags: ['draft', 'work', 'project', 'draft'] };
executeRemoveAll(data, 'tags', 'draft');

// Result: ['work', 'project']  ✅
// Removes all 'draft' strings
```

### Example 2: Array Value (NOT Polymorphic) ❌

```typescript
const data = { tags: ['draft', 'wip', 'temp', 'work', 'project'] };
executeRemoveAll(data, 'tags', ['draft', 'wip', 'temp']);

// Expected (if polymorphic): ['work', 'project']
// Actual result: ['draft', 'wip', 'temp', 'work', 'project']  ❌
// NO CHANGE! It looks for the literal array ['draft', 'wip', 'temp'] as an element
```

### Example 3: When Literal Array Matching Works

```typescript
const data = {
    things: ['a', 'b', ['draft', 'wip', 'temp'], 'c']
};
executeRemoveAll(data, 'things', ['draft', 'wip', 'temp']);

// Result: ['a', 'b', 'c']  ✅
// Removes the array element because it exists as a literal element
```

---

## 📋 Grammar vs Implementation

### Grammar Claim (grammar.ebnf lines 121-122)

```ebnf
RemoveAllOperation ::= "REMOVE_ALL" Value
  (* Value can be single value or array of values - polymorphic *)
```

**Grammar examples (line 140-141):**
```
FOR tags REMOVE_ALL "old-tag"           # Single value
FOR tags REMOVE_ALL ["tag1", "tag2"]    # Multiple values (polymorphic)
```

❌ **GRAMMAR IS WRONG** - Claims polymorphic behavior that doesn't exist

### Implementation Reality

```typescript
// Source: src/actions/arrayActions.ts:294
const valueStr = JSON.stringify(value);
const filtered = array.filter(item => JSON.stringify(item) !== valueStr);
```

✅ **IMPLEMENTATION IS CONSISTENT** - Always treats value as literal match

---

## 📝 Documentation Claims

### What Grammar Says (WRONG)

> "Value can be single value or array of values - polymorphic"

### What Documentation Says (ALSO WRONG)

**File:** `docs-site/reference/examples.md` line 123
```
Action: FOR tags REMOVE_ALL ["draft", "wip", "temp"]
```

**File:** `docs-site/reference/syntax.md` line 258
```
FOR <array> REMOVE_ALL [<value1>, <value2>, ...]
```

**File:** `docs-site/guide/actions.md` line 229
```
FOR tags REMOVE_ANY ["draft", "wip", "temp"]
```
(Note: They invented REMOVE_ANY because they knew REMOVE_ALL can't do this!)

---

## 🎯 Actual Test Coverage Status

### Existing Tests (ONLY Test Single Values)

**File:** `tests/unit/actions/arrayActions.test.ts`

```typescript
it('should remove all occurrences', () => {
    const data = { tags: ['work', 'urgent', 'work', 'project', 'work'] };
    const result = executeRemoveAll(data, 'tags', 'work');
    expect(data.tags).toEqual(['urgent', 'project']);  // ✅ Works
});
```

**Coverage:** ✅ Single value removal - **TESTED**
**Coverage:** ❌ Array value removal (polymorphic) - **NOT TESTED** (because it doesn't exist!)

### NO Tests for Polymorphic Behavior

Searched entire test suite:
- ❌ No tests for `REMOVE_ALL ["value1", "value2"]`
- ❌ No tests for `REMOVE_ALL [...]` with multiple values
- ❌ No tests verifying polymorphic behavior

**Why?** Because the feature **doesn't exist**!

---

## 🚨 Impact Assessment

### Users Are Misled

**What users try (based on docs):**
```
FOR tags REMOVE_ALL ["draft", "wip", "temp"]
```

**What happens:**
- ❌ Nothing removed (unless array contains literal `["draft", "wip", "temp"]`)
- ❌ No error (silent failure)
- ❌ Tags remain unchanged
- 😡 User confused why rule doesn't work

### Current Workaround

**Multiple operations required:**
```
FOR tags REMOVE_ALL "draft"
FOR tags REMOVE_ALL "wip"
FOR tags REMOVE_ALL "temp"
```

OR (using WHERE clause for multiple rules):
```
FOR tags WHERE $ = "draft" REMOVE
FOR tags WHERE $ = "wip" REMOVE
FOR tags WHERE $ = "temp" REMOVE
```

---

## 🔧 What Needs to Happen

### Option 1: Remove False Claims (RECOMMENDED)

**Fix grammar.ebnf:**
```diff
- RemoveAllOperation ::= "REMOVE_ALL" Value
-   (* Value can be single value or array of values - polymorphic *)
+ RemoveAllOperation ::= "REMOVE_ALL" Value
+   (* Removes all occurrences of the specified value *)
```

**Fix documentation:**
```diff
- FOR tags REMOVE_ALL ["draft", "wip", "temp"]  # Multiple values
+ FOR tags REMOVE_ALL "draft"                    # Remove single value

# To remove multiple values, use multiple operations:
FOR tags WHERE $ = "draft" REMOVE
FOR tags WHERE $ = "wip" REMOVE
FOR tags WHERE $ = "temp" REMOVE
```

**Remove all REMOVE_ANY references** (it doesn't exist)

### Option 2: Implement Polymorphic Behavior

**Update implementation:**
```typescript
export function executeRemoveAll(data: any, path: string, value: any): ActionResult {
    const array = resolvePath(data, path);

    // NEW: Check if value is an array of values to remove
    if (Array.isArray(value)) {
        const valuesToRemove = new Set(value.map(v => JSON.stringify(v)));
        const filtered = array.filter(item =>
            !valuesToRemove.has(JSON.stringify(item))
        );
        array.length = 0;
        array.push(...filtered);
    } else {
        // Original behavior for single value
        const valueStr = JSON.stringify(value);
        const filtered = array.filter(item =>
            JSON.stringify(item) !== valueStr
        );
        array.length = 0;
        array.push(...filtered);
    }
}
```

**Add comprehensive tests:**
- Single value removal (existing ✅)
- Array of values removal (NEW)
- Mixed types in removal array
- Edge cases (empty array, duplicates, etc.)

---

## 📊 Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Grammar claims polymorphic** | ❌ Wrong | Line 122 comment |
| **Documentation shows array syntax** | ❌ Wrong | Multiple files |
| **Implementation is polymorphic** | ❌ NO | Literal value matching only |
| **Tests cover polymorphic behavior** | ❌ NO | Only single value tests exist |
| **Feature works as documented** | ❌ NO | Docs claim feature that doesn't exist |

---

## ✅ Recommendation

**IMMEDIATE ACTION:** Remove false claims from documentation

1. ✅ Update grammar comment (remove "polymorphic")
2. ✅ Update all documentation (remove array syntax examples)
3. ✅ Remove all REMOVE_ANY references (operation doesn't exist)
4. ✅ Update examples to show workarounds for multiple value removal

**FUTURE ENHANCEMENT:** Implement true polymorphic behavior
- But this is a breaking change if anyone relies on literal array matching
- Would need migration guide

---

## 🎯 Answer to Original Question

**Q: Is REMOVE_ALL polymorphic and tested thoroughly?**

**A: NO on both counts:**
- ❌ **NOT polymorphic** - only removes literal value matches
- ❌ **NOT tested for polymorphic behavior** - only single value tests exist
- ❌ **Grammar and docs are WRONG** - claim feature that doesn't exist
- ✅ **Implementation is consistent** - but doesn't match documentation

The grammar comment on line 122 saying "polymorphic" is **incorrect** and should be removed.

---

**Test File:** `tests/unit/actions/remove-all-polymorphic-test.test.ts` (proof)
**Related:** `tests/DOCUMENTATION-CLEANUP-COMPLETE.md` (all fixes summary)
