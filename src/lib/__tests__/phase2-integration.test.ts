import { memorySystem } from '../memory-system';
import { learningEngine } from '../learning-engine';
import { browserControl } from '../browser-control';
import { monitoringSystem } from '../monitoring-system';
import { persistenceLayer } from '../persistence-layer';
import { preferencesEngine } from '../preferences-engine';
import { versionControl } from '../version-control';
import { workflowEngine } from '../workflow-engine';
import { resilienceSystem } from '../resilience-system';

export const Phase2IntegrationTests = {
  testMemorySystem: () => {
    console.log('🧠 Testing Memory System...');

    const userId = 'test-user';
    const stm = memorySystem.createShortTermMemory('session-1', userId);
    const ltm = memorySystem.createLongTermMemory(userId, {
      userId,
      name: 'Test User',
      email: 'test@example.com',
      roles: ['user'],
      permissions: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      metadata: {}
    });

    const memory = memorySystem.storeMemory(userId, 'semantic', 'Test content');
    if (!memory) throw new Error('Failed to store memory');

    const retrieved = memorySystem.retrieveMemory(memory.id);
    if (!retrieved) throw new Error('Failed to retrieve memory');

    const stats = memorySystem.getMemoryStats(userId);
    if (stats.totalMemories === 0) throw new Error('Memory stats failed');

    console.log('✅ Memory System: PASS');
    return true;
  },

  testLearningEngine: () => {
    console.log('🎓 Testing Learning Engine...');

    const userId = 'test-user';
    const profile = learningEngine.createLearningProfile(userId, 'moderate');
    
    learningEngine.recordBehavior({
      userId,
      action: 'navigate',
      parameters: { url: 'example.com' },
      result: 'success',
      duration: 1500,
      timestamp: new Date().toISOString(),
      metadata: {}
    });

    const analysis = learningEngine.analyzeBehavior(userId);
    if (analysis.totalEvents === 0) throw new Error('Behavior analysis failed');

    const insights = learningEngine.generateInsights(userId);
    const metrics = learningEngine.calculateLearningMetrics(userId);
    if (metrics.modelAccuracy === 0) throw new Error('Metrics calculation failed');

    console.log('✅ Learning Engine: PASS');
    return true;
  },

  testBrowserControl: () => {
    console.log('🌐 Testing Browser Control...');

    const window = browserControl.createWindow();
    if (!window) throw new Error('Failed to create window');

    const tab = browserControl.createTab(window.id, 'https://example.com');
    if (!tab) throw new Error('Failed to create tab');

    const navigateAction = browserControl.navigateTo(tab.id, 'https://google.com');
    if (!navigateAction.result.success) throw new Error('Navigation failed');

    browserControl.addBookmark({
      id: '',
      type: 'bookmark',
      title: 'Test',
      url: 'https://example.com',
      createdAt: '',
      lastModifiedAt: '',
      tags: []
    });

    const stats = browserControl.getStats();
    if (stats.totalWindows === 0) throw new Error('Browser stats failed');

    console.log('✅ Browser Control: PASS');
    return true;
  },

  testMonitoringSystem: () => {
    console.log('📊 Testing Monitoring System...');

    monitoringSystem.recordMetric('cpu_usage', 45, 'gauge', '%');
    monitoringSystem.recordMetric('memory_usage', 2500, 'gauge', 'MB');

    const rule = monitoringSystem.createAlertRule(
      'High CPU',
      'cpu_usage',
      80,
      '>',
      'warning',
      60
    );
    if (!rule) throw new Error('Failed to create alert rule');

    monitoringSystem.registerHealthCheck('api-service', 'http://api:3000/health');
    monitoringSystem.updateHealthCheck('api-service', 'healthy', 45);

    const metrics = monitoringSystem.getSystemMetrics();
    if (!metrics) throw new Error('Failed to get metrics');

    const alerts = monitoringSystem.getActiveAlerts();
    const report = monitoringSystem.generatePerformanceReport(1);
    if (!report) throw new Error('Report generation failed');

    console.log('✅ Monitoring System: PASS');
    return true;
  },

  testPersistenceLayer: () => {
    console.log('💾 Testing Persistence Layer...');

    const store = persistenceLayer.createDataStore(
      'primary',
      'supabase',
      'postgresql://...'
    );
    if (!store) throw new Error('Failed to create data store');

    const entity = persistenceLayer.storeEntity('user1', 'document', { title: 'Test' });
    if (!entity) throw new Error('Failed to store entity');

    const retrieved = persistenceLayer.retrieveEntity(entity.id);
    if (!retrieved) throw new Error('Failed to retrieve entity');

    const quota = persistenceLayer.initializeUserQuota('user1', 10737418240);
    if (!quota) throw new Error('Failed to create quota');

    persistenceLayer.updateQuotaUsage('user1', 1024 * 1024);
    const updated = persistenceLayer.getStorageQuota('user1');
    if (!updated || updated.usedBytes === 0) throw new Error('Quota update failed');

    const backup = persistenceLayer.createBackupJob('daily', 'full', '0 2 * * *');
    if (!backup) throw new Error('Failed to create backup job');

    console.log('✅ Persistence Layer: PASS');
    return true;
  },

  testPreferencesEngine: () => {
    console.log('⚙️ Testing Preferences Engine...');

    const profile = preferencesEngine.createPreferenceProfile('user1', 'Default');
    if (!profile) throw new Error('Failed to create preference profile');

    preferencesEngine.setPreference('user1', 'ui', 'theme', 'dark');
    const pref = preferencesEngine.getPreference('user1', 'ui', 'theme');
    if (!pref) throw new Error('Failed to get preference');

    const theme = preferencesEngine.createCustomTheme('user1', 'MyTheme');
    if (!theme) throw new Error('Failed to create custom theme');

    const userPrefs = preferencesEngine.getUserPreferences('user1');
    if (!userPrefs) throw new Error('Failed to get user preferences');

    const stats = preferencesEngine.getStats('user1');
    if (stats.totalPreferences === 0) throw new Error('Preferences stats failed');

    console.log('✅ Preferences Engine: PASS');
    return true;
  },

  testVersionControl: () => {
    console.log('📝 Testing Version Control...');

    const history = versionControl.initializeHistory('doc1');
    if (!history) throw new Error('Failed to initialize history');

    const v1 = versionControl.createVersion('doc1', 'user1', { content: 'Version 1' }, 'Initial');
    if (!v1) throw new Error('Failed to create version 1');

    const v2 = versionControl.createVersion('doc1', 'user1', { content: 'Version 2' }, 'Update');
    if (!v2) throw new Error('Failed to create version 2');

    const comparison = versionControl.compareVersions(v1.id, v2.id);
    if (!comparison) throw new Error('Failed to compare versions');

    const branch = versionControl.createBranch('doc1', v1.id, 'develop', 'user1');
    if (!branch) throw new Error('Failed to create branch');

    const tag = versionControl.createTag('doc1', v1.id, 'v1.0', 'user1');
    if (!tag) throw new Error('Failed to create tag');

    const stats = versionControl.getStatistics('doc1');
    if (!stats) throw new Error('Statistics failed');

    console.log('✅ Version Control: PASS');
    return true;
  },

  testWorkflowEngine: () => {
    console.log('⚙️ Testing Workflow Engine...');

    const workflow = workflowEngine.createWorkflow('TestWorkflow', 'user1');
    if (!workflow) throw new Error('Failed to create workflow');

    const step = workflowEngine.addStep(workflow.id, 'Step1', 'task', { action: 'test' });
    if (!step) throw new Error('Failed to add step');

    const trigger = workflowEngine.addTrigger(workflow.id, 'manual', 'Manual Trigger');
    if (!trigger) throw new Error('Failed to add trigger');

    workflowEngine.publishWorkflow(workflow.id);
    const published = workflowEngine.getWorkflow(workflow.id);
    if (published?.status !== 'active') throw new Error('Workflow publish failed');

    const execution = workflowEngine.executeWorkflow(workflow.id, 'user1');
    if (!execution) throw new Error('Failed to execute workflow');

    const monitoring = workflowEngine.getMonitoring(workflow.id);
    if (!monitoring) throw new Error('Monitoring failed');

    const stats = workflowEngine.getStats();
    if (stats.totalWorkflows === 0) throw new Error('Stats failed');

    console.log('✅ Workflow Engine: PASS');
    return true;
  },

  testResilienceSystem: () => {
    console.log('🛡️ Testing Resilience System...');

    const policy = resilienceSystem.createPolicy('api-resilience', 'graceful_degradation');
    if (!policy) throw new Error('Failed to create policy');

    const profile = resilienceSystem.createProfile('api-service', policy.id);
    if (!profile) throw new Error('Failed to create profile');

    const cb = resilienceSystem.createCircuitBreaker('api-service', 'http://api:3000', 5);
    if (!cb) throw new Error('Failed to create circuit breaker');

    const fallback = resilienceSystem.createFallback(
      'api-service',
      'http://primary:3000',
      ['http://replica1:3000', 'http://replica2:3000']
    );
    if (!fallback) throw new Error('Failed to create fallback');

    const hc = resilienceSystem.registerHealthCheck('api-service', 'http://api:3000/health');
    if (!hc) throw new Error('Failed to register health check');

    resilienceSystem.recordHealthCheck(hc.id, 'healthy');

    const rl = resilienceSystem.createRateLimitPolicy('api-service', 100);
    if (!rl) throw new Error('Failed to create rate limit');

    const rp = resilienceSystem.createRetryPolicy('api-service', 3);
    if (!rp) throw new Error('Failed to create retry policy');

    const stats = resilienceSystem.getStats();
    if (stats.totalPolicies === 0) throw new Error('Stats failed');

    const report = resilienceSystem.generateReport(24);
    if (!report) throw new Error('Report generation failed');

    console.log('✅ Resilience System: PASS');
    return true;
  },

  runAll: async function() {
    console.log('\n🚀 Running Phase 2 Integration Tests\n');
    const tests = [
      this.testMemorySystem,
      this.testLearningEngine,
      this.testBrowserControl,
      this.testMonitoringSystem,
      this.testPersistenceLayer,
      this.testPreferencesEngine,
      this.testVersionControl,
      this.testWorkflowEngine,
      this.testResilienceSystem
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = test.call(this);
        if (result) passed++;
      } catch (error) {
        console.error(`❌ ${error}`);
        failed++;
      }
    }

    console.log(`\n✅ Results: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
  }
};
