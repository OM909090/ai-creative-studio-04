export type CommandIntent =
  | 'web_navigate'
  | 'data_extract'
  | 'form_submit'
  | 'content_edit'
  | 'information_query'
  | 'system_control'
  | 'task_management'
  | 'unknown';

export type EntityType =
  | 'url'
  | 'email'
  | 'number'
  | 'date'
  | 'time'
  | 'person'
  | 'organization'
  | 'location'
  | 'action'
  | 'object';

export interface NLPEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface CommandParsing {
  originalText: string;
  normalizedText: string;
  intent: CommandIntent;
  confidence: number;
  entities: NLPEntity[];
  keywords: string[];
  actionVerbs: string[];
  modifiers: string[];
  parameters: Record<string, any>;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedAlternatives?: string[];
}

export interface ContextInfo {
  userId: string;
  sessionId: string;
  previousCommands: string[];
  currentContext: Record<string, any>;
  userPreferences: {
    verbosity: 'brief' | 'detailed' | 'expert';
    confirmationLevel: 'always' | 'sometimes' | 'never';
  };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface NLPSuggestion {
  original: string;
  suggestion: string;
  confidence: number;
  reason: string;
  category: 'spelling' | 'clarity' | 'efficiency' | 'safety';
}

export interface SemanticSimilarity {
  text1: string;
  text2: string;
  similarity: number;
  explanation: string;
}

export interface CommandValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  sanitizedCommand: string;
}
