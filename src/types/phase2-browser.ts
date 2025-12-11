export type BrowserActionType = 'navigate' | 'find' | 'back' | 'forward' | 'reload' | 'stop' | 'screenshot' | 'javascript' | 'cookie' | 'storage';
export type WindowState = 'normal' | 'maximized' | 'minimized' | 'fullscreen';
export type BookmarkType = 'folder' | 'bookmark';

export interface BrowserTab {
  id: string;
  windowId: string;
  title: string;
  url: string;
  favicon: string;
  isActive: boolean;
  isPinned: boolean;
  isIncognito: boolean;
  createdAt: string;
  lastActiveAt: string;
  loadTime: number;
}

export interface BrowserWindow {
  id: string;
  state: WindowState;
  tabs: BrowserTab[];
  activeTabId: string;
  isIncognito: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
}

export interface BrowserHistory {
  id: string;
  url: string;
  title: string;
  visitedAt: string;
  duration: number;
  visitCount: number;
  lastVisitedAt: string;
  transitionType: string;
}

export interface BrowserBookmark {
  id: string;
  parentId?: string;
  type: BookmarkType;
  title: string;
  url?: string;
  children?: BrowserBookmark[];
  createdAt: string;
  lastModifiedAt: string;
  tags: string[];
}

export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  expirationDate?: number;
}

export interface BrowserSession {
  id: string;
  userId: string;
  windows: BrowserWindow[];
  createdAt: string;
  lastSavedAt: string;
  name: string;
  notes: string;
}

export interface BrowserAction {
  id: string;
  type: BrowserActionType;
  target?: string;
  parameters: Record<string, any>;
  result: {
    success: boolean;
    data?: any;
    error?: string;
  };
  executedAt: string;
  duration: number;
}

export interface JavaScriptExecution {
  id: string;
  code: string;
  context: string;
  sandboxed: boolean;
  timeout: number;
  result: {
    success: boolean;
    returnValue?: any;
    error?: string;
  };
  executedAt: string;
  executionTime: number;
}

export interface DOMElement {
  id: string;
  tagName: string;
  className: string;
  id_attr: string;
  text: string;
  href?: string;
  value?: string;
  children: DOMElement[];
  attributes: Record<string, string>;
}

export interface PageState {
  url: string;
  title: string;
  loadState: 'loading' | 'interactive' | 'complete';
  documentReady: boolean;
  dom: DOMElement;
  resources: PageResource[];
  performance: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
}

export interface PageResource {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'xhr' | 'other';
  size: number;
  loadTime: number;
  cached: boolean;
}

export interface BrowserStorage {
  type: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookies';
  items: StorageItem[];
}

export interface StorageItem {
  key: string;
  value: string;
  size: number;
  expiresAt?: string;
  isEncrypted: boolean;
}

export interface NavigationState {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  history: BrowserHistory[];
  navigationTime: number;
}

export interface BrowserPermission {
  origin: string;
  name: string;
  setting: 'allow' | 'block' | 'ask';
  expiresAt?: string;
}

export interface BrowserExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  permissions: string[];
  installDate: string;
}

export interface ScreenCapture {
  id: string;
  tabId: string;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: string;
  selector?: string;
}

export interface BrowserSearchResult {
  tabId: string;
  url: string;
  highlightedMatches: number;
  currentMatch: number;
  searchTerm: string;
}

export interface BrowserControl {
  createWindow(): Promise<BrowserWindow>;
  closeWindow(windowId: string): Promise<void>;
  createTab(windowId: string, url: string): Promise<BrowserTab>;
  closeTab(tabId: string): Promise<void>;
  navigateTo(tabId: string, url: string): Promise<void>;
  goBack(tabId: string): Promise<void>;
  goForward(tabId: string): Promise<void>;
  reload(tabId: string): Promise<void>;
  executeScript(tabId: string, code: string): Promise<any>;
  getCookies(url: string): Promise<BrowserCookie[]>;
  setCookie(cookie: BrowserCookie): Promise<void>;
  getHistory(limit: number): Promise<BrowserHistory[]>;
  addBookmark(bookmark: BrowserBookmark): Promise<void>;
  getBookmarks(): Promise<BrowserBookmark[]>;
  captureScreenshot(tabId: string, selector?: string): Promise<ScreenCapture>;
  getPageState(tabId: string): Promise<PageState>;
  search(tabId: string, query: string): Promise<BrowserSearchResult>;
}
