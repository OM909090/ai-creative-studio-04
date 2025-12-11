import {
  ServerInstance,
  LoadBalancer,
  CacheLayer,
  DatabasePool,
  ScalabilityMetrics,
  LoadBalancingStrategy
} from '@/types/phase3-scalability';

export class ScalabilityInfrastructure {
  private static instance: ScalabilityInfrastructure;
  private servers: ServerInstance[] = [];
  private loadBalancers: Map<string, LoadBalancer> = new Map();
  private cacheLayers: Map<string, CacheLayer> = new Map();
  private dbPools: Map<string, DatabasePool> = new Map();
  private counter: number = 0;
  private requestCount: number = 0;

  private constructor() {
    this.initializeDefaultInfrastructure();
  }

  public static getInstance(): ScalabilityInfrastructure {
    if (!ScalabilityInfrastructure.instance) {
      ScalabilityInfrastructure.instance = new ScalabilityInfrastructure();
    }
    return ScalabilityInfrastructure.instance;
  }

  private initializeDefaultInfrastructure(): void {
    this.addServer('server-1', 'localhost', 3000, 'us-east-1');
    this.addServer('server-2', 'localhost', 3001, 'us-east-1');
    this.addServer('server-3', 'localhost', 3002, 'us-west-1');

    this.createLoadBalancer('main-lb', 'round-robin');
    this.createCacheLayer('redis-cache', 'redis');
    this.createDatabasePool('main-pool', 10, 20);
  }

  public addServer(
    name: string,
    hostname: string,
    port: number,
    region: string
  ): ServerInstance {
    const server: ServerInstance = {
      id: `srv_${++this.counter}_${Date.now()}`,
      hostname,
      port,
      region,
      status: 'healthy',
      weight: 1,
      capacity: 1000,
      currentLoad: Math.random() * 500,
      cpuUsage: Math.random() * 80,
      memoryUsage: Math.random() * 75,
      networkLatency: Math.random() * 50 + 10,
      lastHealthCheck: new Date().toISOString()
    };

    this.servers.push(server);
    return server;
  }

  public createLoadBalancer(
    name: string,
    strategy: LoadBalancingStrategy
  ): LoadBalancer {
    const lb: LoadBalancer = {
      id: `lb_${++this.counter}_${Date.now()}`,
      name,
      strategy,
      instances: this.servers,
      healthCheckInterval: 10000,
      healthCheckTimeout: 5000,
      circuitBreaker: {
        threshold: 5,
        timeout: 60000,
        halfOpenRequests: 3
      },
      metadata: {}
    };

    this.loadBalancers.set(lb.id, lb);
    return lb;
  }

  public createCacheLayer(name: string, cacheType: string): CacheLayer {
    const cache: CacheLayer = {
      id: `cache_${++this.counter}_${Date.now()}`,
      name,
      type: cacheType as any,
      strategy: 'cache-first',
      maxSize: 100 * 1024 * 1024,
      maxAge: 3600,
      ttl: 3600,
      enabled: true,
      hitRate: 0.85,
      missRate: 0.15
    };

    this.cacheLayers.set(cache.id, cache);
    return cache;
  }

  public createDatabasePool(
    name: string,
    minConnections: number,
    maxConnections: number
  ): DatabasePool {
    const pool: DatabasePool = {
      id: `pool_${++this.counter}_${Date.now()}`,
      name,
      minConnections,
      maxConnections,
      activeConnections: Math.floor(Math.random() * minConnections),
      idleConnections: minConnections - Math.floor(Math.random() * minConnections),
      waitingConnections: 0,
      queryQueueSize: 0,
      averageQueryTime: 45
    };

    this.dbPools.set(pool.id, pool);
    return pool;
  }

  public getMetrics(): ScalabilityMetrics {
    this.requestCount++;

    const totalRequests = this.requestCount;
    const activeSessions = Math.floor(Math.random() * 5000) + 1000;
    const activeConnections = this.servers.reduce((sum, s) => sum + (s.currentLoad / 100), 0);

    return {
      timestamp: new Date().toISOString(),
      totalRequests,
      requestsPerSecond: Math.random() * 500 + 100,
      averageResponseTime: Math.random() * 200 + 50,
      p95ResponseTime: Math.random() * 400 + 150,
      p99ResponseTime: Math.random() * 600 + 300,
      errorRate: Math.random() * 2,
      cacheHitRate: 0.85,
      activeSessions,
      activeConnections: Math.floor(activeConnections)
    };
  }

  public distributeLoad(requestType: string): ServerInstance | null {
    const healthyServers = this.servers.filter(s => s.status === 'healthy');
    if (healthyServers.length === 0) return null;

    let selected: ServerInstance;
    const lb = Array.from(this.loadBalancers.values())[0];

    if (lb?.strategy === 'least-connections') {
      selected = healthyServers.reduce((prev, curr) =>
        prev.currentLoad < curr.currentLoad ? prev : curr
      );
    } else {
      const randomIdx = Math.floor(Math.random() * healthyServers.length);
      selected = healthyServers[randomIdx];
    }

    selected.currentLoad += 10;
    return selected;
  }

  public getServers(): ServerInstance[] {
    return this.servers;
  }

  public getLoadBalancers(): LoadBalancer[] {
    return Array.from(this.loadBalancers.values());
  }

  public getCacheLayers(): CacheLayer[] {
    return Array.from(this.cacheLayers.values());
  }

  public getDatabasePools(): DatabasePool[] {
    return Array.from(this.dbPools.values());
  }

  public updateServerHealth(serverId: string, cpuUsage: number, memoryUsage: number): void {
    const server = this.servers.find(s => s.id === serverId);
    if (server) {
      server.cpuUsage = cpuUsage;
      server.memoryUsage = memoryUsage;
      server.status = cpuUsage > 90 || memoryUsage > 90 ? 'degraded' : 'healthy';
      server.lastHealthCheck = new Date().toISOString();
    }
  }

  public getCacheStats(cacheId: string): { hitRate: number; missRate: number; size: number } {
    const cache = Array.from(this.cacheLayers.values()).find(c => c.id === cacheId);
    return {
      hitRate: cache?.hitRate || 0,
      missRate: cache?.missRate || 0,
      size: Math.random() * 80 * 1024 * 1024
    };
  }
}

export const scalabilityInfrastructure = ScalabilityInfrastructure.getInstance();
