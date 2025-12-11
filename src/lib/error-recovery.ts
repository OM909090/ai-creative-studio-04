import {
  ErrorContext,
  ErrorType,
  RecoveryAction,
  RecoveryStrategy,
  ErrorLog,
  RetryPolicy,
  FallbackOption,
  ErrorRecoveryMetrics,
  CircuitBreakerState
} from '@/types/error-recovery';

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private errorLogs: ErrorLog[] = [];
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private fallbackOptions: FallbackOption[] = [];
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorIdCounter: number = 0;

  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1
  };

  private circuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000
  };

  private constructor() {
    this.initializeCircuitBreakers();
  }

  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  private initializeCircuitBreakers(): void {
    const services = [
      'ai-command-processor',
      'web-automation',
      'browser-control',
      'system-control',
      'external-api'
    ];

    services.forEach(service => {
      this.circuitBreakers.set(service, {
        status: 'closed',
        failureCount: 0,
        successCount: 0
      });
    });
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    policy?: RetryPolicy
  ): Promise<{ result: T; attempts: number } | { error: Error; attempts: number }> {
    const retryPolicy = policy || this.getRetryPolicy(operationName) || this.defaultRetryPolicy;
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        const result = await operation();
        this.recordSuccess(operationName);
        return { result, attempts };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retryPolicy.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, retryPolicy);
          await this.sleep(delay);
        }
      }
    }

    this.recordFailure(operationName);
    return { error: lastError || new Error('Operation failed'), attempts };
  }

  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    const exponentialDelay = policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt);
    const delay = Math.min(exponentialDelay, policy.maxDelay);
    const jitter = delay * policy.jitterFactor * Math.random();
    return delay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async handleError(
    error: Error | string,
    context: Omit<ErrorContext, 'timestamp'>
  ): Promise<RecoveryAction[]> {
    const errorContext: ErrorContext = {
      ...context,
      timestamp: new Date().toISOString()
    };

    const errorLog: ErrorLog = {
      id: `err_${++this.errorIdCounter}_${Date.now()}`,
      timestamp: errorContext.timestamp,
      errorType: errorContext.errorType,
      message: typeof error === 'string' ? error : error.message,
      context: errorContext.context || {},
      stackTrace: error instanceof Error ? error.stack : undefined,
      resolved: false,
      recoveryActions: []
    };

    const recoveryActions = this.determineRecoveryActions(errorContext);
    errorLog.recoveryActions = recoveryActions;

    this.errorLogs.push(errorLog);

    return recoveryActions;
  }

  private determineRecoveryActions(context: ErrorContext): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (context.errorType) {
      case 'network_error':
        actions.push(
          {
            id: 'retry',
            strategy: 'retry',
            description: 'Retry the operation',
            executable: context.attempt < context.maxAttempts
          },
          {
            id: 'fallback',
            strategy: 'fallback',
            description: 'Use fallback method',
            executable: this.fallbackOptions.length > 0
          }
        );
        break;

      case 'timeout':
        actions.push(
          {
            id: 'retry_with_longer_timeout',
            strategy: 'retry',
            description: 'Retry with longer timeout',
            executable: context.attempt < context.maxAttempts,
            estimatedDuration: 30000
          }
        );
        break;

      case 'rate_limit':
        actions.push(
          {
            id: 'backoff',
            strategy: 'retry',
            description: 'Back off and retry later',
            executable: true,
            estimatedDuration: 60000
          }
        );
        break;

      case 'permission_denied':
        actions.push(
          {
            id: 'escalate',
            strategy: 'escalate',
            description: 'Request additional permissions',
            executable: true
          }
        );
        break;

      case 'server_error':
        if (context.attempt < context.maxAttempts) {
          actions.push(
            {
              id: 'retry',
              strategy: 'retry',
              description: 'Retry operation',
              executable: true
            }
          );
        }
        actions.push(
          {
            id: 'escalate',
            strategy: 'escalate',
            description: 'Escalate to support',
            executable: true
          }
        );
        break;

      case 'validation_error':
        actions.push(
          {
            id: 'manual',
            strategy: 'manual_intervention',
            description: 'Correct input and retry',
            executable: true
          }
        );
        break;

      default:
        actions.push(
          {
            id: 'cancel',
            strategy: 'cancel',
            description: 'Cancel operation',
            executable: true
          }
        );
    }

    return actions;
  }

  public registerRetryPolicy(operationName: string, policy: RetryPolicy): void {
    this.retryPolicies.set(operationName, policy);
  }

  public getRetryPolicy(operationName: string): RetryPolicy | undefined {
    return this.retryPolicies.get(operationName);
  }

  public registerFallback(fallback: FallbackOption): void {
    this.fallbackOptions.push(fallback);
    this.fallbackOptions.sort((a, b) => b.priority - a.priority);
  }

  public async executeFallback(errorType?: ErrorType): Promise<any> {
    const applicableFallbacks = this.fallbackOptions.filter(fb => {
      if (!fb.conditions) return true;
      if (fb.conditions.errorTypes && errorType) {
        return fb.conditions.errorTypes.includes(errorType);
      }
      return true;
    });

    if (applicableFallbacks.length === 0) {
      throw new Error('No applicable fallback found');
    }

    const fallback = applicableFallbacks[0];

    try {
      return await fallback.execute();
    } catch (error) {
      throw new Error(`Fallback execution failed: ${error}`);
    }
  }

  public recordSuccess(serviceKey: string): void {
    const breaker = this.circuitBreakers.get(serviceKey);
    if (!breaker) return;

    breaker.successCount++;
    breaker.failureCount = 0;
    breaker.lastSuccessTime = new Date().toISOString();

    if (breaker.status === 'half-open' && breaker.successCount >= this.circuitBreakerConfig.successThreshold) {
      breaker.status = 'closed';
      breaker.successCount = 0;
      breaker.failureCount = 0;
    }
  }

  public recordFailure(serviceKey: string): void {
    const breaker = this.circuitBreakers.get(serviceKey);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = new Date().toISOString();

    if (breaker.status === 'closed' && breaker.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      breaker.status = 'open';
      breaker.nextRetryTime = new Date(Date.now() + this.circuitBreakerConfig.timeout).toISOString();
      breaker.failureCount = 0;
    }

    if (breaker.status === 'open') {
      const nextRetryTime = new Date(breaker.nextRetryTime || Date.now()).getTime();
      if (Date.now() >= nextRetryTime) {
        breaker.status = 'half-open';
        breaker.successCount = 0;
        breaker.failureCount = 0;
      }
    }
  }

  public getCircuitBreakerStatus(serviceKey: string): CircuitBreakerState | null {
    return this.circuitBreakers.get(serviceKey) || null;
  }

  public isServiceAvailable(serviceKey: string): boolean {
    const breaker = this.circuitBreakers.get(serviceKey);
    if (!breaker) return true;
    return breaker.status === 'closed' || breaker.status === 'half-open';
  }

  public resolveError(errorId: string, details: Record<string, any>): boolean {
    const errorLog = this.errorLogs.find(log => log.id === errorId);
    if (!errorLog) {
      return false;
    }

    errorLog.resolved = true;
    errorLog.resolvedAt = new Date().toISOString();
    errorLog.resolutionDetails = details;

    return true;
  }

  public getErrorLogs(filter?: {
    errorType?: ErrorType;
    resolved?: boolean;
    limit?: number;
  }): ErrorLog[] {
    let logs = [...this.errorLogs];

    if (filter?.errorType) {
      logs = logs.filter(log => log.errorType === filter.errorType);
    }

    if (filter?.resolved !== undefined) {
      logs = logs.filter(log => log.resolved === filter.resolved);
    }

    const limit = filter?.limit || 100;
    return logs.slice(-limit).reverse();
  }

  public getMetrics(): ErrorRecoveryMetrics {
    const totalErrors = this.errorLogs.length;
    const recoveredErrors = this.errorLogs.filter(log => log.resolved).length;
    const failedRecoveries = totalErrors - recoveredErrors;
    const recoveryRate = totalErrors > 0 ? (recoveredErrors / totalErrors) * 100 : 0;

    const errorsByType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    this.errorLogs.forEach(log => {
      errorsByType[log.errorType] = (errorsByType[log.errorType] || 0) + 1;
    });

    const resolvedLogs = this.errorLogs.filter(log => log.resolved);
    const averageRecoveryTime = resolvedLogs.length > 0
      ? resolvedLogs.reduce((sum, log) => {
        if (log.resolvedAt) {
          return sum + (new Date(log.resolvedAt).getTime() - new Date(log.timestamp).getTime());
        }
        return sum;
      }, 0) / resolvedLogs.length
      : 0;

    return {
      totalErrors,
      recoveredErrors,
      failedRecoveries,
      recoveryRate,
      averageRecoveryTime,
      errorsByType
    };
  }

  public clearResolvedErrors(): number {
    const unresolvedLogs = this.errorLogs.filter(log => !log.resolved);
    const removedCount = this.errorLogs.length - unresolvedLogs.length;
    this.errorLogs = unresolvedLogs;
    return removedCount;
  }
}

export const errorRecoveryService = ErrorRecoveryService.getInstance();
