import {
  ExternalIntegration,
  WebhookConfig,
  Plugin,
  IntegrationWorkflow,
  WorkflowExecution,
  IntegrationLog,
  IntegrationHealth
} from '@/types/phase3-integration';

export class IntegrationLayer {
  private static instance: IntegrationLayer;
  private integrations: Map<string, ExternalIntegration> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private plugins: Map<string, Plugin> = new Map();
  private workflows: Map<string, IntegrationWorkflow> = new Map();
  private executions: IntegrationWorkflow[] = [];
  private logs: IntegrationLog[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): IntegrationLayer {
    if (!IntegrationLayer.instance) {
      IntegrationLayer.instance = new IntegrationLayer();
    }
    return IntegrationLayer.instance;
  }

  public registerIntegration(
    name: string,
    baseUrl: string,
    authType: string = 'bearer'
  ): ExternalIntegration {
    const integration: ExternalIntegration = {
      id: `int_${++this.counter}_${Date.now()}`,
      name,
      type: 'api',
      enabled: true,
      baseUrl,
      authentication: {
        type: authType as any,
        credentials: {},
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      },
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      },
      metadata: {}
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  public registerWebhook(
    integrationId: string,
    url: string,
    events: string[]
  ): WebhookConfig {
    const webhook: WebhookConfig = {
      id: `wh_${++this.counter}_${Date.now()}`,
      integrationId,
      url,
      events: events as any,
      enabled: true,
      retryPolicy: {
        maxRetries: 5,
        delaySeconds: 30
      },
      headers: {
        'Content-Type': 'application/json'
      },
      secret: this.generateSecret(),
      createdAt: new Date().toISOString()
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  public installPlugin(pluginName: string, pluginType: string): Plugin {
    const plugin: Plugin = {
      id: `plugin_${++this.counter}_${Date.now()}`,
      name: pluginName,
      version: '1.0.0',
      type: pluginType as any,
      enabled: true,
      description: `Plugin: ${pluginName}`,
      author: 'Plugin Author',
      dependencies: [],
      config: {},
      hooks: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.plugins.set(plugin.id, plugin);
    return plugin;
  }

  public createWorkflow(
    name: string,
    steps: any[],
    trigger: any
  ): IntegrationWorkflow {
    const workflow: IntegrationWorkflow = {
      id: `wf_${++this.counter}_${Date.now()}`,
      name,
      steps: steps.map((step, idx) => ({
        id: `step_${idx}`,
        integrationId: step.integrationId,
        action: step.action,
        inputMapping: step.inputMapping || {},
        outputMapping: step.outputMapping || {},
        errorHandling: step.errorHandling || 'stop'
      })),
      enabled: true,
      trigger,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  public async executeWorkflow(workflowId: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: `exec_${++this.counter}_${Date.now()}`,
      workflowId,
      status: 'running',
      startTime: new Date().toISOString(),
      steps: workflow.steps.map(step => ({
        id: step.id,
        status: 'pending',
        input: {},
        output: {},
        duration: 0
      })),
      output: {}
    };

    this.executions.push(workflow as any);

    return new Promise((resolve) => {
      setTimeout(() => {
        execution.status = 'completed';
        execution.endTime = new Date().toISOString();
        resolve(execution);
      }, 1500);
    });
  }

  public logIntegrationEvent(
    integrationId: string,
    type: string,
    status: string,
    message: string,
    data?: any
  ): IntegrationLog {
    const log: IntegrationLog = {
      id: `log_${++this.counter}_${Date.now()}`,
      integrationId,
      type: type as any,
      status: status as any,
      message,
      data: data || {},
      timestamp: new Date().toISOString()
    };

    this.logs.push(log);
    if (this.logs.length > 10000) {
      this.logs.shift();
    }

    return log;
  }

  public getIntegrationHealth(integrationId: string): IntegrationHealth {
    return {
      integrationId,
      status: 'healthy',
      lastCheckTime: new Date().toISOString(),
      responseTime: Math.random() * 200 + 50,
      successRate: 99.5,
      errorCount: Math.floor(Math.random() * 5)
    };
  }

  public getIntegrations(): ExternalIntegration[] {
    return Array.from(this.integrations.values());
  }

  public getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public getWorkflows(): IntegrationWorkflow[] {
    return Array.from(this.workflows.values());
  }

  public getLogs(): IntegrationLog[] {
    return this.logs.slice(-50);
  }

  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
}

export const integrationLayer = IntegrationLayer.getInstance();
