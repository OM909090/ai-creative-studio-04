export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type ActionType = 'web_automation' | 'browser_control' | 'system_control' | 'editing' | 'information';

export interface Task {
  id: string;
  userId: string;
  actionType: ActionType;
  priority: TaskPriority;
  status: TaskStatus;
  command: string;
  parameters: Record<string, any>;
  requiredPermissions: string[];
  estimatedDuration: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progress?: number;
  result?: any;
  error?: string;
  dependencies?: string[];
  retryCount: number;
  maxRetries: number;
}

export interface TaskQueue {
  tasks: Task[];
  size: number;
  priority: TaskPriority;
}

export interface TaskRouterMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  queueLength: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  resolvable: boolean;
}

export interface PriorityScores {
  basePriority: number;
  userLevelBoost: number;
  ageBoost: number;
  depthPenalty: number;
  finalScore: number;
}
