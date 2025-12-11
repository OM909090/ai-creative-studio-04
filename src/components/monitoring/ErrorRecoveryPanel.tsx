import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { errorRecoveryService } from '@/lib/error-recovery';

export function ErrorRecoveryPanel() {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const refresh = () => {
      setErrorLogs(errorRecoveryService.getErrorLogs({ limit: 20 }));
      setMetrics(errorRecoveryService.getMetrics());
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (errorType: string) => {
    if (errorType.includes('critical') || errorType === 'server_error') {
      return 'bg-red-100 text-red-800';
    }
    if (errorType === 'timeout' || errorType === 'rate_limit') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  const getRecoveryIcon = (strategy: string) => {
    switch (strategy) {
      case 'retry': return '🔄';
      case 'fallback': return '🔁';
      case 'escalate': return '⬆️';
      case 'manual_intervention': return '🛠️';
      default: return '❌';
    }
  };

  const handleResolveError = (errorId: string) => {
    errorRecoveryService.resolveError(errorId, { resolvedBy: 'user', timestamp: new Date() });
    setErrorLogs(errorRecoveryService.getErrorLogs({ limit: 20 }));
    setSelectedError(null);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Recovery & Monitoring
              </CardTitle>
              <CardDescription>Monitor and manage system errors and recovery</CardDescription>
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
                <p className="text-sm text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold">{metrics.totalErrors}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Recovered</p>
                <p className="text-2xl font-bold text-green-600">{metrics.recoveredErrors}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Recovery Rate</p>
                <p className="text-2xl font-bold">{metrics.recoveryRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Recovery Time</p>
                <p className="text-2xl font-bold">{(metrics.averageRecoveryTime / 1000).toFixed(2)}s</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="errors">Active Errors ({errorLogs.length})</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Strategies</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-3">
          {errorLogs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No recent errors detected
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {errorLogs.map(error => (
                <Card
                  key={error.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedError(error)}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-semibold">{error.errorType}</span>
                            <Badge className={getSeverityColor(error.errorType)}>
                              {error.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{error.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {error.recoveryActions && error.recoveryActions.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <p className="font-semibold text-gray-700">Recovery Options:</p>
                          <div className="mt-1 space-y-1">
                            {error.recoveryActions.map((action: any, idx: number) => (
                              <div key={idx} className="text-gray-600">
                                {getRecoveryIcon(action.strategy)} {action.description}
                                {action.executable && (
                                  <span className="text-green-600 ml-1">✓ Available</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveError(error.id)}
                        >
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recovery" className="space-y-3">
          {selectedError && selectedError.recoveryActions ? (
            <div className="space-y-3">
              {selectedError.recoveryActions.map((action: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRecoveryIcon(action.strategy)}</span>
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{action.strategy}</p>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        {action.executable && (
                          <Badge className="bg-green-100 text-green-800">Executable</Badge>
                        )}
                      </div>
                      {action.estimatedDuration && (
                        <p className="text-sm text-gray-500">
                          Estimated duration: {action.estimatedDuration / 1000}s
                        </p>
                      )}
                      <Button
                        size="sm"
                        disabled={!action.executable}
                        className="mt-2"
                      >
                        Execute Recovery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Select an error to view recovery strategies
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-3">
          {metrics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Errors by Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(metrics.errorsByType)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([errorType, count]) => (
                      <div key={errorType} className="flex justify-between">
                        <span className="text-sm">{errorType}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recovery Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Errors:</span>
                    <span className="font-semibold">{metrics.totalErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successfully Recovered:</span>
                    <span className="font-semibold text-green-600">{metrics.recoveredErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Recoveries:</span>
                    <span className="font-semibold text-red-600">{metrics.failedRecoveries}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Success Rate:</span>
                    <span className="font-semibold">{metrics.recoveryRate.toFixed(1)}%</span>
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
