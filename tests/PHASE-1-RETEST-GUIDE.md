# Phase 1: E2E Retest Guide (After Fixture Fixes)

**Status**: Ready for re-testing
**Fixtures Fixed**: 6
**Expected Improvement**: 50% → ~63% pass rate (+6 tests)

---

## Quick Start

To re-run the E2E tests with the fixed fixtures:

```bash
npm run test:docs-e2e
```

**Duration**: ~10 minutes
**Workers**: 6 (parallel execution)

---

## What Changed

### Fixtures Fixed (6):
1. ✅ reference-examples-18 - Prioritize Specific Items (added condition)
2. ✅ reference-examples-29 - Negative Indexing v1 (fixed input)
3. ✅ reference-examples-30 - Negative Indexing v2 (fixed input)
4. ✅ reference-examples-32 - Relative Positioning v1 (simplified condition)
5. ✅ reference-examples-33 - Relative Positioning v2 (added condition)
6. ✅ reference-examples-36 - Deeply Nested Data (updated date)

### File Modified:
```
tests/wdio/docs-examples/fixtures/extracted-examples.json
```

---

## Expected Results After Retest

### Pass Rate Improvement:
```
Before fixes:  21/43 passing (50%)
After fixes:   ~27/43 passing (~63%)
Improvement:   +6 tests (+13%)
```

### Breakdown:
- **27 Expected Passes**: All previously passing + 6 fixed
- **2 Expected Failures**: Missing Phase 2 features (REPLACE, scalar INSERT)
- **14 Expected Skips**: Multi-step examples (need multi-action support)

---

## Monitoring Retest Results

### Look For:
```
✅ Prioritize Specific Items - should now PASS
✅ Using Negative Indexing (v1) - should now PASS
✅ Using Negative Indexing (v2) - should now PASS
✅ Relative Positioning (v1) - should now PASS
✅ Relative Positioning (v2) - should now PASS
✅ Working with Deeply Nested Data - should now PASS
```

### Still Expected to Fail (2):
```
❌ Strip Title Prefixes - needs REPLACE operation (Phase 2)
❌ Build Processing Log - needs scalar INSERT (Phase 2)
```

### Still Expected to Skip (14):
```
⏳ Multi-step examples - need multi-action support (Phase 2)
```

---

## Verifying Individual Fixtures

To check a specific fixture before/after:

```bash
# View a fixture
jq '.examples[] | select(.id == "reference-examples-18")' \
  tests/wdio/docs-examples/fixtures/extracted-examples.json

# Verify condition was added
jq '.examples[] | select(.id == "reference-examples-18") | .condition' \
  tests/wdio/docs-examples/fixtures/extracted-examples.json
```

---

## Documentation

Retest results should be documented in:
- `tests/PHASE-1-E2E-TEST-RESULTS.md` - Update pass rate metrics
- `tests/PHASE-1-FINAL-STATUS.md` - Update summary
- `tests/PHASE-1-FIXTURE-FIXES.md` - Reference for fixes applied

---

## Phase 1 Completion Checklist

After retest:

- [ ] Run: `npm run test:docs-e2e`
- [ ] Verify ~27/43 tests passing
- [ ] Confirm 2 Phase 2 blockers
- [ ] Confirm 14 multi-step skips
- [ ] Update test reports
- [ ] Document retest results

---

## Next: Phase 2 Preparation

Once retest is complete:

1. **Grammar Expansion**
   - Add REPLACE operation
   - Add REMOVE_AT operation
   - Add ANY/ALL quantifiers
   - Clarify scalar INSERT

2. **Feature Implementation**
   - Implement REPLACE with regex
   - Implement REMOVE_AT
   - Implement ANY/ALL
   - Add multi-action support

3. **E2E Re-validation**
   - Retest with all fixes
   - Target 37/43 minimum
   - Target 43/43 with multi-action

---

**Status**: Ready for retest
**Last Updated**: 2026-01-16
**Duration**: ~10 minutes to execute
