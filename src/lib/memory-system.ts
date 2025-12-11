import {
  MemoryEntry,
  ShortTermMemory,
  LongTermMemory,
  KnowledgeBase,
  MemoryVersion,
  MemorySearch,
  MemorySearchResult,
  MemoryType,
  MemoryPriority,
  ConversationContext,
  ActionRecord,
  UserProfile,
  UserPreferences,
  LearningEntry,
  HistoryEntry,
  MemoryChange
} from '@/types/phase2-memory';

export class MemorySystem {
  private static instance: MemorySystem;
  private shortTermMemories: Map<string, ShortTermMemory> = new Map();
  private longTermMemories: Map<string, LongTermMemory> = new Map();
  private knowledgeBases: Map<string, KnowledgeBase> = new Map();
  private memoryVersions: Map<string, MemoryVersion[]> = new Map();
  private allMemories: Map<string, MemoryEntry> = new Map();
  private memoryCounter: number = 0;

  private constructor() {}

  public static getInstance(): MemorySystem {
    if (!MemorySystem.instance) {
      MemorySystem.instance = new MemorySystem();
    }
    return MemorySystem.instance;
  }

  public createShortTermMemory(
    sessionId: string,
    userId: string
  ): ShortTermMemory {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const memory: ShortTermMemory = {
      id: `stm_${++this.memoryCounter}_${Date.now()}`,
      sessionId,
      userId,
      conversationContext: [],
      currentState: {},
      recentActions: [],
      createdAt: new Date().toISOString(),
      expiresAt
    };
    this.shortTermMemories.set(memory.id, memory);
    return memory;
  }

