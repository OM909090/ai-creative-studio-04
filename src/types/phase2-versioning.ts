export type VersionChangeType = 'create' | 'update' | 'delete' | 'restore' | 'merge' | 'branch';
export type DiffType = 'addition' | 'deletion' | 'modification' | 'rename' | 'copy';

export interface ContentVersion {
  id: string;
  contentId: string;
  userId: string;
  versionNumber: number;
  timestamp: string;
  content: Record<string, any>;
  changeType: VersionChangeType;
  changeMessage: string;
  previousVersionId?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  metadata: Record<string, any>;
}

export interface VersionHistory {
  contentId: string;
  versions: ContentVersion[];
  totalVersions: number;
  createdAt: string;
  lastModifiedAt: string;
  branches: VersionBranch[];
  tags: VersionTag[];
}

export interface VersionBranch {
  id: string;
  contentId: string;
  name: string;
  description: string;
  baseVersionId: string;
  headVersionId: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  commits: string[];
}

export interface VersionTag {
  id: string;
  contentId: string;
  versionId: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface VersionComparison {
  sourceVersionId: string;
  targetVersionId: string;
  diffs: ContentDiff[];
  similarities: number;
  changesSummary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export interface ContentDiff {
  path: string;
  type: DiffType;
  oldValue?: any;
  newValue?: any;
  lineNumber?: number;
  context: {
    before?: string[];
    after?: string[];
  };
}

export interface Commit {
  id: string;
  contentId: string;
  branchId: string;
  versionId: string;
  message: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  changes: VersionChange[];
  parentCommitId?: string;
  parentBranchId?: string;
}

export interface VersionChange {
  path: string;
  type: DiffType;
  oldValue?: any;
  newValue?: any;
  summary: string;
}

export interface MergeRequest {
  id: string;
  contentId: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  description: string;
  status: 'open' | 'merged' | 'closed' | 'draft';
  createdBy: string;
  createdAt: string;
  mergedBy?: string;
  mergedAt?: string;
  conflicts: MergeConflict[];
  reviewers: {
    userId: string;
    status: 'pending' | 'approved' | 'changes_requested';
  }[];
}

export interface MergeConflict {
  path: string;
  sourceValue: any;
  targetValue: any;
  conflictType: 'content' | 'metadata' | 'deletion';
  suggestedResolution?: any;
}

export interface RevertChange {
  id: string;
  contentId: string;
  fromVersionId: string;
  toVersionId: string;
  reason: string;
  performedBy: string;
  performedAt: string;
  reversible: boolean;
}

export interface VersionMetadata {
  contentId: string;
  totalVersions: number;
  currentVersion: number;
  firstVersionAt: string;
  lastModifiedAt: string;
  totalSize: number;
  storageUsed: number;
  archivedVersions: number;
  autoArchiveAfterDays?: number;
}

export interface CollaborativeEdit {
  id: string;
  contentId: string;
  userId: string;
  editTime: string;
  operation: EditOperation;
  acknowledged: boolean;
  cursor?: {
    line: number;
    column: number;
  };
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  path: string;
  position: number;
  value?: string | Record<string, any>;
  length?: number;
}

export interface VersionConflictResolution {
  conflictId: string;
  resolution: 'keep_source' | 'keep_target' | 'manual' | 'auto_merge';
  resolvedValue?: any;
  resolvedBy: string;
  resolvedAt: string;
}

export interface VersionStatistics {
  contentId: string;
  totalVersions: number;
  totalEditors: number;
  editorsWithCount: {
    userId: string;
    edits: number;
  }[];
  mostFrequentChanges: string[];
  averageTimePerVersion: number;
  largestVersionSize: number;
  storageBreakdown: {
    archived: number;
    active: number;
    branches: number;
  };
}

export interface VersionRestoration {
  id: string;
  contentId: string;
  targetVersionId: string;
  restoredAt: string;
  restoredBy: string;
  previousVersionId: string;
  reason: string;
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface VersionAudit {
  id: string;
  contentId: string;
  eventType: string;
  versionId: string;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  userAgent: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface VersionPolicy {
  id: string;
  contentType: string;
  maxVersionsToKeep: number;
  autoArchiveAfterDays?: number;
  autoDeleteAfterDays?: number;
  requireApprovalForDelete: boolean;
  enableVersioning: boolean;
  trackMinorChanges: boolean;
  compressOldVersions: boolean;
}
