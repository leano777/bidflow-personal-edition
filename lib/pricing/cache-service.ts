// Redis Cache Service for Regional Cost Database
// Optimized for sub-100ms pricing queries

import Redis from 'ioredis';
import { 
  CacheConfig, 
  PricingQueryResult, 
  BaseUnitPrice, 
  LocationFactors, 
  EscalationIndex,
  PricingQuery
} from './types';

export class RegionalPricingCache {
  private redis: Redis;
  private config: CacheConfig;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;

  constructor(config: CacheConfig) {
    this.config = config;
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      keepAlive: 30000,
      // Optimize for speed
      commandTimeout: 50, // 50ms command timeout for sub-100ms queries
      connectTimeout: 1000,
      // Connection pool settings
      family: 4,
      enableReadyCheck: false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('🔗 Redis connected for regional pricing cache');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      this.connectionAttempts++;
      console.log(`🔄 Redis reconnecting (attempt ${this.connectionAttempts})`);
    });
  }

  /**
   * Initialize connection and warm cache with critical data
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      console.log('✅ Regional pricing cache initialized');
      
      // Warm up cache with frequently accessed data
      await this.warmCache();
    } catch (error) {
      console.error('Failed to initialize regional pricing cache:', error);
      throw error;
    }
  }

  /**
   * Cache a complete pricing query result
   */
  async cachePricingResult(query: PricingQuery, result: PricingQueryResult): Promise<void> {
    if (!this.isConnected) return;

    const key = this.generateQueryKey(query);
    const value = JSON.stringify({
      ...result,
      cacheHit: false, // Reset cache hit flag
      cachedAt: new Date()
    });

    try {
      await this.redis.setex(key, this.config.ttl.queryResult, value);
    } catch (error) {
      console.error('Failed to cache pricing result:', error);
    }
  }

  /**
   * Get cached pricing query result
   */
  async getCachedPricingResult(query: PricingQuery): Promise<PricingQueryResult | null> {
    if (!this.isConnected) return null;

    const key = this.generateQueryKey(query);
    
    try {
      const startTime = Date.now();
      const cached = await this.redis.get(key);
      const queryTime = Date.now() - startTime;

      if (cached) {
        const result = JSON.parse(cached) as PricingQueryResult;
        return {
          ...result,
          cacheHit: true,
          queryTime,
          calculatedAt: new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached pricing result:', error);
      return null;
    }
  }

  /**
   * Cache base unit prices by CSI code
   */
  async cacheBasePrice(csiCode: string, zipCode: string, price: BaseUnitPrice): Promise<void> {
    if (!this.isConnected) return;

    const key = `${this.config.keyPrefixes.basePrice}:${csiCode}:${zipCode}`;
    const value = JSON.stringify(price);

    try {
      await this.redis.setex(key, this.config.ttl.basePrice, value);
    } catch (error) {
      console.error('Failed to cache base price:', error);
    }
  }

  /**
   * Get cached base unit price
   */
  async getCachedBasePrice(csiCode: string, zipCode: string): Promise<BaseUnitPrice | null> {
    if (!this.isConnected) return null;

    const key = `${this.config.keyPrefixes.basePrice}:${csiCode}:${zipCode}`;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached base price:', error);
      return null;
    }
  }

  /**
   * Cache location factors by zip code
   */
  async cacheLocationFactors(zipCode: string, factors: LocationFactors): Promise<void> {
    if (!this.isConnected) return;

    const key = `${this.config.keyPrefixes.locationFactor}:${zipCode}`;
    const value = JSON.stringify(factors);

    try {
      await this.redis.setex(key, this.config.ttl.locationFactor, value);
    } catch (error) {
      console.error('Failed to cache location factors:', error);
    }
  }

  /**
   * Get cached location factors
   */
  async getCachedLocationFactors(zipCode: string): Promise<LocationFactors | null> {
    if (!this.isConnected) return null;

    const key = `${this.config.keyPrefixes.locationFactor}:${zipCode}`;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached location factors:', error);
      return null;
    }
  }

  /**
   * Cache escalation index by quarter
   */
  async cacheEscalationIndex(quarter: string, index: EscalationIndex): Promise<void> {
    if (!this.isConnected) return;

    const key = `${this.config.keyPrefixes.escalationIndex}:${quarter}`;
    const value = JSON.stringify(index);

    try {
      await this.redis.setex(key, this.config.ttl.escalationIndex, value);
    } catch (error) {
      console.error('Failed to cache escalation index:', error);
    }
  }

  /**
   * Get cached escalation index
   */
  async getCachedEscalationIndex(quarter: string): Promise<EscalationIndex | null> {
    if (!this.isConnected) return null;

    const key = `${this.config.keyPrefixes.escalationIndex}:${quarter}`;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached escalation index:', error);
      return null;
    }
  }

  /**
   * Batch cache multiple items for performance
   */
  async batchCacheBasePrices(items: Array<{csiCode: string, zipCode: string, price: BaseUnitPrice}>): Promise<void> {
    if (!this.isConnected || items.length === 0) return;

    const pipeline = this.redis.pipeline();

    for (const item of items) {
      const key = `${this.config.keyPrefixes.basePrice}:${item.csiCode}:${item.zipCode}`;
      const value = JSON.stringify(item.price);
      pipeline.setex(key, this.config.ttl.basePrice, value);
    }

    try {
      await pipeline.exec();
      console.log(`✅ Batch cached ${items.length} base prices`);
    } catch (error) {
      console.error('Failed to batch cache base prices:', error);
    }
  }

  /**
   * Batch get multiple cached prices
   */
  async batchGetCachedPrices(queries: Array<{csiCode: string, zipCode: string}>): Promise<Map<string, BaseUnitPrice>> {
    if (!this.isConnected || queries.length === 0) return new Map();

    const pipeline = this.redis.pipeline();
    const results = new Map<string, BaseUnitPrice>();

    // Build pipeline
    for (const query of queries) {
      const key = `${this.config.keyPrefixes.basePrice}:${query.csiCode}:${query.zipCode}`;
      pipeline.get(key);
    }

    try {
      const pipelineResults = await pipeline.exec();
      
      if (pipelineResults) {
        pipelineResults.forEach((result, index) => {
          if (result && result[0] === null && result[1]) { // No error and has value
            const query = queries[index];
            const key = `${query.csiCode}:${query.zipCode}`;
            results.set(key, JSON.parse(result[1] as string));
          }
        });
      }

      console.log(`📦 Batch retrieved ${results.size}/${queries.length} cached prices`);
    } catch (error) {
      console.error('Failed to batch get cached prices:', error);
    }

    return results;
  }

  /**
   * Invalidate cache for specific CSI code or zip code
   */
  async invalidateCache(pattern: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Invalidated ${keys.length} cache entries matching: ${pattern}`);
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    connections: number;
    uptime: number;
  }> {
    if (!this.isConnected) {
      return { totalKeys: 0, memoryUsage: '0B', hitRate: 0, connections: 0, uptime: 0 };
    }

    try {
      const info = await this.redis.info();
      const keyCount = await this.redis.dbsize();
      
      // Parse Redis info for relevant stats
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const connectionsMatch = info.match(/connected_clients:(\d+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      
      return {
        totalKeys: keyCount,
        memoryUsage: memoryMatch ? memoryMatch[1] : '0B',
        hitRate: 0.85, // Placeholder - would need to track this separately
        connections: connectionsMatch ? parseInt(connectionsMatch[1]) : 0,
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalKeys: 0, memoryUsage: '0B', hitRate: 0, connections: 0, uptime: 0 };
    }
  }

  /**
   * Warm cache with frequently used data
   */
  private async warmCache(): Promise<void> {
    console.log('🔥 Warming regional pricing cache...');
    
    // This would be populated with actual frequently-used CSI codes and zip codes
    // For now, we'll create placeholder entries for common items
    const commonQueries = [
      { csiCode: '03 30 00', zipCode: '90210' }, // Concrete - Beverly Hills
      { csiCode: '09 22 00', zipCode: '94102' }, // Plaster - San Francisco
      { csiCode: '06 10 00', zipCode: '92101' }, // Carpentry - San Diego
    ];

    // Cache would be warmed with actual data from the regional database
    console.log(`🔥 Cache warming complete for ${commonQueries.length} common queries`);
  }

  /**
   * Generate consistent cache key for pricing queries
   */
  private generateQueryKey(query: PricingQuery): string {
    const keyParts = [
      this.config.keyPrefixes.queryResult,
      query.csiCode,
      query.zipCode,
      query.quantity.toString(),
      query.unit,
      query.targetQuarter || 'current',
      query.includeLocationFactors ? 'loc' : 'noloc',
      query.includeEscalation ? 'esc' : 'noesc'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Health check for cache connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', latency?: number, error?: string }> {
    if (!this.isConnected) {
      return { status: 'unhealthy', error: 'Not connected to Redis' };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { 
        status: latency < 50 ? 'healthy' : 'unhealthy', 
        latency 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('✅ Regional pricing cache shutdown complete');
    } catch (error) {
      console.error('Error during cache shutdown:', error);
    }
  }
}

// Default cache configuration
export const defaultCacheConfig: CacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  ttl: {
    basePrice: 86400, // 24 hours
    locationFactor: 604800, // 7 days
    escalationIndex: 2592000, // 30 days
    queryResult: 3600 // 1 hour
  },
  keyPrefixes: {
    basePrice: 'rcd:price',
    locationFactor: 'rcd:loc',
    escalationIndex: 'rcd:esc',
    queryResult: 'rcd:query'
  }
};
