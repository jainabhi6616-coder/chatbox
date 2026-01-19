/**
 * Cache service for managing API response caching
 */

import { APP_CONFIG } from '../../config/app.config'
import type { ChatResponse } from '../graphql/types'

interface CacheEntry {
  response: ChatResponse
  timestamp: number
}

class CacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly expirationTime: number

  constructor(expirationTimeMs: number = APP_CONFIG.CACHE_EXPIRATION_MS) {
    this.expirationTime = expirationTimeMs
  }

  /**
   * Generate a cache key from the query text
   */
  getCacheKey(query: string): string {
    return query.toLowerCase().trim()
  }

  /**
   * Check if cached response is still valid
   */
  isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.expirationTime
  }

  /**
   * Get cached response if available and valid
   */
  get(query: string): ChatResponse | null {
    const cacheKey = this.getCacheKey(query)
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      return {
        ...cached.response,
        cached: true,
      }
    }

    return null
  }

  /**
   * Store response in cache
   */
  set(query: string, response: ChatResponse): void {
    const cacheKey = this.getCacheKey(query)
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear cache for a specific query
   */
  clearForQuery(query: string): void {
    const cacheKey = this.getCacheKey(query)
    this.cache.delete(cacheKey)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()


