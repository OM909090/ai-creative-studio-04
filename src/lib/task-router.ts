import { Task, TaskPriority, TaskStatus, TaskRouterMetrics, PriorityScores } from '@/types/task-router';

export class TaskRouter {
  private static instance: TaskRouter;
  private priorityQueues: Map<TaskPriority, Task[]> = new Map([
    ['critical', []],
    ['high', []],
    ['medium', []],
    ['low', []]
  ]);
  private activeTasks: Set<string> = new Set();
  private completedTasks: Task[] = [];
  private failedTasks: Task[] = [];
  private taskMetadata: Map<string, Task> = new Map();
  private maxConcurrentTasks: number = 10;
  private taskCounter: number = 0;

  private constructor() {}

  public static getInstance(): TaskRouter {
    if (!TaskRouter.instance) {
      TaskRouter.instance = new TaskRouter();
    }
    return TaskRouter.instance;
  }

  public addTask(
    userId: string,
    actionType: string,
    command: string,
    parameters: Record<string, any> = {},
    options: {
      priority?: TaskPriority;
      requiredPermissions?: string[];
      estimatedDuration?: number;
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): Task {
    const task: Task = {
      id: `task_${++this.taskCounter}_${Date.now()}`,
      userId,
      actionType: actionType as any,
      priority: options.priority || 'medium',
      status: 'queued',
      command,
      parameters,
      requiredPermissions: options.requiredPermissions || [],
      estimatedDuration: options.estimatedDuration || 5000,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      dependencies: options.dependencies || []
    };

    this.taskMetadata.set(task.id, task);
    const queue = this.priorityQueues.get(task.priority);
    if (queue) {
      queue.push(task);
    }

    return task;
  }

  public getNextTask(): Task | null {
    const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const queue = this.priorityQueues.get(priority);
      if (queue && queue.length > 0) {
        const task = queue.find(t => {
          if (t.dependencies && t.dependencies.length > 0) {
            return t.dependencies.every(depId =>
              this.completedTasks.some(ct => ct.id === depId)
            );
          }
          return true;
        });

        if (task) {
          return task;
        }
      }
    }

    return null;
  }

  public startTask(taskId: string): boolean {
    const task = this.taskMetadata.get(taskId);
    if (!task || task.status !== 'queued') {
      return false;
    }

    if (this.activeTasks.size >= this.maxConcurrentTasks) {
      return false;
    }

    task.status = 'executing';
    task.startedAt = new Date().toISOString();
    this.activeTasks.add(taskId);

    const queue = this.priorityQueues.get(task.priority);
    if (queue) {
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    return true;
  }

  public completeTask(taskId: string, result?: any): boolean {
    const task = this.taskMetadata.get(taskId);
    if (!task || task.status !== 'executing') {
      return false;
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    this.activeTasks.delete(taskId);
    this.completedTasks.push(task);

    return true;
  }

  public failTask(taskId: string, error: string): boolean {
    const task = this.taskMetadata.get(taskId);
    if (!task) {
      return false;
    }

    task.error = error;

    if (task.retryCount < task.maxRetries) {
      task.status = 'queued';
      task.retryCount++;
      const queue = this.priorityQueues.get(task.priority);
      if (queue) {
        queue.push(task);
      }
    } else {
      task.status = 'failed';
      this.failedTasks.push(task);
    }

    this.activeTasks.delete(taskId);
    return true;
  }

  public cancelTask(taskId: string): boolean {
    const task = this.taskMetadata.get(taskId);
    if (!task || (task.status !== 'queued' && task.status !== 'executing')) {
      return false;
    }

    task.status = 'cancelled';
    this.activeTasks.delete(taskId);

    const queue = this.priorityQueues.get(task.priority);
    if (queue) {
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    return true;
  }

  public updateTaskProgress(taskId: string, progress: number): boolean {
    const task = this.taskMetadata.get(taskId);
    if (!task) {
      return false;
    }

    task.progress = Math.max(0, Math.min(100, progress));
    return true;
  }

  public getTask(taskId: string): Task | null {
    return this.taskMetadata.get(taskId) || null;
  }

  public getActiveTasks(userId?: string): Task[] {
    const tasks = Array.from(this.activeTasks)
      .map(id => this.taskMetadata.get(id))
      .filter((task): task is Task => task !== undefined);

    if (userId) {
      return tasks.filter(t => t.userId === userId);
    }

    return tasks;
  }

  public getQueuedTasks(userId?: string): Task[] {
    const queued: Task[] = [];

    this.priorityQueues.forEach(queue => {
      queued.push(...queue.filter(t => t.status === 'queued'));
    });

    if (userId) {
      return queued.filter(t => t.userId === userId);
    }

    return queued;
  }

  public getTaskHistory(
    userId?: string,
    limit: number = 100
  ): Task[] {
    const all = [
      ...this.completedTasks,
      ...this.failedTasks
    ];

    let filtered = all;
    if (userId) {
      filtered = all.filter(t => t.userId === userId);
    }

    return filtered.slice(-limit).reverse();
  }

  public calculatePriorityScore(task: Task): PriorityScores {
    const priorityValues: Record<TaskPriority, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    const basePriority = priorityValues[task.priority];

    const createdTime = new Date(task.createdAt).getTime();
    const ageMinutes = (Date.now() - createdTime) / (1000 * 60);
    const ageBoost = Math.min(ageMinutes * 0.5, 25);

    const userLevelBoost = this.calculateUserPriorityBoost(task.userId);

    const depthPenalty = task.dependencies?.length ? task.dependencies.length * 5 : 0;

    const finalScore = basePriority + ageBoost + userLevelBoost - depthPenalty;

    return {
      basePriority,
      userLevelBoost,
      ageBoost,
      depthPenalty,
      finalScore: Math.max(0, finalScore)
    };
  }

  private calculateUserPriorityBoost(userId: string): number {
    const userTasks = this.completedTasks.filter(t => t.userId === userId);
    const successRate = userTasks.length > 0
      ? userTasks.filter(t => !t.error).length / userTasks.length
      : 0.5;

    return successRate > 0.9 ? 10 : 0;
  }

  public getMetrics(): TaskRouterMetrics {
    const totalTasks = this.taskMetadata.size;
    const completedTasks = this.completedTasks.length;
    const failedTasks = this.failedTasks.length;
    const activeTasks = this.activeTasks.size;
    const queueLength = Array.from(this.priorityQueues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0
    );

    const totalExecutionTime = this.completedTasks.reduce((sum, task) => {
      if (task.startedAt && task.completedAt) {
        return sum + (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime());
      }
      return sum;
    }, 0);

    const averageExecutionTime = completedTasks > 0 ? totalExecutionTime / completedTasks : 0;
    const successRate = totalTasks > 0
      ? (completedTasks / (completedTasks + failedTasks)) * 100
      : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      activeTasks,
      queueLength,
      averageExecutionTime,
      successRate
    };
  }

  public setMaxConcurrentTasks(max: number): void {
    this.maxConcurrentTasks = Math.max(1, max);
  }

  public getQueueStatus(): Record<TaskPriority, number> {
    return {
      critical: this.priorityQueues.get('critical')?.length || 0,
      high: this.priorityQueues.get('high')?.length || 0,
      medium: this.priorityQueues.get('medium')?.length || 0,
      low: this.priorityQueues.get('low')?.length || 0
    };
  }

  public clearCompleted(): number {
    const count = this.completedTasks.length;
    this.completedTasks = [];
    return count;
  }

  public clearFailed(): number {
    const count = this.failedTasks.length;
    this.failedTasks = [];
    return count;
  }
}

export const taskRouter = TaskRouter.getInstance();
