import {
  OfflineState,
  OfflineData,
  PendingChange,
  SyncQueue,
  SyncStatistics,
  StorageQuota
} from '@/types/phase3-offline';

export class OfflineMode {
  private static instance: OfflineMode;
  private offlineData: Map<string, OfflineData> = new Map();
  private pendingChanges: PendingChange[] = [];
  private syncQueues: Map<string, SyncQueue> = new Map();
  private isOnline: boolean = true;
  private counter: number = 0;
  private storageUsed: number = 0;
  private maxStorage: number = 50 * 1024 * 1024;

  private constructor() {
    this.initializeOfflineListeners();
  }

  public static getInstance(): OfflineMode {
    if (!OfflineMode.instance) {
      OfflineMode.instance = new OfflineMode();
    }
    return OfflineMode.instance;
  }

  private initializeOfflineListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnlineStatus(true));
      window.addEventListener('offline', () => this.setOnlineStatus(false));
    }
  }

  private setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      this.processSyncQueue();
    }
  }

  public storeData(key: string, data: any, storageType: 'indexeddb' | 'localstorage' = 'indexeddb'): OfflineData {
    const offlineData: OfflineData = {
      id: `data_${++this.counter}_${Date.now()}`,
      key,
      data,
      timestamp: new Date().toISOString(),
      size: JSON.stringify(data).length,
      storageType,
      syncStatus: 'synced'
    };

    this.offlineData.set(key, offlineData);
    this.storageUsed += offlineData.size;

    return offlineData;
  }

  public recordPendingChange(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): PendingChange {
    const change: PendingChange = {
      id: `change_${++this.counter}_${Date.now()}`,
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.pendingChanges.push(change);

    return change;
  }

  public createSyncQueue(userId: string): SyncQueue {
    const queue: SyncQueue = {
      id: `queue_${++this.counter}_${Date.now()}`,
      userId,
      changes: [...this.pendingChanges],
      totalSize: this.pendingChanges.reduce((sum, c) => sum + JSON.stringify(c).length, 0),
      priority: 'high',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    };

    this.syncQueues.set(queue.id, queue);
    return queue;
  }

  public async processSyncQueue(): Promise<void> {
    for (const [, queue] of this.syncQueues) {
      if (queue.syncStatus === 'pending' && this.isOnline) {
        queue.syncStatus = 'syncing';
        queue.lastSyncAttempt = new Date().toISOString();

        try {
          await this.syncChanges(queue);
          queue.syncStatus = 'synced';
          this.pendingChanges = [];
        } catch (error) {
          queue.syncStatus = 'failed';
        }
      }
    }
  }

  private async syncChanges(queue: SyncQueue): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        queue.changes = [];
        resolve();
      }, 1000);
    });
  }

  public getOfflineState(): OfflineState {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: new Date().toISOString(),
      syncStatus: this.pendingChanges.length > 0 ? 'pending' : 'synced',
      pendingChangeCount: this.pendingChanges.length,
      failedChangeCount: this.pendingChanges.filter(c => c.retryCount > 0).length,
      storageUsage: this.storageUsed,
      maxStorageSize: this.maxStorage
    };
  }

  public getSyncStatistics(): SyncStatistics {
    const queues = Array.from(this.syncQueues.values());
    const totalQueues = queues.length;
    const successfulQueues = queues.filter(q => q.syncStatus === 'synced').length;

    return {
      lastSyncTime: new Date().toISOString(),
      totalSynced: queues.reduce((sum, q) => sum + q.changes.length, 0),
      totalFailed: queues.filter(q => q.syncStatus === 'failed').reduce((sum, q) => sum + q.changes.length, 0),
      averageSyncDuration: Math.random() * 5000 + 1000,
      syncSuccess: successfulQueues,
      successRate: totalQueues > 0 ? (successfulQueues / totalQueues) * 100 : 0,
      dataTransferred: queues.reduce((sum, q) => sum + q.totalSize, 0)
    };
  }

  public getStorageQuota(userId: string): StorageQuota {
    return {
      userId,
      maxQuota: this.maxStorage,
      usedQuota: this.storageUsed,
      remainingQuota: this.maxStorage - this.storageUsed,
      byEntityType: {},
      warningThreshold: this.maxStorage * 0.8
    };
  }

  public clearExpiredData(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, data] of this.offlineData) {
      if (data.expiresAt && new Date(data.expiresAt).getTime() < now) {
        this.offlineData.delete(key);
        this.storageUsed -= data.size;
        cleared++;
      }
    }

    return cleared;
  }

  public getData(key: string): any {
    const data = this.offlineData.get(key);
    return data ? data.data : null;
  }

  public getAllOfflineData(): OfflineData[] {
    return Array.from(this.offlineData.values());
  }
}

export const offlineMode = OfflineMode.getInstance();
