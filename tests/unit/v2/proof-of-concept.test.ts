/**
 * Proof of Concept: v2.0 Parser Works
 *
 * This test demonstrates that the v2.0 parser is working correctly
 * and returns the expected v2.0 AST structure.
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '@/parser/actionParser';

describe('Proof: v2.0 Parser Works', () => {
  describe('v2.0 scalar syntax (no FOR) - SHOULD PASS', () => {
    it('v2.0: SET title "value" - scalar operation without FOR', () => {
      const input = 'SET title "value"';

      expect(() => parseAction(input)).not.toThrow();

      const result = parseAction(input) as any;
      expect(result).toBeDefined();
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('SET');
      expect(result.target.segments[0].key).toBe('title');
    });

    it('v2.0: DELETE draft - scalar operation without FOR', () => {
      const input = 'DELETE draft';

      expect(() => parseAction(input)).not.toThrow();

      const result = parseAction(input) as any;
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('DELETE');
      expect(result.target.segments[0].key).toBe('draft');
    });

    it('v2.0: FOR tags APPEND "value" - collection operation WITH FOR', () => {
      const input = 'FOR tags APPEND "value"';

      expect(() => parseAction(input)).not.toThrow();

      const result = parseAction(input) as any;
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('APPEND');
      expect(result.target.segments[0].key).toBe('tags');
    });
  });

  describe('v2.0 Hybrid syntax - Error handling', () => {
    it('v2.0: FOR title SET "value" - parser rejects (FOR not for scalars)', () => {
      const input = 'FOR title SET "value"';

      expect(() => parseAction(input)).toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('v2.0: FOR tasks SORT BY priority - parser accepts (FOR for collections)', () => {
      const input = 'FOR tasks SORT BY priority';

      expect(() => parseAction(input)).not.toThrow();

      const result = parseAction(input) as any;
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('SORT');
      expect(result.operation.by).toBe('priority');
    });

    it('v2.0: FOR tags APPEND "value" - parser accepts (FOR for collections)', () => {
      const input = 'FOR tags APPEND "value"';

      expect(() => parseAction(input)).not.toThrow();

      const result = parseAction(input) as any;
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('APPEND');
      expect(result.target.segments[0].key).toBe('tags');
    });
  });

  describe('Proof: Tests check exact v2.0 AST structure', () => {
    it('v2.0: SET returns correct AST structure', () => {
      const result = parseAction('SET title "value"') as any;

      // Tests verify EXACT v2.0 structure
      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('SET');
      expect(result.operation.value).toBe('value');

      // Check target path structure
      expect(result.target.type).toBe('path');
      expect(Array.isArray(result.target.segments)).toBe(true);
      expect(result.target.segments[0].type).toBe('property');
      expect(result.target.segments[0].key).toBe('title');
    });

    it('v2.0: DELETE returns correct AST structure', () => {
      const result = parseAction('DELETE draft') as any;

      expect(result.type).toBe('action');
      expect(result.operation.type).toBe('DELETE');
      expect(result.target.segments[0].key).toBe('draft');

      // DELETE operation has no value
      expect(result.operation.value).toBeUndefined();
    });
  });
});
