export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'resource-based';
export type CachingStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
export type CompressionType = 'gzip' | 'brotli' | 'deflate';

export interface ServerInstance {
  id: string;
  hostname: string;
  port: number;
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  weight: number;
  capacity: number;
  currentLoad: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  lastHealthCheck: string;
}

export interface LoadBalancer {
  id: string;
  name: string;
  strategy: LoadBalancingStrategy;
  instances: ServerInstance[];
  healthCheckInterval: number;
  healthCheckTimeout: number;
  circuitBreaker: {
    threshold: number;
    timeout: number;
    halfOpenRequests: number;
  };
  metadata: Record<string, any>;
}

export interface CacheLayer {
  id: string;
  name: string;
  type: 'memory' | 'redis' | 'cdn';
  strategy: CachingStrategy;
  maxSize: number;
  maxAge: number;
  ttl: number;
  enabled: boolean;
  hitRate: number;
  missRate: number;
}

export interface CacheEntry {
  id: string;
  key: string;
  value: any;
  expiresAt: string;
  createdAt: string;
  hitCount: number;
  lastAccessedAt: string;
  size: number;
  tags: string[];
}

export interface ResourcePool {
  id: string;
  resourceType: string;
  maxSize: number;
  currentSize: number;
  availableCount: number;
  waitingQueue: string[];
  allocationTime: number;
  releaseTime: number;
}

export interface DatabaseConnection {
  id: string;
  pool: string;
  host: string;
  port: number;
  database: string;
  status: 'active' | 'idle' | 'waiting' | 'closed';
  createdAt: string;
  duration: number;
  queriesExecuted: number;
}

export interface DatabasePool {
  id: string;
  name: string;
  minConnections: number;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  queryQueueSize: number;
  averageQueryTime: number;
}

export interface CompressionConfig {
  enabled: boolean;
  types: CompressionType[];
  minSize: number;
  level: number;
  excludeTypes: string[];
}

export interface CDNConfig {
  enabled: boolean;
  provider: string;
  endpoint: string;
  bucketName: string;
  caching: {
    maxAge: number;
    sMaxAge: number;
    public: boolean;
  };
  compression: CompressionConfig;
}

export interface ScalabilityMetrics {
  timestamp: string;
  totalRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeSessions: number;
  activeConnections: number;
}

export interface AutoScalingPolicy {
  id: string;
  name: string;
  enabled: boolean;
  metric: string;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number;
  scaleUpIncrement: number;
  scaleDownIncrement: number;
}

export interface DistributedTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: string;
  endTime: string;
  duration: number;
  service: string;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: string;
    message: string;
    level: string;
  }>;
  status: 'success' | 'error';
}

export interface ServiceMesh {
  id: string;
  enabled: boolean;
  services: Array<{
    name: string;
    instances: string[];
    port: number;
    protocol: string;
    circuitBreaker: boolean;
    retryPolicy: {
      maxRetries: number;
      backoff: string;
    };
  }>;
  loadBalancing: LoadBalancingStrategy;
  serviceCommunication: 'direct' | 'proxy';
}

export interface PerformanceOptimization {
  id: string;
  name: string;
  type: 'caching' | 'compression' | 'cdn' | 'database' | 'code';
  enabled: boolean;
  impact: {
    responseTimeReduction: number;
    bandwidthSaving: number;
    cpuReduction: number;
  };
  implementedAt: string;
}
