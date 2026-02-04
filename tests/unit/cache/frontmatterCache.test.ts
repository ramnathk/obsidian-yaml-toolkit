/**
 * Tests for Frontmatter Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FrontmatterCache } from '../../../src/cache/frontmatterCache';

// Mock TFile for testing
interface MockTFile {
  path: string;
  stat: {
    mtime: number;
  };
}

function createMockFile(path: string, mtime: number = Date.now()): MockTFile {
  return {
    path,
    stat: { mtime }
  };
}

describe('FrontmatterCache', () => {
  let cache: FrontmatterCache;

  beforeEach(() => {
    cache = new FrontmatterCache();
  });

  describe('Basic caching', () => {
    it('should cache and retrieve frontmatter', () => {
      const file = createMockFile('test.md');
      const data = { title: 'Test Note', tags: ['a', 'b'] };

      cache.set(file, data);
      const retrieved = cache.get(file);

      expect(retrieved).toEqual(data);
    });

    it('should return null for cache miss', () => {
      const file = createMockFile('test.md');
      const retrieved = cache.get(file);

      expect(retrieved).toBeNull();
    });

    it('should handle multiple files', () => {
      const file1 = createMockFile('file1.md');
      const file2 = createMockFile('file2.md');
      const data1 = { title: 'File 1' };
      const data2 = { title: 'File 2' };

      cache.set(file1, data1);
      cache.set(file2, data2);

      expect(cache.get(file1)).toEqual(data1);
      expect(cache.get(file2)).toEqual(data2);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when file is modified', () => {
      const file = createMockFile('test.md', 1000);
      const data = { title: 'Original' };

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);

      // Simulate file modification
      file.stat.mtime = 2000;
      expect(cache.get(file)).toBeNull();
    });

    it('should invalidate when checking same file with different mtime', () => {
      const file = createMockFile('test.md', 1000);
      const data = { title: 'Data' };

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);

      // Simulate file modification by changing mtime
      file.stat.mtime = 2000;

      // Same file object but different mtime should miss
      expect(cache.get(file)).toBeNull();
    });
  });

  describe('Cache eviction (LRU)', () => {
    it('should evict oldest entry when maxSize exceeded', () => {
      // Create a small cache for testing
      const testCache = new FrontmatterCache();

      // Add multiple files to reach the limit
      // (We'll add 501 to trigger eviction)
      const files = Array(501)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.md`, 1000 + i));

      const firstFile = files[0];
      const secondFile = files[1];
      const lastFile = files[500];

      // Cache all files
      for (const file of files) {
        testCache.set(file, { path: file.path });
      }

      // First file should be evicted (LRU)
      expect(testCache.get(firstFile)).toBeNull();

      // Second file might still be there (depends on exact eviction point)
      // Last file should definitely be there
      expect(testCache.get(lastFile)).toEqual({ path: lastFile.path });

      // Verify cache stats
      const stats = testCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    it('should maintain cache size under maxSize', () => {
      const files = Array(250)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.md`));

      for (const file of files) {
        cache.set(file, { id: file.path });
      }

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });

  describe('Cache operations', () => {
    it('should clear entire cache', () => {
      const file1 = createMockFile('file1.md');
      const file2 = createMockFile('file2.md');

      cache.set(file1, { title: 'File 1' });
      cache.set(file2, { title: 'File 2' });

      expect(cache.get(file1)).not.toBeNull();
      expect(cache.get(file2)).not.toBeNull();

      cache.clear();

      expect(cache.get(file1)).toBeNull();
      expect(cache.get(file2)).toBeNull();
    });

    it('should report correct cache statistics', () => {
      const file1 = createMockFile('file1.md');
      const file2 = createMockFile('file2.md');

      cache.set(file1, { title: 'File 1' });
      cache.set(file2, { title: 'File 2' });

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(500);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data objects', () => {
      const file = createMockFile('test.md');
      const data = {};

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);
    });

    it('should handle complex nested data', () => {
      const file = createMockFile('test.md');
      const data = {
        title: 'Complex',
        nested: {
          level1: {
            level2: {
              array: [1, 2, { key: 'value' }]
            }
          }
        }
      };

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);
    });

    it('should handle null and undefined values in data', () => {
      const file = createMockFile('test.md');
      const data = {
        title: 'Test',
        nullField: null,
        undefinedField: undefined
      };

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);
    });

    it('should handle very long file paths', () => {
      const longPath = 'a'.repeat(300) + '/file.md';
      const file = createMockFile(longPath);
      const data = { title: 'Long path' };

      cache.set(file, data);
      expect(cache.get(file)).toEqual(data);
    });
  });

  describe('Performance characteristics', () => {
    it('should handle rapid cache operations', () => {
      const files = Array(100)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.md`));

      // Rapid set operations
      for (const file of files) {
        cache.set(file, { id: file.path });
      }

      // Rapid get operations
      for (const file of files) {
        expect(cache.get(file)).not.toBeNull();
      }

      expect(true).toBe(true); // Test completes without timeout
    });

    it('should efficiently invalidate stale entries', () => {
      const file = createMockFile('test.md', 1000);
      const data = { title: 'Test' };

      cache.set(file, data);
      expect(cache.get(file)).not.toBeNull();

      // Invalidate by changing mtime
      file.stat.mtime = 2000;
      expect(cache.get(file)).toBeNull();

      // Re-cache with new mtime
      cache.set(file, data);
      expect(cache.get(file)).not.toBeNull();
    });
  });
});
