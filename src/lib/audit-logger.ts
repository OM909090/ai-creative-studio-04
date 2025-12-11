import { AuditLog, AuditLogFilter, AuditStats, AuditSeverity, AuditEventType } from '@/types/audit';

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];
  private logIndex: Map<string, AuditLog[]> = new Map();
  private maxLogs: number = 10000;
  private logIdCounter: number = 0;

  private constructor() {
    this.initializeIndexes();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private initializeIndexes(): void {
    this.logIndex.set('eventType', []);
    this.logIndex.set('userId', []);
    this.logIndex.set('severity', []);
    this.logIndex.set('status', []);
  }

  public log(
    userId: string,
    eventType: AuditEventType,
    action: string,
    resource: string,
    options: {
      status?: 'success' | 'failure';
      severity?: AuditSeverity;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
      result?: any;
      error?: string;
    } = {}
  ): AuditLog {
    const auditLog: AuditLog = {
      id: `audit_${++this.logIdCounter}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      eventType,
      action,
      resource,
      status: options.status || (options.error ? 'failure' : 'success'),
      severity: options.severity || this.determineSeverity(eventType, options.status),
      details: options.details || {},
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      duration: options.duration,
      result: options.result,
      error: options.error
    };

    this.logs.push(auditLog);
    this.updateIndexes(auditLog);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (auditLog.severity === 'high' || auditLog.severity === 'critical') {
      console.warn('CRITICAL AUDIT EVENT:', auditLog);
    }

    return auditLog;
  }

  private updateIndexes(auditLog: AuditLog): void {
    const eventTypeIndex = this.logIndex.get('eventType') || [];
    eventTypeIndex.push(auditLog);
    this.logIndex.set('eventType', eventTypeIndex);

    const userIdIndex = this.logIndex.get('userId') || [];
    userIdIndex.push(auditLog);
    this.logIndex.set('userId', userIdIndex);

    const severityIndex = this.logIndex.get('severity') || [];
    severityIndex.push(auditLog);
    this.logIndex.set('severity', severityIndex);

    const statusIndex = this.logIndex.get('status') || [];
    statusIndex.push(auditLog);
    this.logIndex.set('status', statusIndex);
  }

  private determineSeverity(eventType: AuditEventType, status?: string): AuditSeverity {
    const criticalEvents: AuditEventType[] = [
      'permission_granted',
      'permission_revoked',
      'role_assigned',
      'role_removed',
      'security_event'
    ];

    if (criticalEvents.includes(eventType)) {
      return 'high';
    }

    if (status === 'failure' || eventType === 'system_error') {
      return 'medium';
    }

    if (eventType === 'data_accessed') {
      return 'medium';
    }

    return 'low';
  }

  public search(filter: AuditLogFilter): AuditLog[] {
    let results = [...this.logs];

    if (filter.userId) {
      results = results.filter(log => log.userId === filter.userId);
    }

    if (filter.eventType) {
      results = results.filter(log => log.eventType === filter.eventType);
    }

    if (filter.status) {
      results = results.filter(log => log.status === filter.status);
    }

    if (filter.severity) {
      results = results.filter(log => log.severity === filter.severity);
    }

    if (filter.resource) {
      results = results.filter(log =>
        log.resource.toLowerCase().includes(filter.resource!.toLowerCase())
      );
    }

    if (filter.startDate) {
      const startTime = new Date(filter.startDate).getTime();
      results = results.filter(log => new Date(log.timestamp).getTime() >= startTime);
    }

    if (filter.endDate) {
      const endTime = new Date(filter.endDate).getTime();
      results = results.filter(log => new Date(log.timestamp).getTime() <= endTime);
    }

    const limit = filter.limit || 100;
    const offset = filter.offset || 0;

    return results
      .reverse()
      .slice(offset, offset + limit);
  }

  public getStats(): AuditStats {
    const byEventType: Record<AuditEventType, number> = {} as Record<AuditEventType, number>;
    const bySeverity: Record<AuditSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    let successCount = 0;
    let failureCount = 0;

    this.logs.forEach(log => {
      byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

      if (log.status === 'success') {
        successCount++;
      } else {
        failureCount++;
      }
    });

    return {
      totalLogs: this.logs.length,
      successCount,
      failureCount,
      byEventType,
      bySeverity,
      recentLogs: this.logs.slice(-10).reverse()
    };
  }

  public getUserActivity(userId: string, limit: number = 50): AuditLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit)
      .reverse();
  }

  public getRecentCriticalEvents(hours: number = 24): AuditLog[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.logs.filter(log =>
      (log.severity === 'high' || log.severity === 'critical') &&
      new Date(log.timestamp) > cutoffTime
    );
  }

  public exportLogs(filter?: AuditLogFilter): string {
    const logsToExport = filter ? this.search(filter) : this.logs;

    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Event Type',
      'Action',
      'Resource',
      'Status',
      'Severity',
      'Duration (ms)',
      'Error'
    ];

    const rows = logsToExport.map(log => [
      log.id,
      log.timestamp,
      log.userId,
      log.eventType,
      log.action,
      log.resource,
      log.status,
      log.severity,
      log.duration || '',
      log.error || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  public deleteOldLogs(olderThanDays: number): number {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const initialLength = this.logs.length;

    this.logs = this.logs.filter(log =>
      new Date(log.timestamp).getTime() > cutoffTime
    );

    return initialLength - this.logs.length;
  }

  public clear(): void {
    this.logs = [];
    this.logIndex.clear();
    this.initializeIndexes();
  }

  public getLogCount(): number {
    return this.logs.length;
  }

  public getAverageDuration(filter: AuditLogFilter): number {
    const results = this.search(filter);
    const logsWithDuration = results.filter(log => log.duration !== undefined);

    if (logsWithDuration.length === 0) {
      return 0;
    }

    const totalDuration = logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0);
    return totalDuration / logsWithDuration.length;
  }
}

export const auditLogger = AuditLogger.getInstance();
