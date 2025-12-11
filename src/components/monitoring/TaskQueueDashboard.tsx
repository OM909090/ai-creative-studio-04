import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { taskRouter } from '@/lib/task-router';

export function TaskQueueDashboard() {
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [queuedTasks, setQueuedTasks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const refresh = () => {
      setActiveTasks(taskRouter.getActiveTasks());
      setQueuedTasks(taskRouter.getQueuedTasks());
      setMetrics(taskRouter.getMetrics());
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'executing': return <Zap className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Task Queue Dashboard
              </CardTitle>
              <CardDescription>Monitor and manage active tasks and queue</CardDescription>
            </div>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">{metrics.activeTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Queued</p>
                <p className="text-2xl font-bold">{metrics.queueLength}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{(metrics.averageExecutionTime / 1000).toFixed(1)}s</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activeTasks.length})</TabsTrigger>
          <TabsTrigger value="queued">Queued ({queuedTasks.length})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2">
          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No active tasks
              </CardContent>
            </Card>
          ) : (
            activeTasks.map(task => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{task.command}</p>
                        <p className="text-sm text-gray-600">ID: {task.id}</p>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{task.progress || 0}%</span>
                      </div>
                      <Progress value={task.progress || 0} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type: {task.actionType}</span>
                      <span className="text-gray-600">Duration: {task.estimatedDuration}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="queued" className="space-y-2">
          {queuedTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No queued tasks
              </CardContent>
            </Card>
          ) : (
            queuedTasks.map((task, index) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                        <p className="font-semibold">{task.command}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">ID: {task.id}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-2">
          {metrics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Queue Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Critical Priority:</span>
                    <span className="font-semibold text-red-600">{taskRouter.getQueueStatus().critical}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Priority:</span>
                    <span className="font-semibold text-orange-600">{taskRouter.getQueueStatus().high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Priority:</span>
                    <span className="font-semibold text-yellow-600">{taskRouter.getQueueStatus().medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Priority:</span>
                    <span className="font-semibold text-green-600">{taskRouter.getQueueStatus().low}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Processed:</span>
                    <span className="font-semibold">{metrics.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold text-green-600">{metrics.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-semibold text-red-600">{metrics.failedTasks}</span>
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
