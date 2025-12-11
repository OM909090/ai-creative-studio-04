export type AnalyticsEventType = 'page_view' | 'user_action' | 'error' | 'performance' | 'business' | 'custom';
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'distribution';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  userId: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: string;
  duration?: number;
  errorInfo?: {
    message: string;
    stack: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: string;
  dimensions: Record<string, string>;
}

export interface UserBehaviorMetrics {
  userId: string;
  sessionCount: number;
  totalDuration: number;
  actionCount: number;
  errorCount: number;
  conversionEvents: string[];
  lastActive: string;
  deviceInfo: {
    os: string;
    browser: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  timestamp: string;
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  steps: {
    name: string;
    eventType: string;
    userCount: number;
    conversionRate: number;
  }[];
  totalUsers: number;
  conversionRate: number;
  dropoffPoints: { step: string; percentage: number }[];
  timeRange: { start: string; end: string };
}

export interface CohortAnalysis {
  id: string;
  name: string;
  cohortType: 'acquisition' | 'behavioral' | 'demographic';
  members: string[];
  metrics: {
    retention: number[];
    churn: number[];
    lifetimeValue: number;
    avgSessionDuration: number;
  };
  createdAt: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  generatedAt: string;
  period: { start: string; end: string };
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  recommendations: string[];
  visualization: ChartVisualization[];
}

export interface AnalyticsInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  metric: string;
  value: number;
  change: number;
  confidence: number;
  timestamp: string;
}

export interface ChartVisualization {
  id: string;
  type: ChartType;
  title: string;
  metric: string;
  timeGranularity: TimeGranularity;
  data: Array<{ label: string; value: number; metadata?: any }>;
  config: Record<string, any>;
}

export interface PredictionModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'timeseries';
  metric: string;
  accuracy: number;
  trainedAt: string;
  predictions: {
    timestamp: string;
    predicted: number;
    actual?: number;
    confidence: number;
  }[];
}

export interface AnalyticsSegment {
  id: string;
  name: string;
  filters: {
    property: string;
    operator: '=' | '!=' | '>' | '<' | 'contains' | 'not_contains';
    value: any;
  }[];
  userCount: number;
  metrics: Record<string, number>;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'trend';
  title: string;
  metric: string;
  timeRange: TimeGranularity;
  refreshInterval: number;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  sharingSettings: {
    viewers: string[];
    editors: string[];
  };
}
