import {
  LearningProfile,
  BehaviorModel,
  BehaviorPattern,
  PatternOccurrence,
  UserBehavior,
  PersonalizationProfile,
  PersonalizedPreference,
  LearningAnalytics,
  PatternInsight,
  AdaptationResult,
  LearningMetrics,
  BehaviorAnalysis,
  BehaviorAnomaly,
  LearningModel,
  AdaptationStrategy
} from '@/types/phase2-learning';

export class LearningEngine {
  private static instance: LearningEngine;
  private learningProfiles: Map<string, LearningProfile> = new Map();
  private behaviorHistory: Map<string, UserBehavior[]> = new Map();
  private personalizationProfiles: Map<string, PersonalizationProfile> = new Map();
  private patternInsights: Map<string, PatternInsight[]> = new Map();
  private anomalyHistory: Map<string, BehaviorAnomaly[]> = new Map();
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  public createLearningProfile(
    userId: string,
    strategy: AdaptationStrategy = 'moderate'
  ): LearningProfile {
    const profile: LearningProfile = {
      id: `lp_${++this.counter}_${Date.now()}`,
      userId,
      models: [],
      adaptationStrategy: strategy,
      confidenceThreshold: 0.7,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      version: 1
    };

    this.learningProfiles.set(profile.id, profile);
    this.behaviorHistory.set(userId, []);
    return profile;
  }

  public recordBehavior(behavior: UserBehavior): void {
    const history = this.behaviorHistory.get(behavior.userId) || [];
    history.push(behavior);
    this.behaviorHistory.set(behavior.userId, history);

    this.updatePatterns(behavior.userId);
  }

  private updatePatterns(userId: string): void {
    const history = this.behaviorHistory.get(userId) || [];
    const profile = Array.from(this.learningProfiles.values())
      .find(p => p.userId === userId);
    
    if (!profile) return;

    const models = profile.models;
    for (const model of models) {
      if (model.type === 'behavior') {
        this.analyzePatterns(userId, model, history);
      }
    }
  }

  private analyzePatterns(
    userId: string,
    model: BehaviorModel,
    history: UserBehavior[]
  ): void {
    const actionGroups = new Map<string, UserBehavior[]>();
    
    history.forEach(behavior => {
      const group = actionGroups.get(behavior.action) || [];
      group.push(behavior);
      actionGroups.set(behavior.action, group);
    });

    actionGroups.forEach((behaviors, action) => {
      const existingPattern = model.patterns.find(p => p.pattern === action);
      
      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.occurrences.push({
          timestamp: new Date().toISOString(),
          context: behaviors[0].metadata,
          outcome: behaviors[0].result,
          confidence: Math.min(0.95, existingPattern.confidence + 0.05)
        });
      } else {
        const pattern: BehaviorPattern = {
          id: `pat_${++this.counter}_${Date.now()}`,
          pattern: action,
          frequency: behaviors.length,
          occurrences: behaviors.map(b => ({
            timestamp: b.timestamp,
            context: b.metadata,
            outcome: b.result,
            confidence: 0.6
          })),
          associatedOutcomes: [...new Set(behaviors.map(b => b.result))],
          confidence: 0.6,
          context: {}
        };
        model.patterns.push(pattern);
      }
    });

