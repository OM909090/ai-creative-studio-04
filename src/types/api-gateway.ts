export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Record<string, any>) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStatus {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  rateLimit: RateLimitConfig;
  requiresAuth: boolean;
  requiredPermissions: string[];
  timeout: number;
  retryable: boolean;
  cacheable: boolean;
  cacheTTL?: number;
}

export interface APIRequest {
  id: string;
  endpoint: string;
  method: string;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
  headers: Record<string, string>;
  body?: Record<string, any>;
}

export interface APIResponse {
  id: string;
  requestId: string;
  statusCode: number;
  timestamp: string;
  duration: number;
  cached: boolean;
  body: any;
  headers: Record<string, string>;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  requestsByEndpoint: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
}

export interface APIGatewayConfig {
  globalRateLimit?: RateLimitConfig;
  enableCaching?: boolean;
  enableMetrics?: boolean;
  logRequests?: boolean;
  timeout?: number;
}
