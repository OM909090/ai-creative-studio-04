export type AuditEventType =
  | 'command_executed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'role_assigned'
  | 'role_removed'
  | 'task_created'
  | 'task_completed'
  | 'task_failed'
  | 'authentication_success'
  | 'authentication_failure'
  | 'data_accessed'
  | 'data_modified'
  | 'system_error'
  | 'security_event';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  eventType: AuditEventType;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  severity: AuditSeverity;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  result?: any;
  error?: string;
}

export interface AuditLogFilter {
  userId?: string;
  eventType?: AuditEventType;
  status?: 'success' | 'failure';
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  byEventType: Record<AuditEventType, number>;
  bySeverity: Record<AuditSeverity, number>;
  recentLogs: AuditLog[];
}
