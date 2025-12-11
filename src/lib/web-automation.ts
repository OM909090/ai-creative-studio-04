import { errorRecoveryService } from './error-recovery';

export interface WebAutomationTask {
  id: string;
  action: 'form_fill' | 'data_extract' | 'click_element' | 'navigate' | 'scroll' | 'wait' | 'screenshot';
  selector?: string;
  data?: Record<string, any>;
  url?: string;
  waitFor?: string;
  waitTime?: number;
  scrollBy?: { x: number; y: number };
}

export interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

export class WebAutomationEngine {
  private static instance: WebAutomationEngine;
  private executedTasks: Map<string, AutomationResult> = new Map();
  private taskIdCounter: number = 0;

  private constructor() {}

  public static getInstance(): WebAutomationEngine {
    if (!WebAutomationEngine.instance) {
      WebAutomationEngine.instance = new WebAutomationEngine();
    }
    return WebAutomationEngine.instance;
  }

  public async executeTask(task: WebAutomationTask): Promise<AutomationResult> {
    const startTime = Date.now();
    const taskId = `web_auto_${++this.taskIdCounter}_${Date.now()}`;

    try {
      let result: any;

      switch (task.action) {
        case 'form_fill':
          result = await this.formFill(task);
          break;
        case 'data_extract':
          result = await this.dataExtract(task);
          break;
        case 'click_element':
          result = await this.clickElement(task);
          break;
        case 'navigate':
          result = await this.navigate(task);
          break;
        case 'scroll':
          result = await this.scroll(task);
          break;
        case 'wait':
          result = await this.wait(task);
          break;
        case 'screenshot':
          result = await this.screenshot(task);
          break;
        default:
          throw new Error(`Unknown action: ${task.action}`);
      }

      const automationResult: AutomationResult = {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      this.executedTasks.set(taskId, automationResult);
      return automationResult;

    } catch (error) {
      const automationResult: AutomationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      this.executedTasks.set(taskId, automationResult);
      throw automationResult;
    }
  }

  private async formFill(task: WebAutomationTask): Promise<any> {
    if (!task.selector || !task.data) {
      throw new Error('Form fill requires selector and data');
    }

    return {
      action: 'form_fill',
      selector: task.selector,
      fieldsFilled: Object.keys(task.data).length,
      fields: Object.keys(task.data)
    };
  }

  private async dataExtract(task: WebAutomationTask): Promise<any> {
    if (!task.selector) {
      throw new Error('Data extraction requires selector');
    }

    return {
      action: 'data_extract',
      selector: task.selector,
      itemsExtracted: 0,
      data: []
    };
  }

  private async clickElement(task: WebAutomationTask): Promise<any> {
    if (!task.selector) {
      throw new Error('Click requires selector');
    }

    if (task.waitFor) {
      await this.wait({ action: 'wait', waitTime: 500 });
    }

    return {
      action: 'click_element',
      selector: task.selector,
      success: true
    };
  }

  private async navigate(task: WebAutomationTask): Promise<any> {
    if (!task.url) {
      throw new Error('Navigate requires URL');
    }

    return {
      action: 'navigate',
      url: task.url,
      success: true
    };
  }

  private async scroll(task: WebAutomationTask): Promise<any> {
    const scrollBy = task.scrollBy || { x: 0, y: 100 };

    return {
      action: 'scroll',
      scrollBy,
      success: true
    };
  }

  private async wait(task: WebAutomationTask): Promise<any> {
    const waitTime = task.waitTime || 1000;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          action: 'wait',
          waitTime,
          success: true
        });
      }, waitTime);
    });
  }

  private async screenshot(task: WebAutomationTask): Promise<any> {
    return {
      action: 'screenshot',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  public async executeTasks(tasks: WebAutomationTask[]): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];

    for (const task of tasks) {
      try {
        const result = await this.executeTask(task);
        results.push(result);
      } catch (error) {
        if (error instanceof Error || (typeof error === 'object' && error !== null)) {
          results.push(error as AutomationResult);
        }
      }
    }

    return results;
  }

  public async executeWithRetry(
    task: WebAutomationTask,
    maxRetries: number = 3
  ): Promise<AutomationResult> {
    const result = await errorRecoveryService.executeWithRetry(
      () => this.executeTask(task),
      `web-automation-${task.action}`,
      {
        maxRetries,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitterFactor: 0.1
      }
    );

    if ('result' in result) {
      return result.result;
    } else {
      return {
        success: false,
        error: result.error.message,
        duration: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  public getExecutionHistory(limit: number = 20): Map<string, AutomationResult> {
    const entries = Array.from(this.executedTasks.entries());
    return new Map(entries.slice(-limit));
  }

  public getSuccessRate(): number {
    if (this.executedTasks.size === 0) {
      return 0;
    }

    const successful = Array.from(this.executedTasks.values()).filter(r => r.success).length;
    return (successful / this.executedTasks.size) * 100;
  }

  public getAverageDuration(): number {
    if (this.executedTasks.size === 0) {
      return 0;
    }

    const totalDuration = Array.from(this.executedTasks.values()).reduce(
      (sum, r) => sum + r.duration,
      0
    );

    return totalDuration / this.executedTasks.size;
  }

  public clearHistory(): void {
    this.executedTasks.clear();
  }
}

export const webAutomationEngine = WebAutomationEngine.getInstance();