    model.trainingDataSize = history.length;
    model.lastTrainedAt = new Date().toISOString();
  }

  public createPersonalizationProfile(userId: string): PersonalizationProfile {
    const profile: PersonalizationProfile = {
      id: `pp_${++this.counter}_${Date.now()}`,
      userId,
      preferences: [],
      recommendations: [],
      adaptations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.personalizationProfiles.set(profile.id, profile);
    return profile;
  }

  public addPreference(
    profileId: string,
    preference: PersonalizedPreference
  ): boolean {
    const profile = this.personalizationProfiles.get(profileId);
    if (!profile) return false;

    const existing = profile.preferences.find(p => p.category === preference.category);
    if (existing) {
      Object.assign(existing, preference);
    } else {
      profile.preferences.push(preference);
    }

    profile.updatedAt = new Date().toISOString();
    return true;
  }

  public analyzeBehavior(userId: string): BehaviorAnalysis {
    const history = this.behaviorHistory.get(userId) || [];
    const patterns = this.identifyPatterns(userId, history);
    const anomalies = this.detectAnomalies(userId, history, patterns);

    return {
      userId,
      analyzedAt: new Date().toISOString(),
      totalEvents: history.length,
      uniquePatterns: patterns.size,
      mostFrequentPattern: Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
      patterns: Array.from(patterns.entries()).map(([pattern, frequency]) => ({
        pattern,
        frequency,
        confidence: Math.min(0.95, 0.5 + frequency * 0.01),
        trend: frequency > history.length * 0.3 ? 'increasing' : 
               frequency > history.length * 0.1 ? 'stable' : 'decreasing'
      })),
      anomalies
    };
  }

  private identifyPatterns(
    userId: string,
    history: UserBehavior[]
  ): Map<string, number> {
    const patterns = new Map<string, number>();

    history.forEach(behavior => {
      const count = patterns.get(behavior.action) || 0;
      patterns.set(behavior.action, count + 1);
    });

    return patterns;
  }

  private detectAnomalies(
    userId: string,
    history: UserBehavior[],
    patterns: Map<string, number>
  ): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];
    const existingAnomalies = this.anomalyHistory.get(userId) || [];

    const totalEvents = history.length;
    const avgFrequency = totalEvents / patterns.size;

    patterns.forEach((frequency, action) => {
      const deviation = Math.abs(frequency - avgFrequency);
      const stdDev = Math.sqrt(
        Array.from(patterns.values()).reduce((sum, f) => 
          sum + Math.pow(f - avgFrequency, 2), 0) / patterns.size
      );

      if (deviation > stdDev * 2) {
        const anomaly: BehaviorAnomaly = {
          id: `anom_${++this.counter}_${Date.now()}`,
          type: frequency > avgFrequency ? 'spike' : 'drop',
          severity: Math.abs(deviation) > stdDev * 3 ? 'critical' : 'high',
          description: `${action} occurred ${frequency} times (avg: ${avgFrequency.toFixed(1)})`,
          detectedAt: new Date().toISOString(),
          context: { action, frequency, avgFrequency, stdDev }
        };

        anomalies.push(anomaly);
      }
    });

    this.anomalyHistory.set(userId, [...existingAnomalies, ...anomalies]);
    return anomalies;
  }

  public generateInsights(userId: string): PatternInsight[] {
    const history = this.behaviorHistory.get(userId) || [];
    const patterns = this.identifyPatterns(userId, history);
    const insights: PatternInsight[] = [];

    patterns.forEach((frequency, pattern) => {
      if (frequency > history.length * 0.1) {
        const insight: PatternInsight = {
          id: `ins_${++this.counter}_${Date.now()}`,
          userId,
          pattern,
          insight: `User frequently performs "${pattern}" action (${frequency} times)`,
          relatedBehaviors: this.findRelatedBehaviors(userId, pattern),
          confidence: Math.min(0.95, 0.5 + frequency * 0.01),
          suggestedActions: this.generateSuggestedActions(pattern),
          discoveredAt: new Date().toISOString()
        };
        insights.push(insight);
      }
    });

    this.patternInsights.set(userId, insights);
    return insights;
  }

  private findRelatedBehaviors(userId: string, pattern: string): string[] {
    const history = this.behaviorHistory.get(userId) || [];
    const relatedSet = new Set<string>();

    history.forEach((behavior, index) => {
      if (behavior.action === pattern && index < history.length - 1) {
        relatedSet.add(history[index + 1].action);
      }
    });

    return Array.from(relatedSet);
  }

  private generateSuggestedActions(pattern: string): string[] {
    const suggestions: Record<string, string[]> = {
      'navigate': ['suggest_related_pages', 'prefetch_content'],
      'data_extract': ['cache_results', 'suggest_related_extractions'],
      'form_submit': ['remember_values', 'suggest_similar_forms'],
      'search': ['suggest_refinements', 'cache_results'],
      'edit': ['autosave', 'suggest_templates']
    };

    return suggestions[pattern] || ['optimize_performance'];
  }

  public calculateLearningMetrics(userId: string): LearningMetrics {
    const profile = Array.from(this.learningProfiles.values())
      .find(p => p.userId === userId);
    
    if (!profile) {
      return {
        modelAccuracy: 0,
        predictionSuccess: 0,
        userSatisfaction: 0,
        adaptationEffectiveness: 0,
        trainingProgress: 0,
        convergenceRate: 0
      };
    }

    const totalPatterns = profile.models.reduce((sum, m) => sum + m.patterns.length, 0);
    const confidenceScores = profile.models
      .flatMap(m => m.patterns.map(p => p.confidence));
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0;

    return {
      modelAccuracy: avgConfidence,
      predictionSuccess: Math.min(0.95, avgConfidence * 0.9),
      userSatisfaction: 0.75,
      adaptationEffectiveness: Math.min(0.9, avgConfidence * 0.85),
      trainingProgress: Math.min(1, totalPatterns / 50),
      convergenceRate: 0.85
    };
  }

  public getAnalytics(userId: string): LearningAnalytics {
    const history = this.behaviorHistory.get(userId) || [];
    const patterns = this.identifyPatterns(userId, history);

    return {
      userId,
      totalPatterns: patterns.size,
      recognizedPatterns: Array.from(patterns.values()).filter(f => f > 2).length,
      patternAccuracy: 0.82,
      mostCommonActions: Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]),
      preferredChannels: ['browser', 'api'],
      peakActivityTimes: this.calculatePeakTimes(history),
      averageSessionDuration: this.calculateAvgSessionDuration(history),
      learningProgress: Math.min(1, patterns.size / 20),
      lastAnalyzedAt: new Date().toISOString()
    };
  }

  private calculatePeakTimes(history: UserBehavior[]): string[] {
    const hours = new Map<number, number>();
    
    history.forEach(behavior => {
      const hour = new Date(behavior.timestamp).getHours();
      hours.set(hour, (hours.get(hour) || 0) + 1);
    });

    return Array.from(hours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => `${e[0]}:00-${e[0] + 1}:00`);
  }

  private calculateAvgSessionDuration(history: UserBehavior[]): number {
    if (history.length === 0) return 0;
    
    const totalDuration = history.reduce((sum, b) => sum + b.duration, 0);
    return totalDuration / history.length;
  }

  public getPersonalizationLevel(userId: string): {
    level: 'minimal' | 'moderate' | 'high' | 'maximum';
    confidence: number;
    appliedAdaptations: number;
  } {
    const profile = this.personalizationProfiles.get(
      Array.from(this.personalizationProfiles.values())
        .find(p => p.userId === userId)?.id || ''
    );

    if (!profile) {
      return { level: 'minimal', confidence: 0, appliedAdaptations: 0 };
    }

    const adaptationCount = profile.adaptations.length;
    let level: 'minimal' | 'moderate' | 'high' | 'maximum';
    
    if (adaptationCount === 0) level = 'minimal';
    else if (adaptationCount < 5) level = 'moderate';
    else if (adaptationCount < 15) level = 'high';
    else level = 'maximum';

    return {
      level,
      confidence: Math.min(0.95, 0.6 + adaptationCount * 0.05),
      appliedAdaptations: adaptationCount
    };
  }
}

export const learningEngine = LearningEngine.getInstance();
