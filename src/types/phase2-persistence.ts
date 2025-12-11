export type StorageBackend = 'supabase' | 'mongodb' | 'postgresql' | 'sqlite';
export type BackupStrategy = 'full' | 'incremental' | 'differential' | 'snapshot';
export type RestoreStrategy = 'point_in_time' | 'latest' | 'specific_version';
export type DataEncryptionLevel = 'none' | 'basic' | 'standard' | 'maximum';
export type CompressionType = 'none' | 'gzip' | 'brotli' | 'zstd';

export interface DataStore {
  id: string;
  name: string;
  backend: StorageBackend;
  connectionString: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  lastHealthCheck: string;
  healthStatus: 'healthy' | 'degraded' | 'down';
}

export interface StorageEntity {
  id: string;
  userId: string;
  entityType: string;
  data: Record<string, any>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    tags: string[];
  };
  encryption: {
    enabled: boolean;
    level: DataEncryptionLevel;
    keyId?: string;
  };
  retention: {
    deleteAfterDays?: number;
    archiveAfterDays?: number;
    isPermanent: boolean;
  };
}

export interface BackupJob {
  id: string;
  name: string;
  type: BackupStrategy;
  schedule: CronExpression;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
  retentionDays: number;
  compression: CompressionType;
  encryption: DataEncryptionLevel;
  targetLocation: string;
  parallelism: number;
  createdAt: string;
}

export interface BackupExecution {
  id: string;
  jobId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalSize: number;
  compressedSize: number;
  itemsBackedUp: number;
  errors: BackupError[];
  location: string;
  metadata: Record<string, any>;
}

export interface BackupError {
  itemId: string;
  itemName: string;
  error: string;
  timestamp: string;
  recoverable: boolean;
}

export interface Backup {
  id: string;
  jobId: string;
  userId: string;
  timestamp: string;
  size: number;
  compressedSize: number;
  itemCount: number;
  type: BackupStrategy;
  location: string;
  isIncremental: boolean;
  baseBackupId?: string;
  retention: {
    expiresAt: string;
    isArchived: boolean;
  };
  integrity: {
    checksum: string;
    verified: boolean;
    verifiedAt?: string;
  };
  metadata: Record<string, any>;
}

export interface RestorePoint {
  id: string;
  backupId: string;
  userId: string;
  timestamp: string;
  description: string;
  itemCount: number;
  totalSize: number;
  metadata: Record<string, any>;
  isAvailable: boolean;
}

export interface RestoreJob {
  id: string;
  restorePointId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  strategy: RestoreStrategy;
  targetLocation: string;
  itemsRestored: number;
  itemsFailed: number;
  errors: RestoreError[];
  verification: {
    required: boolean;
    completed: boolean;
    passed?: boolean;
  };
}

export interface RestoreError {
  itemId: string;
  itemName: string;
  error: string;
  retryable: boolean;
}

export interface CronExpression {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  timezone: string;
}

export interface DataVersion {
  id: string;
  entityId: string;
  userId: string;
  versionNumber: number;
  timestamp: string;
  previousVersionId?: string;
  data: Record<string, any>;
  changesSummary: string;
  changedBy: string;
  changeType: 'create' | 'update' | 'delete';
}

export interface DataRetention {
  id: string;
  entityType: string;
  defaultRetentionDays: number;
  archiveAfterDays: number;
  deleteAfterDays: number;
  exceptions: {
    userId: string;
    customRetentionDays?: number;
  }[];
}

export interface EncryptionKey {
  id: string;
  algorithm: string;
  keyLength: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  lastRotatedAt?: string;
  nextRotationAt?: string;
}

export interface BackupReport {
  id: string;
  generatedAt: string;
  period: {
    startTime: string;
    endTime: string;
  };
  totalBackupsCreated: number;
  successfulBackups: number;
  failedBackups: number;
  totalDataBacked: number;
  storageUsed: number;
  averageBackupDuration: number;
  issues: BackupIssue[];
  recommendations: string[];
}

export interface BackupIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  affectedJobs: string[];
  suggestedAction: string;
}

export interface DataMigration {
  id: string;
  sourceBackend: StorageBackend;
  targetBackend: StorageBackend;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  itemsMigrated: number;
  itemsFailed: number;
  errors: DataMigrationError[];
}

export interface DataMigrationError {
  itemId: string;
  error: string;
  timestamp: string;
}

export interface StorageQuota {
  userId: string;
  quotaLimitBytes: number;
  usedBytes: number;
  availableBytes: number;
  percentageUsed: number;
  warningThresholdPercent: number;
  autoCleanupEnabled: boolean;
  lastCheckedAt: string;
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  rtoMinutes: number;
  rpoMinutes: number;
  recoverySteps: RecoveryStep[];
  testSchedule: CronExpression;
  lastTestedAt?: string;
  nextTestAt?: string;
  contacts: {
    name: string;
    email: string;
    phone: string;
    role: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryStep {
  order: number;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  dependencies: number[];
  automatable: boolean;
  verificationSteps: string[];
}

export interface DisasterRecoveryTest {
  id: string;
  planId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  stepsExecuted: number;
  stepsFailed: number;
  actualRto: number;
  actualRpo: number;
  issues: string[];
}
