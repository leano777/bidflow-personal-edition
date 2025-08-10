// Regional Cost Database - CSI Code and Zip Code Based Pricing
// Handles baseline unit prices, location factors, and escalation indices

import {
  CSICode,
  BaseUnitPrice,
  ZipCodePricing,
  LocationFactors,
  EscalationIndex,
  RegionalCostDatabase,
  PricingQuery,
  PricingQueryResult
} from './types';
import { RegionalPricingCache, defaultCacheConfig } from './cache-service';

export class RegionalCostDBService {
  private database: RegionalCostDatabase;
  private cache: RegionalPricingCache;
  private isInitialized: boolean = false;

  constructor(cache?: RegionalPricingCache) {
    this.cache = cache || new RegionalPricingCache(defaultCacheConfig);
    this.database = {
      csiCodes: [],
      zipCodePricing: new Map(),
      locationFactors: new Map(),
      escalationIndices: [],
      lastSync: new Date(),
      cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Initialize the database and cache
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Regional Cost Database...');
      
      // Initialize cache first
      await this.cache.initialize();
      
      // Load CSI codes and baseline data
      await this.loadCSICodes();
      await this.loadBaselinePricing();
      await this.loadEscalationIndices();
      
      this.isInitialized = true;
      console.log('✅ Regional Cost Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Regional Cost Database:', error);
      throw error;
    }
  }

