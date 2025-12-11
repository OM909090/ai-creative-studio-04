export type OSType = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web';
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'watch' | 'tv';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'mobile-browser';
export type NativeAPIType = 'file-system' | 'camera' | 'microphone' | 'location' | 'contacts' | 'calendar' | 'storage';

export interface PlatformInfo {
  os: OSType;
  osVersion: string;
  device: DeviceType;
  browser?: BrowserType;
  browserVersion?: string;
  architecture: 'x86' | 'x64' | 'arm' | 'arm64';
  isNative: boolean;
  appVersion: string;
}

export interface PlatformCapabilities {
  fileSystemAccess: boolean;
  cameraAccess: boolean;
  microphoneAccess: boolean;
  locationAccess: boolean;
  offlineMode: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  nativeApis: NativeAPIType[];
  maxFileSize: number;
  maxStorageSize: number;
}

export interface PlatformConfig {
  platform: OSType;
  capabilities: PlatformCapabilities;
  uiScale: number;
  touchSupport: boolean;
  darkModeSupport: boolean;
  multiWindowSupport: boolean;
  nativeMenuBar: boolean;
  customization: Record<string, any>;
}

export interface NativeAPIBridge {
  apiType: NativeAPIType;
  isAvailable: boolean;
  permissions: {
    requested: boolean;
    granted: boolean;
    permanent: boolean;
  };
  endpoint?: string;
  fallbackImplementation: boolean;
}

export interface FileSystemAccess {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  allowedExtensions: string[];
  allowedPaths: string[];
  sandbox: boolean;
}

export interface DeviceFeature {
  name: string;
  available: boolean;
  enabled: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt';
  requestPermission(): Promise<boolean>;
  fallback?: () => void;
}

export interface PlatformEvent {
  type: 'online' | 'offline' | 'low-memory' | 'battery-low' | 'network-change' | 'orientation-change';
  platform: OSType;
  timestamp: string;
  data: Record<string, any>;
}

export interface CrossPlatformAPI {
  platform: PlatformInfo;
  fileSystem: FileSystemAccess;
  camera: DeviceFeature;
  microphone: DeviceFeature;
  location: DeviceFeature;
  contacts: DeviceFeature;
  calendar: DeviceFeature;
  storage: DeviceFeature;
  notifications: DeviceFeature;
  backgroundSync: DeviceFeature;
}

export interface CompatibilityMatrix {
  feature: string;
  windows: boolean;
  macos: boolean;
  linux: boolean;
  ios: boolean;
  android: boolean;
  web: boolean;
  fallback: string;
  notes: string;
}

export interface PlatformAdapter {
  platform: OSType;
  fileSystemAdapter: any;
  nativeAPIAdapter: any;
  uiAdapter: any;
  storageAdapter: any;
  notificationAdapter: any;
}

export interface AppWindowConfig {
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  icon: string;
  frame: boolean;
  alwaysOnTop: boolean;
  resizable: boolean;
  movable: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  actions?: Array<{ title: string; action: string }>;
  tag?: string;
  badge?: string;
  timestamp: string;
}

export interface PlatformPreferences {
  platform: OSType;
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  uiDensity: 'compact' | 'normal' | 'spacious';
  animations: boolean;
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    reduceMotion: boolean;
    largeText: boolean;
  };
}
