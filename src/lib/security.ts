import {
  UserSecurityProfile,
  PermissionCheck,
  SecurityEvent,
  UserRole,
  ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS
} from '@/types/security';

export class SecurityService {
  private static instance: SecurityService;
  private securityEvents: SecurityEvent[] = [];
  private userProfiles: Map<string, UserSecurityProfile> = new Map();

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  public checkPermissions(
    userId: string,
    requiredPermissions: string[]
  ): PermissionCheck {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return {
        required: requiredPermissions,
        granted: [],
        missing: requiredPermissions,
        hasSufficientPermissions: false
      };
    }

    const granted = requiredPermissions.filter(perm =>
      profile.permissions.includes(perm)
    );

    const missing = requiredPermissions.filter(perm =>
      !profile.permissions.includes(perm)
    );

    return {
      required: requiredPermissions,
      granted,
      missing,
      hasSufficientPermissions: missing.length === 0
    };
  }

  public grantPermission(userId: string, permission: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.permissions.includes(permission)) {
      return false;
    }

    profile.permissions.push(permission);
    this.logSecurityEvent({
      eventType: 'permission_granted',
      userId,
      action: 'grant_permission',
      resource: permission,
      severity: 'low'
    });

    return true;
  }

  public revokePermission(userId: string, permission: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return false;
    }

    const index = profile.permissions.indexOf(permission);
    if (index === -1) {
      return false;
    }

    profile.permissions.splice(index, 1);
    this.logSecurityEvent({
      eventType: 'permission_denied',
      userId,
      action: 'revoke_permission',
      resource: permission,
      severity: 'low'
    });

    return true;
  }

  public assignRole(userId: string, role: UserRole): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return false;
    }

    if (profile.roles.includes(role)) {
      return false;
    }

    profile.roles.push(role);

    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    const newPermissions = rolePermissions.filter(
      perm => !profile.permissions.includes(perm)
    );

    profile.permissions.push(...newPermissions);

    this.logSecurityEvent({
      eventType: 'role_changed',
      userId,
      action: 'assign_role',
      resource: role,
      severity: 'medium'
    });

    return true;
  }

  public removeRole(userId: string, role: UserRole): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return false;
    }

    const index = profile.roles.indexOf(role);
    if (index === -1) {
      return false;
    }

    profile.roles.splice(index, 1);

    const remainingPermissions = this.calculatePermissionsForRoles(profile.roles);
    profile.permissions = remainingPermissions;

    this.logSecurityEvent({
      eventType: 'role_changed',
      userId,
      action: 'remove_role',
      resource: role,
      severity: 'medium'
    });

    return true;
  }

  public createUserProfile(
    userId: string,
    initialRole: UserRole = 'guest'
  ): UserSecurityProfile {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const permissions = ROLE_PERMISSIONS[initialRole] || [];
    const profile: UserSecurityProfile = {
      userId,
      roles: [initialRole],
      permissions,
      riskScore: 0,
      lastSecurityReview: new Date().toISOString(),
      mfaEnabled: false,
      apiKeysCount: 0,
      activeSessionCount: 1
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  public getUserProfile(userId: string): UserSecurityProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  public updateRiskScore(userId: string, riskScore: number): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.riskScore = Math.max(0, Math.min(100, riskScore));
    }
  }

  public enableMFA(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.mfaEnabled = true;
      this.logSecurityEvent({
        eventType: 'permission_granted',
        userId,
        action: 'enable_mfa',
        resource: 'mfa',
        severity: 'medium'
      });
    }
  }

  public disableMFA(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.mfaEnabled = false;
      this.logSecurityEvent({
        eventType: 'permission_denied',
        userId,
        action: 'disable_mfa',
        resource: 'mfa',
        severity: 'medium'
      });
    }
  }

  private calculatePermissionsForRoles(roles: UserRole[]): string[] {
    const allPermissions = new Set<string>();

    roles.forEach(role => {
      const rolePerms = ROLE_PERMISSIONS[role] || [];
      rolePerms.forEach(perm => allPermissions.add(perm));
    });

    return Array.from(allPermissions);
  }

  public logSecurityEvent(
    event: Omit<SecurityEvent, 'id' | 'timestamp'>
  ): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString()
    };

    this.securityEvents.push(securityEvent);

    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn('HIGH PRIORITY SECURITY EVENT:', securityEvent);
    }
  }

  public getSecurityEvents(
    userId?: string,
    limit: number = 100
  ): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (userId) {
      events = events.filter(e => e.userId === userId);
    }

    return events.slice(-limit).reverse();
  }

  public getAllPermissions() {
    return Object.values(PERMISSION_DEFINITIONS);
  }

  public getPermission(permissionId: string) {
    return PERMISSION_DEFINITIONS[permissionId];
  }

  public validateTokenExpiry(issuedAt: number, expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now < expiresAt;
  }

  public hasRiskFlag(userId: string, actionType: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return true;
    }

    if (profile.riskScore > 70) {
      return true;
    }

    if (!profile.mfaEnabled && actionType === 'sensitive_operation') {
      return true;
    }

    return false;
  }
}

export const securityService = SecurityService.getInstance();