  /**
   * Main pricing lookup method - optimized for sub-100ms queries
   */
  async lookupPricing(query: PricingQuery): Promise<PricingQueryResult> {
    if (!this.isInitialized) {
      throw new Error('Regional Cost Database not initialized');
    }

    const startTime = Date.now();

    try {
      // 1. Check cache first for complete result
      const cachedResult = await this.cache.getCachedPricingResult(query);
      if (cachedResult) {
        console.log(`⚡ Cache hit for query: ${query.csiCode}:${query.zipCode} (${cachedResult.queryTime}ms)`);
        return cachedResult;
      }

      // 2. Build result from components (with individual caching)
      const result = await this.buildPricingResult(query, startTime);

      // 3. Cache the complete result
      await this.cache.cachePricingResult(query, result);

      return result;

    } catch (error) {
      console.error('Error during pricing lookup:', error);
      throw new Error(`Failed to lookup pricing for CSI ${query.csiCode} in ${query.zipCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch lookup multiple pricing queries
   */
  async batchLookupPricing(queries: PricingQuery[]): Promise<PricingQueryResult[]> {
    if (!this.isInitialized) {
      throw new Error('Regional Cost Database not initialized');
    }

    console.log(`📊 Processing batch lookup for ${queries.length} queries`);
    const startTime = Date.now();

    // Process queries in parallel for better performance
    const results = await Promise.allSettled(
      queries.map(query => this.lookupPricing(query))
    );

    const successful: PricingQueryResult[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(`Query ${index}: ${result.reason}`);
        console.error(`Failed query ${index}:`, result.reason);
      }
    });

    const totalTime = Date.now() - startTime;
    console.log(`📊 Batch lookup complete: ${successful.length}/${queries.length} successful (${totalTime}ms total)`);

    if (failed.length > 0) {
      console.warn(`⚠️  ${failed.length} queries failed:`, failed);
    }

    return successful;
  }

  /**
   * Build complete pricing result from individual components
   */
  private async buildPricingResult(query: PricingQuery, startTime: number): Promise<PricingQueryResult> {
    // 1. Get base unit price
    const basePrice = await this.getBaseUnitPrice(query.csiCode, query.zipCode);
    if (!basePrice) {
      throw new Error(`No base price found for CSI ${query.csiCode} in zip ${query.zipCode}`);
    }

    // 2. Get location factors (if requested)
    let locationFactors: LocationFactors | null = null;
    let locationAdjusted = {
      laborCost: basePrice.laborCost,
      materialCost: basePrice.materialCost,
      equipmentCost: basePrice.equipmentCost,
      totalCost: basePrice.totalUnitPrice
    };

    if (query.includeLocationFactors !== false) {
      locationFactors = await this.getLocationFactors(query.zipCode);
      if (locationFactors) {
        locationAdjusted = {
          laborCost: basePrice.laborCost * locationFactors.laborFactor,
          materialCost: basePrice.materialCost * locationFactors.materialFactor,
          equipmentCost: basePrice.equipmentCost * locationFactors.equipmentFactor,
          totalCost: basePrice.totalUnitPrice * locationFactors.totalFactor
        };
      }
    }

    // 3. Apply escalation indices (if requested)
    let escalationFactor: EscalationIndex | null = null;
    let escalationAdjusted = { ...locationAdjusted };

    if (query.includeEscalation !== false) {
      const targetQuarter = query.targetQuarter || this.getCurrentQuarter();
      escalationFactor = await this.getEscalationIndex(targetQuarter);
      
      if (escalationFactor) {
        const laborMultiplier = 1 + (escalationFactor.laborEscalation / 100);
        const materialMultiplier = 1 + (escalationFactor.materialEscalation / 100);
        const equipmentMultiplier = 1 + (escalationFactor.equipmentEscalation / 100);
        const overallMultiplier = 1 + (escalationFactor.overallInflation / 100);

        escalationAdjusted = {
          laborCost: locationAdjusted.laborCost * laborMultiplier,
          materialCost: locationAdjusted.materialCost * materialMultiplier,
          equipmentCost: locationAdjusted.equipmentCost * equipmentMultiplier,
          totalCost: locationAdjusted.totalCost * overallMultiplier
        };
      }
    }

    // 4. Calculate final pricing
    const finalUnitPrice = escalationAdjusted.totalCost;
    const extendedPrice = finalUnitPrice * query.quantity;

    // 5. Calculate confidence score
    const confidence = this.calculateConfidence(basePrice, locationFactors, escalationFactor);

    const queryTime = Date.now() - startTime;

    return {
      query,
      basePrice,
      locationAdjusted,
      escalationAdjusted,
      finalPrice: {
        laborCost: escalationAdjusted.laborCost,
        materialCost: escalationAdjusted.materialCost,
        equipmentCost: escalationAdjusted.equipmentCost,
        totalCost: escalationAdjusted.totalCost,
        unitPrice: finalUnitPrice,
        extendedPrice
      },
      appliedFactors: {
        locationFactor: locationFactors!,
        escalationFactor: escalationFactor || undefined
      },
      confidence,
      cacheHit: false,
      queryTime,
      calculatedAt: new Date()
    };
  }

  /**
   * Get base unit price for CSI code and zip code
   */
  private async getBaseUnitPrice(csiCode: string, zipCode: string): Promise<BaseUnitPrice | null> {
    // Check cache first
    const cached = await this.cache.getCachedBasePrice(csiCode, zipCode);
    if (cached) {
      return cached;
    }

    // Look up in database
    const zipPricing = this.database.zipCodePricing.get(zipCode);
    if (!zipPricing) {
      return null;
    }

    const basePrice = zipPricing.unitPrices.find(price => price.csiCode === csiCode);
    if (basePrice) {
      // Cache the result
      await this.cache.cacheBasePrice(csiCode, zipCode, basePrice);
    }

    return basePrice || null;
  }

  /**
   * Get location factors for zip code
   */
  private async getLocationFactors(zipCode: string): Promise<LocationFactors | null> {
    // Check cache first
    const cached = await this.cache.getCachedLocationFactors(zipCode);
    if (cached) {
      return cached;
    }

    // Look up in database
    const factors = this.database.locationFactors.get(zipCode);
    if (factors) {
      // Cache the result
      await this.cache.cacheLocationFactors(zipCode, factors);
    }

    return factors || null;
  }

  /**
   * Get escalation index for target quarter
   */
  private async getEscalationIndex(quarter: string): Promise<EscalationIndex | null> {
    // Check cache first
    const cached = await this.cache.getCachedEscalationIndex(quarter);
    if (cached) {
      return cached;
    }

    // Look up in database
    const index = this.database.escalationIndices.find(idx => idx.quarter === quarter);
    if (index) {
      // Cache the result
      await this.cache.cacheEscalationIndex(quarter, index);
    }

    return index || null;
  }

  /**
   * Calculate confidence score for pricing result
   */
  private calculateConfidence(
    basePrice: BaseUnitPrice, 
    locationFactors: LocationFactors | null, 
    escalationIndex: EscalationIndex | null
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust for data freshness
    const daysSinceUpdate = (Date.now() - basePrice.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 90) {
      confidence -= 0.3;
    } else if (daysSinceUpdate > 30) {
      confidence -= 0.1;
    }

    // Boost confidence for location factors
    if (locationFactors) {
      confidence += 0.1;
    }

    // Boost confidence for recent escalation data
    if (escalationIndex) {
      const daysSincePublished = (Date.now() - escalationIndex.publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished <= 30) {
        confidence += 0.1;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get current quarter in format "YYYY-QN"
   */
  private getCurrentQuarter(): string {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
  }

  /**
   * Load CSI codes from data source
   */
  private async loadCSICodes(): Promise<void> {
    console.log('📚 Loading CSI codes...');
    
    // In a real implementation, this would load from a database or API
    // For now, we'll create some sample CSI codes
    this.database.csiCodes = [
      { code: '03 30 00', level: 3, title: 'Cast-In-Place Concrete', description: 'Ready-mixed concrete', parentCode: '03 00 00' },
      { code: '06 10 00', level: 3, title: 'Rough Carpentry', description: 'Framing lumber and hardware', parentCode: '06 00 00' },
      { code: '09 22 00', level: 3, title: 'Supports for Plaster and Gypsum Board', description: 'Metal lath, furring', parentCode: '09 00 00' },
      { code: '09 91 00', level: 3, title: 'Painting', description: 'Interior and exterior painting', parentCode: '09 00 00' },
      { code: '23 21 00', level: 3, title: 'Hydronic Piping and Pumps', description: 'HVAC piping systems', parentCode: '23 00 00' },
      { code: '26 05 19', level: 3, title: 'Low-Voltage Electrical Power Conductors and Cables', description: 'Electrical wiring', parentCode: '26 00 00' }
    ];

    console.log(`✅ Loaded ${this.database.csiCodes.length} CSI codes`);
  }

  /**
   * Load baseline unit pricing data
   */
  private async loadBaselinePricing(): Promise<void> {
    console.log('💰 Loading baseline pricing data...');
    
    // Sample zip codes with baseline pricing
    const sampleZipCodes = [
      { zip: '90210', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
      { zip: '94102', city: 'San Francisco', state: 'CA', county: 'San Francisco' },
      { zip: '92101', city: 'San Diego', state: 'CA', county: 'San Diego' },
      { zip: '95814', city: 'Sacramento', state: 'CA', county: 'Sacramento' }
    ];

    for (const zipInfo of sampleZipCodes) {
      const unitPrices: BaseUnitPrice[] = [
        {
          id: `${zipInfo.zip}-03-30-00`,
          csiCode: '03 30 00',
          itemDescription: 'Ready-mix concrete, 3000 psi',
          unit: 'CY',
          laborCost: 45.50,
          materialCost: 120.00,
          equipmentCost: 15.25,
          totalUnitPrice: 180.75,
          effectiveDate: new Date('2024-01-01'),
          lastUpdated: new Date()
        },
        {
          id: `${zipInfo.zip}-06-10-00`,
          csiCode: '06 10 00',
          itemDescription: 'Framing lumber, Douglas Fir',
          unit: 'LF',
          laborCost: 2.85,
          materialCost: 4.25,
          equipmentCost: 0.15,
          totalUnitPrice: 7.25,
          effectiveDate: new Date('2024-01-01'),
          lastUpdated: new Date()
        },
        {
          id: `${zipInfo.zip}-09-91-00`,
          csiCode: '09 91 00',
          itemDescription: 'Interior paint, premium latex',
          unit: 'SF',
          laborCost: 1.85,
          materialCost: 0.65,
          equipmentCost: 0.05,
          totalUnitPrice: 2.55,
          effectiveDate: new Date('2024-01-01'),
          lastUpdated: new Date()
        }
      ];

      const locationFactors: LocationFactors = {
        zipCode: zipInfo.zip,
        laborFactor: zipInfo.zip === '94102' ? 1.35 : zipInfo.zip === '90210' ? 1.25 : 1.0,
        materialFactor: zipInfo.zip === '94102' ? 1.15 : zipInfo.zip === '90210' ? 1.10 : 1.0,
        equipmentFactor: zipInfo.zip === '94102' ? 1.20 : zipInfo.zip === '90210' ? 1.15 : 1.0,
        totalFactor: zipInfo.zip === '94102' ? 1.25 : zipInfo.zip === '90210' ? 1.18 : 1.0,
        costIndex: zipInfo.zip === '94102' ? 125 : zipInfo.zip === '90210' ? 118 : 100,
        lastUpdated: new Date()
      };

      const zipCodePricing: ZipCodePricing = {
        zipCode: zipInfo.zip,
        city: zipInfo.city,
        state: zipInfo.state,
        county: zipInfo.county,
        unitPrices,
        locationFactors,
        lastUpdated: new Date()
      };

      this.database.zipCodePricing.set(zipInfo.zip, zipCodePricing);
      this.database.locationFactors.set(zipInfo.zip, locationFactors);
    }

    console.log(`✅ Loaded pricing for ${this.database.zipCodePricing.size} zip codes`);
  }

  /**
   * Load escalation indices
   */
  private async loadEscalationIndices(): Promise<void> {
    console.log('📈 Loading escalation indices...');
    
    const currentYear = new Date().getFullYear();
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    // Create escalation data for current and previous year
    for (const year of [currentYear - 1, currentYear]) {
      for (let q = 0; q < quarters.length; q++) {
        const quarter = quarters[q];
        const escalationIndex: EscalationIndex = {
          quarter: `${year}-${quarter}`,
          year,
          quarterNumber: q + 1,
          laborEscalation: 2.5 + (Math.random() * 2 - 1), // 1.5% to 3.5%
          materialEscalation: 3.2 + (Math.random() * 3 - 1.5), // 1.7% to 4.7%
          equipmentEscalation: 1.8 + (Math.random() * 1.5 - 0.75), // 1.05% to 2.55%
          overallInflation: 2.8 + (Math.random() * 2 - 1), // 1.8% to 3.8%
          baseIndexValue: 100 + (year - 2020) * 10 + q * 2.5, // Increasing trend
          publishedDate: new Date(year, q * 3, 15) // Mid-quarter publication
        };
        
        this.database.escalationIndices.push(escalationIndex);
      }
    }

    console.log(`✅ Loaded ${this.database.escalationIndices.length} escalation indices`);
  }

  /**
   * Refresh database from external sources
   */
  async refreshDatabase(): Promise<void> {
    console.log('🔄 Refreshing Regional Cost Database...');
    
    try {
      await this.loadBaselinePricing();
      await this.loadEscalationIndices();
      
      this.database.lastSync = new Date();
      this.database.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Invalidate relevant cache entries
      await this.cache.invalidateCache('rcd:*');
      
      console.log('✅ Database refresh complete');
    } catch (error) {
      console.error('Failed to refresh database:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      csiCodes: this.database.csiCodes.length,
      zipCodes: this.database.zipCodePricing.size,
      locationFactors: this.database.locationFactors.size,
      escalationIndices: this.database.escalationIndices.length,
      lastSync: this.database.lastSync,
      cacheExpiry: this.database.cacheExpiry,
      initialized: this.isInitialized
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.cache.shutdown();
    console.log('✅ Regional Cost Database shutdown complete');
  }
}

// Singleton instance for easy use
export const regionalCostDB = new RegionalCostDBService();
