/**
 * TypeScript interfaces for Enhanced AI Web Command System
 */

export interface AIWebCommandRequest {
  message: string;
  userContext?: Record<string, any>;
  currentPermissions?: string[];
  sessionId?: string;
  userId?: string;
}

export interface AIWebCommandResponse {
  actionType: 'web_automation' | 'browser_control' | 'system_control' | 'editing' | 'information';
  actionDetails: string;
  parameters: Record<string, any>;
  explanation: string;
  requiresConfirmation: boolean;
  scopeValidation: {
    withinScope: boolean;
    reason: string;
    permissionsRequired: string[];
    suggestedAlternative?: string;
  };
  timestamp: string;
  status: 'ready_for_execution' | 'pending_confirmation' | 'executing' | 'completed' | 'failed';
  executionId: string;
  estimatedDuration?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIWebCommandExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  timestamp: string;
  duration: number;
}

export interface UserContext {
  userId: string;
  sessionId: string;
  preferences: {
    theme: string;
    language: string;
    [key: string]: any;
  };
  recentCommands: string[];
  commandHistory: AIWebCommandExecutionResult[];
}

export interface PermissionScope {
  web_automation: boolean;
  browser_control: boolean;
  system_control: boolean;
  editing: boolean;
  information: boolean;
  specificPermissions: string[];
}

export interface AIWebCommandError {
  error: string;
  code: 'invalid_request' | 'permission_denied' | 'out_of_scope' | 'rate_limit' | 'service_error';
  details?: Record<string, any>;
  suggestedAction?: string;
}

// Available action types
export type AIActionType =
  | 'web_automation'
  | 'browser_control'
  | 'system_control'
  | 'editing'
  | 'information';

// Web Automation specific types
export interface WebAutomationParameters {
  action: 'form_fill' | 'data_extract' | 'click_element' | 'navigate' | 'scroll';
  target?: string;
  data?: Record<string, any>;
  selector?: string;
  url?: string;
  waitFor?: string;
}

// Browser Control specific types
export interface BrowserControlParameters {
  action:
    | 'new_tab'
    | 'close_tab'
    | 'navigate'
    | 'bookmark'
    | 'history'
    | 'settings'
    | 'extension_control';
  url?: string;
  tabId?: string;
  bookmarkData?: {
    title: string;
    url: string;
    folder?: string;
  };
}

// System Control specific types
export interface SystemControlParameters {
  action: 'file_operation' | 'process_info' | 'system_info' | 'app_management';
  filePath?: string;
  operation?: 'read' | 'write' | 'delete' | 'copy' | 'move';
  content?: string;
  processId?: number;
}

// Editing specific types (extends current functionality)
export interface EditingParameters {
  action:
    | 'image_adjust'
    | 'video_edit'
    | 'filter_apply'
    | 'effect_add'
    | 'audio_process';
  adjustments?: Record<string, number>;
  filter?: string;
  effect?: string;
  mediaUrl?: string;
}

// Information specific types
export interface InformationParameters {
  action: 'general_info' | 'technical_info' | 'tutorial' | 'documentation';
  topic?: string;
  query?: string;
  detailLevel?: 'basic' | 'intermediate' | 'advanced';
}

// Task routing and execution types
export interface TaskRoute {
  taskId: string;
  actionType: AIActionType;
  priority: number;
  estimatedDuration: number;
  requiredPermissions: string[];
  executionEngine: string;
}

export interface ExecutionQueueItem {
  executionId: string;
  task: TaskRoute;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  progress?: number;
  result?: any;
  error?: string;
}

// Monitoring and logging types
export interface AICommandLog {
  timestamp: string;
  executionId: string;
  userId: string;
  command: string;
  actionType: AIActionType;
  status: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemMonitoringData {
  timestamp: string;
  activeTasks: number;
  queueLength: number;
  systemLoad: number;
  memoryUsage: number;
  errorRate: number;
  recentErrors: AICommandLog[];
}

// Memory and context management types
export interface AIMemoryEntry {
  id: string;
  type: 'short_term' | 'long_term' | 'knowledge';
  content: any;
  timestamp: string;
  expiration?: string;
  tags: string[];
}

export interface UserPreferences {
  preferredActions: string[];
  favoriteTools: string[];
  interfacePreferences: {
    theme: string;
    layout: string;
    notifications: boolean;
  };
  aiBehavior: {
    confirmationLevel: 'always' | 'sometimes' | 'never';
    detailLevel: 'basic' | 'detailed' | 'expert';
  };
}