export type IntegrationEventType = 'workflow' | 'data_sync' | 'notification' | 'authentication' | 'custom';
export type PluginType = 'input' | 'output' | 'processor' | 'analyzer' | 'notifier';
export type WebhookEvent = 'task.created' | 'task.updated' | 'task.completed' | 'user.action' | 'system.event';

export interface ExternalIntegration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'plugin' | 'extension';
  enabled: boolean;
  baseUrl: string;
  authentication: {
    type: 'bearer' | 'api-key' | 'oauth2' | 'basic';
    credentials: Record<string, string>;
    expiresAt?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  metadata: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  integrationId: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  retryPolicy: {
    maxRetries: number;
    delaySeconds: number;
  };
  headers: Record<string, string>;
  secret: string;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  metadata: {
    userId?: string;
    sessionId?: string;
    source: string;
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  enabled: boolean;
  description: string;
  author: string;
  repository?: string;
  dependencies: Array<{
    name: string;
    version: string;
  }>;
  config: Record<string, any>;
  hooks: {
    onLoad?: string;
    onUnload?: string;
    onCommand?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  permissions: string[];
  dependencies: Record<string, string>;
  config: {
    [key: string]: {
      type: string;
      default: any;
      description: string;
    };
  };
  hooks: {
    [key: string]: {
      description: string;
      parameters: Record<string, string>;
    };
  };
}

export interface IntegrationWorkflow {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    integrationId: string;
    action: string;
    inputMapping: Record<string, string>;
    outputMapping: Record<string, string>;
    errorHandling: 'continue' | 'retry' | 'stop';
    condition?: string;
  }>;
  enabled: boolean;
  trigger: {
    type: 'manual' | 'webhook' | 'schedule' | 'event';
    config: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  steps: Array<{
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input: Record<string, any>;
    output: Record<string, any>;
    error?: string;
    duration: number;
  }>;
  output: Record<string, any>;
  error?: string;
}

export interface APIRequest {
  id: string;
  integrationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers: Record<string, string>;
  body?: any;
  timeout: number;
  timestamp: string;
}

export interface APIResponse {
  id: string;
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
  timestamp: string;
  cached: boolean;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  type: 'request' | 'response' | 'error' | 'webhook';
  status: 'success' | 'failure' | 'warning';
  message: string;
  data: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export interface DataMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  type: 'direct' | 'computed' | 'lookup';
  config: Record<string, any>;
}

export interface IntegrationHealth {
  integrationId: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheckTime: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: string;
  };
}
