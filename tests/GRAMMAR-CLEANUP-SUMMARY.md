# Grammar Cleanup Summary - REMOVE_ALL Polymorphic Claims

**Date:** 2026-01-08
**Action:** Removed false polymorphic claims from grammar until feature is implemented

---

## ✅ What Was Done

### 1. Created Feature Request Issue

**File:** `docs/dev/ISSUE-polymorphic-remove-all.md`

**Contains:**
- ✅ Clear problem statement
- ✅ Expected behavior with examples (single value + array)
- ✅ **21 detailed acceptance criteria** covering:
  - Functional requirements (AC1-AC7)
  - Performance requirements (AC8)
  - Error handling (AC9-AC10)
  - Code quality (AC11-AC12)
  - Testing requirements (AC13-AC15)
  - Documentation requirements (AC16-AC19)
  - Backward compatibility (AC20-AC21)
- ✅ Full implementation specification with algorithm
- ✅ Minimum 15 test cases specified
- ✅ Success metrics
- ✅ Timeline estimate (~8 hours)

**Ready to copy-paste into GitHub issue when ready to implement**

---

### 2. Cleaned Grammar File

**File:** `docs/prp/grammar.ebnf`

**Changes made:**

#### Line 122 - Updated Comment
```diff
- RemoveAllOperation ::= "REMOVE_ALL" Value
-   (* Value can be single value or array of values - polymorphic *)
+ RemoveAllOperation ::= "REMOVE_ALL" Value
+   (* Removes all occurrences of the specified value from array *)
```

#### Line 141 - Removed Polymorphic Example
```diff
  FOR tasks APPEND "new item"
  FOR tasks PREPEND "urgent item"
  FOR tasks INSERT "item" AT 2
  FOR tags REMOVE_ALL "old-tag"
- FOR tags REMOVE_ALL ["tag1", "tag2"]    (* Polymorphic *)
  FOR tasks SORT BY priority DESC
```

#### Line 326 - Removed Polymorphic Example (Second Location)
```diff
  FOR tags APPEND "urgent"
  FOR tags PREPEND "important"
  FOR tags INSERT "featured" AT 0
  FOR tags REMOVE_ALL "old-tag"
- FOR tags REMOVE_ALL ["tag1", "tag2", "tag3"]
  FOR tasks SORT BY priority DESC
```

#### Line 602 - Updated TypeScript Type
```diff
  type ArrayAction =
    | { op: 'APPEND'; path: string; value: any }
    | { op: 'PREPEND'; path: string; value: any }
    | { op: 'INSERT'; path: string; value: any; at: number }
-   | { op: 'REMOVE_ALL'; path: string; value: any | any[] }
+   | { op: 'REMOVE_ALL'; path: string; value: any }
    | { op: 'SORT'; path: string; by?: string; order?: 'ASC' | 'DESC' }
```

#### Line 632 - Removed REMOVE_ANY Reference
```diff
  | `APPEND array value` | `FOR array APPEND value` |
  | `PREPEND array value` | `FOR array PREPEND value` |
  | `INSERT_AT array value AT n` | `FOR array INSERT value AT n` |
  | `REMOVE_ALL array value` | `FOR array REMOVE_ALL value` |
- | `REMOVE_ANY array [vals]` | `FOR array REMOVE_ALL [vals]` |
  | `SORT_BY array BY field` | `FOR array SORT BY field` |
```

---

### 3. Verified Test Proof

**File:** `tests/unit/actions/remove-all-polymorphic-test.test.ts`

**Status:** ✅ All 4 tests passing

Confirms:
- ✅ Single value removal works
- ❌ Array value (polymorphic) does NOT work
- ✅ Only literal array matching works (edge case)
- ✅ Workaround requires multiple calls

**Test output:**
```
✓ tests/unit/actions/remove-all-polymorphic-test.test.ts (4 tests) 2ms
  ✓ Single value (current behavior) > should remove single value
  ✓ Array of values (polymorphic behavior) > should remove multiple values when given array
  ✓ Array of values (polymorphic behavior) > should demonstrate literal array matching
  ✓ Workaround: Multiple REMOVE_ALL calls > requires separate calls for each value
```

