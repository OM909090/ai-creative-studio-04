export type MemoryType = 'short_term' | 'long_term' | 'episodic' | 'semantic';
export type MemoryPriority = 'critical' | 'high' | 'medium' | 'low';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  userId: string;
  content: string;
  metadata: Record<string, any>;
  priority: MemoryPriority;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessedAt: string;
  relatedMemories: string[];
  confidence: number;
}

export interface ShortTermMemory {
  id: string;
  sessionId: string;
  userId: string;
  conversationContext: ConversationContext[];
  currentState: Record<string, any>;
  recentActions: ActionRecord[];
  createdAt: string;
  expiresAt: string;
}

export interface LongTermMemory {
  id: string;
  userId: string;
  userProfile: UserProfile;
  preferences: UserPreferences;
  history: HistoryEntry[];
  learnings: LearningEntry[];
  createdAt: string;
  lastUpdatedAt: string;
  version: number;
}

export interface KnowledgeBase {
  id: string;
  userId: string;
  domainName: string;
  entries: KnowledgeEntry[];
  relationships: KnowledgeRelationship[];
  lastUpdatedAt: string;
  version: number;
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  content: string;
  tags: string[];
  confidence: number;
  sources: string[];
  createdAt: string;
  validUntil?: string;
}

export interface KnowledgeRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number;
}

export interface MemoryVersion {
  id: string;
  memoryId: string;
  versionNumber: number;
  previousState: Record<string, any>;
  currentState: Record<string, any>;
  changes: MemoryChange[];
  changeReason: string;
  timestamp: string;
  changedBy: string;
}

export interface MemoryChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  changeType: 'created' | 'updated' | 'deleted' | 'merged';
}

export interface ConversationContext {
  turn: number;
  userMessage: string;
  aiResponse: string;
  intent: string;
  confidence: number;
  timestamp: string;
  entities: string[];
}

export interface ActionRecord {
  id: string;
  action: string;
  parameters: Record<string, any>;
  result: 'success' | 'failed' | 'partial';
  timestamp: string;
  duration: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastActiveAt: string;
  metadata: Record<string, any>;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  customSettings: Record<string, any>;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: ('email' | 'push' | 'in_app')[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacyPreferences {
  dataCollection: boolean;
  analyticsTracking: boolean;
  shareWithThirdParties: boolean;
  retentionDays: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  result: string;
  timestamp: string;
  duration: number;
  metadata: Record<string, any>;
}

export interface LearningEntry {
  id: string;
  pattern: string;
  frequency: number;
  lastOccurredAt: string;
  associatedActions: string[];
  confidence: number;
}

export interface MemorySearch {
  query: string;
  memoryType?: MemoryType;
  userId: string;
  limit: number;
  offset: number;
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  totalMatches: number;
  searchTime: number;
  relevanceScores: Map<string, number>;
}
