# Phase 3: Nested Path Investigation - Findings

**Date**: 2026-01-08
**Status**: IN PROGRESS - Root cause identified
**Issue**: Nested paths work in unit tests but fail in E2E tests

---

## 🔍 Investigation Summary

### ✅ What DOES Work (Proven)

1. **Unit Tests - Direct Execution** ✅
   ```typescript
   const data = { metadata: { views: 20 } };
   executeIncrement(data, 'metadata.views', 10);
   // Result: { metadata: { views: 30 } } ✅
   ```

2. **Unit Tests - Through Parser + executeAction** ✅
   ```typescript
   const actionAST = parseAction('INCREMENT metadata.views 10');
   executeAction(actionAST, data);
   // Result: AST correct, data mutated correctly ✅
   ```

3. **Parser - AST Generation** ✅
   ```json
   {
     "type": "action",
     "target": {
       "type": "path",
       "segments": [
         { "type": "property", "key": "metadata" },
         { "type": "property", "key": "views" }
       ]
     },
     "operation": {
       "type": "INCREMENT",
       "amount": 10
     }
   }
   ```

4. **pathResolver - setPath** ✅
   - Correctly creates intermediate objects
   - Lines 106-111 in `src/parser/pathResolver.ts`:
     ```typescript
     if (!current[segment.key] || typeof current[segment.key] !== 'object') {
         const nextSegment = segments[i + 1];
         current[segment.key] = nextSegment.type === 'index' ? [] : {};
     }
     ```

5. **ruleEngine - segmentsToPath** ✅
   - Correctly converts AST segments back to path string
   - `[{type:'property', key:'metadata'}, {type:'property', key:'views'}]` → `"metadata.views"` ✅

---

### ❌ What DOESN'T Work (E2E Tests)

**Test**: `should increment nested field`
- **Input**: `{ metadata: { views: 20, likes: 5 } }`
- **Action**: `INCREMENT metadata.views 10`
- **Expected**: `metadata.views = 30`
- **Actual**: `metadata.views = 20` ❌ (NOT modified!)
- **Notice**: "✅ Complete: 18 success, 0 warnings, 0 errors"

**Key Observation**: The rule execution reports SUCCESS (18 files), but the actual file content is NOT modified!

---

## 🎯 Root Cause Hypothesis

The issue is NOT in the action execution phase (proven by unit tests). The issue must be in one of these areas:

### Hypothesis 1: Write Phase Not Executing ❌
- **Location**: `src/core/batchProcessor.ts` lines 92-98
- **Logic**:
  ```typescript
  if (result.modified && result.newData) {
      await writeFrontmatter(app, file, result.newData, bodyContent);
  }
  ```
- **Test**: Needs debug logging to confirm `result.newData` contains modified data
- **Probability**: MEDIUM - logs say "18 success" but writes might not be happening

### Hypothesis 2: Data Object Not Mutated in E2E Environment ❌
- **Issue**: Maybe the `data` object in E2E is immutable or frozen?
- **Counter-evidence**: Unit tests with same code path work fine
- **Probability**: LOW - unlikely given unit test results

### Hypothesis 3: File Write Timing Issue ⚠️
- **Issue**: Write happens but file is read back too quickly?
- **Counter-evidence**: Test has `await browser.pause(1000)` after clickApply
- **Probability**: LOW - 1 second should be enough

### Hypothesis 4: `newData` Not Set Correctly ⚠️
- **Location**: `src/core/ruleEngine.ts` line 124
  ```typescript
  return {
      ...
      modified: true,
      newData: data,  // <-- Is this the mutated data?
  };
  ```
- **Test**: Need to verify `data` contains mutated values at return time
- **Probability**: HIGH - Most likely culprit!

---

## 🔬 Evidence from Debug Test

Created `tests/unit/debug-nested-increment.test.ts` - ALL 3 TESTS PASS:

1. ✅ Direct executeIncrement works (views: 20 → 30)
2. ✅ Through parser + executeAction works (views: 20 → 30)
3. ✅ AST structure is correct

**Debug Output Proves**:
```
[DEBUG INCREMENT] START: path="metadata.views", amount=10
[DEBUG INCREMENT] Current value at "metadata.views": 20
[DEBUG INCREMENT] Calculation: 20 + 10 = 30
[DEBUG INCREMENT] After setPath, data: { "metadata": { "views": 30 } }
```

