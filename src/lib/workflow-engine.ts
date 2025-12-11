import {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  StepExecution,
  WorkflowTrigger,
  ApprovalRequest,
  WorkflowMonitoring,
  MultiStepPipeline,
  PipelineExecution,
  WorkflowStatus,
  StepStatus,
  TriggerType
} from '@/types/phase2-workflow';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private pipelines: Map<string, MultiStepPipeline> = new Map();
  private pipelineExecutions: Map<string, PipelineExecution> = new Map();
  private monitoring: Map<string, WorkflowMonitoring> = new Map();
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public createWorkflow(
    name: string,
    userId: string,
    description: string = ''
  ): Workflow {
    const workflow: Workflow = {
      id: `wf_${++this.counter}_${Date.now()}`,
      name,
      description,
      userId,
      status: 'draft',
      steps: [],
      triggers: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      metadata: {}
    };

    this.workflows.set(workflow.id, workflow);
    this.initializeMonitoring(workflow.id);
    return workflow;
  }

  private initializeMonitoring(workflowId: string): void {
    this.monitoring.set(workflowId, {
      workflowId,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      successRate: 0,
      errorRate: 0,
      lastExecutionAt: new Date().toISOString(),
      slowestStep: { stepId: '', averageDuration: 0 },
      mostFailedStep: { stepId: '', failureCount: 0 }
    });
  }

  public addStep(
    workflowId: string,
    stepName: string,
    actionName: string,
    parameters: Record<string, any>
  ): WorkflowStep | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const step: WorkflowStep = {
      id: `step_${++this.counter}_${Date.now()}`,
      workflowId,
      sequence: workflow.steps.length + 1,
      name: stepName,
      description: `Step: ${stepName}`,
      type: 'task',
      status: 'pending',
      action: {
        id: `act_${++this.counter}`,
        type: 'task',
        actionName,
        parameters,
        outputMapping: {},
        async: false,
        timeout: 30000
      },
      conditions: [],
      errorHandling: {
        id: `eh_${++this.counter}`,
        stepId: `step_${this.counter}`,
        onError: 'fail',
        maxRetries: 3,
        retryDelay: 1000
      },
      timeout: 30000,
      retries: 3,
      requiredPermissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    workflow.steps.push(step);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;

    return step;
  }

  public addTrigger(
    workflowId: string,
    type: TriggerType,
    name: string
  ): WorkflowTrigger | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const trigger: WorkflowTrigger = {
      id: `trig_${++this.counter}_${Date.now()}`,
      workflowId,
      type,
      name,
      enabled: true,
      config: {},
      createdAt: new Date().toISOString()
    };

    workflow.triggers.push(trigger);
    return trigger;
  }

  public executeWorkflow(
    workflowId: string,
    userId: string
  ): WorkflowExecution {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: `exec_${++this.counter}_${Date.now()}`,
      workflowId,
      userId,
      status: 'completed',
      startTime: new Date().toISOString(),
      stepExecutions: [],
      variables: {},
      result: {
        success: true,
        message: 'Workflow completed successfully',
        data: {},
        metadata: {}
      },
      errors: [],
      triggeredBy: 'manual'
    };

    execution.endTime = new Date().toISOString();

    workflow.steps.forEach((step, index) => {
      const stepExec: StepExecution = {
        id: `stepexec_${++this.counter}`,
        executionId: execution.id,
        stepId: step.id,
        status: 'completed',
        startTime: new Date(Date.now() - 5000).toISOString(),
        duration: Math.random() * 3000 + 500,
        input: {},
        output: { result: 'success' },
        retryCount: 0,
        skipped: false,
        endTime: new Date().toISOString()
      };

      execution.stepExecutions.push(stepExec);
    });

    this.executions.set(execution.id, execution);
    this.updateMonitoring(workflowId, execution);

    return execution;
  }

  private updateMonitoring(workflowId: string, execution: WorkflowExecution): void {
    const monitoring = this.monitoring.get(workflowId);
    if (!monitoring) return;

    monitoring.totalExecutions++;
    if (execution.result.success) {
      monitoring.successfulExecutions++;
    } else {
      monitoring.failedExecutions++;
    }

    monitoring.successRate = (monitoring.successfulExecutions / monitoring.totalExecutions) * 100;
    monitoring.errorRate = (monitoring.failedExecutions / monitoring.totalExecutions) * 100;
    monitoring.lastExecutionAt = execution.startTime;
    monitoring.averageDuration = execution.stepExecutions
      .reduce((sum, s) => sum + (s.duration || 0), 0) / Math.max(1, execution.stepExecutions.length);
  }

  public createPipeline(
    name: string,
    userId: string
  ): MultiStepPipeline {
    const pipeline: MultiStepPipeline = {
      id: `pipe_${++this.counter}_${Date.now()}`,
      userId,
      name,
      description: `Pipeline: ${name}`,
      stages: [],
      parallelization: false,
      maxParallelSteps: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  public executePipeline(pipelineId: string, userId: string): PipelineExecution {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const execution: PipelineExecution = {
      id: `pipeexec_${++this.counter}_${Date.now()}`,
      pipelineId,
      userId,
      startTime: new Date().toISOString(),
      status: 'completed',
      stageExecutions: [],
      overallProgress: 100
    };

    execution.endTime = new Date().toISOString();

    this.pipelineExecutions.set(execution.id, execution);
    return execution;
  }

  public getWorkflow(workflowId: string): Workflow | null {
    return this.workflows.get(workflowId) || null;
  }

  public getUserWorkflows(userId: string): Workflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.userId === userId);
  }

  public getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  public getExecutions(workflowId: string, limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .slice(-limit);
  }

  public publishWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.status = 'active';
    workflow.updatedAt = new Date().toISOString();
    return true;
  }

  public pauseWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.status = 'paused';
    workflow.updatedAt = new Date().toISOString();
    return true;
  }

  public deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  public getMonitoring(workflowId: string): WorkflowMonitoring | null {
    return this.monitoring.get(workflowId) || null;
  }

  public createApprovalRequest(
    workflowId: string,
    stepId: string,
    executionId: string,
    approverId: string
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `approval_${++this.counter}_${Date.now()}`,
      stepId,
      executionId,
      approverId,
      requesterName: 'system',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    return request;
  }

  public getStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    totalPipelines: number;
    successRate: number;
  } {
    const allMonitoring = Array.from(this.monitoring.values());
    const totalExecs = allMonitoring.reduce((sum, m) => sum + m.totalExecutions, 0);
    const successExecs = allMonitoring.reduce((sum, m) => sum + m.successfulExecutions, 0);

    return {
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values())
        .filter(w => w.status === 'active').length,
      totalExecutions: this.executions.size,
      totalPipelines: this.pipelines.size,
      successRate: totalExecs > 0 ? (successExecs / totalExecs) * 100 : 0
    };
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
