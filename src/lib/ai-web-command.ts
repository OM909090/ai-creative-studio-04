/**
 * AI Web Command Processing Service
 * Handles communication with AI command processor and task execution
 * Integrated with Phase 1 Core Infrastructure
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AIWebCommandRequest,
  AIWebCommandResponse,
  AIWebCommandExecutionResult,
  AIWebCommandError
} from '@/types/ai-web-command';
import { toast } from 'sonner';
import { securityService } from './security';
import { taskRouter } from './task-router';
import { auditLogger } from './audit-logger';
import { errorRecoveryService } from './error-recovery';
import { apiGateway } from './api-gateway';
import { nlpProcessor } from './nlp-processor';
import { memorySystem } from './memory-system';
import { learningEngine } from './learning-engine';
import { browserControl } from './browser-control';
import { monitoringSystem } from './monitoring-system';
import { persistenceLayer } from './persistence-layer';
import { preferencesEngine } from './preferences-engine';
import { workflowEngine } from './workflow-engine';
import { resilienceSystem } from './resilience-system';

export class AIWebCommandService {
  private static instance: AIWebCommandService;
  private commandHistory: AIWebCommandExecutionResult[] = [];
  private activeTasks: Set<string> = new Set();
  private userContext: Record<string, any> = {};
  private userPermissions: string[] = [];
  private userId: string = 'demo-user';

  private constructor() {
    this.loadUserContext();
    this.loadUserPermissions();
    this.initializeSecurityProfile();
    this.initializePhase2Systems();
  }

  private initializePhase2Systems(): void {
    const userProfile = {
      userId: this.userId,
      name: 'Demo User',
      email: `${this.userId}@example.com`,
      roles: ['user'],
      permissions: this.userPermissions,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      metadata: {}
    };

    memorySystem.createLongTermMemory(this.userId, userProfile);
    learningEngine.createLearningProfile(this.userId, 'moderate');
    learningEngine.createPersonalizationProfile(this.userId);
    preferencesEngine.createPreferenceProfile(this.userId, 'Default');
    persistenceLayer.initializeUserQuota(this.userId);
    browserControl.createWindow();
  }

  public static getInstance(): AIWebCommandService {
    if (!AIWebCommandService.instance) {
      AIWebCommandService.instance = new AIWebCommandService();
    }
    return AIWebCommandService.instance;
  }

  private async loadUserContext(): Promise<void> {
    // Load user context from local storage or API
    const savedContext = localStorage.getItem('aiUserContext');
    if (savedContext) {
      try {
        this.userContext = JSON.parse(savedContext);
      } catch (error) {
        console.error('Failed to load user context:', error);
      }
    }
  }

  private async loadUserPermissions(): Promise<void> {
    const profile = securityService.getUserProfile(this.userId);
    if (profile) {
      this.userPermissions = profile.permissions;
    } else {
      const defaultProfile = securityService.createUserProfile(this.userId, 'user');
      this.userPermissions = defaultProfile.permissions;
    }
  }

  private initializeSecurityProfile(): void {
    const profile = securityService.getUserProfile(this.userId);
    if (!profile) {
      securityService.createUserProfile(this.userId, 'user');
    }
  }

  public async processWebCommand(
    message: string,
    options: {
      requireConfirmation?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      skipNLP?: boolean;
    } = {}
  ): Promise<AIWebCommandResponse | AIWebCommandError> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!message || typeof message !== 'string' || message.trim() === '') {
        throw new Error('Invalid command: message must be a non-empty string');
      }

      // Advanced NLP Processing
      if (!options.skipNLP) {
        const validation = nlpProcessor.validateCommand(message);
        if (!validation.isValid) {
          auditLogger.log(
            this.userId,
            'system_error',
            'invalid_command_detected',
            message.substring(0, 50),
            {
              status: 'failure',
              severity: 'medium',
              details: { errors: validation.errors, warnings: validation.warnings }
            }
          );

          if (validation.errors.length > 0) {
            throw new Error(`Invalid command: ${validation.errors[0]}`);
          }
        }

        if (validation.warnings.length > 0) {
          console.warn('Command warnings:', validation.warnings);
        }

        const sanitized = validation.sanitizedCommand;
        const parsing = nlpProcessor.parseCommand(sanitized);

        console.log('NLP Parsing Result:', {
          intent: parsing.intent,
          confidence: parsing.confidence,
          entities: parsing.entities,
          keywords: parsing.keywords,
          complexity: parsing.complexity
        });

        if (parsing.confidence < 0.5) {
          const suggestions = nlpProcessor.generateSuggestions(message);
          if (suggestions.length > 0) {
            toast.info(`Did you mean: ${suggestions[0].suggestion}?`, {
              duration: 5000
            });
          }
        }

        if (validation.suggestions.length > 0) {
          console.info('Suggestions:', validation.suggestions);
        }
      }

      // Create task in router
      const priority = options.priority || 'medium';
      const task = taskRouter.addTask(
        this.userId,
        'information',
        message,
        { message },
        {
          priority,
          requiredPermissions: this.userPermissions,
          estimatedDuration: 5000
        }
      );

      // Log command attempt
      auditLogger.log(
        this.userId,
        'command_executed',
        'process_web_command',
        message.substring(0, 50),
        {
          status: 'success',
          severity: 'low',
          details: { taskId: task.id, message }
        }
      );

      // Create command request
      const request: AIWebCommandRequest = {
        message: message.trim(),
        userContext: this.userContext,
        currentPermissions: this.userPermissions
      };

      // Check rate limiting
      const rateLimitStatus = apiGateway.getRateLimitStatus(this.userId);
      if (rateLimitStatus?.isLimited) {
        auditLogger.log(
          this.userId,
          'security_event',
          'rate_limit_exceeded',
          'api_command',
          {
            status: 'failure',
            severity: 'high',
            details: { rateLimitStatus }
          }
        );
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      // Show processing indication
      const processingToast = toast.info('AI is processing your web command...', {
        duration: 30000,
        id: `ai-processing-${Date.now()}`
      });

      // Execute with error recovery
      const result = await errorRecoveryService.executeWithRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('ai-web-command', {
            body: request,
          });

          if (error) {
            throw new Error(error.message || 'Failed to process web command');
          }

          return data;
        },
        'ai-command-processor'
      );

      // Dismiss processing toast
      toast.dismiss(processingToast);

      if ('error' in result) {
        throw result.error;
      }

      const data = result.result;

      if (data.error) {
        // Handle specific error cases
        if (data.code === 'out_of_scope') {
          toast.error(`❌ ${data.error}: ${data.reason}`);
          return {
            error: data.error,
            code: data.code as AIWebCommandError['code'],
            details: { reason: data.reason }
          };
        } else if (data.code === 'permission_denied') {
          toast.error(`🔒 ${data.error}: Missing permissions: ${data.missingPermissions?.join(', ')}`);
          return {
            error: data.error,
            code: data.code as AIWebCommandError['code'],
            details: { missingPermissions: data.missingPermissions }
          };
        } else {
          toast.error(`❌ ${data.error}`);
          return {
            error: data.error,
            code: (data.code || 'service_error') as AIWebCommandError['code']
          };
        }
      }

      const response = data as AIWebCommandResponse;

      // Check if confirmation is required
      if (response.requiresConfirmation && !options.requireConfirmation) {
        const confirmed = await this.requestUserConfirmation(response);
        if (!confirmed) {
          toast.info('Command cancelled by user');
          return {
            error: 'Command cancelled by user',
            code: 'invalid_request'
          };
        }
      }

      // Add to active tasks
      this.activeTasks.add(response.executionId);

      // Execute the command based on action type
      const executionResult = await this.executeCommand(response);

      // Update command history
      this.commandHistory.push({
        executionId: response.executionId,
        status: executionResult.status,
        result: executionResult.result,
        error: executionResult.error,
        timestamp: new Date().toISOString(),
        duration: executionResult.duration
      });

      // Complete task in router
      taskRouter.completeTask(task.id, executionResult.result);

      // Log successful command execution
      auditLogger.log(
        this.userId,
        'command_executed',
        `execute_${response.actionType}`,
        response.actionDetails,
        {
          status: 'success',
          severity: 'low',
          duration: executionResult.duration,
          details: {
            executionId: response.executionId,
            actionType: response.actionType,
            result: executionResult.result
          }
        }
      );

      // Save updated context
      this.saveUserContext();

      // Phase 2 Integration: Track command in memory and learning
      this.recordCommandInMemory(message, executionResult);
      this.recordBehaviorForLearning(response.actionType, executionResult);
      this.monitorCommandPerformance(message, executionResult.duration);

      return response;

    } catch (error) {
      console.error('Web command processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast.error(`❌ Failed to process command: ${errorMessage}`);

      // Log failed command execution
      auditLogger.log(
        this.userId,
        'system_error',
        'process_web_command_failed',
        'web_command_execution',
        {
          status: 'failure',
          severity: 'medium',
          duration: Date.now() - startTime,
          error: errorMessage
        }
      );

      return {
        error: errorMessage,
        code: 'service_error'
      };
    }
  }

  private async requestUserConfirmation(response: AIWebCommandResponse): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmationId = `confirm-${response.executionId}`;

      // Create a simple confirmation message
      const confirmationMessage = `${response.explanation} (Action: ${response.actionDetails})`;

      // For now, we'll auto-confirm for development
      // In a real implementation, you would use a proper confirmation dialog
      console.log('Confirmation required:', confirmationMessage);
      console.log('Auto-confirming for development purposes');

      // Simulate user confirmation after a short delay
      setTimeout(() => {
        resolve(true);
      }, 1000);

      // Show a toast notification about the confirmation
      toast.info(`⏳ Waiting for confirmation: ${response.actionDetails}`, {
        duration: 3000,
        id: confirmationId
      });
    });
  }

  private async executeCommand(response: AIWebCommandResponse): Promise<AIWebCommandExecutionResult> {
    const startTime = Date.now();
    const executionId = response.executionId;

    try {
      // Update status
      toast.info(`🚀 Executing: ${response.actionDetails}`, {
        id: `executing-${executionId}`
      });

      // Execute based on action type
      let result: any = null;

      switch (response.actionType) {
        case 'web_automation':
          result = await this.executeWebAutomation(response);
          break;

        case 'browser_control':
          result = await this.executeBrowserControl(response);
          break;

        case 'system_control':
          result = await this.executeSystemControl(response);
          break;

        case 'editing':
          result = await this.executeEditingCommand(response);
          break;

        case 'information':
          result = await this.executeInformationCommand(response);
          break;

        default:
          throw new Error(`Unknown action type: ${response.actionType}`);
      }

      const duration = Date.now() - startTime;

      toast.success(`✅ Completed: ${response.actionDetails}`, {
        id: `completed-${executionId}`
      });

      return {
        executionId,
        status: 'completed',
        result,
        timestamp: new Date().toISOString(),
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast.error(`❌ Failed: ${response.actionDetails} - ${errorMessage}`, {
        id: `failed-${executionId}`
      });

      return {
        executionId,
        status: 'failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration
      };
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(executionId);
    }
  }

  private async executeWebAutomation(response: AIWebCommandResponse): Promise<any> {
    // This would integrate with web automation tools
    // For now, we'll simulate the execution
    console.log('Executing web automation:', response.parameters);

    // Simulate different web automation actions
    switch (response.parameters.action) {
      case 'form_fill':
        return { success: true, message: 'Form filled successfully' };
      case 'data_extract':
        return {
          success: true,
          data: ['Sample data 1', 'Sample data 2', 'Sample data 3'],
          count: 3
        };
      case 'click_element':
        return { success: true, message: 'Element clicked' };
      case 'navigate':
        return { success: true, url: response.parameters.url };
      default:
        return { success: true, message: 'Web automation completed' };
    }
  }

  private async executeBrowserControl(response: AIWebCommandResponse): Promise<any> {
    // This would integrate with browser control APIs
    console.log('Executing browser control:', response.parameters);

    // Simulate different browser control actions
    switch (response.parameters.action) {
      case 'new_tab':
        return { success: true, tabId: 'tab-123', url: response.parameters.url };
      case 'close_tab':
        return { success: true, closedTabId: response.parameters.tabId };
      case 'navigate':
        return { success: true, url: response.parameters.url };
      case 'bookmark':
        return {
          success: true,
          bookmark: {
            id: 'bookmark-456',
            ...response.parameters.bookmarkData
          }
        };
      default:
        return { success: true, message: 'Browser control completed' };
    }
  }

  private async executeSystemControl(response: AIWebCommandResponse): Promise<any> {
    // This would integrate with system control APIs
    console.log('Executing system control:', response.parameters);

    // Simulate different system control actions
    switch (response.parameters.action) {
      case 'file_operation':
        return {
          success: true,
          filePath: response.parameters.filePath,
          operation: response.parameters.operation
        };
      case 'process_info':
        return {
          success: true,
          processId: response.parameters.processId,
          status: 'running'
        };
      default:
        return { success: true, message: 'System control completed' };
    }
  }

  private async executeEditingCommand(response: AIWebCommandResponse): Promise<any> {
    // Integrate with existing editing functionality
    console.log('Executing editing command:', response.parameters);

    // This would call your existing editing functions
    // For now, we'll simulate the execution
    return {
      success: true,
      adjustments: response.parameters.adjustments || {},
      filter: response.parameters.filter || 'none',
      message: 'Editing adjustments applied'
    };
  }

  private async executeInformationCommand(response: AIWebCommandResponse): Promise<any> {
    // Provide information to the user
    console.log('Executing information command:', response.parameters);

    // Simulate information retrieval
    return {
      success: true,
      information: `Here is the information you requested about ${response.parameters.topic || response.parameters.query}: This is a detailed response that would contain the actual information.`,
      sources: ['knowledge_base', 'web_search'],
      relatedTopics: ['Topic 1', 'Topic 2', 'Topic 3']
    };
  }

  private saveUserContext(): void {
    try {
      localStorage.setItem('aiUserContext', JSON.stringify(this.userContext));
    } catch (error) {
      console.error('Failed to save user context:', error);
    }
  }

  public getCommandHistory(): AIWebCommandExecutionResult[] {
    return [...this.commandHistory].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getActiveTasks(): string[] {
    return Array.from(this.activeTasks);
  }

  public updateUserContext(newContext: Record<string, any>): void {
    this.userContext = { ...this.userContext, ...newContext };
    this.saveUserContext();
  }

  public async checkPermissions(requiredPermissions: string[]): Promise<boolean> {
    return requiredPermissions.every(perm => this.userPermissions.includes(perm));
  }

  public getAvailablePermissions(): string[] {
    return [...this.userPermissions];
  }

  public parseCommandWithNLP(command: string) {
    return nlpProcessor.parseCommand(command);
  }

  public validateCommandWithNLP(command: string) {
    return nlpProcessor.validateCommand(command);
  }

  public generateNLPSuggestions(command: string) {
    return nlpProcessor.generateSuggestions(command);
  }

  public calculateSemanticSimilarity(text1: string, text2: string) {
    return nlpProcessor.calculateSimilarity(text1, text2);
  }

  public getNLPCommandHistory(limit?: number) {
    return nlpProcessor.getCommandHistory(limit);
  }

  public analyzeCommandPatterns() {
    return nlpProcessor.analyzePatterns();
  }

  public clearNLPHistory(): void {
    nlpProcessor.clearHistory();
  }

  private recordCommandInMemory(command: string, result: AIWebCommandExecutionResult): void {
    memorySystem.storeMemory(
      this.userId,
      'episodic',
      command,
      {
        result: result.result,
        status: result.status,
        duration: result.duration,
        timestamp: result.timestamp
      },
      result.status === 'completed' ? 'high' : 'medium'
    );
  }

  private recordBehaviorForLearning(actionType: string, result: AIWebCommandExecutionResult): void {
    learningEngine.recordBehavior({
      userId: this.userId,
      action: actionType,
      parameters: { type: actionType },
      result: result.status === 'completed' ? 'success' : 'failure',
      duration: result.duration,
      timestamp: result.timestamp,
      metadata: { executionId: result.executionId }
    });
  }

  private monitorCommandPerformance(duration: number): void {
    monitoringSystem.recordMetric(
      'command_execution_time',
      duration,
      'histogram',
      'ms'
    );

    if (duration > 5000) {
      monitoringSystem.recordMetric(
        'slow_command_detected',
        duration,
        'gauge',
        'ms'
      );
    }
  }

  public getMemoryStats(): Record<string, any> {
    return memorySystem.getMemoryStats(this.userId);
  }

  public getLearningAnalytics(): any {
    return learningEngine.getAnalytics(this.userId);
  }

  public getMonitoringMetrics(): any {
    return {
      systemMetrics: monitoringSystem.getSystemMetrics(),
      activeAlerts: monitoringSystem.getActiveAlerts().length,
      realTimeAlerts: monitoringSystem.getRealTimeAlerts(5)
    };
  }

  public getPersistenceStats(): any {
    return persistenceLayer.getStats();
  }

  public getUserPreferences(): any {
    return preferencesEngine.getUserPreferences(this.userId);
  }

  public getResilienceStatus(): any {
    return {
      stats: resilienceSystem.getStats(),
      report: resilienceSystem.generateReport(1)
    };
  }

  public initializeWorkflow(name: string): any {
    return workflowEngine.createWorkflow(name, this.userId);
  }

  public executeBrowserAction(actionType: string, target: string): any {
    const tab = browserControl.createTab('win_default', target);
    if (!tab) throw new Error('Failed to create browser tab');
    return browserControl.navigateTo(tab.id, target);
  }

  public getSystemStatus(): any {
    return {
      memory: this.getMemoryStats(),
      learning: this.getLearningAnalytics(),
      monitoring: this.getMonitoringMetrics(),
      persistence: this.getPersistenceStats(),
      resilience: this.getResilienceStatus()
    };
  }
}

// Singleton instance
export const aiWebCommandService = AIWebCommandService.getInstance();