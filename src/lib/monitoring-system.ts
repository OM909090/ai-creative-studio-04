import {
  SystemMetrics,
  PerformanceMetric,
  AlertRule,
  Alert,
  HealthCheck,
  ComponentHealth,
  TraceData,
  UserBehaviorMetrics,
  ResourceUtilization,
  AnomalyDetection,
  RealTimeAlert,
  PerformanceReport,
  MetricType,
  AlertSeverity,
  HealthStatus
} from '@/types/phase2-monitoring';

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private traces: TraceData[] = [];
  private realTimeAlerts: RealTimeAlert[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  public recordMetric(
    name: string,
    value: number,
    type: MetricType = 'gauge',
    unit: string = ''
  ): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: `met_${++this.counter}_${Date.now()}`,
      name,
      type,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags: {},
      metadata: {}
    };

    this.metrics.push(metric);
    if (this.metrics.length > 10000) {
      this.metrics.shift();
    }

    this.checkAlertRules(metric);
    return metric;
  }

  public createAlertRule(
    name: string,
    metric: string,
    threshold: number,
    operator: '>' | '<' | '==' | '>=' | '<=',
    severity: AlertSeverity = 'warning',
    durationSeconds: number = 60
  ): AlertRule {
    const rule: AlertRule = {
      id: `rule_${++this.counter}_${Date.now()}`,
      name,
      description: `Alert when ${metric} ${operator} ${threshold}`,
      metric,
      threshold,
      operator,
      duration: durationSeconds,
      severity,
      enabled: true,
      actions: [],
      createdAt: new Date().toISOString()
    };

    this.alertRules.push(rule);
    return rule;
  }

  private checkAlertRules(metric: PerformanceMetric): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled || rule.metric !== metric.name) return;

      const shouldAlert = this.evaluateCondition(
        metric.value,
        rule.threshold,
        rule.operator
      );

      if (shouldAlert) {
        const existingAlert = this.alerts.find(
          a => a.ruleId === rule.id && a.status === 'active'
        );

        if (!existingAlert) {
          const alert: Alert = {
            id: `alert_${++this.counter}_${Date.now()}`,
            ruleId: rule.id,
            severity: rule.severity,
            title: rule.name,
            message: `${rule.name}: ${metric.value} ${rule.operator} ${rule.threshold}`,
            metric: metric.name,
            currentValue: metric.value,
            threshold: rule.threshold,
            triggeredAt: new Date().toISOString(),
            status: 'active'
          };

          this.alerts.push(alert);
          this.createRealTimeAlert(alert);
        }
      }
    });
  }

  private evaluateCondition(
    value: number,
    threshold: number,
    operator: '>' | '<' | '==' | '>=' | '<='
  ): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value === threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  private createRealTimeAlert(alert: Alert): void {
    const rtAlert: RealTimeAlert = {
      id: `rta_${++this.counter}_${Date.now()}`,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      dismissible: true
    };

    this.realTimeAlerts.push(rtAlert);
    if (this.realTimeAlerts.length > 100) {
      this.realTimeAlerts.shift();
    }
  }

  public registerHealthCheck(
    componentName: string,
    endpoint: string
  ): HealthCheck {
    const check: HealthCheck = {
      id: `hc_${++this.counter}_${Date.now()}`,
      name: componentName,
      component: componentName,
      status: 'healthy',
      responseTime: 0,
      lastCheckedAt: new Date().toISOString(),
      nextCheckAt: new Date(Date.now() + 60000).toISOString(),
      details: { endpoint }
    };

    this.healthChecks.set(componentName, check);
    return check;
  }

  public updateHealthCheck(
    componentName: string,
    status: HealthStatus,
    responseTime: number
  ): boolean {
    const check = this.healthChecks.get(componentName);
    if (!check) return false;

    check.status = status;
    check.responseTime = responseTime;
    check.lastCheckedAt = new Date().toISOString();
    check.nextCheckAt = new Date(Date.now() + 60000).toISOString();

    if (status === 'unhealthy' || status === 'offline') {
      this.createComponentAlert(componentName, status);
    }

    return true;
  }

  private createComponentAlert(componentName: string, status: HealthStatus): void {
    const alert: Alert = {
      id: `alert_${++this.counter}_${Date.now()}`,
      ruleId: '',
      severity: status === 'offline' ? 'critical' : 'warning',
      title: `Component Health: ${componentName}`,
      message: `${componentName} is ${status}`,
      metric: 'component_health',
      currentValue: status === 'offline' ? 0 : 50,
      threshold: 100,
      triggeredAt: new Date().toISOString(),
      status: 'active'
    };

    this.alerts.push(alert);
  }

  public recordTrace(
    operationName: string,
    duration: number,
    status: 'success' | 'error' | 'cancelled' = 'success'
  ): TraceData {
    const trace: TraceData = {
      traceId: `trace_${++this.counter}_${Date.now()}`,
      spanId: `span_${++this.counter}`,
      operationName,
      startTime: Date.now() - duration,
      duration,
      status,
      tags: { operation: operationName },
      logs: [],
      metadata: {}
    };

    this.traces.push(trace);
    if (this.traces.length > 10000) {
      this.traces.shift();
    }

    return trace;
  }

  public getSystemMetrics(): SystemMetrics {
    return {
      timestamp: new Date().toISOString(),
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkBandwidth: Math.random() * 1000,
      requestsPerSecond: Math.random() * 500 + 100,
      averageResponseTime: Math.random() * 5000 + 100,
      errorRate: Math.random() * 5,
      uptime: Math.random() * 1000000000
    };
  }

  public getComponentHealth(componentName: string): ComponentHealth | null {
    const check = this.healthChecks.get(componentName);
    if (!check) return null;

    return {
      componentName,
      status: check.status,
      uptime: Math.random() * 100,
      lastFailure: check.status !== 'healthy' ? new Date().toISOString() : undefined,
      failureCount: Math.floor(Math.random() * 10),
      checks: [check],
      dependencies: [
        { name: 'database', status: 'healthy' },
        { name: 'cache', status: 'healthy' }
      ]
    };
  }

  public getActiveAlerts(severity?: AlertSeverity): Alert[] {
    let alerts = this.alerts.filter(a => a.status === 'active');
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    return alerts;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    return true;
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    return true;
  }

  public getUserBehaviorMetrics(userId: string): UserBehaviorMetrics {
    return {
      userId,
      activeSessionCount: Math.floor(Math.random() * 10) + 1,
      totalInteractions: Math.floor(Math.random() * 1000) + 100,
      averageSessionDuration: Math.random() * 3600 + 300,
      commandSuccessRate: Math.random() * 0.3 + 0.7,
      errorEncounterRate: Math.random() * 0.2,
      avgCommandExecutionTime: Math.random() * 5000 + 500,
      mostUsedFeatures: ['navigate', 'extract', 'edit'],
      peakActivityTime: `${Math.floor(Math.random() * 24)}:00`,
      lastActivityAt: new Date().toISOString()
    };
  }

  public getResourceUtilization(): ResourceUtilization {
    return {
      timestamp: new Date().toISOString(),
      cpuCores: [
        { coreId: 0, usage: Math.random() * 100, temperature: 45 + Math.random() * 35 },
        { coreId: 1, usage: Math.random() * 100, temperature: 45 + Math.random() * 35 }
      ],
      memoryPages: [
        {
          type: 'physical',
          total: 16000000000,
          used: Math.random() * 16000000000,
          available: Math.random() * 8000000000,
          percentage: Math.random() * 100
        }
      ],
      diskPartitions: [
        {
          device: '/dev/sda1',
          mountPoint: '/',
          total: 1000000000000,
          used: Math.random() * 500000000000,
          available: Math.random() * 500000000000,
          percentage: Math.random() * 100
        }
      ],
      networkInterfaces: [
        {
          name: 'eth0',
          bytesIn: Math.random() * 1000000000,
          bytesOut: Math.random() * 1000000000,
          packetsIn: Math.random() * 1000000,
          packetsOut: Math.random() * 1000000,
          errors: 0,
          dropped: 0
        }
      ]
    };
  }

  public detectAnomalies(): AnomalyDetection[] {
    const recentMetrics = this.metrics.slice(-100);
    const anomalies: AnomalyDetection[] = [];

    const metricsByName = new Map<string, number[]>();
    recentMetrics.forEach(m => {
      const values = metricsByName.get(m.name) || [];
      values.push(m.value);
      metricsByName.set(m.name, values);
    });

    metricsByName.forEach((values, metricName) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
      );

      values.forEach((value, index) => {
        if (Math.abs(value - avg) > stdDev * 2) {
          anomalies.push({
            id: `anom_${++this.counter}_${Date.now()}`,
            metric: metricName,
            anomalyScore: Math.min(1, Math.abs(value - avg) / (stdDev * 3)),
            threshold: stdDev * 2,
            isAnomaly: true,
            expectedRange: { min: avg - stdDev * 2, max: avg + stdDev * 2 },
            actualValue: value,
            timestamp: new Date().toISOString(),
            context: { index }
          });
        }
      });
    });

    return anomalies;
  }

  public generatePerformanceReport(hours: number = 24): PerformanceReport {
    const now = Date.now();
    const startTime = new Date(now - hours * 60 * 60 * 1000).toISOString();
    const endTime = new Date(now).toISOString();

    const recentMetrics = this.metrics.filter(m => {
      const metricTime = new Date(m.timestamp).getTime();
      return metricTime >= now - hours * 60 * 60 * 1000;
    });

    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics
          .filter(m => m.name.includes('response'))
          .reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
      : 0;

    return {
      id: `report_${++this.counter}_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: { startTime, endTime },
      summary: {
        uptime: 99.9,
        avgResponseTime,
        errorRate: Math.random() * 0.5,
        throughput: Math.random() * 10000 + 1000
      },
      topSlowOperations: [
        { name: 'database_query', avgDuration: 2500, callCount: 150 },
        { name: 'api_request', avgDuration: 1800, callCount: 300 }
      ],
      alerts: this.alerts.slice(-10),
      recommendations: [
        'Optimize database queries for faster response',
        'Increase cache hit rate',
        'Monitor error rate trends'
      ]
    };
  }

  public clearOldMetrics(hoursToKeep: number = 24): number {
    const cutoffTime = Date.now() - hoursToKeep * 60 * 60 * 1000;
    const initialLength = this.metrics.length;

    this.metrics = this.metrics.filter(m => {
      return new Date(m.timestamp).getTime() > cutoffTime;
    });

    return initialLength - this.metrics.length;
  }

  public getMetricsCount(): number {
    return this.metrics.length;
  }

  public getAlertsCount(): number {
    return this.alerts.filter(a => a.status === 'active').length;
  }

  public getRealTimeAlerts(limit: number = 20): RealTimeAlert[] {
    return this.realTimeAlerts.slice(-limit);
  }
}

export const monitoringSystem = MonitoringSystem.getInstance();
