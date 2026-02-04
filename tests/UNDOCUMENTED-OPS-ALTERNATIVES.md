# Undocumented Operations: Grammar-Compliant Alternatives

**Purpose**: For each undocumented operation, determine if there's a grammar-compliant alternative way to achieve the same outcome.

---

## Quick Reference: Summary Grid

| Operation | Has Alternative? | What to Do |
|-----------|------------------|-----------|
| **REPLACE** (string transform) | ❌ No | Needs to be formally added to grammar |
| **REMOVE_AT** (remove by index) | ❌ No (NOT equivalent to REMOVE_ALL) | Needs to be formally added to grammar |
| **empty / !empty** | ✅ Yes - Use `NOT HAS path` or `path = ""` | Add to grammar (clearer semantics) |
| **Type checking** (:type) | ⚠️ Weak workarounds | Add to grammar |
| **ANY / ALL** (quantifiers) | ❌ No | Needs to be formally added to grammar |
| **FOR array[i] SET** | ✅ Yes - Use `FOR array WHERE condition SET` | Already documented! Just needs implementation |
| **.length** property | ✅ Yes - Use `empty` operator | Use empty instead |
| **{{fm:field}}** (field mapping) | ⚠️ Complex | Clarify intent; may need COPY operation |

---

## 1. REPLACE / REPLACE_ALL (String Transformation)

### What It Does
Performs regex-based string replacement on field values.

**Examples from tests**:
```
REPLACE author /^Dr\.?\s+// ""           ← Strip "Dr." prefix
REPLACE url_slug /[^a-z0-9]+/ig "-"      ← Replace non-alphanumeric with dashes
REPLACE status /^(.+)$/ "${1.toLowerCase()}"  ← Complex transformation
```

### Grammar Alternative
**❌ NO GRAMMAR EQUIVALENT**

**Why**: The grammar has:
- `SET path value` - can only set to static values
- No string manipulation functions like substr(), replace(), toLowerCase(), etc.

**Possible Workarounds**:
1. **If transformation is simple**: Use `SET` with hardcoded value
   ```
   INSTEAD OF: REPLACE author /^Dr\.?\s+// ""
   USE: SET author "Alice Johnson"  ← Only works if you know the exact result
   ```

2. **If transformation is complex**: Requires custom parsing
   - This is a **feature gap** that cannot be worked around

### Recommendation
**⚠️ REPLACE needs to stay undocumented OR be added to grammar as a formal operation**

---

## 2. REMOVE_AT (Remove Array Element by Index)

### What It Does
Removes a specific element from an array by position.

**Not found in test examples yet, but grammar shows it might be used like**:
```
FOR tags REMOVE_AT 2    ← Remove element at index 2
```

### The Critical Problem: REMOVE_AT ≠ REMOVE_ALL

**Example with duplicate values**:
```yaml
tags: ["draft", "important", "draft", "archived"]
```

**Remove index 2 (second "draft")**:
- `FOR tags REMOVE_AT 2` → ["draft", "important", "archived"] ✅
- `FOR tags REMOVE_ALL "draft"` → ["important", "archived"] ❌ REMOVES ALL DRAFTS

These are fundamentally different operations:
- **REMOVE_AT** = position-based deletion (removes specific slot)
- **REMOVE_ALL** = value-based deletion (removes all matching values)

### Grammar Alternative
**❌ NO EQUIVALENT** (my original analysis was incorrect)

To achieve REMOVE_AT with grammar operations, you would need:
```
FOR array WHERE index = 2 REMOVE      ← Not in grammar
FOR array WHERE <identify item 2> REMOVE  ← Only works if item is unique
```

**Limitation**: You can only remove by value in a WHERE clause, not by index.

### Recommendation
**✅ Add REMOVE_AT to grammar** - It's a distinct operation with different semantics than REMOVE_ALL

---

## 3. empty / !empty (Empty Value Check)

### What It Does
Checks if a field is empty (null, empty array, empty string).

**Examples from tests**:
```json
"condition": "tags empty"          ← Array is empty
"condition": "content empty"       ← String is empty
"condition": "!tags empty"         ← Array is NOT empty (same as !empty)
```

