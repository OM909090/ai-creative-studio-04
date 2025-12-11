import {
  AnalyticsEvent,
  AnalyticsMetric,
  UserBehaviorMetrics,
  AnalyticsReport,
  AnalyticsInsight,
  ChartVisualization
} from '@/types/phase3-analytics';

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private events: AnalyticsEvent[] = [];
  private metrics: AnalyticsMetric[] = [];
  private reports: Map<string, AnalyticsReport> = new Map();
  private insights: AnalyticsInsight[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  public trackEvent(eventData: Omit<AnalyticsEvent, 'id'>): AnalyticsEvent {
    const event: AnalyticsEvent = {
      id: `evt_${++this.counter}_${Date.now()}`,
      ...eventData
    };

    this.events.push(event);
    if (this.events.length > 100000) {
      this.events.shift();
    }

    return event;
  }

  public recordMetric(name: string, value: number, unit: string = ''): AnalyticsMetric {
    const metric: AnalyticsMetric = {
      id: `met_${++this.counter}_${Date.now()}`,
      name,
      type: 'gauge',
      value,
      unit,
      tags: {},
      timestamp: new Date().toISOString(),
      dimensions: {}
    };

    this.metrics.push(metric);
    if (this.metrics.length > 50000) {
      this.metrics.shift();
    }

    return metric;
  }

  public getUserBehaviorMetrics(userId: string): UserBehaviorMetrics {
    const userEvents = this.events.filter(e => e.userId === userId);

    return {
      userId,
      sessionCount: new Set(userEvents.map(e => e.sessionId)).size,
      totalDuration: userEvents.reduce((sum, e) => sum + (e.duration || 0), 0),
      actionCount: userEvents.filter(e => e.eventType === 'user_action').length,
      errorCount: userEvents.filter(e => e.eventType === 'error').length,
      conversionEvents: userEvents
        .filter(e => e.eventType === 'business')
        .map(e => e.properties.conversionType || 'unknown'),
      lastActive: userEvents[userEvents.length - 1]?.timestamp || '',
      deviceInfo: {
        os: 'Unknown',
        browser: 'Unknown',
        deviceType: 'desktop'
      }
    };
  }

  public generateReport(
    reportName: string,
    reportType: 'daily' | 'weekly' | 'monthly',
    startDate: string,
    endDate: string
  ): AnalyticsReport {
    const periodMetrics = this.metrics.filter(m => {
      const mTime = new Date(m.timestamp).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return mTime >= start && mTime <= end;
    });

    const insights = this.generateInsights(reportType, periodMetrics);

    const report: AnalyticsReport = {
      id: `report_${++this.counter}_${Date.now()}`,
      name: reportName,
      type: reportType,
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      metrics: periodMetrics.slice(-20),
      insights,
      recommendations: this.getRecommendations(insights),
      visualization: this.generateVisualizations(periodMetrics)
    };

    this.reports.set(report.id, report);
    return report;
  }

  private generateInsights(
    reportType: string,
    metrics: AnalyticsMetric[]
  ): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    if (metrics.length > 0) {
      const avgValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      const maxValue = Math.max(...metrics.map(m => m.value));
      const change = ((maxValue - avgValue) / avgValue) * 100;

      insights.push({
        id: `insight_${++this.counter}_${Date.now()}`,
        type: 'trend',
        title: 'Performance Trend',
        description: `Metrics show a ${change.toFixed(1)}% change this period`,
        metric: 'average_performance',
        value: avgValue,
        change: change,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  private getRecommendations(insights: AnalyticsInsight[]): string[] {
    const recommendations: string[] = [];

    if (insights.some(i => i.change > 20)) {
      recommendations.push('Performance has improved significantly - maintain current strategies');
    }

    if (insights.some(i => i.change < -20)) {
      recommendations.push('Performance has declined - investigate recent changes');
    }

    recommendations.push('Continue monitoring key metrics for early anomaly detection');

    return recommendations;
  }

  private generateVisualizations(metrics: AnalyticsMetric[]): ChartVisualization[] {
    const grouped = new Map<string, AnalyticsMetric[]>();

    metrics.forEach(m => {
      if (!grouped.has(m.name)) {
        grouped.set(m.name, []);
      }
      grouped.get(m.name)!.push(m);
    });

    const visualizations: ChartVisualization[] = [];

    grouped.forEach((metricGroup, metricName) => {
      visualizations.push({
        id: `viz_${++this.counter}_${Date.now()}`,
        type: 'line',
        title: `${metricName} Trend`,
        metric: metricName,
        timeGranularity: 'hour',
        data: metricGroup.map((m, idx) => ({
          label: new Date(m.timestamp).toLocaleTimeString(),
          value: m.value,
          metadata: { unit: m.unit }
        })),
        config: { stacked: false }
      });
    });

    return visualizations;
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events.slice(-100);
  }

  public getMetrics(): AnalyticsMetric[] {
    return this.metrics.slice(-50);
  }

  public getReports(): AnalyticsReport[] {
    return Array.from(this.reports.values());
  }
}

export const analyticsEngine = AnalyticsEngine.getInstance();
