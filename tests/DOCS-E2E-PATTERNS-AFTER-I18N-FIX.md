# Docs E2E Test Patterns - CONSOLIDATED (Historical)

**⚠️ IMPORTANT**: This document is HISTORICAL. Please refer to **`DOCS-E2E-FAILURE-ROOT-CAUSE.md`** for current findings.

---

## What This Document Was

On 2026-01-07, this analysis identified apparent patterns of failures in HAS, NOT, and contains operators after the i18n fix was applied.

**Key observation at that time**: "~83% of docs examples use broken operators"

## What We Now Know

As of 2026-01-16, after further investigation:

1. **Fixture data issues were the real problem** (not operator bugs)
   - 3 documentation examples had incorrect input data
   - Once corrected, tests that appeared to fail now pass

2. **Timeouts masked failures** (not operator issues)
   - Tests timing out at 30s due to vault scanning overhead
   - Increased to 60s - eliminated timeout-based false failures

3. **Some operator observations need re-validation**
   - Earlier analysis was based on incomplete data (timeouts, wrong fixtures)
   - Should re-run full E2E suite to get accurate operator status
   - Current data: 11 passing, 20 failing, 15 skipped

## What Changed

| Item | Original Analysis | Current Status |
|------|---|---|
| HAS operator | ❌ Broken | 🔄 Needs re-validation (was timeout issue) |
| NOT operator | ❌ Broken with HAS/contains | 🔄 Needs re-validation (was timeout issue) |
| contains operator | ❌ Broken | 🔄 Needs re-validation (was timeout issue) |
| i18n interpolation | ✅ Fixed | ✅ Still fixed, 17 unit tests passing |
| Test timeout | ❌ 30s insufficient | ✅ Increased to 60s, fixed |
| Fixture data | (Not analyzed) | ✅ 3 examples corrected |

## Historical Value

This document serves as a record of the investigation process:
- Shows how misleading incomplete data can be
- Demonstrates importance of proper test infrastructure
- Proves value of fixing timeouts and i18n BEFORE analyzing operator issues

## Current Investigation Status

**See `DOCS-E2E-FAILURE-ROOT-CAUSE.md` for:**
- ✅ Confirmed fixes (i18n, fixtures, timeouts)
- 📊 Current test results (11 passing, 20 failing, 15 skipped)
- 🔄 Remaining failures by category
- 📋 Next steps for full E2E validation

---

**Last consolidated**: 2026-01-16
**Next action**: Run full E2E suite to validate operator status with fixed infrastructure