### Grammar Alternative
**✅ YES - Multiple options depending on context**

#### For arrays:
```
INSTEAD OF: tags empty
USE: NOT HAS tags  ← If missing array means empty
   OR: tags.length = 0  ← If using length property (not documented!)
```

#### For strings:
```
INSTEAD OF: content empty
USE: content = ""  ← Exact comparison
   OR: NOT HAS content  ← If missing string means empty
```

**BUT PROBLEM**: Using `NOT HAS` for arrays is ambiguous:
- Does it mean "field doesn't exist"?
- Or "field exists but is empty"?
- These are different scenarios!

### Recommendation
**✅ Add empty / !empty to grammar** - It's a distinct concept from HAS/!HAS

**Rationale**:
- HAS checks: field exists
- empty checks: field is empty (but might exist)
- These are complementary operators that make sense together

---

## 4. Type Checking (:type, !:type)

### What It Does
Checks the data type of a field value.

**Examples from tests**:
```json
"condition": "author :string"      ← Is string
"condition": "count !:number"      ← NOT a number
"condition": "items :array"        ← Is array
"condition": "config :object"      ← Is object
```

### Grammar Alternative
**✅ PARTIAL - Can use comparison operators as proxies**

#### For type detection:
```
INSTEAD OF: count :number
USE: count >= 0 OR count < 0    ← Math operations only work on numbers

INSTEAD OF: tags :array
USE: tags contains "something"   ← contains only works on arrays/strings

INSTEAD OF: author :string
USE: author = author OR NOT author = ""  ← Weak check, but works for non-empty strings
```

**LIMITATIONS**: These workarounds are:
- Fragile (what if value is 0?)
- Implicit rather than explicit
- Not readable

### Recommendation
**✅ Add type checking to grammar** - Makes conditions clearer

**Syntax options**:
```
Option 1: path :type
  author :string
  tags :array

Option 2: type(path) = "string"
  type(author) = "string"

Option 3: typeof path = string
  typeof author = string
```

Recommend **Option 1** (matches test examples)

---

## 5. ANY / ALL Quantifiers

### What It Does
Checks if ANY or ALL items in a collection match a condition.

**Examples from tests**:
```json
"condition": "ANY books WHERE priority = \"high\""           ← Any book has high priority
"condition": "ALL reviewers WHERE approved = true"            ← All reviewers approved
"condition": "ALL tasks WHERE status != \"pending\""         ← All tasks not pending
```

### Grammar Alternative
**❌ NO GRAMMAR EQUIVALENT**

**Why**: Grammar has:
- `FOR array WHERE condition` - operates on matching items
- But no way to express "does ANY/ALL match this condition?"

**Possible interpretation of ANY**:
```
INSTEAD OF: ANY books WHERE priority = "high"
USE: HAS books AND (1 book matches condition)

⚠️ But there's no "count matching items" in grammar!
```

**Possible interpretation of ALL**:
```
INSTEAD OF: ALL tasks WHERE status != "pending"
USE: NOT EXISTS (task WHERE status = "pending")

⚠️ But there's no negation of FOR EXISTS pattern!
```

### Workaround
You could restructure rules to avoid quantifiers:

```
INSTEAD OF: IF ALL tasks done → Set status "complete"
            FOR tasks SET status "done"
            SET complete true

USE:        IF all tasks done condition evaluates to true
            But this requires pre-evaluating in condition
```

**LIMITATION**: This is architectural; can't really work around it.

### Recommendation
**✅ Add ANY and ALL to grammar** - Important for complex conditions

**Syntax options**:
```
Option 1: ANY path WHERE condition
  ANY books WHERE priority = "high"

Option 2: path #ANY WHERE condition
  books #ANY WHERE priority = "high"
```

Recommend **Option 1** (matches test examples)

---

## 6. Direct Array Element SET (FOR array[index] SET field value)

### What It Does
Updates fields on a specific array element by index, without a WHERE clause.

**Examples from tests**:
```json
"actions": ["FOR history[-1] SET reviewed true"]           ← Update last history item
"actions": ["FOR teams[-1].members[-1] SET badge \"lead\""]  ← Update nested element
```