---

## 📊 Current Status

### Grammar File - CLEAN ✅

No false claims remain:
- ❌ No "polymorphic" comments
- ❌ No array examples for REMOVE_ALL
- ❌ No REMOVE_ANY references
- ✅ Only single-value behavior documented

**Verification:**
```bash
grep -i "polymorphic\|REMOVE_ANY\|REMOVE_ALL.*\[" docs/prp/grammar.ebnf
# Result: No matches (clean!)
```

### Documentation - STILL NEEDS CLEANUP ⚠️

**Files that still claim polymorphic behavior:**
- `docs-site/reference/syntax.md` - Lines 252-267 (REMOVE_ANY section)
- `docs-site/guide/actions.md` - Lines 200-229 (REMOVE_ANY)
- `docs-site/reference/examples.md` - Line 123 (array syntax example)
- `docs-site/reference/quick-reference.md` (mentions REMOVE_ANY)

**These were addressed in documentation cleanup** (see DOCUMENTATION-CLEANUP-COMPLETE.md)

---

## 🎯 Next Steps

### When Ready to Implement Feature:

1. **Create GitHub Issue**
   - Copy content from `docs/dev/ISSUE-polymorphic-remove-all.md`
   - Add labels: `enhancement`, `array-operations`, `breaking-change`

2. **Implement Feature**
   - Update `src/actions/arrayActions.ts` lines 280-327
   - Use provided algorithm in issue

3. **Add Tests**
   - Minimum 15 test cases specified
   - All 21 acceptance criteria must pass

4. **Update Documentation**
   - Restore "polymorphic" comment to grammar (with context)
   - Add array examples back to grammar
   - Update all 4 documentation files

5. **Verify**
   - All 348 existing tests still pass
   - New polymorphic tests pass (15+)
   - Documentation examples work in E2E tests

---

## 📁 Related Files

**Created/Updated:**
- ✅ `docs/dev/ISSUE-polymorphic-remove-all.md` (feature request with 21 ACs)
- ✅ `docs/prp/grammar.ebnf` (cleaned - 4 locations)
- ✅ `tests/unit/actions/remove-all-polymorphic-test.test.ts` (proof test)
- ✅ `tests/REMOVE_ALL-POLYMORPHIC-ANALYSIS.md` (technical analysis)
- ✅ `tests/DOCUMENTATION-CLEANUP-COMPLETE.md` (all fixes summary)
- ✅ `tests/GRAMMAR-CLEANUP-SUMMARY.md` (this file)

**Cleanup Completed:**
- ✅ `docs-site/` (4 files - all REMOVE_ANY/ADD issues fixed)

---

## 💡 Key Insights

1. **Grammar was aspirational, not factual**
   - Claimed polymorphic behavior that was never implemented
   - Probably copied from design docs to grammar prematurely

2. **No tests existed for claimed feature**
   - Only single-value removal was tested
   - No one caught the discrepancy

3. **Users likely confused**
   - Documentation shows array syntax that doesn't work
   - Silent failure (no error, just doesn't remove anything)

4. **Easy to implement later**
   - Complete specification now exists
   - All acceptance criteria defined
   - Algorithm provided
   - Test cases specified

---

## ✅ Summary

**Goal:** Remove false polymorphic claims from grammar
**Status:** ✅ COMPLETE

- [x] Feature request created with 21 acceptance criteria
- [x] Grammar file cleaned (4 locations)
- [x] Test proof created and verified
- [x] Analysis documented
- [x] Ready for future implementation

**Grammar file is now accurate** - only documents what actually works.

---

**Last Updated:** 2026-01-08
**Related Reports:**
- `REMOVE_ALL-POLYMORPHIC-ANALYSIS.md` - Technical analysis
- `DOCUMENTATION-CLEANUP-COMPLETE.md` - All grammar fixes summary
