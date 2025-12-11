export type CollaborationEventType = 'insert' | 'delete' | 'update' | 'move' | 'format' | 'comment' | 'presence' | 'sync';
export type PresenceStatus = 'active' | 'idle' | 'away' | 'offline';
export type ConflictResolution = 'last-write-wins' | 'operational-transform' | 'crdt';

export interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: PresenceStatus;
  lastActive: string;
  cursorPosition: { line: number; column: number } | null;
  color: string;
}

export interface CollaborationSession {
  id: string;
  name: string;
  documentId: string;
  participants: CollaborativeUser[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  accessLevel: 'view' | 'comment' | 'edit' | 'manage';
}

export interface CollaborativeChange {
  id: string;
  userId: string;
  type: CollaborationEventType;
  content: any;
  position: { line: number; column: number } | null;
  timestamp: string;
  version: number;
  parentChangeIds: string[];
}

export interface OperationalTransform {
  changeId: string;
  operation: 'insert' | 'delete';
  content: string;
  position: number;
  length: number;
  userId: string;
  timestamp: string;
}

export interface ConflictResolutionResult {
  resolved: boolean;
  mergedContent: string;
  conflictingChanges: CollaborativeChange[];
  resolution: ConflictResolution;
  timestamp: string;
}

export interface CursorPresence {
  userId: string;
  userName: string;
  userColor: string;
  position: { line: number; column: number };
  timestamp: string;
  isVisible: boolean;
}

export interface CollaborationRoom {
  id: string;
  name: string;
  documentType: 'document' | 'spreadsheet' | 'presentation' | 'diagram';
  participants: CollaborativeUser[];
  changeHistory: CollaborativeChange[];
  version: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface CollaborationComment {
  id: string;
  userId: string;
  content: string;
  position: { line: number; column: number };
  resolved: boolean;
  replies: CollaborationComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationMetrics {
  activeParticipants: number;
  totalChanges: number;
  conflictsResolved: number;
  averageLatency: number;
  documentSize: number;
  lastSyncTime: string;
  syncStatus: 'synced' | 'syncing' | 'failed';
}

export interface CollaborationWebSocketMessage {
  type: 'change' | 'presence' | 'cursor' | 'comment' | 'ping' | 'sync-request' | 'sync-response';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: string;
  version: number;
}

export interface SyncState {
  lastSyncedVersion: number;
  pendingChanges: CollaborativeChange[];
  conflictingChanges: CollaborativeChange[];
  isSyncing: boolean;
  lastSyncTime: string;
  syncQueue: CollaborativeChange[];
}