### Grammar Alternative
**✅ YES - Use WHERE clause**

But requires knowing something about the element:

```
INSTEAD OF: FOR history[-1] SET reviewed true
USE:        FOR history WHERE <identify last element> SET reviewed true

Problem: How to identify "last element"?
- BY VALUE: FOR history WHERE timestamp = (latest timestamp) SET reviewed true
- BY INDEX: No way to say "item at index -1" without the index syntax
```

### Better Solution
**Enhance grammar to support direct index-based SET**

```
Proposed syntax option 1 (matches tests):
  FOR array[-1] SET field value
  FOR array[0] SET field value

Proposed syntax option 2 (more explicit):
  FOR array[WHERE last] SET field value
  FOR array[first] SET field value
```

### Current Status
- **DOCUMENTED** in grammar (lines 173-207 of grammar.ebnf)
- **NOT IMPLEMENTED** in parser (throws error: "SET on array requires WHERE clause")

### Recommendation
**✅ Implement this feature** - It's already documented!

**Steps**:
1. Update parser to detect array index in path
2. If `FOR array[index] SET`, allow without WHERE
3. Resolve index to specific element
4. Apply SET to that element only

---

## 7. .length Property (Array Length)

### What It Does
Accesses the length of an array field.

**Examples from tests**:
```json
"condition": "HAS tags AND tags.length > 0"
"condition": "tags.length = 0"
```

### Grammar Alternative
**✅ YES - But requires workaround**

```
INSTEAD OF: tags.length > 0
USE:        HAS tags                 ← Simple case: field exists means non-empty

INSTEAD OF: tags.length = 0
USE:        tags empty                ← Requires empty operator (see #3)

INSTEAD OF: tags.length >= 3
USE:        ⚠️ No direct equivalent - would need ALL/ANY with count
```

### Current Status
- Tested in conditions
- May or may not be implemented
- Not documented in grammar

### Recommendation
**⚠️ Clarify intent**:
- If `.length` should work: Add to grammar as a property accessor
- If not needed: Use `empty` operator instead (simpler)

**Suggest**: Replace `tags.length > 0` with `tags !empty`

---

## 8. Template Variables: {{fm:field}} (Field Mapping)

### What It Does
References another field's value as a template variable during action execution.

**Examples from tests**:
```json
"SET url_slug \"{{fm:title}}\""           ← Use title field's value
"SET author \"{{fm:author}}\""
"FOR history APPEND {author: \"{{fm:author}}\"}"
"SET tags [\"{{fm:tags}}\"]"               ← Convert field to array
```

### Current Status: ✅ FULLY IMPLEMENTED

- **Parser**: ✅ Recognizes `{{fm:field}}` syntax in values
- **Template Engine**: ✅ `src/core/templateEngine.ts` fully implements field resolution
- **Unit Tests**: ✅ 3+ test cases in `tests/unit/core/templateEngine.test.ts`
- **Generated Tests**: ✅ Example 65 auto-tests `{{fm:field}}` syntax
- **User Documentation**: ⚠️ Documented in advanced-techniques.md, but NOT in syntax.md

**Implementation details** (src/core/templateEngine.ts lines 119-143):
- Uses `resolvePath()` to support nested paths: `{{fm:metadata.author.name}}`
- Supports array access: `{{fm:tags[0]}}`
- Type conversion: Numbers, booleans, arrays, objects converted to JSON strings
- Error handling: Throws clear error if field not found

### Grammar Status
**❌ NOT in grammar.ebnf** - Should be documented in Function section

Current grammar only documents `{{now}}` and `{{today}}`

### Recommendation
**✅ Add {{fm:field}} to grammar.ebnf**

Syntax is already fully implemented. Just needs formal grammar documentation:

```ebnf
Function ::= "{{" "now" "}}"
           | "{{" "today" "}}"
           | "{{" "fm" ":" Path "}}"    ← ADD THIS
           (* ... other functions *)
```

**Also**: Update `docs-site/reference/syntax.md` to document `{{fm:field}}` in the Template Variables section (currently only lists `{{now}}` and `{{today}}`)

---

## Summary Table

