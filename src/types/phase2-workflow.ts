export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'archived';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'blocked';
export type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event' | 'timer';
export type ActionType = 'task' | 'approval' | 'notification' | 'script' | 'integration';
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains' | 'matches';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  userId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  sequence: number;
  name: string;
  description: string;
  type: ActionType;
  status: StepStatus;
  action: WorkflowAction;
  conditions: WorkflowCondition[];
  errorHandling: ErrorHandlingPolicy;
  timeout: number;
  retries: number;
  requiredPermissions: string[];
  approvals?: ApprovalRule[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  actionName: string;
  parameters: Record<string, any>;
  outputMapping: Record<string, string>;
  async: boolean;
  timeout: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator: 'AND' | 'OR';
  priority: number;
}

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: TriggerType;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  schedule?: CronExpression;
  webhookUrl?: string;
  eventType?: string;
  createdAt: string;
}

export interface CronExpression {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  timezone: string;
}

export interface WorkflowVariable {
  id: string;
  workflowId: string;
  name: string;
  dataType: string;
  defaultValue: any;
  scope: 'global' | 'step' | 'local';
  required: boolean;
  description: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: WorkflowStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  stepExecutions: StepExecution[];
  variables: Record<string, any>;
  result: WorkflowResult;
  errors: WorkflowError[];
  triggeredBy: TriggerType;
}

export interface StepExecution {
  id: string;
  executionId: string;
  stepId: string;
  status: StepStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
  retryCount: number;
  skipped: boolean;
  skippedReason?: string;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface WorkflowError {
  stepId: string;
  stepName: string;
  error: string;
  errorCode: string;
  timestamp: string;
  recoverable: boolean;
  suggestedFix?: string;
}

export interface ApprovalRule {
  id: string;
  stepId: string;
  approverId: string;
  approverRole: string;
  approvalRequired: boolean;
  timeoutHours: number;
  notificationChannels: string[];
}

export interface ApprovalRequest {
  id: string;
  stepId: string;
  executionId: string;
  approverId: string;
  requesterName: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt?: string;
  approverComment?: string;
}

export interface ErrorHandlingPolicy {
  id: string;
  stepId: string;
  onError: 'fail' | 'skip' | 'retry' | 'branch';
  maxRetries: number;
  retryDelay: number;
  fallbackStepId?: string;
  errorBranch?: ErrorBranch;
}

export interface ErrorBranch {
  errorCode: string;
  branchStepId: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  parameters: TemplateParameter[];
  isPublic: boolean;
  author: string;
  version: string;
  tags: string[];
  createdAt: string;
}

export interface TemplateParameter {
  id: string;
  name: string;
  dataType: string;
  defaultValue: any;
  required: boolean;
  description: string;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  enabled: boolean;
  cronExpression: CronExpression;
  nextRunAt: string;
  lastRunAt?: string;
  timezone: string;
  maxConcurrentRuns: number;
  currentRunCount: number;
}

export interface WorkflowMonitoring {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  errorRate: number;
  lastExecutionAt: string;
  slowestStep: {
    stepId: string;
    averageDuration: number;
  };
  mostFailedStep: {
    stepId: string;
    failureCount: number;
  };
}

export interface WorkflowNotification {
  id: string;
  workflowId: string;
  executionId: string;
  type: 'on_start' | 'on_success' | 'on_failure' | 'on_step_failure' | 'on_approval_needed';
  channel: string;
  recipient: string;
  message: string;
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface MultiStepPipeline {
  id: string;
  userId: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  parallelization: boolean;
  maxParallelSteps: number;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  sequenceOrder: number;
  name: string;
  steps: WorkflowStep[];
  canParallelize: boolean;
  stageDependencies: string[];
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: WorkflowStatus;
  stageExecutions: StageExecution[];
  overallProgress: number;
}

export interface StageExecution {
  id: string;
  pipelineExecutionId: string;
  stageId: string;
  status: StepStatus;
  startTime: string;
  endTime?: string;
  stepExecutions: StepExecution[];
  parallelized: boolean;
}

export interface WorkflowMetrics {
  workflowId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  executionCount: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
  mostCommonError: string;
  errorBreakdown: {
    errorCode: string;
    count: number;
  }[];
}
