import {
  PlatformInfo,
  PlatformCapabilities,
  OSType,
  DeviceType,
  NativeAPIBridge,
  PlatformEvent
} from '@/types/phase3-crossplatform';

export class CrossPlatformLayer {
  private static instance: CrossPlatformLayer;
  private platformInfo: PlatformInfo;
  private capabilities: PlatformCapabilities;
  private apiCache: Map<string, NativeAPIBridge> = new Map();
  private eventListeners: Array<(event: PlatformEvent) => void> = [];

  private constructor() {
    this.platformInfo = this.detectPlatform();
    this.capabilities = this.detectCapabilities();
    this.initializeAPIs();
  }

  public static getInstance(): CrossPlatformLayer {
    if (!CrossPlatformLayer.instance) {
      CrossPlatformLayer.instance = new CrossPlatformLayer();
    }
    return CrossPlatformLayer.instance;
  }

  private detectPlatform(): PlatformInfo {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    let os: OSType = 'web';
    let device: DeviceType = 'desktop';
    let browser: any = 'web';

    if (ua.includes('Windows')) {
      os = 'windows';
    } else if (ua.includes('Mac')) {
      os = 'macos';
    } else if (ua.includes('Linux')) {
      os = 'linux';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'ios';
      device = ua.includes('iPhone') ? 'mobile' : 'tablet';
    } else if (ua.includes('Android')) {
      os = 'android';
      device = ua.includes('Mobile') ? 'mobile' : 'tablet';
    }

    if (ua.includes('Chrome')) browser = 'chrome';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Safari')) browser = 'safari';
    else if (ua.includes('Edge')) browser = 'edge';

    return {
      os,
      osVersion: '1.0',
      device,
      browser,
      browserVersion: '1.0',
      architecture: 'x64',
      isNative: false,
      appVersion: '1.0.0'
    };
  }

  private detectCapabilities(): PlatformCapabilities {
    const hasFileAPI = typeof File !== 'undefined';
    const hasIndexedDB = typeof indexedDB !== 'undefined';

    return {
      fileSystemAccess: hasFileAPI && this.platformInfo.os !== 'web',
      cameraAccess: true,
      microphoneAccess: true,
      locationAccess: typeof navigator !== 'undefined' && 'geolocation' in navigator,
      offlineMode: hasIndexedDB,
      pushNotifications: 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator,
      nativeApis: ['file-system', 'camera', 'microphone', 'location', 'storage'],
      maxFileSize: 100 * 1024 * 1024,
      maxStorageSize: 50 * 1024 * 1024
    };
  }

  private initializeAPIs(): void {
    const apis: NativeAPIBridge[] = [
      {
        apiType: 'file-system',
        isAvailable: this.capabilities.fileSystemAccess,
        permissions: { requested: false, granted: false, permanent: false },
        fallbackImplementation: true
      },
      {
        apiType: 'camera',
        isAvailable: this.capabilities.cameraAccess,
        permissions: { requested: false, granted: false, permanent: false },
        fallbackImplementation: true
      },
      {
        apiType: 'microphone',
        isAvailable: this.capabilities.microphoneAccess,
        permissions: { requested: false, granted: false, permanent: false },
        fallbackImplementation: true
      },
      {
        apiType: 'location',
        isAvailable: this.capabilities.locationAccess,
        permissions: { requested: false, granted: false, permanent: false },
        fallbackImplementation: true
      },
      {
        apiType: 'storage',
        isAvailable: true,
        permissions: { requested: true, granted: true, permanent: true },
        fallbackImplementation: false
      }
    ];

    apis.forEach(api => {
      this.apiCache.set(api.apiType, api);
    });
  }

  public getPlatformInfo(): PlatformInfo {
    return this.platformInfo;
  }

  public getCapabilities(): PlatformCapabilities {
    return this.capabilities;
  }

  public getAPIBridge(apiType: string): NativeAPIBridge | null {
    return this.apiCache.get(apiType) || null;
  }

  public isFeatureSupported(feature: string): boolean {
    switch (feature) {
      case 'offline-mode':
        return this.capabilities.offlineMode;
      case 'push-notifications':
        return this.capabilities.pushNotifications;
      case 'camera':
        return this.capabilities.cameraAccess;
      case 'microphone':
        return this.capabilities.microphoneAccess;
      case 'location':
        return this.capabilities.locationAccess;
      default:
        return false;
    }
  }

  public requestPermission(apiType: string): Promise<boolean> {
    return new Promise((resolve) => {
      const api = this.apiCache.get(apiType);
      if (!api) {
        resolve(false);
        return;
      }

      setTimeout(() => {
        api.permissions.requested = true;
        api.permissions.granted = true;
        resolve(true);
      }, 100);
    });
  }

  public addEventListener(callback: (event: PlatformEvent) => void): void {
    this.eventListeners.push(callback);
  }

  public removeEventListener(callback: (event: PlatformEvent) => void): void {
    const index = this.eventListeners.indexOf(callback);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: PlatformEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  public notifyOnlineStatus(online: boolean): void {
    this.emitEvent({
      type: online ? 'online' : 'offline',
      platform: this.platformInfo.os,
      timestamp: new Date().toISOString(),
      data: {}
    });
  }

  public isOnMobile(): boolean {
    return this.platformInfo.device === 'mobile' || this.platformInfo.device === 'tablet';
  }

  public isOnDesktop(): boolean {
    return this.platformInfo.device === 'desktop';
  }

  public supportsNativeApis(): boolean {
    return this.platformInfo.isNative || this.platformInfo.os !== 'web';
  }

  public getAllAPIs(): NativeAPIBridge[] {
    return Array.from(this.apiCache.values());
  }
}

export const crossPlatformLayer = CrossPlatformLayer.getInstance();
