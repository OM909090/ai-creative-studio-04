export type PreferenceCategory = 'ui' | 'behavior' | 'notifications' | 'privacy' | 'performance' | 'accessibility';
export type PreferenceScope = 'global' | 'workspace' | 'project' | 'personal';

export interface UserPreference {
  id: string;
  userId: string;
  category: PreferenceCategory;
  scope: PreferenceScope;
  key: string;
  value: any;
  dataType: string;
  defaultValue: any;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PreferenceProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  scope: PreferenceScope;
  preferences: UserPreference[];
  isActive: boolean;
  isPremade: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customThemeId?: string;
  fontSize: 'small' | 'normal' | 'large';
  compactMode: boolean;
  sidebarPosition: 'left' | 'right';
  showAnimations: boolean;
  colorScheme: string;
  accentColor: string;
  layout: 'default' | 'minimal' | 'detailed';
}

export interface BehaviorPreferences {
  autoSave: boolean;
  autoSaveInterval: number;
  confirmBeforeDelete: boolean;
  confirmBeforeLargeOperations: boolean;
  defaultSortOrder: 'asc' | 'desc';
  defaultSortBy: string;
  rememberLastState: boolean;
  enableUndoRedo: boolean;
  undoHistorySize: number;
  defaultViewMode: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  soundEnabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
  notificationGroups: {
    category: string;
    enabled: boolean;
    channels: ('email' | 'push' | 'inapp')[];
  }[];
}

export interface PrivacyPreferences {
  dataCollection: boolean;
  analyticsTracking: boolean;
  crashReporting: boolean;
  shareWithThirdParties: boolean;
  shareUsageStatistics: boolean;
  retentionDays: number;
  gdprCompliance: boolean;
  consentLevel: 'minimal' | 'standard' | 'full';
}

export interface PerformancePreferences {
  enableCache: boolean;
  cacheExpiration: number;
  enableCompression: boolean;
  lazyLoadImages: boolean;
  prefetchResources: boolean;
  maxConcurrentRequests: number;
  enableServiceWorker: boolean;
  offlineMode: boolean;
  lowBandwidthMode: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  screenReaderOptimized: boolean;
  focusIndicator: boolean;
  reduceMotion: boolean;
  captions: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  colorBlindMode?: 'deuteranopia' | 'protanopia' | 'tritanopia';
  screenMagnification: boolean;
  magnificationLevel: number;
}

export interface PreferenceTemplate {
  id: string;
  name: string;
  description: string;
  category: PreferenceCategory;
  presets: PreferencePreset[];
  author: string;
  version: string;
  tags: string[];
  createdAt: string;
}

export interface PreferencePreset {
  id: string;
  name: string;
  description: string;
  settings: UserPreference[];
  icon?: string;
  color?: string;
  isPopular: boolean;
  downloads: number;
}

export interface PreferenceSync {
  id: string;
  userId: string;
  enabled: boolean;
  syncIntervalSeconds: number;
  lastSyncAt: string;
  syncedPreferences: string[];
  deviceId: string;
  conflictResolution: 'local' | 'remote' | 'merge';
}

export interface PreferenceHistory {
  id: string;
  userId: string;
  preferenceId: string;
  oldValue: any;
  newValue: any;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface PreferenceValidation {
  preferenceKey: string;
  dataType: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
  pattern?: string;
  required: boolean;
  customValidator?: string;
}

export interface CustomTheme {
  id: string;
  userId: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    [key: string]: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: number;
  borderRadius: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceExport {
  format: 'json' | 'yaml' | 'xml';
  includePersonalData: boolean;
  encryptSensitive: boolean;
  fileName: string;
}

export interface PreferenceImport {
  format: 'json' | 'yaml' | 'xml';
  mergeStrategy: 'overwrite' | 'merge' | 'keep_existing';
  validateOnly: boolean;
  fileContent: string;
}
