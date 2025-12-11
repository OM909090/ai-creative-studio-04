import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, Filter, Shield } from 'lucide-react';
import { auditLogger } from '@/lib/audit-logger';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const refresh = () => {
      const allLogs = auditLogger.search({
        eventType: filterType as any,
        severity: filterSeverity as any,
        limit: 50
      });
      setLogs(allLogs);
      setStats(auditLogger.getStats());
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }
  }, [filterType, filterSeverity, autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success'
      ? <span className="text-green-600">✓</span>
      : <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csv = auditLogger.exportLogs({
      eventType: filterType as any,
      severity: filterSeverity as any
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Audit Log Viewer
              </CardTitle>
              <CardDescription>Monitor system events and security activities</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failureCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalLogs > 0 ? ((stats.successCount / stats.totalLogs) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-3">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No audit logs found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <Card key={log.id} className="hover:bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="font-semibold">{log.action}</span>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Resource: <span className="font-mono">{log.resource}</span>
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        User: <span className="font-mono">{log.userId}</span>
                        {log.duration && <span> • Duration: {log.duration}ms</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-3">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Events by Severity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between">
                      <span className="capitalize">{severity}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Event Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byEventType)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5)
                    .map(([eventType, count]) => (
                      <div key={eventType} className="flex justify-between">
                        <span className="text-sm">{eventType}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
