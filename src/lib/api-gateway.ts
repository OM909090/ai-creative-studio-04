import {
  RateLimitConfig,
  RateLimitStatus,
  APIEndpoint,
  APIRequest,
  APIResponse,
  APIMetrics,
  APIGatewayConfig
} from '@/types/api-gateway';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class APIGateway {
  private static instance: APIGateway;
  private endpoints: Map<string, APIEndpoint> = new Map();
  private rateLimitCache: Map<string, RateLimitEntry> = new Map();
  private requestCache: Map<string, { response: APIResponse; expireTime: number }> = new Map();
  private requests: APIRequest[] = [];
  private responses: APIResponse[] = [];
  private config: APIGatewayConfig;
  private requestIdCounter: number = 0;

  private defaultConfig: APIGatewayConfig = {
    globalRateLimit: {
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator: (req) => req.userId || req.ipAddress || 'unknown'
    },
    enableCaching: true,
    enableMetrics: true,
    logRequests: true,
    timeout: 30000
  };

  private constructor(config?: APIGatewayConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  public static getInstance(config?: APIGatewayConfig): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway(config);
    }
    return APIGateway.instance;
  }

  public registerEndpoint(endpoint: APIEndpoint): void {
    const key = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
    this.endpoints.set(key, endpoint);
  }

  public async handleRequest(request: APIRequest): Promise<APIResponse | RateLimitStatus> {
    const endpointKey = `${request.method.toUpperCase()} ${request.endpoint}`;
    const endpoint = this.endpoints.get(endpointKey);

    request.id = `req_${++this.requestIdCounter}_${Date.now()}`;
    request.timestamp = new Date().toISOString();

    const rateLimitStatus = this.checkRateLimit(request, endpoint);
    if (rateLimitStatus.isLimited) {
      if (this.config.logRequests) {
        this.requests.push(request);
      }
      return rateLimitStatus;
    }

    const cacheKey = this.generateCacheKey(request);
    if (this.config.enableCaching) {
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return {
          ...cachedResponse,
          cached: true
        };
      }
    }

    const startTime = Date.now();
    let response: APIResponse;

    try {
      response = {
        id: `res_${Date.now()}`,
        requestId: request.id,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        cached: false,
        body: { success: true },
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': request.id
        }
      };

      if (endpoint?.cacheable && this.config.enableCaching) {
        this.cacheResponse(cacheKey, response, endpoint.cacheTTL || 300000);
      }

      if (this.config.logRequests) {
        this.requests.push(request);
        this.responses.push(response);
      }

      return response;

    } catch (error) {
      response = {
        id: `res_${Date.now()}`,
        requestId: request.id,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        cached: false,
        body: {
          error: error instanceof Error ? error.message : 'Internal server error'
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': request.id
        }
      };

      if (this.config.logRequests) {
        this.requests.push(request);
        this.responses.push(response);
      }

      return response;
    }
  }

  private checkRateLimit(request: APIRequest, endpoint?: APIEndpoint): RateLimitStatus {
    const limitConfig = endpoint?.rateLimit || this.config.globalRateLimit;
    if (!limitConfig) {
      return {
        limit: Infinity,
        current: 0,
        remaining: Infinity,
        resetTime: Date.now(),
        isLimited: false
      };
    }

    const key = limitConfig.keyGenerator(request);
    const now = Date.now();
    let entry = this.rateLimitCache.get(key);

    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + limitConfig.windowMs
      };
      this.rateLimitCache.set(key, entry);
    }

    const isLimited = entry.count >= limitConfig.maxRequests;

    if (!isLimited) {
      entry.count++;
    }

    return {
      limit: limitConfig.maxRequests,
      current: entry.count,
      remaining: Math.max(0, limitConfig.maxRequests - entry.count),
      resetTime: entry.resetTime,
      isLimited
    };
  }

  private generateCacheKey(request: APIRequest): string {
    return `${request.method}:${request.endpoint}:${JSON.stringify(request.body || {})}`;
  }

  private getCachedResponse(key: string): APIResponse | null {
    const cached = this.requestCache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expireTime) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.response;
  }

  private cacheResponse(key: string, response: APIResponse, ttl: number): void {
    this.requestCache.set(key, {
      response,
      expireTime: Date.now() + ttl
    });
  }

  public clearCache(): void {
    this.requestCache.clear();
  }

  public getRateLimitStatus(userId: string, endpointPath?: string): RateLimitStatus | null {
    const endpointKey = endpointPath ? `${endpointPath}` : 'global';
    const endpoint = this.endpoints.get(endpointKey);
    const limitConfig = endpoint?.rateLimit || this.config.globalRateLimit;

    if (!limitConfig) {
      return null;
    }

    const key = limitConfig.keyGenerator({ userId });
    const entry = this.rateLimitCache.get(key);

    if (!entry) {
      return {
        limit: limitConfig.maxRequests,
        current: 0,
        remaining: limitConfig.maxRequests,
        resetTime: Date.now() + (limitConfig.windowMs || 60000),
        isLimited: false
      };
    }

    return {
      limit: limitConfig.maxRequests,
      current: entry.count,
      remaining: Math.max(0, limitConfig.maxRequests - entry.count),
      resetTime: entry.resetTime,
      isLimited: entry.count >= limitConfig.maxRequests
    };
  }

  public getMetrics(): APIMetrics {
    const totalRequests = this.responses.length;
    const successfulRequests = this.responses.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
    const failedRequests = this.responses.filter(r => r.statusCode >= 400).length;
    const rateLimitedRequests = this.responses.filter(r => r.statusCode === 429).length;

    const averageResponseTime = totalRequests > 0
      ? this.responses.reduce((sum, r) => sum + r.duration, 0) / totalRequests
      : 0;

    const cachedResponses = this.responses.filter(r => r.cached).length;
    const cacheHitRate = totalRequests > 0 ? (cachedResponses / totalRequests) * 100 : 0;

    const requestsByEndpoint: Record<string, number> = {};
    this.requests.forEach(req => {
      requestsByEndpoint[req.endpoint] = (requestsByEndpoint[req.endpoint] || 0) + 1;
    });

    const errorsByStatusCode: Record<number, number> = {};
    this.responses.filter(r => r.statusCode >= 400).forEach(res => {
      errorsByStatusCode[res.statusCode] = (errorsByStatusCode[res.statusCode] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      averageResponseTime,
      cacheHitRate,
      requestsByEndpoint,
      errorsByStatusCode
    };
  }

  public getRequestHistory(limit: number = 100): APIRequest[] {
    return this.requests.slice(-limit).reverse();
  }

  public getResponseHistory(limit: number = 100): APIResponse[] {
    return this.responses.slice(-limit).reverse();
  }

  public resetRateLimits(): void {
    this.rateLimitCache.clear();
  }

  public resetMetrics(): void {
    this.requests = [];
    this.responses = [];
    this.rateLimitCache.clear();
  }
}

export const apiGateway = APIGateway.getInstance();
