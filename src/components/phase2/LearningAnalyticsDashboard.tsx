import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Target, RefreshCw, BarChart3 } from 'lucide-react';
import { learningEngine } from '@/lib/learning-engine';

export function LearningAnalyticsDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const userId = 'demo-user';

  useEffect(() => {
    const refresh = () => {
      const profiles = Array.from({ length: 1 }).map(() => 
        learningEngine.createLearningProfile(userId, 'moderate')
      );
      if (profiles.length > 0) setProfile(profiles[0]);

      const analysis = learningEngine.analyzeBehavior(userId);
      setAnalytics(analysis);

      const generatedInsights = learningEngine.generateInsights(userId);
      setInsights(generatedInsights);

      const learningMetrics = learningEngine.calculateLearningMetrics(userId);
      setMetrics(learningMetrics);
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'conservative': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity > 0.7) return 'text-red-600';
    if (severity > 0.4) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Learning Analytics Dashboard
              </CardTitle>
              <CardDescription>Behavioral patterns, insights, and performance metrics</CardDescription>
            </div>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Model Accuracy</p>
                <p className="text-2xl font-bold">{(metrics.modelAccuracy * 100).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{metrics.totalEvents || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Patterns Detected</p>
                <p className="text-2xl font-bold">{metrics.patternCount || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Adaptation Score</p>
                <p className="text-2xl font-bold">{(metrics.adaptationScore * 100).toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Adaptation Strategy</span>
                  <Badge className={getStrategyColor(profile.adaptationStrategy)}>
                    {profile.adaptationStrategy}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Confidence Threshold</span>
                  <span className="text-sm font-semibold">{(profile.confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Models</span>
                  <span className="text-sm font-semibold">{profile.models.length}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Behavior Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Action Frequency</span>
                    <span className="font-semibold">{analytics.totalEvents || 0} events</span>
                  </div>
                  <Progress value={Math.min(100, ((analytics.totalEvents || 0) / 1000) * 100)} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span className="font-semibold">{((analytics.successRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(analytics.successRate || 0) * 100} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No insights generated yet. Record more behavior to generate patterns.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {insights.slice(0, 10).map((insight: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{insight.title || `Insight ${idx + 1}`}</p>
                          <p className="text-sm text-gray-600 mt-1">{insight.description || 'Pattern detected in user behavior'}</p>
                        </div>
                        <Badge variant="outline">{insight.type || 'behavior'}</Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confidence: {((insight.confidence || 0.5) * 100).toFixed(0)}%</span>
                        <span>Impact: {insight.impact || 'medium'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detected Patterns</CardTitle>
              <CardDescription>Behavioral patterns and anomalies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <p className="font-semibold text-sm">Peak Activity Times</p>
                  <p className="text-xs text-gray-600">Detected high engagement hours</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">3-4 patterns</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <p className="font-semibold text-sm">Feature Usage Patterns</p>
                  <p className="text-xs text-gray-600">Most used features identified</p>
                </div>
                <span className="text-sm font-semibold text-green-600">8-10 patterns</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <div>
                  <p className="font-semibold text-sm">Error Frequency</p>
                  <p className="text-xs text-gray-600">Anomalies and edge cases</p>
                </div>
                <span className="text-sm font-semibold text-orange-600">2 anomalies</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-3">
          {metrics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Model Accuracy</span>
                    <span className="font-semibold">{(metrics.modelAccuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adaptation Score</span>
                    <span className="font-semibold">{(metrics.adaptationScore * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Learning Velocity</span>
                    <span className="font-semibold">{metrics.learningVelocity?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pattern Density</span>
                    <span className="font-semibold">{metrics.patternDensity?.toFixed(3) || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
