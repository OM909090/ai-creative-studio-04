import {
  ResiliencePolicy,
  ResilienceProfile,
  CircuitBreaker,
  FallbackConfiguration,
  GracefulDegradation,
  HealthCheckPolicy,
  HealthCheckResult,
  RateLimitPolicy,
  RetryPolicy,
  DegradationManager,
  DegradationEvent,
  ResilienceMetric,
  FailoverConfiguration,
  ResilienceReport,
  DegradationLevel,
  ResilienceStrategy,
  HealthStatus
} from '@/types/phase2-resilience';

export class ResilienceSystem {
  private static instance: ResilienceSystem;
  private policies: Map<string, ResiliencePolicy> = new Map();
  private profiles: Map<string, ResilienceProfile> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private fallbacks: Map<string, FallbackConfiguration> = new Map();
  private healthChecks: Map<string, HealthCheckPolicy> = new Map();
  private healthResults: HealthCheckResult[] = [];
  private degradationManagers: Map<string, DegradationManager> = new Map();
  private rateLimits: Map<string, RateLimitPolicy> = new Map();
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private metrics: ResilienceMetric[] = [];
  private failoverConfigs: Map<string, FailoverConfiguration> = new Map();
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): ResilienceSystem {
    if (!ResilienceSystem.instance) {
      ResilienceSystem.instance = new ResilienceSystem();
    }
    return ResilienceSystem.instance;
  }

  public createPolicy(
    name: string,
    strategy: ResilienceStrategy = 'graceful_degradation'
  ): ResiliencePolicy {
    const policy: ResiliencePolicy = {
      id: `rp_${++this.counter}_${Date.now()}`,
      name,
      description: `Resilience policy: ${name}`,
      enabled: true,
      strategy,
      degradationThreshold: 50,
      recoveryTime: 300000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.policies.set(policy.id, policy);
    return policy;
  }

  public createProfile(
    serviceName: string,
    policyId: string
  ): ResilienceProfile {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error('Policy not found');

    const profile: ResilienceProfile = {
      id: `prof_${++this.counter}_${Date.now()}`,
      serviceName,
      currentState: 'healthy',
      degradationLevel: 'full',
      policies: [policy],
      lastHealthCheck: new Date().toISOString(),
      nextHealthCheck: new Date(Date.now() + 60000).toISOString(),
      metrics: {
        uptime: 99.9,
        availabilityPercent: 99.9,
        meanTimeToRecovery: 300,
        failureRate: 0.1,
        gracefulDegradationCount: 0,
        circuitBreakerTrips: 0,
        fallbackUsagePercent: 0
      }
    };

    this.profiles.set(profile.id, profile);
    this.initializeDegradationManager(serviceName);
    return profile;
  }

  private initializeDegradationManager(serviceName: string): void {
    this.degradationManagers.set(serviceName, {
      serviceName,
      currentDegradation: 'full',
      history: [],
      activeRules: []
    });
  }

  public createCircuitBreaker(
    serviceName: string,
    endpoint: string,
    failureThreshold: number = 5
  ): CircuitBreaker {
    const breaker: CircuitBreaker = {
      id: `cb_${++this.counter}_${Date.now()}`,
      serviceName,
      endpoint,
      state: 'closed',
      failureThreshold,
      successThreshold: 2,
      timeout: 60000,
      failureCount: 0,
      lastState: 'closed',
      stateChangeAt: new Date().toISOString()
    };

    this.circuitBreakers.set(breaker.id, breaker);
    return breaker;
  }

  public recordFailure(circuitBreakerId: string): void {
    const breaker = this.circuitBreakers.get(circuitBreakerId);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureAt = new Date().toISOString();

    if (breaker.failureCount >= breaker.failureThreshold && breaker.state === 'closed') {
      breaker.lastState = breaker.state;
      breaker.state = 'open';
      breaker.stateChangeAt = new Date().toISOString();
    }
  }

  public createFallback(
    serviceName: string,
    primaryEndpoint: string,
    fallbackEndpoints: string[]
  ): FallbackConfiguration {
    const fallback: FallbackConfiguration = {
      id: `fb_${++this.counter}_${Date.now()}`,
      serviceName,
      primaryEndpoint,
      fallbackEndpoints,
      fallbackMode: 'cached',
      dataSource: 'cache',
      timeout: 5000,
      refreshInterval: 60000,
      enabled: true
    };

    this.fallbacks.set(fallback.id, fallback);
    return fallback;
  }

  public registerHealthCheck(
    serviceName: string,
    endpoint: string
  ): HealthCheckPolicy {
    const policy: HealthCheckPolicy = {
      id: `hc_${++this.counter}_${Date.now()}`,
      serviceName,
      endpoint,
      method: 'http',
      interval: 60000,
      timeout: 5000,
      expectedStatus: 200,
      healthyThreshold: 3,
      unhealthyThreshold: 2,
      enabled: true
    };

    this.healthChecks.set(policy.id, policy);
    return policy;
  }

  public recordHealthCheck(
    policyId: string,
    status: 'healthy' | 'unhealthy' | 'timeout' | 'error'
  ): HealthCheckResult {
    const policy = this.healthChecks.get(policyId);
    if (!policy) throw new Error('Health check policy not found');

    const result: HealthCheckResult = {
      id: `hcr_${++this.counter}_${Date.now()}`,
      policyId,
      serviceName: policy.serviceName,
      timestamp: new Date().toISOString(),
      status,
      responseTime: Math.random() * 1000 + 100,
      statusCode: status === 'healthy' ? 200 : 500,
      consecutiveFailures: status === 'healthy' ? 0 : 1
    };

    this.healthResults.push(result);
    if (this.healthResults.length > 10000) {
      this.healthResults.shift();
    }

    return result;
  }

  public createRateLimitPolicy(
    serviceName: string,
    requestsPerSecond: number
  ): RateLimitPolicy {
    const policy: RateLimitPolicy = {
      id: `ratelimit_${++this.counter}_${Date.now()}`,
      serviceName,
      requestsPerSecond,
      burstSize: requestsPerSecond * 2,
      backoffStrategy: 'exponential',
      retryAfterHeader: 'Retry-After',
      enabled: true
    };

    this.rateLimits.set(policy.id, policy);
    return policy;
  }

  public createRetryPolicy(
    serviceName: string,
    maxAttempts: number = 3
  ): RetryPolicy {
    const policy: RetryPolicy = {
      id: `retry_${++this.counter}_${Date.now()}`,
      serviceName,
      maxAttempts,
      initialDelay: 100,
      maxDelay: 32000,
      delayMultiplier: 2,
      jitterEnabled: true,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      enabled: true
    };

    this.retryPolicies.set(policy.id, policy);
    return policy;
  }

  public initiateDegradation(
    serviceName: string,
    level: DegradationLevel,
    reason: string
  ): GracefulDegradation {
    const manager = this.degradationManagers.get(serviceName);
    if (!manager) throw new Error('Service not found');

    const previousLevel = manager.currentDegradation;
    manager.currentDegradation = level;

    const event: DegradationEvent = {
      id: `degrad_${++this.counter}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromLevel: previousLevel,
      toLevel: level,
      reason,
      affectedFeatures: []
    };

    manager.history.push(event);

    const degradation: GracefulDegradation = {
      id: event.id,
      serviceName,
      degradationLevel: level,
      affectedFeatures: [],
      degradedAt: event.timestamp,
      estimatedRecoveryTime: new Date(Date.now() + 300000).toISOString(),
      userNotificationLevel: level === 'critical' ? 'alert' : 'warning',
      rootCause: reason
    };

    return degradation;
  }

  public recoverService(serviceName: string): boolean {
    const manager = this.degradationManagers.get(serviceName);
    if (!manager) return false;

    const previousLevel = manager.currentDegradation;
    manager.currentDegradation = 'full';

    if (manager.history.length > 0) {
      manager.history[manager.history.length - 1].recoveredAt = new Date().toISOString();
    }

    return true;
  }

  public createFailover(
    serviceName: string,
    primaryEndpoint: string,
    replicaEndpoints: string[]
  ): FailoverConfiguration {
    const config: FailoverConfiguration = {
      id: `failover_${++this.counter}_${Date.now()}`,
      serviceName,
      enabled: true,
      primary: {
        id: `inst_${++this.counter}`,
        endpoint: primaryEndpoint,
        region: 'primary',
        priority: 1,
        weight: 1,
        status: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      replicas: replicaEndpoints.map((endpoint, index) => ({
        id: `inst_${++this.counter}`,
        endpoint,
        region: `replica_${index + 1}`,
        priority: index + 2,
        weight: 1,
        status: 'healthy' as HealthStatus,
        lastHealthCheck: new Date().toISOString()
      })),
      healthCheck: {
        id: `hc_${++this.counter}`,
        serviceName,
        endpoint: primaryEndpoint,
        method: 'http',
        interval: 60000,
        timeout: 5000,
        expectedStatus: 200,
        healthyThreshold: 3,
        unhealthyThreshold: 2,
        enabled: true
      },
      failoverTime: 5000,
      currentActive: `inst_${this.counter - replicaEndpoints.length}`
    };

    this.failoverConfigs.set(config.id, config);
    return config;
  }

  public recordMetric(serviceName: string, availability: number): void {
    const metric: ResilienceMetric = {
      serviceName,
      timestamp: new Date().toISOString(),
      uptime: availability,
      downtime: 100 - availability,
      recoveryTime: Math.random() * 600 + 60,
      failureCount: Math.floor(Math.random() * 10),
      degradationCount: Math.floor(Math.random() * 5),
      fallbackUsageCount: Math.floor(Math.random() * 20),
      circuitBreakerTrips: Math.floor(Math.random() * 3)
    };

    this.metrics.push(metric);
    if (this.metrics.length > 10000) {
      this.metrics.shift();
    }
  }

  public getMetrics(serviceName: string, hours: number = 24): ResilienceMetric[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter(
      m => m.serviceName === serviceName && 
           new Date(m.timestamp).getTime() > cutoffTime
    );
  }

  public generateReport(hours: number = 24): ResilienceReport {
    const services = new Set(Array.from(this.profiles.values()).map(p => p.serviceName));

    return {
      id: `report_${++this.counter}_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      services: Array.from(services).map(name => ({
        name,
        availability: 99 + Math.random() * 1,
        mttr: 150 + Math.random() * 150,
        incidents: Math.floor(Math.random() * 5)
      })),
      overallHealth: {
        avgAvailability: 99.5,
        totalIncidents: Array.from(services).length * 2,
        criticalIncidents: 0
      },
      recommendations: [
        'Monitor circuit breaker states',
        'Optimize health check intervals',
        'Review fallback strategies'
      ]
    };
  }

  public getStats(): {
    totalPolicies: number;
    totalProfiles: number;
    totalCircuitBreakers: number;
    healthyServices: number;
    degradedServices: number;
  } {
    const healthyProfiles = Array.from(this.profiles.values())
      .filter(p => p.currentState === 'healthy').length;
    const degradedProfiles = Array.from(this.profiles.values())
      .filter(p => p.currentState === 'degraded' || p.currentState === 'critical').length;

    return {
      totalPolicies: this.policies.size,
      totalProfiles: this.profiles.size,
      totalCircuitBreakers: this.circuitBreakers.size,
      healthyServices: healthyProfiles,
      degradedServices: degradedProfiles
    };
  }
}

export const resilienceSystem = ResilienceSystem.getInstance();
