import {
  UserPreference,
  PreferenceProfile,
  UIPreferences,
  BehaviorPreferences,
  NotificationPreferences,
  PrivacyPreferences,
  PerformancePreferences,
  AccessibilityPreferences,
  CustomTheme,
  PreferenceHistory,
  PreferenceCategory,
  PreferenceScope
} from '@/types/phase2-preferences';

export class PreferencesEngine {
  private static instance: PreferencesEngine;
  private preferences: Map<string, UserPreference> = new Map();
  private profiles: Map<string, PreferenceProfile> = new Map();
  private themes: Map<string, CustomTheme> = new Map();
  private history: PreferenceHistory[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): PreferencesEngine {
    if (!PreferencesEngine.instance) {
      PreferencesEngine.instance = new PreferencesEngine();
    }
    return PreferencesEngine.instance;
  }

  public createPreferenceProfile(
    userId: string,
    name: string,
    scope: PreferenceScope = 'personal'
  ): PreferenceProfile {
    const profile: PreferenceProfile = {
      id: `pp_${++this.counter}_${Date.now()}`,
      userId,
      name,
      description: `Preference profile: ${name}`,
      scope,
      preferences: this.getDefaultPreferences(userId),
      isActive: true,
      isPremade: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  private getDefaultPreferences(userId: string): UserPreference[] {
    return [
      {
        id: `pref_${++this.counter}_${Date.now()}`,
        userId,
        category: 'ui',
        scope: 'personal',
        key: 'theme',
        value: 'auto',
        dataType: 'string',
        defaultValue: 'auto',
        description: 'UI theme preference',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: `pref_${++this.counter}_${Date.now()}`,
        userId,
        category: 'notifications',
        scope: 'personal',
        key: 'email_enabled',
        value: true,
        dataType: 'boolean',
        defaultValue: true,
        description: 'Enable email notifications',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: `pref_${++this.counter}_${Date.now()}`,
        userId,
        category: 'privacy',
        scope: 'personal',
        key: 'data_collection',
        value: true,
        dataType: 'boolean',
        defaultValue: true,
        description: 'Allow data collection for analytics',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    ];
  }

  public setPreference(
    userId: string,
    category: PreferenceCategory,
    key: string,
    value: any
  ): UserPreference {
    const id = `${userId}_${category}_${key}`;
    const existing = Array.from(this.preferences.values())
      .find(p => p.userId === userId && p.category === category && p.key === key);

    if (existing) {
      this.recordHistory(existing.id, existing.value, value, userId);
      existing.value = value;
      existing.updatedAt = new Date().toISOString();
      existing.version++;
      return existing;
    }

    const pref: UserPreference = {
      id: `pref_${++this.counter}_${Date.now()}`,
      userId,
      category,
      scope: 'personal',
      key,
      value,
      dataType: typeof value,
      defaultValue: value,
      description: `${category}: ${key}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    this.preferences.set(pref.id, pref);
    return pref;
  }

  private recordHistory(
    preferenceId: string,
    oldValue: any,
    newValue: any,
    changedBy: string
  ): PreferenceHistory {
    const record: PreferenceHistory = {
      id: `hist_${++this.counter}_${Date.now()}`,
      userId: changedBy,
      preferenceId,
      oldValue,
      newValue,
      changedAt: new Date().toISOString(),
      changedBy
    };

    this.history.push(record);
    return record;
  }

  public getPreference(
    userId: string,
    category: PreferenceCategory,
    key: string
  ): UserPreference | null {
    return Array.from(this.preferences.values())
      .find(p => p.userId === userId && p.category === category && p.key === key) || null;
  }

  public getUserPreferences(userId: string): UIPreferences & BehaviorPreferences & NotificationPreferences {
    const prefs = Array.from(this.preferences.values())
      .filter(p => p.userId === userId);

    return {
      theme: 'auto',
      fontSize: 'normal',
      compactMode: false,
      sidebarPosition: 'left',
      showAnimations: true,
      colorScheme: 'default',
      accentColor: '#3b82f6',
      layout: 'default',
      autoSave: true,
      autoSaveInterval: 30000,
      confirmBeforeDelete: true,
      confirmBeforeLargeOperations: true,
      defaultSortOrder: 'asc',
      defaultSortBy: 'name',
      rememberLastState: true,
      enableUndoRedo: true,
      undoHistorySize: 50,
      defaultViewMode: 'list',
      enabled: true,
      emailNotifications: true,
      pushNotifications: false,
      inAppNotifications: true,
      soundEnabled: true,
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        days: []
      },
      notificationGroups: []
    };
  }

  public createCustomTheme(userId: string, name: string): CustomTheme {
    const theme: CustomTheme = {
      id: `theme_${++this.counter}_${Date.now()}`,
      userId,
      name,
      description: `Custom theme: ${name}`,
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#ffffff',
        foreground: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0ea5e9'
      },
      fonts: {
        primary: 'system-ui',
        secondary: 'system-ui',
        mono: 'monospace'
      },
      spacing: 4,
      borderRadius: 6,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.themes.set(theme.id, theme);
    return theme;
  }

  public getCustomTheme(themeId: string): CustomTheme | null {
    return this.themes.get(themeId) || null;
  }

  public getUserThemes(userId: string): CustomTheme[] {
    return Array.from(this.themes.values())
      .filter(t => t.userId === userId);
  }

  public applyTheme(userId: string, themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme || theme.userId !== userId) return false;

    Array.from(this.themes.values())
      .filter(t => t.userId === userId)
      .forEach(t => t.isActive = false);

    theme.isActive = true;
    return true;
  }

  public exportPreferences(userId: string): string {
    const userPrefs = Array.from(this.preferences.values())
      .filter(p => p.userId === userId);
    
    const profile = Array.from(this.profiles.values())
      .find(p => p.userId === userId);

    return JSON.stringify({
      preferences: userPrefs,
      profile,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public importPreferences(userId: string, jsonData: string): number {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;

      if (Array.isArray(data.preferences)) {
        data.preferences.forEach((pref: UserPreference) => {
          if (pref.userId === userId) {
            const existing = this.preferences.get(pref.id);
            if (!existing) {
              this.preferences.set(pref.id, pref);
              imported++;
            }
          }
        });
      }

      return imported;
    } catch (error) {
      return 0;
    }
  }

  public getPreferenceHistory(userId: string, limit: number = 50): PreferenceHistory[] {
    return this.history
      .filter(h => h.userId === userId)
      .slice(-limit);
  }

  public resetToDefaults(userId: string): number {
    const defaults = this.getDefaultPreferences(userId);
    let reset = 0;

    defaults.forEach(defaultPref => {
      const existing = Array.from(this.preferences.values())
        .find(p => p.userId === userId && 
                   p.category === defaultPref.category && 
                   p.key === defaultPref.key);

      if (existing) {
        this.recordHistory(existing.id, existing.value, defaultPref.value, userId);
        existing.value = defaultPref.value;
        existing.updatedAt = new Date().toISOString();
        reset++;
      }
    });

    return reset;
  }

  public getStats(userId: string): {
    totalPreferences: number;
    totalProfiles: number;
    totalThemes: number;
    historyEntries: number;
  } {
    return {
      totalPreferences: Array.from(this.preferences.values())
        .filter(p => p.userId === userId).length,
      totalProfiles: Array.from(this.profiles.values())
        .filter(p => p.userId === userId).length,
      totalThemes: Array.from(this.themes.values())
        .filter(t => t.userId === userId).length,
      historyEntries: this.history.filter(h => h.userId === userId).length
    };
  }
}

export const preferencesEngine = PreferencesEngine.getInstance();
