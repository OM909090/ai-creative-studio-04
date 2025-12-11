import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Plus, 
  X, 
  Bookmark, 
  History, 
  Settings, 
  RefreshCw,
  Maximize2,
  Camera
} from 'lucide-react';
import { browserControl } from '@/lib/browser-control';

export function BrowserControlDashboard() {
  const [windows, setWindows] = useState<any[]>([]);
  const [tabs, setTabs] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    const refresh = () => {
      const browserStats = browserControl.getStats();
      setStats(browserStats);
      
      const historyItems = browserControl.getHistory();
      setHistory(historyItems.slice(0, 10));
      
      const bookmarkList = browserControl.getBookmarks();
      setBookmarks(bookmarkList.slice(0, 10));
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleCreateWindow = () => {
    const newWindow = browserControl.createWindow();
    if (newWindow) {
      setWindows([...windows, newWindow]);
    }
  };

  const handleCreateTab = () => {
    if (windows.length > 0 && newUrl) {
      const tab = browserControl.createTab(windows[0].id, newUrl);
      if (tab) {
        setTabs([...tabs, tab]);
        setNewUrl('');
      }
    }
  };

  const handleAddBookmark = (url: string) => {
    browserControl.addBookmark({
      id: '',
      type: 'bookmark',
      title: url.split('/')[2],
      url: url,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      tags: []
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <span className="w-2 h-2 bg-green-600 rounded-full"></span>;
    if (status === 'loading') return <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>;
    return <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Browser Control Dashboard
              </CardTitle>
              <CardDescription>Manage windows, tabs, and navigation</CardDescription>
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
                <p className="text-sm text-gray-600">Open Windows</p>
                <p className="text-2xl font-bold">{stats.totalWindows}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Tabs</p>
                <p className="text-2xl font-bold">{stats.totalTabs}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Bookmarks</p>
                <p className="text-2xl font-bold">{stats.totalBookmarks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">History Items</p>
                <p className="text-2xl font-bold">{stats.totalHistory}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="windows" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="windows" className="space-y-3">
          <Button onClick={handleCreateWindow} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Window
          </Button>

          {windows.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No windows open. Create a new window to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {windows.map((win: any) => (
                <Card key={win.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Window {win.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-600">
                          {win.bounds.width}x{win.bounds.height} • {win.tabs.length} tabs
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={win.isIncognito ? 'destructive' : 'secondary'}>
                          {win.isIncognito ? 'Incognito' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tabs" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTab()}
            />
            <Button onClick={handleCreateTab} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {tabs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No tabs open. Enter a URL above to create a new tab.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tabs.map((tab: any) => (
                <Card key={tab.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tab.status || 'active')}
                            <p className="font-semibold text-sm flex-1">{tab.title}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 break-all">{tab.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBookmark(tab.url)}
                        >
                          <Bookmark className="w-4 h-4 text-amber-600" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{new Date(tab.createdAt).toLocaleString()}</span>
                        <span className={tab.isPinned ? 'text-blue-600 font-semibold' : ''}>
                          {tab.isPinned ? '📌 Pinned' : ''}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-3">
          {bookmarks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No bookmarks yet. Save URLs from open tabs to create bookmarks.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{bookmark.title}</p>
                        <p className="text-xs text-gray-600 mt-1 break-all">{bookmark.url}</p>
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {bookmark.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {history.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No history items. Browser history is empty.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((item: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{item.title || 'Untitled'}</p>
                      <p className="text-xs text-gray-600 break-all">{item.url}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.visitedAt || item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