  public createLongTermMemory(
    userId: string,
    userProfile: UserProfile
  ): LongTermMemory {
    const memory: LongTermMemory = {
      id: `ltm_${++this.memoryCounter}_${Date.now()}`,
      userId,
      userProfile,
      preferences: {
        userId,
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          enabled: true,
          channels: ['in_app'],
          frequency: 'daily',
          doNotDisturb: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          }
        },
        privacy: {
          dataCollection: true,
          analyticsTracking: true,
          shareWithThirdParties: false,
          retentionDays: 90
        },
        customSettings: {}
      },
      history: [],
      learnings: [],
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      version: 1
    };
    this.longTermMemories.set(memory.id, memory);
    this.createMemoryVersion(memory.id, memory, 'create', 'Initial memory creation', userId);
    return memory;
  }

  public createKnowledgeBase(
    userId: string,
    domainName: string
  ): KnowledgeBase {
    const kb: KnowledgeBase = {
      id: `kb_${++this.memoryCounter}_${Date.now()}`,
      userId,
      domainName,
      entries: [],
      relationships: [],
      lastUpdatedAt: new Date().toISOString(),
      version: 1
    };
    this.knowledgeBases.set(kb.id, kb);
    return kb;
  }

  public addConversationContext(
    memoryId: string,
    context: ConversationContext
  ): boolean {
    const memory = this.shortTermMemories.get(memoryId);
    if (!memory) return false;

    memory.conversationContext.push(context);
    return true;
  }

  public addActionRecord(
    memoryId: string,
    action: ActionRecord
  ): boolean {
    const memory = this.shortTermMemories.get(memoryId);
    if (!memory) return false;

    memory.recentActions.push(action);
    if (memory.recentActions.length > 100) {
      memory.recentActions.shift();
    }
    return true;
  }

  public updateMemoryState(
    memoryId: string,
    updates: Record<string, any>
  ): boolean {
    const memory = this.shortTermMemories.get(memoryId) || 
                   this.longTermMemories.get(memoryId);
    if (!memory) return false;

    if ('currentState' in memory) {
      memory.currentState = { ...memory.currentState, ...updates };
    }
    return true;
  }

  public storeMemory(
    userId: string,
    type: MemoryType,
    content: string,
    metadata: Record<string, any> = {},
    priority: MemoryPriority = 'medium'
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: `mem_${++this.memoryCounter}_${Date.now()}`,
      type,
      userId,
      content,
      metadata,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessedAt: new Date().toISOString(),
      relatedMemories: [],
      confidence: 0.8
    };

    this.allMemories.set(entry.id, entry);
    return entry;
  }

  public retrieveMemory(memoryId: string): MemoryEntry | null {
    const memory = this.allMemories.get(memoryId);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessedAt = new Date().toISOString();
    }
    return memory || null;
  }

  public searchMemories(query: MemorySearch): MemorySearchResult {
    const startTime = Date.now();
    const results: MemoryEntry[] = [];
    const relevanceScores = new Map<string, number>();

    const queryLower = query.query.toLowerCase();
    const filtered = Array.from(this.allMemories.values()).filter(
      m => (!query.memoryType || m.type === query.memoryType) &&
           m.userId === query.userId
    );

    filtered.forEach(memory => {
      const contentMatch = memory.content.toLowerCase().includes(queryLower) ? 1 : 0;
      const metadataMatch = Object.values(memory.metadata)
        .some(v => String(v).toLowerCase().includes(queryLower)) ? 0.8 : 0;
      
      const score = contentMatch * 0.7 + metadataMatch * 0.3;
      if (score > 0) {
        results.push(memory);
        relevanceScores.set(memory.id, score);
      }
    });

    results.sort((a, b) => (relevanceScores.get(b.id) || 0) - (relevanceScores.get(a.id) || 0));
    const paginatedResults = results.slice(query.offset, query.offset + query.limit);

    return {
      entries: paginatedResults,
      totalMatches: results.length,
      searchTime: Date.now() - startTime,
      relevanceScores
    };
  }

  public getConversationHistory(
    memoryId: string,
    limit: number = 50
  ): ConversationContext[] {
    const memory = this.shortTermMemories.get(memoryId);
    if (!memory) return [];
    return memory.conversationContext.slice(-limit);
  }

  public getRecentActions(
    memoryId: string,
    limit: number = 20
  ): ActionRecord[] {
    const memory = this.shortTermMemories.get(memoryId);
    if (!memory) return [];
    return memory.recentActions.slice(-limit);
  }

  public addLearning(
    memoryId: string,
    learning: LearningEntry
  ): boolean {
    const memory = this.longTermMemories.get(memoryId);
    if (!memory) return false;

    const existingIndex = memory.learnings.findIndex(l => l.pattern === learning.pattern);
    if (existingIndex >= 0) {
      memory.learnings[existingIndex].frequency++;
      memory.learnings[existingIndex].lastOccurredAt = new Date().toISOString();
    } else {
      memory.learnings.push(learning);
    }

    memory.lastUpdatedAt = new Date().toISOString();
    return true;
  }

  public addHistoryEntry(
    memoryId: string,
    entry: HistoryEntry
  ): boolean {
    const memory = this.longTermMemories.get(memoryId);
    if (!memory) return false;

    memory.history.push(entry);
    memory.lastUpdatedAt = new Date().toISOString();
    return true;
  }

  private createMemoryVersion(
    memoryId: string,
    currentState: any,
    changeType: 'created' | 'updated' | 'deleted' | 'merged',
    changeReason: string,
    changedBy: string
  ): MemoryVersion {
    const versions = this.memoryVersions.get(memoryId) || [];
    const versionNumber = versions.length + 1;
    const previousState = versions.length > 0 ? versions[versions.length - 1].currentState : {};

    const changes: MemoryChange[] = [];
    Object.keys(currentState).forEach(key => {
      if (previousState[key] !== currentState[key]) {
        changes.push({
          field: key,
          oldValue: previousState[key],
          newValue: currentState[key],
          timestamp: new Date().toISOString(),
          changeType
        });
      }
    });

    const version: MemoryVersion = {
      id: `ver_${++this.memoryCounter}_${Date.now()}`,
      memoryId,
      versionNumber,
      previousState,
      currentState,
      changes,
      changeReason,
      timestamp: new Date().toISOString(),
      changedBy
    };

    versions.push(version);
    this.memoryVersions.set(memoryId, versions);
    return version;
  }

  public getMemoryVersions(memoryId: string): MemoryVersion[] {
    return this.memoryVersions.get(memoryId) || [];
  }

  public getMemoryVersion(memoryId: string, versionNumber: number): MemoryVersion | null {
    const versions = this.memoryVersions.get(memoryId) || [];
    return versions.find(v => v.versionNumber === versionNumber) || null;
  }

  public cloneMemory(memoryId: string, userId: string): MemoryEntry | null {
    const original = this.allMemories.get(memoryId);
    if (!original) return null;

    const clone = this.storeMemory(
      userId,
      original.type,
      original.content,
      { ...original.metadata, clonedFrom: memoryId },
      original.priority
    );

    clone.relatedMemories.push(memoryId);
    return clone;
  }

  public clearExpiredMemories(): number {
    let cleared = 0;
    const now = new Date();

    for (const [id, memory] of this.shortTermMemories.entries()) {
      if (new Date(memory.expiresAt) < now) {
        this.shortTermMemories.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  public getMemoryStats(userId: string): {
    shortTermMemories: number;
    longTermMemories: number;
    totalMemories: number;
    knowledgeBases: number;
    memoryUsage: string;
  } {
    const userMemories = Array.from(this.allMemories.values())
      .filter(m => m.userId === userId);
    
    return {
      shortTermMemories: Array.from(this.shortTermMemories.values())
        .filter(m => m.userId === userId).length,
      longTermMemories: Array.from(this.longTermMemories.values())
        .filter(m => m.userId === userId).length,
      totalMemories: userMemories.length,
      knowledgeBases: Array.from(this.knowledgeBases.values())
        .filter(kb => kb.userId === userId).length,
      memoryUsage: `${(userMemories.length * 1024).toLocaleString()} bytes`
    };
  }

  public exportMemories(userId: string): {
    memories: MemoryEntry[];
    shortTerm: ShortTermMemory[];
    longTerm: LongTermMemory[];
    timestamp: string;
  } {
    return {
      memories: Array.from(this.allMemories.values()).filter(m => m.userId === userId),
      shortTerm: Array.from(this.shortTermMemories.values()).filter(m => m.userId === userId),
      longTerm: Array.from(this.longTermMemories.values()).filter(m => m.userId === userId),
      timestamp: new Date().toISOString()
    };
  }
}

export const memorySystem = MemorySystem.getInstance();
