export type LearningModel = 'behavior' | 'preference' | 'pattern' | 'context';
export type AdaptationStrategy = 'aggressive' | 'moderate' | 'conservative' | 'disabled';

export interface LearningProfile {
  id: string;
  userId: string;
  models: BehaviorModel[];
  adaptationStrategy: AdaptationStrategy;
  confidenceThreshold: number;
  createdAt: string;
  lastUpdatedAt: string;
  version: number;
}

export interface BehaviorModel {
  id: string;
  type: LearningModel;
  userId: string;
  patterns: BehaviorPattern[];
  confidence: number;
  accuracy: number;
  trainingDataSize: number;
  lastTrainedAt: string;
}

export interface BehaviorPattern {
  id: string;
  pattern: string;
  frequency: number;
  occurrences: PatternOccurrence[];
  associatedOutcomes: string[];
  confidence: number;
  context: Record<string, any>;
}

export interface PatternOccurrence {
  timestamp: string;
  context: Record<string, any>;
  outcome: string;
  confidence: number;
}

export interface UserBehavior {
  userId: string;
  action: string;
  parameters: Record<string, any>;
  result: string;
  duration: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface PersonalizationProfile {
  id: string;
  userId: string;
  preferences: PersonalizedPreference[];
  recommendations: PersonalizationRecommendation[];
  adaptations: SystemAdaptation[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizedPreference {
  id: string;
  category: string;
  preference: string;
  weight: number;
  confidence: number;
  learnedFrom: string[];
  appliesTo: string[];
}

export interface PersonalizationRecommendation {
  id: string;
  type: string;
  content: string;
  reason: string;
  confidence: number;
  targetUser: string;
  expiresAt: string;
}

export interface SystemAdaptation {
  id: string;
  adaptationType: string;
  currentValue: any;
  recommendedValue: any;
  reason: string;
  confidence: number;
  autoApply: boolean;
  appliedAt?: string;
}

export interface LearningAnalytics {
  userId: string;
  totalPatterns: number;
  recognizedPatterns: number;
  patternAccuracy: number;
  mostCommonActions: string[];
  preferredChannels: string[];
  peakActivityTimes: string[];
  averageSessionDuration: number;
  learningProgress: number;
  lastAnalyzedAt: string;
}

export interface PatternInsight {
  id: string;
  userId: string;
  pattern: string;
  insight: string;
  relatedBehaviors: string[];
  confidence: number;
  suggestedActions: string[];
  discoveredAt: string;
}

export interface AdaptationResult {
  adaptationId: string;
  applied: boolean;
  result: string;
  impact: {
    performanceChange: number;
    userSatisfactionChange: number;
    resourceUsageChange: number;
  };
  feedback: string;
  timestamp: string;
}

export interface LearningMetrics {
  modelAccuracy: number;
  predictionSuccess: number;
  userSatisfaction: number;
  adaptationEffectiveness: number;
  trainingProgress: number;
  convergenceRate: number;
}

export interface BehaviorAnalysis {
  userId: string;
  analyzedAt: string;
  totalEvents: number;
  uniquePatterns: number;
  mostFrequentPattern: string;
  patterns: {
    pattern: string;
    frequency: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  anomalies: BehaviorAnomaly[];
}

export interface BehaviorAnomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  context: Record<string, any>;
}

export interface AdaptiveResponse {
  responseId: string;
  userId: string;
  personalizationApplied: boolean;
  adaptations: {
    category: string;
    adjustment: string;
    reason: string;
  }[];
  userFeedback?: string;
  timestamp: string;
}
