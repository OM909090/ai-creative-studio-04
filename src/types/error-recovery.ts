export type ErrorType =
  | 'network_error'
  | 'timeout'
  | 'rate_limit'
  | 'permission_denied'
  | 'resource_not_found'
  | 'server_error'
  | 'validation_error'
  | 'unknown_error';

export type RecoveryStrategy = 'retry' | 'fallback' | 'cancel' | 'escalate' | 'manual_intervention';

export interface ErrorContext {
  errorType: ErrorType;
  message: string;
  originalError?: Error;
  attempt: number;
  maxAttempts: number;
  timestamp: string;
  context?: Record<string, any>;
}

export interface RecoveryAction {
  id: string;
  strategy: RecoveryStrategy;
  description: string;
  executable: boolean;
  estimatedDuration?: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  errorType: ErrorType;
  message: string;
  context: Record<string, any>;
  stackTrace?: string;
  resolved: boolean;
  recoveryActions?: RecoveryAction[];
  resolvedAt?: string;
  resolutionDetails?: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

export interface FallbackOption {
  id: string;
  description: string;
  execute: () => Promise<any>;
  priority: number;
  conditions?: {
    errorTypes?: ErrorType[];
    minAttempts?: number;
  };
}

export interface ErrorRecoveryMetrics {
  totalErrors: number;
  recoveredErrors: number;
  failedRecoveries: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  errorsByType: Record<ErrorType, number>;
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  nextRetryTime?: string;
}
