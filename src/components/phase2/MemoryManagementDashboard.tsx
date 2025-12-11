import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Brain, Trash2, Search, RefreshCw, Archive } from 'lucide-react';
import { memorySystem } from '@/lib/memory-system';

export function MemoryManagementDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const userId = 'demo-user';

  useEffect(() => {
    const refresh = () => {
      const memoryStats = memorySystem.getMemoryStats(userId);
      setStats(memoryStats);
      
      if (searchTerm) {
        const results = memorySystem.searchMemories(userId, searchTerm);
        setMemories(results.map((r: any) => r.memory));
      }
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, searchTerm]);

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'short-term': return 'bg-blue-100 text-blue-800';
      case 'long-term': return 'bg-purple-100 text-purple-800';
      case 'episodic': return 'bg-green-100 text-green-800';
      case 'semantic': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Memory Management System
              </CardTitle>
              <CardDescription>Monitor and manage system memory types</CardDescription>
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

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Memories</p>
                <p className="text-2xl font-bold">{stats.totalMemories}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold">{(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{stats.shortTermCount || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold">{((stats.longTermCount || 0) / Math.max(stats.totalMemories, 1) * 100).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="types">Memory Types</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Short-Term Memory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Session Memory</span>
                      <span className="font-semibold">{stats.shortTermCount || 0} entries</span>
                    </div>
                    <Progress value={Math.min(100, ((stats.shortTermCount || 0) / 100) * 100)} />
                  </div>
                  <p className="text-xs text-gray-500">24-hour expiration • Real-time access</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Long-Term Memory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Persistent Storage</span>
                      <span className="font-semibold">{stats.longTermCount || 0} profiles</span>
                    </div>
                    <Progress value={Math.min(100, ((stats.longTermCount || 0) / 50) * 100)} />
                  </div>
                  <p className="text-xs text-gray-500">Permanent storage • User preferences</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Domain Knowledge</span>
                      <span className="font-semibold">{stats.semanticCount || 0} entries</span>
                    </div>
                    <Progress value={Math.min(100, ((stats.semanticCount || 0) / 200) * 100)} />
                  </div>
                  <p className="text-xs text-gray-500">Semantic storage • Cross-session facts</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {memories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                {searchTerm ? 'No memories found' : 'Enter search term to find memories'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {memories.slice(0, 20).map((memory: any) => (
                <Card key={memory.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getMemoryTypeColor(memory.type)}>
                            {memory.type}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(memory.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{memory.content.substring(0, 100)}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Memory Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Short-Term
                  </span>
                  <span className="font-semibold">{Math.round((stats?.shortTermCount || 0) / Math.max(stats?.totalMemories, 1) * 100)}%</span>
                </div>
                <Progress value={(stats?.shortTermCount || 0) / Math.max(stats?.totalMemories, 1) * 100} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    Long-Term
                  </span>
                  <span className="font-semibold">{Math.round((stats?.longTermCount || 0) / Math.max(stats?.totalMemories, 1) * 100)}%</span>
                </div>
                <Progress value={(stats?.longTermCount || 0) / Math.max(stats?.totalMemories, 1) * 100} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Semantic
                  </span>
                  <span className="font-semibold">{Math.round((stats?.semanticCount || 0) / Math.max(stats?.totalMemories, 1) * 100)}%</span>
                </div>
                <Progress value={(stats?.semanticCount || 0) / Math.max(stats?.totalMemories, 1) * 100} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Memory Versions</CardTitle>
              <CardDescription>Track memory changes and history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Memory versioning tracks all changes made to stored data with full audit trail support.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
