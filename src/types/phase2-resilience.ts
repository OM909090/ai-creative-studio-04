export type DegradationLevel = 'full' | 'partial' | 'minimal' | 'critical';
export type ResilienceStrategy = 'fail_fast' | 'graceful_degradation' | 'fallback' | 'circuit_breaker';
export type FallbackMode = 'readonly' | 'cached' | 'limited_features' | 'offline' | 'maintenance';

export interface ResiliencePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  strategy: ResilienceStrategy;
  degradationThreshold: number;
  recoveryTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResilienceProfile {
  id: string;
  serviceName: string;
  currentState: 'healthy' | 'degraded' | 'critical' | 'recovering';
  degradationLevel: DegradationLevel;
  policies: ResiliencePolicy[];
  lastHealthCheck: string;
  nextHealthCheck: string;
  metrics: ResilienceMetrics;
}

export interface ResilienceMetrics {
  uptime: number;
  availabilityPercent: number;
  meanTimeToRecovery: number;
  failureRate: number;
  gracefulDegradationCount: number;
  circuitBreakerTrips: number;
  fallbackUsagePercent: number;
}

export interface CircuitBreaker {
  id: string;
  serviceName: string;
  endpoint: string;
  state: 'closed' | 'open' | 'half_open';
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  lastFailureAt?: string;
  failureCount: number;
  lastState: 'closed' | 'open' | 'half_open';
  stateChangeAt: string;
}

export interface FallbackConfiguration {
  id: string;
  serviceName: string;
  primaryEndpoint: string;
  fallbackEndpoints: string[];
  fallbackMode: FallbackMode;
  dataSource: 'cache' | 'replica' | 'default' | 'none';
  timeout: number;
  refreshInterval: number;
  enabled: boolean;
}

export interface GracefulDegradation {
  id: string;
  serviceName: string;
  degradationLevel: DegradationLevel;
  affectedFeatures: FeatureDegradation[];
  degradedAt: string;
  estimatedRecoveryTime: string;
  userNotificationLevel: 'silent' | 'notice' | 'warning' | 'alert';
  rootCause?: string;
}

export interface FeatureDegradation {
  featureId: string;
  featureName: string;
  degradationLevel: DegradationLevel;
  affectedFunctionality: string[];
  fallbackBehavior: string;
  estimatedRecoveryTime?: string;
}

export interface HealthCheckPolicy {
  id: string;
  serviceName: string;
  endpoint: string;
  method: 'http' | 'tcp' | 'grpc' | 'custom';
  interval: number;
  timeout: number;
  expectedStatus: number | number[];
  healthyThreshold: number;
  unhealthyThreshold: number;
  enabled: boolean;
}

export interface HealthCheckResult {
  id: string;
  policyId: string;
  serviceName: string;
  timestamp: string;
  status: 'healthy' | 'unhealthy' | 'timeout' | 'error';
  responseTime: number;
  statusCode?: number;
  message?: string;
  consecutiveFailures: number;
}

export interface RateLimitPolicy {
  id: string;
  serviceName: string;
  requestsPerSecond: number;
  burstSize: number;
  backoffStrategy: 'linear' | 'exponential';
  retryAfterHeader: string;
  enabled: boolean;
}

export interface BulkheadPolicy {
  id: string;
  serviceName: string;
  maxConcurrentRequests: number;
  queueSize: number;
  timeout: number;
  rejectionPolicy: 'reject' | 'queue' | 'fallback';
  threadPoolSize: number;
  enabled: boolean;
}

export interface TimeoutPolicy {
  id: string;
  serviceName: string;
  defaultTimeout: number;
  criticalOperationTimeout: number;
  readTimeout: number;
  writeTimeout: number;
  connectTimeout: number;
  enabled: boolean;
}

export interface RetryPolicy {
  id: string;
  serviceName: string;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  delayMultiplier: number;
  jitterEnabled: boolean;
  retryableStatuses: number[];
  enabled: boolean;
}

export interface DegradationManager {
  serviceName: string;
  currentDegradation: DegradationLevel;
  history: DegradationEvent[];
  activeRules: DegradationRule[];
}

export interface DegradationEvent {
  id: string;
  timestamp: string;
  fromLevel: DegradationLevel;
  toLevel: DegradationLevel;
  reason: string;
  affectedFeatures: string[];
  recoveredAt?: string;
}

export interface DegradationRule {
  id: string;
  condition: string;
  targetDegradationLevel: DegradationLevel;
  affectedFeatures: string[];
  enabled: boolean;
  priority: number;
}

export interface ResilienceMetric {
  serviceName: string;
  timestamp: string;
  uptime: number;
  downtime: number;
  recoveryTime: number;
  failureCount: number;
  degradationCount: number;
  fallbackUsageCount: number;
  circuitBreakerTrips: number;
}

export interface ServiceLoadProfile {
  serviceName: string;
  currentLoad: number;
  maxCapacity: number;
  loadPercentage: number;
  responseTime: number;
  requestsPerSecond: number;
  timestamp: string;
}

export interface ResilienceRecommendation {
  id: string;
  serviceName: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  affectedComponents: string[];
  suggestedAction: string;
  estimatedImpact: string;
  createdAt: string;
}

export interface FailoverConfiguration {
  id: string;
  serviceName: string;
  enabled: boolean;
  primary: ServiceInstance;
  replicas: ServiceInstance[];
  healthCheck: HealthCheckPolicy;
  failoverTime: number;
  currentActive: string;
}

export interface ServiceInstance {
  id: string;
  endpoint: string;
  region: string;
  priority: number;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'draining' | 'standby';
  lastHealthCheck: string;
}

export interface CacheResilience {
  id: string;
  serviceName: string;
  cacheEnabled: boolean;
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  fallbackToCache: boolean;
  warningThreshold: number;
}

export interface ResilienceReport {
  id: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  services: {
    name: string;
    availability: number;
    mttr: number;
    incidents: number;
  }[];
  overallHealth: {
    avgAvailability: number;
    totalIncidents: number;
    criticalIncidents: number;
  };
  recommendations: ResilienceRecommendation[];
}
