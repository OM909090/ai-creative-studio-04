import {
  BrowserTab,
  BrowserWindow,
  BrowserHistory,
  BrowserBookmark,
  BrowserCookie,
  BrowserSession,
  BrowserAction,
  JavaScriptExecution,
  DOMElement,
  PageState,
  NavigationState,
  ScreenCapture,
  BrowserSearchResult
} from '@/types/phase2-browser';

export class BrowserControlEngine {
  private static instance: BrowserControlEngine;
  private windows: Map<string, BrowserWindow> = new Map();
  private tabs: Map<string, BrowserTab> = new Map();
  private history: BrowserHistory[] = [];
  private bookmarks: BrowserBookmark[] = [];
  private cookies: Map<string, BrowserCookie[]> = new Map();
  private sessions: Map<string, BrowserSession> = new Map();
  private actionHistory: BrowserAction[] = [];
  private counter: number = 0;

  private constructor() {}

  public static getInstance(): BrowserControlEngine {
    if (!BrowserControlEngine.instance) {
      BrowserControlEngine.instance = new BrowserControlEngine();
    }
    return BrowserControlEngine.instance;
  }

  public createWindow(): BrowserWindow {
    const window: BrowserWindow = {
      id: `win_${++this.counter}_${Date.now()}`,
      state: 'normal',
      tabs: [],
      activeTabId: '',
      isIncognito: false,
      bounds: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      },
      createdAt: new Date().toISOString()
    };

