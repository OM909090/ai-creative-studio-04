import {
  ContentVersion,
  VersionHistory,
  VersionBranch,
  VersionTag,
  VersionComparison,
  ContentDiff,
  Commit,
  MergeRequest,
  RevertChange,
  VersionStatistics
} from '@/types/phase2-versioning';

export class VersionControlSystem {
  private static instance: VersionControlSystem;
  private versions: Map<string, ContentVersion> = new Map();
  private histories: Map<string, VersionHistory> = new Map();
  private branches: Map<string, VersionBranch> = new Map();
  private tags: Map<string, VersionTag> = new Map();
  private commits: Map<string, Commit> = new Map();
  private mergeRequests: Map<string, MergeRequest> = new Map();
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): VersionControlSystem {
    if (!VersionControlSystem.instance) {
      VersionControlSystem.instance = new VersionControlSystem();
    }
    return VersionControlSystem.instance;
  }

  public initializeHistory(contentId: string): VersionHistory {
    const history: VersionHistory = {
      contentId,
      versions: [],
      totalVersions: 0,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      branches: [],
      tags: []
    };

    this.histories.set(contentId, history);
    return history;
  }

  public createVersion(
    contentId: string,
    userId: string,
    content: Record<string, any>,
    changeMessage: string
  ): ContentVersion {
    const history = this.histories.get(contentId) || this.initializeHistory(contentId);

    const version: ContentVersion = {
      id: `v_${++this.counter}_${Date.now()}`,
      contentId,
      userId,
      versionNumber: history.totalVersions + 1,
      timestamp: new Date().toISOString(),
      content,
      changeType: history.totalVersions === 0 ? 'create' : 'update',
      changeMessage,
      previousVersionId: history.versions.length > 0 
        ? history.versions[history.versions.length - 1].id 
        : undefined,
      author: {
        id: userId,
        name: userId,
        email: `${userId}@example.com`
      },
      metadata: {}
    };

    this.versions.set(version.id, version);
    history.versions.push(version);
    history.totalVersions++;
    history.lastModifiedAt = version.timestamp;

    this.histories.set(contentId, history);
    return version;
  }

  public createBranch(
    contentId: string,
    baseVersionId: string,
    name: string,
    createdBy: string
  ): VersionBranch {
    const baseVersion = this.versions.get(baseVersionId);
    if (!baseVersion) throw new Error('Base version not found');

    const branch: VersionBranch = {
      id: `br_${++this.counter}_${Date.now()}`,
      contentId,
      name,
      description: `Branch: ${name}`,
      baseVersionId,
      headVersionId: baseVersionId,
      createdAt: new Date().toISOString(),
      createdBy,
      isActive: true,
      commits: []
    };

    this.branches.set(branch.id, branch);
    const history = this.histories.get(contentId);
    if (history) {
      history.branches.push(branch);
    }

    return branch;
  }

  public createTag(
    contentId: string,
    versionId: string,
    name: string,
    createdBy: string
  ): VersionTag {
    const tag: VersionTag = {
      id: `tag_${++this.counter}_${Date.now()}`,
      contentId,
      versionId,
      name,
      description: `Tag: ${name}`,
      createdAt: new Date().toISOString(),
      createdBy,
      metadata: { type: 'release' }
    };

    this.tags.set(tag.id, tag);
    const history = this.histories.get(contentId);
    if (history) {
      history.tags.push(tag);
    }

    return tag;
  }

  public compareVersions(
    sourceVersionId: string,
    targetVersionId: string
  ): VersionComparison {
    const source = this.versions.get(sourceVersionId);
    const target = this.versions.get(targetVersionId);

    if (!source || !target) throw new Error('Version not found');

    const diffs: ContentDiff[] = [];
    const sourceKeys = new Set([...Object.keys(source.content), ...Object.keys(target.content)]);

    sourceKeys.forEach(key => {
      const sourceVal = source.content[key];
      const targetVal = target.content[key];

      if (sourceVal !== targetVal) {
        diffs.push({
          path: key,
          type: targetVal === undefined ? 'deletion' : 
                 sourceVal === undefined ? 'addition' : 'modification',
          oldValue: sourceVal,
          newValue: targetVal
        });
      }
    });

    return {
      sourceVersionId,
      targetVersionId,
      diffs,
      similarities: Math.max(0, 100 - (diffs.length * 10)),
      changesSummary: {
        additions: diffs.filter(d => d.type === 'addition').length,
        deletions: diffs.filter(d => d.type === 'deletion').length,
        modifications: diffs.filter(d => d.type === 'modification').length
      }
    };
  }

  public createCommit(
    contentId: string,
    branchId: string,
    versionId: string,
    message: string,
    userId: string
  ): Commit {
    const version = this.versions.get(versionId);
    const branch = this.branches.get(branchId);

    if (!version || !branch) throw new Error('Version or branch not found');

    const commit: Commit = {
      id: `commit_${++this.counter}_${Date.now()}`,
      contentId,
      branchId,
      versionId,
      message,
      author: {
        id: userId,
        name: userId,
        email: `${userId}@example.com`
      },
      timestamp: new Date().toISOString(),
      changes: [],
      parentCommitId: branch.commits.length > 0 
        ? this.commits.get(branch.commits[branch.commits.length - 1])?.id 
        : undefined
    };

    this.commits.set(commit.id, commit);
    branch.commits.push(commit.id);
    branch.headVersionId = versionId;

    return commit;
  }

  public createMergeRequest(
    contentId: string,
    sourceBranchId: string,
    targetBranchId: string,
    title: string,
    createdBy: string
  ): MergeRequest {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);

    if (!sourceBranch || !targetBranch) throw new Error('Branch not found');

    const mr: MergeRequest = {
      id: `mr_${++this.counter}_${Date.now()}`,
      contentId,
      sourceBranchId,
      targetBranchId,
      title,
      description: `Merge ${sourceBranch.name} into ${targetBranch.name}`,
      status: 'open',
      createdBy,
      createdAt: new Date().toISOString(),
      conflicts: [],
      reviewers: []
    };

    this.mergeRequests.set(mr.id, mr);
    return mr;
  }

  public mergeBranches(mergeRequestId: string): boolean {
    const mr = this.mergeRequests.get(mergeRequestId);
    if (!mr || mr.status !== 'open') return false;

    mr.status = 'merged';
    mr.mergedAt = new Date().toISOString();
    mr.mergedBy = 'system';

    return true;
  }

  public revertToVersion(
    contentId: string,
    targetVersionId: string,
    reason: string,
    userId: string
  ): RevertChange {
    const history = this.histories.get(contentId);
    const targetVersion = this.versions.get(targetVersionId);

    if (!history || !targetVersion) throw new Error('Content or version not found');

    const revert: RevertChange = {
      id: `revert_${++this.counter}_${Date.now()}`,
      contentId,
      fromVersionId: history.versions[history.versions.length - 1].id,
      toVersionId: targetVersionId,
      reason,
      performedBy: userId,
      performedAt: new Date().toISOString(),
      reversible: true
    };

    return revert;
  }

  public getVersionHistory(contentId: string): VersionHistory | null {
    return this.histories.get(contentId) || null;
  }

  public getVersion(versionId: string): ContentVersion | null {
    return this.versions.get(versionId) || null;
  }

  public getVersionsByUser(userId: string): ContentVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.userId === userId);
  }

  public getStatistics(contentId: string): VersionStatistics {
    const history = this.histories.get(contentId);
    if (!history) throw new Error('Content not found');

    const userEdits = new Map<string, number>();
    history.versions.forEach(v => {
      const count = userEdits.get(v.userId) || 0;
      userEdits.set(v.userId, count + 1);
    });

    return {
      contentId,
      totalVersions: history.totalVersions,
      totalEditors: userEdits.size,
      editorsWithCount: Array.from(userEdits.entries()).map(([userId, edits]) => ({ userId, edits })),
      mostFrequentChanges: [],
      averageTimePerVersion: 3600,
      largestVersionSize: 102400,
      storageBreakdown: {
        archived: 0,
        active: history.totalVersions,
        branches: history.branches.length
      }
    };
  }

  public getMergeRequests(contentId: string, status?: string): MergeRequest[] {
    let mrs = Array.from(this.mergeRequests.values())
      .filter(m => m.contentId === contentId);
    
    if (status) {
      mrs = mrs.filter(m => m.status === status);
    }

    return mrs;
  }
}

export const versionControl = VersionControlSystem.getInstance();
