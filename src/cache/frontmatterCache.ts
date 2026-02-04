/**
 * Frontmatter Cache - In-memory caching for parsed frontmatter
 *
 * Improves performance by avoiding repeated parsing of unchanged files
 * Uses LRU eviction when cache reaches max size limit
 */

import { TFile } from 'obsidian';

interface CacheEntry {
  data: Record<string, any>;
  etag: string;  // File modification time as version identifier
  timestamp: number;  // When this entry was cached
}

export class FrontmatterCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 500;

  /**
   * Get cached frontmatter if valid
   * Returns null if cache miss or entry is stale
   */
  get(file: TFile): Record<string, any> | null {
    const entry = this.cache.get(file.path);
    if (!entry) return null;

    // Validate cache entry using file modification time
    const currentEtag = `${file.stat.mtime}`;
    if (entry.etag !== currentEtag) {
      // File was modified, invalidate cache
      this.cache.delete(file.path);
      return null;
    }

    return entry.data;
  }

  /**
   * Store frontmatter in cache
   * Evicts oldest entry if cache is full (LRU strategy)
   */
  set(file: TFile, data: Record<string, any>): void {
    // Make room if cache is full
    if (this.cache.size >= this.maxSize) {
      // Get the first (oldest) key in insertion order
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Create new cache entry
    this.cache.set(file.path, {
      data,
      etag: `${file.stat.mtime}`,
      timestamp: Date.now()
    });
  }

  /**
   * Clear entire cache
   * Useful when vault structure changes significantly
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Export singleton instance for application-wide caching
export const globalFrontmatterCache = new FrontmatterCache();
