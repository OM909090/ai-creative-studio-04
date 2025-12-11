export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'failed' | 'offline';
export type StorageType = 'indexeddb' | 'localstorage' | 'cache';
export type ConflictStrategy = 'local-first' | 'server-first' | 'manual';

export interface OfflineState {
  isOnline: boolean;
  lastOnlineTime: string;
  syncStatus: SyncStatus;
  pendingChangeCount: number;
  failedChangeCount: number;
  storageUsage: number;
  maxStorageSize: number;
}

export interface OfflineData {
  id: string;
  key: string;
  data: any;
  timestamp: string;
  expiresAt?: string;
  size: number;
  storageType: StorageType;
  syncStatus: SyncStatus;
}

export interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastRetryTime?: string;
  error?: string;
}

export interface SyncQueue {
  id: string;
  userId: string;
  changes: PendingChange[];
  totalSize: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  lastSyncAttempt?: string;
  syncStatus: SyncStatus;
}

export interface ConflictResolution {
  conflictId: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  strategy: ConflictStrategy;
  resolvedVersion: any;
  resolvedAt: string;
  metadata: Record<string, any>;
}

export interface CacheStrategy {
  name: string;
  maxAge: number;
  maxSize: number;
  priority: 'low' | 'medium' | 'high';
  entities: string[];
  syncInterval: number;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  registrationUrl: string;
  updateInterval: number;
  precacheAssets: string[];
  networkStrategies: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    routes: string[];
  }[];
}

export interface IndexedDBSchema {
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes: Array<{
      name: string;
      keyPath: string;
      unique: boolean;
    }>;
  }[];
}

export interface OfflineEvent {
  type: 'offline' | 'online' | 'sync-start' | 'sync-end' | 'sync-error' | 'conflict';
  timestamp: string;
  data?: any;
}

export interface SyncStatistics {
  lastSyncTime: string;
  totalSynced: number;
  totalFailed: number;
  averageSyncDuration: number;
  syncSuccess: number;
  successRate: number;
  dataTransferred: number;
}

export interface OfflineDataBundle {
  id: string;
  userId: string;
  content: Array<{
    entityType: string;
    data: any[];
  }>;
  createdAt: string;
  expiresAt: string;
  size: number;
  checksum: string;
}

export interface StorageQuota {
  userId: string;
  maxQuota: number;
  usedQuota: number;
  remainingQuota: number;
  byEntityType: Record<string, number>;
  warningThreshold: number;
}

export interface OfflineSyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
  retryBackoffMultiplier: number;
  conflictStrategy: ConflictStrategy;
  prioritizeLocalChanges: boolean;
  maxPendingChanges: number;
}