    this.windows.set(window.id, window);
    return window;
  }

  public closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId);
    if (!window) return false;

    window.tabs.forEach(tab => {
      this.tabs.delete(tab.id);
    });
    this.windows.delete(windowId);
    return true;
  }

  public createTab(windowId: string, url: string): BrowserTab | null {
    const window = this.windows.get(windowId);
    if (!window) return null;

    const tab: BrowserTab = {
      id: `tab_${++this.counter}_${Date.now()}`,
      windowId,
      title: 'Loading...',
      url,
      favicon: '',
      isActive: window.tabs.length === 0,
      isPinned: false,
      isIncognito: window.isIncognito,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      loadTime: 0
    };

    window.tabs.push(tab);
    if (tab.isActive) {
      window.activeTabId = tab.id;
    }
    this.tabs.set(tab.id, tab);
    return tab;
  }

  public closeTab(tabId: string): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    const window = this.windows.get(tab.windowId);
    if (window) {
      window.tabs = window.tabs.filter(t => t.id !== tabId);
      if (window.activeTabId === tabId && window.tabs.length > 0) {
        window.activeTabId = window.tabs[0].id;
      }
    }
    this.tabs.delete(tabId);
    return true;
  }

  public navigateTo(tabId: string, url: string): BrowserAction {
    const tab = this.tabs.get(tabId);
    
    const action: BrowserAction = {
      id: `act_${++this.counter}_${Date.now()}`,
      type: 'navigate',
      target: tabId,
      parameters: { url },
      result: {
        success: tab !== undefined,
        data: tab ? { previousUrl: tab.url, newUrl: url } : undefined
      },
      executedAt: new Date().toISOString(),
      duration: Math.random() * 3000 + 500
    };

    if (tab) {
      this.addToHistory({
        id: `hist_${++this.counter}_${Date.now()}`,
        url,
        title: 'Navigated to ' + url,
        visitedAt: new Date().toISOString(),
        duration: action.duration,
        visitCount: 1,
        lastVisitedAt: new Date().toISOString(),
        transitionType: 'link'
      });
      
      tab.url = url;
      tab.lastActiveAt = new Date().toISOString();
      tab.loadTime = action.duration;
    }

    this.actionHistory.push(action);
    return action;
  }

  public goBack(tabId: string): BrowserAction {
    const tab = this.tabs.get(tabId);
    
    const action: BrowserAction = {
      id: `act_${++this.counter}_${Date.now()}`,
      type: 'back',
      target: tabId,
      parameters: {},
      result: {
        success: tab !== undefined
      },
      executedAt: new Date().toISOString(),
      duration: Math.random() * 2000 + 300
    };

    if (tab && this.history.length > 0) {
      const previousEntry = this.history[Math.max(0, this.history.length - 2)];
      tab.url = previousEntry.url;
      tab.lastActiveAt = new Date().toISOString();
    }

    this.actionHistory.push(action);
    return action;
  }

  public goForward(tabId: string): BrowserAction {
    const tab = this.tabs.get(tabId);
    
    const action: BrowserAction = {
      id: `act_${++this.counter}_${Date.now()}`,
      type: 'forward',
      target: tabId,
      parameters: {},
      result: {
        success: tab !== undefined
      },
      executedAt: new Date().toISOString(),
      duration: Math.random() * 2000 + 300
    };

    this.actionHistory.push(action);
    return action;
  }

  public reload(tabId: string): BrowserAction {
    const tab = this.tabs.get(tabId);
    
    const action: BrowserAction = {
      id: `act_${++this.counter}_${Date.now()}`,
      type: 'reload',
      target: tabId,
      parameters: {},
      result: {
        success: tab !== undefined
      },
      executedAt: new Date().toISOString(),
      duration: Math.random() * 3000 + 500
    };

    if (tab) {
      tab.lastActiveAt = new Date().toISOString();
      tab.loadTime = action.duration;
    }

    this.actionHistory.push(action);
    return action;
  }

  public executeScript(tabId: string, code: string): JavaScriptExecution {
    const execution: JavaScriptExecution = {
      id: `js_${++this.counter}_${Date.now()}`,
      code,
      context: tabId,
      sandboxed: true,
      timeout: 5000,
      result: {
        success: true,
        returnValue: { message: 'Script executed successfully' }
      },
      executedAt: new Date().toISOString(),
      executionTime: Math.random() * 1000 + 100
    };

    return execution;
  }

  public getCookies(url: string): BrowserCookie[] {
    const domain = new URL(url).hostname;
    return this.cookies.get(domain) || [];
  }

  public setCookie(cookie: BrowserCookie): boolean {
    const cookies = this.cookies.get(cookie.domain) || [];
    const existingIndex = cookies.findIndex(c => c.name === cookie.name);
    
    if (existingIndex >= 0) {
      cookies[existingIndex] = cookie;
    } else {
      cookies.push(cookie);
    }

    this.cookies.set(cookie.domain, cookies);
    return true;
  }

  public getHistory(limit: number = 100): BrowserHistory[] {
    return this.history.slice(-limit);
  }

  public addBookmark(bookmark: BrowserBookmark): BrowserBookmark {
    if (!bookmark.id) {
      bookmark.id = `bm_${++this.counter}_${Date.now()}`;
    }
    if (!bookmark.createdAt) {
      bookmark.createdAt = new Date().toISOString();
    }
    if (!bookmark.lastModifiedAt) {
      bookmark.lastModifiedAt = new Date().toISOString();
    }

    this.bookmarks.push(bookmark);
    return bookmark;
  }

  public getBookmarks(): BrowserBookmark[] {
    return this.bookmarks;
  }

  public removeBookmark(bookmarkId: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === bookmarkId);
    if (index >= 0) {
      this.bookmarks.splice(index, 1);
      return true;
    }
    return false;
  }

  public captureScreenshot(tabId: string, selector?: string): ScreenCapture {
    const tab = this.tabs.get(tabId);
    
    const capture: ScreenCapture = {
      id: `ss_${++this.counter}_${Date.now()}`,
      tabId,
      dataUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      width: 1920,
      height: 1080,
      timestamp: new Date().toISOString(),
      selector
    };

    return capture;
  }

  public getPageState(tabId: string): PageState | null {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    return {
      url: tab.url,
      title: tab.title,
      loadState: 'complete',
      documentReady: true,
      dom: {
        id: 'root',
        tagName: 'html',
        className: '',
        id_attr: '',
        text: 'Document',
        children: [],
        attributes: {}
      },
      resources: [],
      performance: {
        navigationStart: Date.now(),
        domContentLoaded: Date.now() + 1000,
        loadComplete: Date.now() + 2000
      }
    };
  }

  public search(tabId: string, query: string): BrowserSearchResult {
    const tab = this.tabs.get(tabId);
    
    return {
      tabId,
      url: tab?.url || '',
      highlightedMatches: Math.floor(Math.random() * 20) + 1,
      currentMatch: 1,
      searchTerm: query
    };
  }

  public createSession(userId: string, name: string): BrowserSession {
    const windows = Array.from(this.windows.values());
    
    const session: BrowserSession = {
      id: `sess_${++this.counter}_${Date.now()}`,
      userId,
      windows: [...windows],
      createdAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      name,
      notes: ''
    };

    this.sessions.set(session.id, session);
    return session;
  }

  public restoreSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.windows.clear();
    session.windows.forEach(window => {
      this.windows.set(window.id, { ...window });
    });

    return true;
  }

  public getNavigationState(tabId: string): NavigationState {
    const tab = this.tabs.get(tabId);
    const historyIndex = this.history.findIndex(h => h.url === tab?.url);

    return {
      currentUrl: tab?.url || '',
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex >= 0 && historyIndex < this.history.length - 1,
      history: this.history.slice(Math.max(0, historyIndex - 10), historyIndex + 1),
      navigationTime: tab?.loadTime || 0
    };
  }

  public getWindowList(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  public getTabList(windowId: string): BrowserTab[] {
    const window = this.windows.get(windowId);
    return window?.tabs || [];
  }

  public getActionHistory(limit: number = 50): BrowserAction[] {
    return this.actionHistory.slice(-limit);
  }

  private addToHistory(entry: BrowserHistory): void {
    const existing = this.history.findIndex(h => h.url === entry.url);
    if (existing >= 0) {
      this.history[existing].visitCount++;
      this.history[existing].lastVisitedAt = entry.visitedAt;
    } else {
      this.history.push(entry);
    }

    if (this.history.length > 1000) {
      this.history.shift();
    }
  }

  public clearHistory(): void {
    this.history = [];
  }

  public clearCookies(): void {
    this.cookies.clear();
  }

  public getStats(): {
    totalWindows: number;
    totalTabs: number;
    totalHistory: number;
    totalBookmarks: number;
    totalCookies: number;
    totalSessions: number;
  } {
    const totalCookies = Array.from(this.cookies.values())
      .reduce((sum, arr) => sum + arr.length, 0);

    return {
      totalWindows: this.windows.size,
      totalTabs: this.tabs.size,
      totalHistory: this.history.length,
      totalBookmarks: this.bookmarks.length,
      totalCookies,
      totalSessions: this.sessions.size
    };
  }
}

export const browserControl = BrowserControlEngine.getInstance();