| Operation | Grammar Alt? | Recommendation | Difficulty |
|-----------|-------------|-----------------|-----------|
| REPLACE | ❌ No | Add to grammar | **HIGH** |
| REMOVE_AT | ❌ No | Add to grammar (position-based removal) | **MEDIUM** |
| empty/!empty | ✅ Use HAS/NOT HAS | Add to grammar (clearer) | **LOW** |
| Type checking (:type) | ⚠️ Workarounds only | Add to grammar | **LOW** (already implemented!) |
| ANY/ALL quantifiers | ❌ No | Add to grammar | **HIGH** |
| FOR array[i] SET | ✅ Use WHERE | Implement as documented | **MEDIUM** |
| .length property | ✅ Use empty operator | Use empty instead | **LOW** |
| **{{fm:field}}** | **N/A** | **✅ FULLY IMPLEMENTED** | **LOW** (just doc) |

---

## Recommended Action Plan

### Phase 1: Grammar Updates (No implementation changes)
1. ✅ Add `empty` / `!empty` to Condition Grammar (Section 3.2)
2. ✅ Add type checking syntax `:type` / `!:type` (Section 3.2)
3. ✅ Add ANY/ALL quantifiers (Section 3.2)
4. ✅ Document REPLACE operation (Section 2 - Array Operations)
5. ✅ Document REMOVE_AT operation (Section 2 - Array Operations)
6. ✅ Add `.length` property support (Section 3 - Common Elements)
7. ✅ Clarify template variable syntax {{fm:field}} (Section 3.3)

### Phase 2: Parser Implementation
1. ✅ Implement direct element SET: `FOR array[i] SET field value`
2. ✅ Verify REMOVE_AT works correctly (may already be implemented)
3. ✅ Verify empty/!empty conditions work (already implemented, need to verify)
4. ✅ Verify type checking works (already implemented, need to verify)
5. ✅ Implement or clarify ANY/ALL quantifiers
6. ✅ Implement REPLACE operation (if not already present)

### Phase 3: E2E Test Validation
1. ✅ Update tests to use grammar-compliant syntax where alternatives exist
2. ✅ Remove tests using unimplementable patterns (e.g., complex REPLACE)
3. ✅ Verify all remaining tests use properly documented operations

---

## Impact on Failing Tests

**String Operations Failures (5 tests)**:
- Most likely use REPLACE which has **no grammar equivalent**
- May need to be redesigned or REPLACE needs to be formally added

**Basic Operations Failures (6 tests)**:
- May use undocumented conditions (empty, type checking, quantifiers)
- Can likely be fixed by implementing documented features

**Array Operations Failures (4 tests)**:
- Likely use direct element SET without WHERE
- Can be fixed by implementing that feature

**Advanced Operators Failures (5 tests)**:
- Likely use ANY/ALL or type checking
- Can be fixed by implementing those features

---

## Conclusion

**Of the 8 undocumented operations**:
- **4 have NO grammar equivalent**: REPLACE, REMOVE_AT, ANY/ALL quantifiers
- **3 already IMPLEMENTED but not documented**: empty/!empty, type checking, {{fm:field}}
- **1 has grammar alternatives**: direct element SET, .length property

**Key insight** (from user feedback): REMOVE_AT and REMOVE_ALL are semantically different:
- REMOVE_AT removes by position (critical for deduplicating specific instances)
- REMOVE_ALL removes all matching values (different use case)
- There's NO workaround for REMOVE_AT without adding index-based WHERE clauses

**Recommendation**:

1. **Operations already implemented** (just need grammar docs):
   - ✅ empty/!empty conditions
   - ✅ Type checking (:type, !:type)
   - ✅ {{fm:field}} template variables
   - Add these to grammar.ebnf and update syntax.md

2. **Operations that need implementation**:
   - ❌ REPLACE / REPLACE_ALL (string regex operations)
   - ❌ REMOVE_AT (position-based array removal)
   - ❌ ANY/ALL quantifiers
   - ❌ Direct element SET without WHERE (already documented, needs implementation)
   - Add these to grammar, then implement in parser

This would make the E2E tests valid and representative of real user workflows.

**Note**: These are not bugs or shortcuts—they're legitimate features that should be officially supported.
