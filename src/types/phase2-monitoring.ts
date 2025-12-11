export type MetricType = 'counter' | 'gauge' | 'histogram' | 'rate';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

export interface SystemMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkBandwidth: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface PerformanceTimeseries {
  metricName: string;
  dataPoints: {
    timestamp: string;
    value: number;
  }[];
  aggregation: 'raw' | 'avg' | 'max' | 'min' | 'sum';
  period: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '==' | '>=' | '<=';
  duration: number;
  severity: AlertSeverity;
  enabled: boolean;
  actions: AlertAction[];
  createdAt: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface AlertAction {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'log';
  target: string;
  template: string;
  enabled: boolean;
}

export interface HealthCheck {
  id: string;
  name: string;
  component: string;
  status: HealthStatus;
  statusCode?: number;
  responseTime: number;
  lastCheckedAt: string;
  nextCheckAt: string;
  details: Record<string, any>;
}

export interface ComponentHealth {
  componentName: string;
  status: HealthStatus;
  uptime: number;
  lastFailure?: string;
  failureCount: number;
  checks: HealthCheck[];
  dependencies: {
    name: string;
    status: HealthStatus;
  }[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'log';
  title: string;
  metric: string;
  refreshInterval: number;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TraceData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  duration: number;
  status: 'success' | 'error' | 'cancelled';
  tags: Record<string, string>;
  logs: TraceLog[];
  metadata: Record<string, any>;
}

export interface TraceLog {
  timestamp: number;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  fields: Record<string, any>;
}

export interface UserBehaviorMetrics {
  userId: string;
  activeSessionCount: number;
  totalInteractions: number;
  averageSessionDuration: number;
  commandSuccessRate: number;
  errorEncounterRate: number;
  avgCommandExecutionTime: number;
  mostUsedFeatures: string[];
  peakActivityTime: string;
  lastActivityAt: string;
}

export interface ResourceUtilization {
  timestamp: string;
  cpuCores: CPUCore[];
  memoryPages: MemoryPage[];
  diskPartitions: DiskPartition[];
  networkInterfaces: NetworkInterface[];
}

export interface CPUCore {
  coreId: number;
  usage: number;
  temperature?: number;
  frequency?: number;
}

export interface MemoryPage {
  type: 'physical' | 'virtual' | 'cache';
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface DiskPartition {
  device: string;
  mountPoint: string;
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface NetworkInterface {
  name: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errors: number;
  dropped: number;
}

export interface AnomalyDetection {
  id: string;
  metric: string;
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
  expectedRange: {
    min: number;
    max: number;
  };
  actualValue: number;
  timestamp: string;
  context: Record<string, any>;
}

export interface RealTimeAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  expiresAt: string;
  dismissible: boolean;
  actionUrl?: string;
}

export interface MetricsAggregation {
  period: string;
  startTime: string;
  endTime: string;
  metrics: {
    name: string;
    avg: number;
    max: number;
    min: number;
    sum: number;
    count: number;
    stdDev: number;
  }[];
}

export interface PerformanceReport {
  id: string;
  generatedAt: string;
  period: {
    startTime: string;
    endTime: string;
  };
  summary: {
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  topSlowOperations: {
    name: string;
    avgDuration: number;
    callCount: number;
  }[];
  alerts: Alert[];
  recommendations: string[];
}
