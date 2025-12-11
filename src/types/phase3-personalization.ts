export type RecommendationType = 'content' | 'feature' | 'action' | 'learning' | 'workflow';
export type FeedbackType = 'like' | 'dislike' | 'useful' | 'not_useful' | 'accurate' | 'inaccurate' | 'rating';
export type PersonalizationStrategy = 'collaborative' | 'content-based' | 'hybrid' | 'context-aware';

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    enabled: boolean;
    channels: string[];
    frequency: string;
  };
  privacy: {
    dataCollection: boolean;
    analyticsTracking: boolean;
    personalizedRecommendations: boolean;
  };
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    fontSize: 'small' | 'medium' | 'large';
    reduceMotion: boolean;
  };
  customSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserInterests {
  id: string;
  userId: string;
  interests: Array<{
    topic: string;
    weight: number;
    frequency: number;
    lastInteractionTime: string;
  }>;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    endorsements: number;
  }>;
  goals: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    targetDate?: string;
    progress: number;
  }>;
  updatedAt: string;
}

export interface UserBehaviorProfile {
  id: string;
  userId: string;
  actionFrequency: Record<string, number>;
  preferredFeatures: string[];
  workingHours: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  activityPattern: {
    peakHours: number[];
    peakDays: string[];
    averageSessionDuration: number;
  };
  devicePreferences: Array<{
    deviceType: string;
    preferenceScore: number;
  }>;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    metadata: Record<string, any>;
  };
  score: number;
  confidence: number;
  reason: string;
  algorithm: string;
  createdAt: string;
  expiresAt: string;
  interacted: boolean;
  feedback?: FeedbackType;
}

export interface RecommendationModel {
  id: string;
  name: string;
  type: PersonalizationStrategy;
  algorithm: string;
  version: string;
  accuracy: number;
  coverageRate: number;
  diversityScore: number;
  popularity: number;
  trainedAt: string;
  features: Array<{
    name: string;
    importance: number;
    type: string;
  }>;
}

export interface UserFeedback {
  id: string;
  userId: string;
  itemId: string;
  itemType: string;
  feedbackType: FeedbackType;
  rating?: number;
  comment?: string;
  context: Record<string, any>;
  timestamp: string;
}

export interface FeedbackAnalysis {
  id: string;
  itemId: string;
  averageRating: number;
  totalFeedback: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  themes: Array<{
    theme: string;
    frequency: number;
    sentiment: string;
  }>;
  updatedAt: string;
}

export interface PersonalizationSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  interactions: Array<{
    type: string;
    item: string;
    timestamp: string;
    duration: number;
  }>;
  contextData: {
    location?: string;
    device: string;
    weather?: string;
    timeOfDay: string;
  };
  personalizedContent: Recommendation[];
}

export interface ContentAffinityScore {
  userId: string;
  contentId: string;
  contentType: string;
  score: number;
  factors: Record<string, number>;
  timestamp: string;
}

export interface UserCohort {
  id: string;
  name: string;
  description: string;
  size: number;
  characteristics: Array<{
    trait: string;
    value: string;
    percentage: number;
  }>;
  averageBehavior: Record<string, number>;
  createdAt: string;
}

export interface PersonalizationConfig {
  id: string;
  userId: string;
  enabled: boolean;
  strategy: PersonalizationStrategy;
  updateFrequency: number;
  minConfidenceThreshold: number;
  diversityWeight: number;
  noveltyWeight: number;
  popularityWeight: number;
  explorationRate: number;
  exploitationRate: number;
  contextAwareness: boolean;
}

export interface AITutor {
  id: string;
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  pacePreference: 'slow' | 'moderate' | 'fast';
  strengths: string[];
  weaknesses: string[];
  recommendedCourses: Array<{
    courseId: string;
    relevanceScore: number;
    difficulty: string;
  }>;
  progressMetrics: {
    completionRate: number;
    masteryLevel: number;
    engagementScore: number;
  };
  nextLessonRecommendation?: {
    lessonId: string;
    estimatedDuration: number;
    difficulty: string;
  };
  updatedAt: string;
}
