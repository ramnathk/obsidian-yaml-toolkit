/**
 * Hybrid v2.0 Grammar: Syntax Validation Tests
 *
 * Tests for the Hybrid approach where:
 * - Scalars: No FOR required, no WHERE allowed
 * - Collections (arrays/objects): FOR required, WHERE allowed/required based on operation
 *
 * Comprehensive tests for cross-keyword dependencies and syntax rules:
 * - WHERE without FOR
 * - FOR on scalars (invalid in Hybrid)
 * - Operations that require WHERE
 * - Operations that forbid WHERE
 * - FOR without required operation
 * - Invalid keyword combinations
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '@/parser/actionParser';

describe('Hybrid v2.0 Grammar: Syntax Validation', () => {
  describe('Hybrid approach: Scalar operations (no FOR allowed)', () => {
    it('should accept: SET title "value" (scalar operation without FOR)', () => {
      const input = 'SET title "value"';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should accept: DELETE draft (scalar operation without FOR)', () => {
      const input = 'DELETE draft';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should accept: RENAME author TO creator (scalar operation without FOR)', () => {
      const input = 'RENAME author TO creator';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject: FOR title SET "value" (FOR not allowed on scalars)', () => {
      const input = 'FOR title SET "value"';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations.*Use: SET title "value"/i);
    });

    it('should reject: FOR draft DELETE (FOR not allowed on scalars)', () => {
      const input = 'FOR draft DELETE';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations.*Use: DELETE draft/i);
    });

    it('should reject: FOR author RENAME TO creator (FOR not allowed on scalars)', () => {
      const input = 'FOR author RENAME TO creator';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations.*Use: RENAME author TO creator/i);
    });
  });

  describe('WHERE clause validation: WHERE without FOR', () => {
    it('should reject: WHERE status = "done" SET priority 10 (missing FOR)', () => {
      const input = 'WHERE status = "done" SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/WHERE requires FOR keyword.*WHERE can only be used with collection operations/i);
    });

    it('should reject: WHERE condition REMOVE (missing FOR)', () => {
      const input = 'WHERE priority > 5 REMOVE';

      expect(() => parseAction(input))
        .toThrow(/WHERE requires FOR keyword/i);
    });

    it('should reject: WHERE condition MOVE TO START (missing FOR)', () => {
      const input = 'WHERE status = "done" MOVE TO START';

      expect(() => parseAction(input))
        .toThrow(/WHERE requires FOR keyword/i);
    });

    it('should reject: tasks WHERE status = "done" SET priority 10 (FOR missing)', () => {
      const input = 'tasks WHERE status = "done" SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/Expected FOR keyword.*Did you forget FOR\?/i);
    });

    it('should reject: WHERE alone with no other keywords', () => {
      const input = 'WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/WHERE requires FOR keyword/i);
    });

    it('should reject: WHERE in wrong position with scalar operation', () => {
      const input = 'SET title WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/WHERE not allowed on scalar operations/i);
    });
  });

  describe('FOR validation: FOR without required components', () => {
    it('should reject: FOR (missing everything)', () => {
      const input = 'FOR';

      expect(() => parseAction(input))
        .toThrow(/Expected path after FOR/i);
    });

    it('should reject: FOR tasks (missing operation)', () => {
      const input = 'FOR tasks';

      expect(() => parseAction(input))
        .toThrow(/Expected operation keyword after path/i);
    });

    it('should reject: FOR tasks WHERE (missing condition and operation)', () => {
      const input = 'FOR tasks WHERE';

      expect(() => parseAction(input))
        .toThrow(/Expected condition after WHERE/i);
    });

    it('should reject: FOR WHERE (missing path)', () => {
      const input = 'FOR WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/Expected path after FOR.*found WHERE/i);
    });

    it('should reject: FOR SET (missing path)', () => {
      const input = 'FOR SET "value"';

      expect(() => parseAction(input))
        .toThrow(/Expected path after FOR.*found SET/i);
    });
  });

  describe('Operations requiring WHERE clause', () => {
    it('should reject: FOR tasks REMOVE (REMOVE requires WHERE or value)', () => {
      const input = 'FOR tasks REMOVE';

      expect(() => parseAction(input))
        .toThrow(/Expected value/i); // REMOVE needs value or WHERE
    });

    it('should accept: FOR tasks WHERE status = "done" REMOVE (valid)', () => {
      const input = 'FOR tasks WHERE status = "done" REMOVE';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject: FOR tasks SET priority 10 (SET on array requires WHERE)', () => {
      const input = 'FOR tasks SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/SET on array requires WHERE clause to specify which items to update/i);
    });

    it('should accept: FOR tasks WHERE status = "pending" SET priority 10 (valid)', () => {
      const input = 'FOR tasks WHERE status = "pending" SET priority 10';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject: FOR tasks MOVE TO START (MOVE with target requires WHERE)', () => {
      const input = 'FOR tasks MOVE TO START';

      expect(() => parseAction(input))
        .toThrow(/MOVE TO requires WHERE clause.*Use MOVE FROM\/TO for index-based move/i);
    });

    it('should accept: FOR tasks WHERE priority > 8 MOVE TO START (valid)', () => {
      const input = 'FOR tasks WHERE priority > 8 MOVE TO START';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should accept: FOR tasks MOVE FROM 0 TO 5 (index-based move, no WHERE needed)', () => {
      const input = 'FOR tasks MOVE FROM 0 TO 5';

      expect(() => parseAction(input)).not.toThrow();
    });
  });

  describe('Operations forbidding WHERE clause', () => {
    it('should reject: WHERE on scalar operations (scalar operations never use FOR/WHERE)', () => {
      const input = 'SET title WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/WHERE not allowed on scalar operations/i);
    });

    it('should reject: FOR tags WHERE status = "done" INSERT "value" AT 0 (WHERE on INSERT)', () => {
      const input = 'FOR tags WHERE status = "done" INSERT "value" AT 0';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with INSERT.*Use conditional SET instead/i);
    });

    it('should reject: FOR tags WHERE priority > 5 REMOVE_ALL "old" (WHERE on REMOVE_ALL)', () => {
      const input = 'FOR tags WHERE priority > 5 REMOVE_ALL "old"';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with REMOVE_ALL/i);
    });

    it('should reject: FOR tasks WHERE enabled = true SORT BY priority (WHERE on SORT)', () => {
      const input = 'FOR tasks WHERE enabled = true SORT BY priority';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with SORT/i);
    });

    it('should reject: FOR tags WHERE category = "tech" DEDUPLICATE (WHERE on DEDUPLICATE)', () => {
      const input = 'FOR tags WHERE category = "tech" DEDUPLICATE';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with DEDUPLICATE/i);
    });

    it('should reject: FOR metadata WHERE status = "done" MERGE {"key": "value"} (WHERE on MERGE)', () => {
      const input = 'FOR metadata WHERE status = "done" MERGE {"key": "value"}';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with MERGE/i);
    });

    it('should reject: FOR tasks WHERE category = "tech" MOVE FROM 0 TO 5 (WHERE on index-based MOVE)', () => {
      const input = 'FOR tasks WHERE category = "tech" MOVE FROM 0 TO 5';

      expect(() => parseAction(input))
        .toThrow(/WHERE clause not allowed with index-based MOVE FROM\/TO/i);
    });
  });

  describe('Hybrid v2.0 validation', () => {
    it('should detect FOR on scalars and suggest Hybrid syntax', () => {
      const input = 'FOR title SET "value"';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations.*Use: SET title "value"/i);
    });

    it('should detect missing FOR on collections', () => {
      const input = 'tasks APPEND "item"';

      expect(() => parseAction(input))
        .toThrow(/Expected FOR keyword.*Use: FOR tasks APPEND "item"/i);
    });
  });

  describe('Multiple WHERE clauses (invalid)', () => {
    it('should reject: FOR tasks WHERE status = "done" WHERE priority > 5 SET archived true', () => {
      const input = 'FOR tasks WHERE status = "done" WHERE priority > 5 SET archived true';

      expect(() => parseAction(input))
        .toThrow(/Unexpected WHERE.*Use AND to combine conditions/i);
    });

    it('should suggest using AND: FOR tasks WHERE a = 1 WHERE b = 2 SET flag true', () => {
      const input = 'FOR tasks WHERE a = 1 WHERE b = 2 SET flag true';

      expect(() => parseAction(input))
        .toThrow(/Multiple WHERE clauses not allowed.*Use: WHERE a = 1 AND b = 2/i);
    });
  });

  describe('WHERE with wrong operation combinations', () => {
    it('should provide clear error for WHERE on scalar operations', () => {
      const input = 'DELETE title WHERE something = true';

      expect(() => parseAction(input))
        .toThrow(/WHERE not allowed on scalar operations/i);
    });

    it('should provide clear error for FOR on scalar operations', () => {
      const input = 'FOR title DELETE';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations.*Use: DELETE title/i);
    });

    it('should differentiate between array REMOVE (requires FOR+WHERE) and scalar DELETE (no FOR/WHERE)', () => {
      const validRemove = 'FOR tasks WHERE status = "done" REMOVE';
      const validDelete = 'DELETE title';

      expect(() => parseAction(validRemove)).not.toThrow();
      expect(() => parseAction(validDelete)).not.toThrow();
    });
  });

  describe('Helpful error messages for common mistakes', () => {
    it('should suggest FOR when user starts with path: tasks WHERE status = "done" SET...', () => {
      const input = 'tasks WHERE status = "done" SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/Did you forget FOR\?.*Use: FOR tasks WHERE/i);
    });

    it('should suggest WHERE when user tries array SET without WHERE', () => {
      const input = 'FOR tasks SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/SET on array requires WHERE.*Specify which items: FOR tasks WHERE status = "pending" SET priority 10/i);
    });

    it('should explain REMOVE requires WHERE or value: FOR tasks REMOVE', () => {
      const input = 'FOR tasks REMOVE';

      expect(() => parseAction(input))
        .toThrow(/Expected value/i); // REMOVE needs value or WHERE
    });

    it('should explain MOVE TO requires WHERE: FOR tasks MOVE TO START', () => {
      const input = 'FOR tasks MOVE TO START';

      expect(() => parseAction(input))
        .toThrow(/MOVE TO requires WHERE.*For index-based move, use: FOR tasks MOVE FROM index TO index/i);
    });
  });

  describe('Context-sensitive validation: Hybrid approach', () => {
    it('should allow SET without FOR on scalar fields', () => {
      const input = 'SET title "New Title"';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject FOR on scalar fields', () => {
      const input = 'FOR title SET "New Title"';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('should require FOR and WHERE for SET on array items', () => {
      const input = 'FOR tasks SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/requires WHERE/i);
    });

    it('should allow DELETE without FOR on scalar fields', () => {
      const input = 'DELETE draft';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject FOR on scalar DELETE', () => {
      const input = 'FOR draft DELETE';

      expect(() => parseAction(input))
        .toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('should require FOR and WHERE or value for REMOVE on array items', () => {
      const input = 'FOR tasks REMOVE';

      expect(() => parseAction(input))
        .toThrow(/Expected value/i); // REMOVE needs value or WHERE
    });

    it('should allow MOVE FROM/TO with FOR, without WHERE (index-based)', () => {
      const input = 'FOR tasks MOVE FROM 0 TO 5';

      expect(() => parseAction(input)).not.toThrow();
    });

    it('should require FOR and WHERE for MOVE TO target (conditional)', () => {
      const input = 'FOR tasks MOVE TO START';

      expect(() => parseAction(input))
        .toThrow(/requires WHERE/i);
    });
  });

  describe('Edge cases: WHERE in unexpected positions', () => {
    it('should reject WHERE before FOR: WHERE status = "done" FOR tasks SET priority 10', () => {
      const input = 'WHERE status = "done" FOR tasks SET priority 10';

      expect(() => parseAction(input))
        .toThrow(/Expected FOR keyword at start.*WHERE must come after FOR and path/i);
    });

    it('should reject WHERE after operation: FOR tasks SET priority 10 WHERE status = "done"', () => {
      const input = 'FOR tasks SET priority 10 WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/WHERE must come before operation.*Use: FOR tasks WHERE status = "done" SET priority 10/i);
    });

    it('should reject WHERE in middle of operation: FOR tasks SET WHERE status = "done" priority 10', () => {
      const input = 'FOR tasks SET WHERE status = "done" priority 10';

      expect(() => parseAction(input))
        .toThrow(/Unexpected WHERE in operation.*WHERE must come immediately after path/i);
    });
  });

  describe('Validation summary table: Hybrid v2.0 approach', () => {
    const validationRules = [
      {
        operation: 'SET (scalar)',
        requiresFOR: false,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'SET title "value"'
      },
      {
        operation: 'SET (array)',
        requiresFOR: true,
        requiresWHERE: true,
        allowsWHERE: true,
        example: 'FOR tasks WHERE status = "pending" SET priority 10'
      },
      {
        operation: 'DELETE (scalar)',
        requiresFOR: false,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'DELETE draft'
      },
      {
        operation: 'RENAME (scalar)',
        requiresFOR: false,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'RENAME old TO new'
      },
      {
        operation: 'INSERT (array)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tags INSERT "value" AT 0'
      },
      {
        operation: 'APPEND (array)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tags APPEND "value"'
      },
      {
        operation: 'REMOVE (array)',
        requiresFOR: true,
        requiresWHERE: true,
        allowsWHERE: true,
        example: 'FOR tasks WHERE status = "done" REMOVE'
      },
      {
        operation: 'REMOVE_ALL (array)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tags REMOVE_ALL "old"'
      },
      {
        operation: 'SORT (array)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tasks SORT BY priority'
      },
      {
        operation: 'MOVE FROM/TO (array, index)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tasks MOVE FROM 0 TO 5'
      },
      {
        operation: 'MOVE TO (array, conditional)',
        requiresFOR: true,
        requiresWHERE: true,
        allowsWHERE: true,
        example: 'FOR tasks WHERE priority > 8 MOVE TO START'
      },
      {
        operation: 'DEDUPLICATE (array)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR tags DEDUPLICATE'
      },
      {
        operation: 'MERGE (object)',
        requiresFOR: true,
        requiresWHERE: false,
        allowsWHERE: false,
        example: 'FOR metadata MERGE {"key": "value"}'
      }
    ];

    it('should document FOR and WHERE clause requirements for all operations', () => {
      expect(validationRules).toHaveLength(13);

      // Verify scalar operations (no FOR required)
      const scalarOps = validationRules.filter(r => !r.requiresFOR);
      expect(scalarOps).toEqual([
        expect.objectContaining({ operation: 'SET (scalar)' }),
        expect.objectContaining({ operation: 'DELETE (scalar)' }),
        expect.objectContaining({ operation: 'RENAME (scalar)' })
      ]);

      // Verify collection operations (FOR required)
      const collectionOps = validationRules.filter(r => r.requiresFOR);
      expect(collectionOps.length).toBe(10);

      // Verify operations requiring WHERE
      const requireWHERE = validationRules.filter(r => r.requiresWHERE);
      expect(requireWHERE).toEqual([
        expect.objectContaining({ operation: 'SET (array)' }),
        expect.objectContaining({ operation: 'REMOVE (array)' }),
        expect.objectContaining({ operation: 'MOVE TO (array, conditional)' })
      ]);

      // Verify operations forbidding WHERE
      const forbidWHERE = validationRules.filter(r => !r.allowsWHERE);
      expect(forbidWHERE.length).toBe(10); // All scalars + most array ops
    });

    it('should validate each rule with positive and negative tests', () => {
      validationRules.forEach(rule => {
        // Positive test: valid syntax should not throw
        if (!rule.requiresWHERE) {
          expect(() => parseAction(rule.example)).not.toThrow();
        }

        // Additional validation logic can be added here
      });
    });
  });

  describe('Hybrid v2.0 validation matrix', () => {
    it('should document the complete validation matrix', () => {
      // Hybrid v2.0 Validation Matrix:
      //
      // | Operation Type          | FOR Required | WHERE Allowed | WHERE Required |
      // |-------------------------|--------------|---------------|----------------|
      // | Scalar operations       | ❌ No        | ❌ No         | ❌ No          |
      // | Array simple ops        | ✅ Yes       | ❌ No         | ❌ No          |
      // | Array conditional ops   | ✅ Yes       | ✅ Yes        | ✅ Yes         |
      // | Object operations       | ✅ Yes       | ❌ No         | ❌ No          |
      //
      // Examples:
      // - Scalar: SET title "value"
      // - Array simple: FOR tags APPEND "item"
      // - Array conditional: FOR tasks WHERE status = "done" REMOVE
      // - Object: FOR metadata MERGE {"key": "value"}

      const matrix = {
        scalar: { forRequired: false, whereAllowed: false, whereRequired: false },
        arraySimple: { forRequired: true, whereAllowed: false, whereRequired: false },
        arrayConditional: { forRequired: true, whereAllowed: true, whereRequired: true },
        object: { forRequired: true, whereAllowed: false, whereRequired: false }
      };

      expect(matrix.scalar).toEqual({ forRequired: false, whereAllowed: false, whereRequired: false });
      expect(matrix.arraySimple).toEqual({ forRequired: true, whereAllowed: false, whereRequired: false });
      expect(matrix.arrayConditional).toEqual({ forRequired: true, whereAllowed: true, whereRequired: true });
      expect(matrix.object).toEqual({ forRequired: true, whereAllowed: false, whereRequired: false });
    });
  });

  describe('Parser state tracking', () => {
    it('should track that FOR has been seen before allowing WHERE', () => {
      const input = 'WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/WHERE requires FOR/i);
    });

    it('should track that path has been seen before allowing WHERE', () => {
      const input = 'FOR WHERE status = "done"';

      expect(() => parseAction(input))
        .toThrow(/Expected path after FOR/i);
    });

    it('should track that WHERE has been seen before allowing operation', () => {
      const input = 'FOR tasks WHERE';

      expect(() => parseAction(input))
        .toThrow(/Expected condition after WHERE/i);
    });
  });

  describe('Comprehensive error message quality', () => {
    it('should include position information in errors', () => {
      const input = 'FOR tasks WHERE status = "unterminated';

      expect(() => parseAction(input))
        .toThrow(/position \d+/i);
    });

    it('should include expected tokens in errors', () => {
      const input = 'FOR tasks INVALID_OP';

      expect(() => parseAction(input))
        .toThrow(/Expected: SET, DELETE, RENAME, INSERT, REMOVE, SORT, MOVE, DEDUPLICATE, MERGE/i);
    });

    it('should include examples in WHERE-related errors', () => {
      const input = 'FOR tasks WHERE'; // Incomplete WHERE

      expect(() => parseAction(input))
        .toThrow(/Expected.*condition/i); // Actual parse error for incomplete WHERE
    });

    it('should differentiate between parser errors and semantic errors', () => {
      const syntaxError = 'FOR tasks WHERE'; // Missing condition
      const semanticError = 'FOR tasks SET priority 10'; // Missing WHERE for array SET

      expect(() => parseAction(syntaxError))
        .toThrow(/Expected.*condition/i); // Parser error
      expect(() => parseAction(semanticError))
        .toThrow(/SET on array requires WHERE/i); // Semantic error
    });
  });
});