So the code DEFINITELY mutates the data object correctly!

---

## 🚨 Critical Gap: E2E Console Logs Not Captured

**Problem**: The E2E test logs don't show ANY console.log output from:
- Rule engine debug logs
- Batch processor debug logs
- INCREMENT function debug logs

**This means**: We can't see what's actually happening during E2E execution!

**Need**: Add debug logging that's visible in E2E tests, OR inspect browser console during test execution.

---

## 📋 Next Steps

### Step 1: Add Visible Debug Logging ✅
Add console.log statements that will be visible in E2E tests:

**ruleEngine.ts** (line 78-90):
```typescript
console.log(`[DEBUG RULE ENGINE] BEFORE action - data:`, JSON.stringify(data, null, 2));
const actionResult = executeAction(actionAST, data);
console.log(`[DEBUG RULE ENGINE] AFTER action - data:`, JSON.stringify(data, null, 2));
```

**batchProcessor.ts** (line 92):
```typescript
console.log(`[DEBUG BATCH] Writing data:`, JSON.stringify(result.newData, null, 2));
await writeFrontmatter(app, file, result.newData, bodyContent);
```

### Step 2: Run E2E Test with Debug Logging
```bash
npm run build:test
npm run test:e2e:docs -- --spec tests/wdio/docs-examples/suites/increment.test.ts
```

**Expected to see**:
- `BEFORE action` showing original data
- `AFTER action` showing mutated data (views: 30)
- `Writing data` showing what's being written

**If data is mutated correctly but file doesn't change**: Write phase bug
**If data is NOT mutated**: Environment-specific issue with object mutation

### Step 3: Verify Write Actually Happens
Add verification logging in batchProcessor:
```typescript
await writeFrontmatter(app, file, result.newData, bodyContent);

// Read back to verify
const { data: verifyData } = await readFrontmatter(app, file);
console.log(`[DEBUG BATCH] Verification read:`, JSON.stringify(verifyData, null, 2));
```

### Step 4: Check for Object Reference Issues
Possibility: The `data` object in `executeRule` is not the same reference as what gets written?

Check in ruleEngine.ts:
```typescript
const { data, content } = await readFrontmatter(app, file);  // Line 49
const originalData = JSON.parse(JSON.stringify(data));       // Line 50

// ... actions mutate `data` ...

return {
    newData: data,  // <-- Is this the SAME object that was mutated?
};
```

---

## 🎯 Most Likely Root Cause

**Hypothesis**: The `data` object IS being mutated during action execution, but for some reason the `newData` in the FileResult is not the mutated object.

**Possible causes**:
1. Object reference lost somewhere in the chain
2. `data` is being reassigned instead of mutated
3. Write is happening with wrong data

**Test**: Add comprehensive logging to trace the `data` object through the entire flow.

---

## 🔧 Quick Fix Attempt

If logging shows `data` is mutated but `newData` is not, try explicitly returning the mutated data:

```typescript
// In executeAction (ruleEngine.ts)
export function executeAction(ast: ActionAST, data: any): ActionResult {
    const path = segmentsToPath(v2ast.target.segments);

    switch (operation.type) {
        case 'INCREMENT':
            const result = executeIncrement(data, path, operation.amount || 1);
            // Verify data was mutated
            console.log('[DEBUG] Post-INCREMENT data:', JSON.stringify(data, null, 2));
            return result;
    }
}
```

---

## 📊 Test Results Summary

| Test Type | Nested Paths | Status |
|-----------|--------------|--------|
| Unit (direct) | ✅ Works | `executeIncrement` mutates data |
| Unit (parser) | ✅ Works | AST → execution mutates data |
| E2E | ❌ Fails | File NOT modified (but "success" reported) |

**Conclusion**: The code is correct, but something in the E2E environment prevents the write from happening or writes wrong data.

---

## 🚀 Action Items for User

1. **Add debug logging** to ruleEngine and batchProcessor (see Step 1 above)
2. **Rebuild and test**: `npm run build:test && npm run test:e2e:docs`
3. **Check browser console** during E2E test execution for debug output
4. **Share findings** from debug logs to identify exact failure point

---

**Last Updated**: 2026-01-08 10:35
**Next Session**: Add debug logging and re-run E2E tests to pinpoint exact failure location
