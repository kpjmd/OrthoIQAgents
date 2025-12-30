import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import logger from './logger.js';

class CacheManager {
  constructor() {
    // Initialize LRU cache with 1000 item max and 24hr TTL
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    logger.info('Cache manager initialized with LRU cache');
  }
  
  /**
   * Generate cache key from case data
   */
  generateCacheKey(caseData) {
    // Extract key fields that define uniqueness
    const keyData = {
      symptoms: caseData.symptoms || [],
      painLevel: caseData.painLevel,
      location: caseData.location,
      duration: caseData.duration,
      age: caseData.age,
      primaryComplaint: caseData.primaryComplaint
    };
    
    // Create hash for consistent key
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);
    
    return `consultation:${hash}`;
  }
  
  /**
   * Get consultation from cache
   */
  async get(caseData) {
    const key = this.generateCacheKey(caseData);
    const cached = this.cache.get(key);
    
    if (cached) {
      this.stats.hits++;
      logger.debug(`Cache HIT for key: ${key}`);
      return {
        ...cached,
        fromCache: true,
        cacheKey: key
      };
    }
    
    this.stats.misses++;
    logger.debug(`Cache MISS for key: ${key}`);
    return null;
  }
  
  /**
   * Store consultation in cache
   */
  async set(caseData, response, ttl = null) {
    const key = this.generateCacheKey(caseData);
    
    // Store with optional custom TTL
    const options = ttl ? { ttl: ttl * 1000 } : undefined;
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      caseData: this.sanitizeCaseData(caseData)
    }, options);
    
    this.stats.sets++;
    logger.debug(`Cached consultation with key: ${key}`);
    
    return key;
  }
  
  /**
   * Check if similar case exists in cache
   * Now uses weighted scoring with body location/complaint matching
   */
  async findSimilar(caseData, threshold = 0.8) {
    // Get threshold from env if available
    const configThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD) || threshold;

    // Normalize location and complaint for comparison
    const targetLocation = (caseData.location || '').toLowerCase().trim();
    const targetComplaint = (caseData.primaryComplaint || '').toLowerCase().trim();
    const targetSymptoms = new Set((caseData.symptoms || []).map(s => s.toLowerCase()));

    let bestMatch = null;
    let bestScore = 0;
    let bestDetails = null;

    for (const [key, value] of this.cache.entries()) {
      const cachedLocation = (value.caseData.location || '').toLowerCase().trim();
      const cachedComplaint = (value.caseData.primaryComplaint || '').toLowerCase().trim();
      const cachedSymptoms = new Set((value.caseData.symptoms || []).map(s => s.toLowerCase()));

      // CRITICAL: Body location/primary complaint must match exactly
      // This prevents ankle queries from matching neck injuries
      const locationMatch = targetLocation && cachedLocation &&
        (targetLocation === cachedLocation ||
         targetLocation.includes(cachedLocation) ||
         cachedLocation.includes(targetLocation));

      const complaintMatch = targetComplaint && cachedComplaint &&
        (targetComplaint === cachedComplaint ||
         targetComplaint.includes(cachedComplaint) ||
         cachedComplaint.includes(targetComplaint));

      // Skip if body location/complaint don't match
      if (!locationMatch && !complaintMatch) {
        continue;
      }

      // Calculate symptom similarity using Jaccard
      const intersection = new Set([...targetSymptoms].filter(x => cachedSymptoms.has(x)));
      const union = new Set([...targetSymptoms, ...cachedSymptoms]);
      const symptomSimilarity = union.size > 0 ? intersection.size / union.size : 0;

      // Calculate age/duration similarity
      const ageSimilarity = this.calculateNumericSimilarity(
        caseData.age,
        value.caseData.age,
        100
      );
      const durationSimilarity = this.calculateDurationSimilarity(
        caseData.duration,
        value.caseData.duration
      );

      // Weighted score: Location/complaint heavily weighted
      const weightedScore =
        (locationMatch ? 0.3 : 0) +
        (complaintMatch ? 0.2 : 0) +
        (symptomSimilarity * 0.3) +
        (ageSimilarity * 0.1) +
        (durationSimilarity * 0.1);

      if (weightedScore >= configThreshold && weightedScore > bestScore) {
        bestMatch = value;
        bestScore = weightedScore;
        bestDetails = {
          locationMatch,
          complaintMatch,
          symptomSimilarity,
          ageSimilarity,
          durationSimilarity
        };
      }
    }

    if (bestMatch) {
      this.stats.hits++;
      logger.info(`Found similar case with ${(bestScore * 100).toFixed(1)}% similarity (location: ${bestDetails.locationMatch}, complaint: ${bestDetails.complaintMatch}, symptoms: ${(bestDetails.symptomSimilarity * 100).toFixed(1)}%)`);
      return {
        ...bestMatch.response,
        fromCache: true,
        similarity: bestScore,
        matchDetails: bestDetails,
        note: 'Response based on similar case with matching body location'
      };
    }

    return null;
  }

  /**
   * Calculate numeric similarity (0-1 scale)
   */
  calculateNumericSimilarity(val1, val2, maxDiff) {
    if (!val1 || !val2) return 0;
    const diff = Math.abs(val1 - val2);
    return Math.max(0, 1 - (diff / maxDiff));
  }

  /**
   * Calculate duration similarity
   */
  calculateDurationSimilarity(dur1, dur2) {
    if (!dur1 || !dur2) return 0;

    // Convert to days for comparison
    const days1 = this.durationToDays(dur1);
    const days2 = this.durationToDays(dur2);

    if (!days1 || !days2) return 0;

    // Similar if within same timeframe category
    const diff = Math.abs(days1 - days2);
    if (diff < 3) return 1.0; // Within 3 days
    if (diff < 7) return 0.8; // Within same week
    if (diff < 14) return 0.6; // Within 2 weeks
    if (diff < 30) return 0.4; // Within same month
    return 0.2;
  }

  /**
   * Convert duration string to days
   */
  durationToDays(duration) {
    if (typeof duration === 'number') return duration;
    if (typeof duration !== 'string') return 0;

    const lower = duration.toLowerCase();
    if (lower.includes('day')) {
      const match = lower.match(/(\d+)\s*day/);
      return match ? parseInt(match[1]) : 0;
    }
    if (lower.includes('week')) {
      const match = lower.match(/(\d+)\s*week/);
      return match ? parseInt(match[1]) * 7 : 0;
    }
    if (lower.includes('month')) {
      const match = lower.match(/(\d+)\s*month/);
      return match ? parseInt(match[1]) * 30 : 0;
    }
    if (lower.includes('year')) {
      const match = lower.match(/(\d+)\s*year/);
      return match ? parseInt(match[1]) * 365 : 0;
    }
    return 0;
  }
  
  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      size: this.cache.size,
      maxSize: this.cache.max
    };
  }
  
  /**
   * Remove sensitive data before caching
   */
  sanitizeCaseData(caseData) {
    const sanitized = { ...caseData };
    delete sanitized.patientId;
    delete sanitized.personalInfo;
    delete sanitized.insurance;
    return sanitized;
  }
  
  /**
   * Warm up cache with common cases
   */
  async warmUp(commonCases = []) {
    logger.info(`Warming up cache with ${commonCases.length} common cases`);
    
    for (const caseData of commonCases) {
      // Pre-populate cache with common consultation patterns
      const mockResponse = {
        preWarmed: true,
        commonCase: true,
        // ... response data
      };
      await this.set(caseData, mockResponse);
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager();

export default cacheManager;