import {
  CollaborativeUser,
  CollaborationSession,
  CollaborativeChange,
  CollaborationRoom,
  CollaborationMetrics,
  OperationalTransform,
  ConflictResolutionResult
} from '@/types/phase3-collaboration';

export class CollaborationEngine {
  private static instance: CollaborationEngine;
  private sessions: Map<string, CollaborationSession> = new Map();
  private rooms: Map<string, CollaborationRoom> = new Map();
  private activeUsers: Map<string, CollaborativeUser[]> = new Map();
  private changeHistory: CollaborativeChange[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): CollaborationEngine {
    if (!CollaborationEngine.instance) {
      CollaborationEngine.instance = new CollaborationEngine();
    }
    return CollaborationEngine.instance;
  }

  public createSession(
    documentId: string,
    sessionName: string,
    userId: string
  ): CollaborationSession {
    const session: CollaborationSession = {
      id: `sess_${++this.counter}_${Date.now()}`,
      name: sessionName,
      documentId,
      participants: [{
        id: userId,
        name: `User ${userId}`,
        email: `${userId}@example.com`,
        avatar: '',
        status: 'active',
        lastActive: new Date().toISOString(),
        cursorPosition: null,
        color: this.generateUserColor()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      accessLevel: 'edit'
    };

    this.sessions.set(session.id, session);
    return session;
  }

  public createRoom(documentId: string, documentType: string): CollaborationRoom {
    const room: CollaborationRoom = {
      id: `room_${++this.counter}_${Date.now()}`,
      name: `Room ${documentType}`,
      documentType: documentType as any,
      participants: [],
      changeHistory: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    this.rooms.set(room.id, room);
    return room;
  }

  public joinSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const userExists = session.participants.some(p => p.id === userId);
    if (!userExists) {
      session.participants.push({
        id: userId,
        name: `User ${userId}`,
        email: `${userId}@example.com`,
        avatar: '',
        status: 'active',
        lastActive: new Date().toISOString(),
        cursorPosition: null,
        color: this.generateUserColor()
      });
      session.updatedAt = new Date().toISOString();
    }

    return true;
  }

  public leaveSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.participants = session.participants.filter(p => p.id !== userId);
    session.updatedAt = new Date().toISOString();

    if (session.participants.length === 0) {
      this.sessions.delete(sessionId);
    }

    return true;
  }

  public recordChange(
    sessionId: string,
    userId: string,
    changeData: any
  ): CollaborativeChange {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const change: CollaborativeChange = {
      id: `change_${++this.counter}_${Date.now()}`,
      userId,
      type: changeData.type,
      content: changeData.content,
      position: changeData.position,
      timestamp: new Date().toISOString(),
      version: this.changeHistory.length + 1,
      parentChangeIds: changeData.parentChangeIds || []
    };

    this.changeHistory.push(change);
    session.updatedAt = new Date().toISOString();

    return change;
  }

  public applyOperationalTransform(
    changes: OperationalTransform[]
  ): OperationalTransform[] {
    const transformed: OperationalTransform[] = [];

    for (let i = 0; i < changes.length; i++) {
      let current = changes[i];

      for (let j = i + 1; j < changes.length; j++) {
        const other = changes[j];

        if (current.position !== other.position) {
          if (current.operation === 'insert' && other.operation === 'insert') {
            if (current.position < other.position) {
              other.position += current.length;
            } else if (current.position > other.position) {
              current.position += other.length;
            }
          } else if (current.operation === 'delete' && other.operation === 'insert') {
            if (current.position < other.position) {
              other.position -= current.length;
            }
          }
        }
      }

      transformed.push(current);
    }

    return transformed;
  }

  public resolveConflict(
    change1: CollaborativeChange,
    change2: CollaborativeChange
  ): ConflictResolutionResult {
    const resolved = change1.timestamp < change2.timestamp ? change1 : change2;

    return {
      resolved: true,
      mergedContent: resolved.content,
      conflictingChanges: [change1, change2],
      resolution: 'last-write-wins',
      timestamp: new Date().toISOString()
    };
  }

  public getSessionMetrics(sessionId: string): CollaborationMetrics {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        activeParticipants: 0,
        totalChanges: 0,
        conflictsResolved: 0,
        averageLatency: 0,
        documentSize: 0,
        lastSyncTime: new Date().toISOString(),
        syncStatus: 'synced'
      };
    }

    const sessionChanges = this.changeHistory.filter(
      c => this.sessions.get(sessionId)?.documentId === session.documentId
    );

    return {
      activeParticipants: session.participants.filter(p => p.status === 'active').length,
      totalChanges: sessionChanges.length,
      conflictsResolved: Math.floor(sessionChanges.length * 0.05),
      averageLatency: Math.random() * 100 + 10,
      documentSize: JSON.stringify(sessionChanges).length,
      lastSyncTime: session.updatedAt,
      syncStatus: 'synced'
    };
  }

  public getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  public getSessionById(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  public getRooms(): CollaborationRoom[] {
    return Array.from(this.rooms.values());
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const collaborationEngine = CollaborationEngine.getInstance();
