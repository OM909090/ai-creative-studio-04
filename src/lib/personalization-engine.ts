import {
  UserProfile,
  UserPreferences,
  UserBehaviorProfile,
  Recommendation,
  UserFeedback,
  PersonalizationConfig,
  AITutor
} from '@/types/phase3-personalization';

export class PersonalizationEngine {
  private static instance: PersonalizationEngine;
  private profiles: Map<string, UserProfile> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map();
  private recommendations: Recommendation[] = [];
  private feedback: UserFeedback[] = [];
  private tutors: Map<string, AITutor> = new Map();
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): PersonalizationEngine {
    if (!PersonalizationEngine.instance) {
      PersonalizationEngine.instance = new PersonalizationEngine();
    }
    return PersonalizationEngine.instance;
  }

  public createUserProfile(
    userId: string,
    name: string,
    email: string
  ): UserProfile {
    const profile: UserProfile = {
      id: `profile_${++this.counter}_${Date.now()}`,
      userId,
      name,
      email,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  public createUserPreferences(userId: string): UserPreferences {
    const prefs: UserPreferences = {
      id: `prefs_${++this.counter}_${Date.now()}`,
      userId,
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        enabled: true,
        channels: ['in_app', 'email'],
        frequency: 'daily'
      },
      privacy: {
        dataCollection: true,
        analyticsTracking: true,
        personalizedRecommendations: true
      },
      accessibility: {
        highContrast: false,
        screenReader: false,
        fontSize: 'medium',
        reduceMotion: false
      },
      customSettings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.preferences.set(userId, prefs);
    return prefs;
  }

  public createBehaviorProfile(userId: string): UserBehaviorProfile {
    const behavior: UserBehaviorProfile = {
      id: `behavior_${++this.counter}_${Date.now()}`,
      userId,
      actionFrequency: {
        view: 150,
        edit: 45,
        share: 20,
        comment: 35
      },
      preferredFeatures: ['search', 'filter', 'export', 'batch_operations'],
      workingHours: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      },
      activityPattern: {
        peakHours: [10, 11, 14, 15],
        peakDays: ['Monday', 'Tuesday', 'Wednesday'],
        averageSessionDuration: 45 * 60 * 1000
      },
      devicePreferences: [
        { deviceType: 'desktop', preferenceScore: 0.9 },
        { deviceType: 'mobile', preferenceScore: 0.6 }
      ],
      updatedAt: new Date().toISOString()
    };

    this.behaviorProfiles.set(userId, behavior);
    return behavior;
  }

  public generateRecommendations(userId: string, count: number = 5): Recommendation[] {
    const userRecommendations: Recommendation[] = [];

    for (let i = 0; i < count; i++) {
      const rec: Recommendation = {
        id: `rec_${++this.counter}_${Date.now()}`,
        userId,
        type: ['content', 'feature', 'action'][Math.floor(Math.random() * 3)] as any,
        item: {
          id: `item_${i}`,
          title: `Recommended Item ${i + 1}`,
          description: `Description for recommended item ${i + 1}`,
          category: ['productivity', 'learning', 'entertainment'][Math.floor(Math.random() * 3)],
          metadata: {}
        },
        score: Math.random() * 0.4 + 0.6,
        confidence: Math.random() * 0.2 + 0.8,
        reason: `Recommended based on your ${['interests', 'behavior', 'skills'][Math.floor(Math.random() * 3)]}`,
        algorithm: 'collaborative-filtering',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interacted: false
      };

      userRecommendations.push(rec);
      this.recommendations.push(rec);
    }

    return userRecommendations;
  }

  public recordFeedback(
    userId: string,
    itemId: string,
    feedbackType: string,
    rating?: number,
    comment?: string
  ): UserFeedback {
    const fb: UserFeedback = {
      id: `fb_${++this.counter}_${Date.now()}`,
      userId,
      itemId,
      itemType: 'recommendation',
      feedbackType: feedbackType as any,
      rating,
      comment,
      context: { source: 'recommendation_system' },
      timestamp: new Date().toISOString()
    };

    this.feedback.push(fb);
    return fb;
  }

  public createAITutor(userId: string): AITutor {
    const tutor: AITutor = {
      id: `tutor_${++this.counter}_${Date.now()}`,
      userId,
      learningStyle: ['visual', 'auditory', 'kinesthetic'][Math.floor(Math.random() * 3)] as any,
      pacePreference: ['slow', 'moderate', 'fast'][Math.floor(Math.random() * 3)] as any,
      strengths: ['Communication', 'Problem Solving', 'Creativity'],
      weaknesses: ['Time Management'],
      recommendedCourses: [
        { courseId: 'course_1', relevanceScore: 0.92, difficulty: 'intermediate' },
        { courseId: 'course_2', relevanceScore: 0.88, difficulty: 'advanced' }
      ],
      progressMetrics: {
        completionRate: 0.75,
        masteryLevel: 0.82,
        engagementScore: 0.88
      },
      updatedAt: new Date().toISOString()
    };

    this.tutors.set(userId, tutor);
    return tutor;
  }

  public getUserProfile(userId: string): UserProfile | null {
    return this.profiles.get(userId) || null;
  }

  public getUserPreferences(userId: string): UserPreferences | null {
    return this.preferences.get(userId) || null;
  }

  public getBehaviorProfile(userId: string): UserBehaviorProfile | null {
    return this.behaviorProfiles.get(userId) || null;
  }

  public getAITutor(userId: string): AITutor | null {
    return this.tutors.get(userId) || null;
  }

  public getRecommendations(): Recommendation[] {
    return this.recommendations.slice(-50);
  }

  public getFeedback(): UserFeedback[] {
    return this.feedback.slice(-100);
  }

  public updateUserPreference(userId: string, key: string, value: any): void {
    const prefs = this.preferences.get(userId);
    if (prefs) {
      (prefs as any)[key] = value;
      prefs.updatedAt = new Date().toISOString();
    }
  }
}

export const personalizationEngine = PersonalizationEngine.getInstance();
