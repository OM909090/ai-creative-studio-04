export type UserRole = 'admin' | 'user' | 'viewer' | 'guest';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'web_automation' | 'browser_control' | 'system_control' | 'editing' | 'information' | 'security' | 'monitoring';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RoleDefinition {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSecurityProfile {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  riskScore: number;
  lastSecurityReview: string;
  mfaEnabled: boolean;
  apiKeysCount: number;
  activeSessionCount: number;
}

export interface PermissionCheck {
  required: string[];
  granted: string[];
  missing: string[];
  hasSufficientPermissions: boolean;
}

export interface SecurityEvent {
  id: string;
  eventType: 'permission_denied' | 'unauthorized_access' | 'permission_granted' | 'role_changed' | 'suspicious_activity';
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}

export interface TokenPayload {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'web.data_extraction',
    'web.form_filling',
    'web.navigation',
    'browser.tabs',
    'browser.bookmarks',
    'browser.history',
    'browser.navigation',
    'browser.settings',
    'system.file_read',
    'system.file_write',
    'system.process_info',
    'editing.image',
    'editing.video',
    'editing.audio',
    'information.general',
    'information.technical',
    'security.manage_roles',
    'security.manage_permissions',
    'security.view_audit_logs',
    'security.manage_users',
    'monitoring.view_all',
    'monitoring.manage_alerts'
  ],
  user: [
    'web.data_extraction',
    'web.form_filling',
    'web.navigation',
    'browser.tabs',
    'browser.navigation',
    'editing.image',
    'editing.video',
    'editing.audio',
    'information.general',
    'information.technical',
    'security.view_audit_logs',
    'monitoring.view_own'
  ],
  viewer: [
    'web.data_extraction',
    'editing.image',
    'information.general',
    'monitoring.view_own'
  ],
  guest: [
    'information.general'
  ]
};

export const PERMISSION_DEFINITIONS: Record<string, Permission> = {
  'web.data_extraction': {
    id: 'web.data_extraction',
    name: 'Data Extraction',
    description: 'Extract data from web pages',
    category: 'web_automation',
    riskLevel: 'low'
  },
  'web.form_filling': {
    id: 'web.form_filling',
    name: 'Form Filling',
    description: 'Automatically fill and submit web forms',
    category: 'web_automation',
    riskLevel: 'medium'
  },
  'web.navigation': {
    id: 'web.navigation',
    name: 'Web Navigation',
    description: 'Navigate through web pages',
    category: 'web_automation',
    riskLevel: 'low'
  },
  'browser.tabs': {
    id: 'browser.tabs',
    name: 'Tab Management',
    description: 'Create and manage browser tabs',
    category: 'browser_control',
    riskLevel: 'low'
  },
  'browser.bookmarks': {
    id: 'browser.bookmarks',
    name: 'Bookmarks',
    description: 'Manage browser bookmarks',
    category: 'browser_control',
    riskLevel: 'low'
  },
  'browser.history': {
    id: 'browser.history',
    name: 'History Management',
    description: 'Access and manage browser history',
    category: 'browser_control',
    riskLevel: 'medium'
  },
  'browser.navigation': {
    id: 'browser.navigation',
    name: 'Navigation Control',
    description: 'Control browser navigation',
    category: 'browser_control',
    riskLevel: 'low'
  },
  'browser.settings': {
    id: 'browser.settings',
    name: 'Browser Settings',
    description: 'Modify browser settings',
    category: 'browser_control',
    riskLevel: 'high'
  },
  'system.file_read': {
    id: 'system.file_read',
    name: 'File Read',
    description: 'Read files from system',
    category: 'system_control',
    riskLevel: 'high'
  },
  'system.file_write': {
    id: 'system.file_write',
    name: 'File Write',
    description: 'Write files to system',
    category: 'system_control',
    riskLevel: 'critical'
  },
  'system.process_info': {
    id: 'system.process_info',
    name: 'Process Information',
    description: 'View system process information',
    category: 'system_control',
    riskLevel: 'high'
  },
  'editing.image': {
    id: 'editing.image',
    name: 'Image Editing',
    description: 'Edit images',
    category: 'editing',
    riskLevel: 'low'
  },
  'editing.video': {
    id: 'editing.video',
    name: 'Video Editing',
    description: 'Edit videos',
    category: 'editing',
    riskLevel: 'medium'
  },
  'editing.audio': {
    id: 'editing.audio',
    name: 'Audio Editing',
    description: 'Edit audio files',
    category: 'editing',
    riskLevel: 'medium'
  },
  'information.general': {
    id: 'information.general',
    name: 'General Information',
    description: 'Access general information',
    category: 'information',
    riskLevel: 'low'
  },
  'information.technical': {
    id: 'information.technical',
    name: 'Technical Information',
    description: 'Access technical documentation',
    category: 'information',
    riskLevel: 'low'
  },
  'security.manage_roles': {
    id: 'security.manage_roles',
    name: 'Manage Roles',
    description: 'Create and modify user roles',
    category: 'security',
    riskLevel: 'critical'
  },
  'security.manage_permissions': {
    id: 'security.manage_permissions',
    name: 'Manage Permissions',
    description: 'Assign and revoke permissions',
    category: 'security',
    riskLevel: 'critical'
  },
  'security.view_audit_logs': {
    id: 'security.view_audit_logs',
    name: 'View Audit Logs',
    description: 'Access system audit logs',
    category: 'security',
    riskLevel: 'medium'
  },
  'security.manage_users': {
    id: 'security.manage_users',
    name: 'Manage Users',
    description: 'Create, modify, and delete users',
    category: 'security',
    riskLevel: 'critical'
  },
  'monitoring.view_all': {
    id: 'monitoring.view_all',
    name: 'View All Monitoring',
    description: 'View monitoring data for all users',
    category: 'monitoring',
    riskLevel: 'high'
  },
  'monitoring.view_own': {
    id: 'monitoring.view_own',
    name: 'View Own Monitoring',
    description: 'View own monitoring data',
    category: 'monitoring',
    riskLevel: 'low'
  },
  'monitoring.manage_alerts': {
    id: 'monitoring.manage_alerts',
    name: 'Manage Alerts',
    description: 'Configure system alerts',
    category: 'monitoring',
    riskLevel: 'high'
  }
};
