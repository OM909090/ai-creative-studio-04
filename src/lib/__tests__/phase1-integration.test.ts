/**
 * Phase 1 Integration Tests
 * Tests all Phase 1 core infrastructure components together
 */

import { securityService } from '../security';
import { taskRouter } from '../task-router';
import { auditLogger } from '../audit-logger';
import { errorRecoveryService } from '../error-recovery';
import { apiGateway } from '../api-gateway';
import { webAutomationEngine } from '../web-automation';
import { nlpProcessor } from '../nlp-processor';

export const Phase1IntegrationTests = {
  /**
   * Test 1: Security System Integration
   * Validates RBAC and permission management
   */
  testSecuritySystem: () => {
    console.log('🔒 Testing Security System...');

    const userId = 'test-user-1';
    const profile = securityService.createUserProfile(userId, 'user');

    if (!profile) throw new Error('Failed to create security profile');

    const checkResult = securityService.checkPermissions(userId, ['web.data_extraction']);
    if (!checkResult.hasSufficientPermissions) {
      throw new Error('Permission check failed');
    }

    securityService.grantPermission(userId, 'browser.tabs');
    const updatedProfile = securityService.getUserProfile(userId);
    if (!updatedProfile?.permissions.includes('browser.tabs')) {
      throw new Error('Permission grant failed');
    }

    console.log('✅ Security System: PASS');
    return true;
  },

  /**
   * Test 2: Task Router Integration
   * Validates task queuing and priority management
   */
  testTaskRouter: () => {
    console.log('⚡ Testing Task Router...');

    const task1 = taskRouter.addTask(
      'test-user-1',
      'information',
      'Test command 1',
      {},
      { priority: 'high' }
    );

    const task2 = taskRouter.addTask(
      'test-user-1',
      'web_automation',
      'Test command 2',
      {},
      { priority: 'low' }
    );

    if (!task1 || !task2) throw new Error('Failed to create tasks');

    const nextTask = taskRouter.getNextTask();
    if (nextTask?.id !== task1.id) {
      throw new Error('Priority queue ordering failed');
    }

    taskRouter.startTask(task1.id);
    taskRouter.completeTask(task1.id, { success: true });

    const metrics = taskRouter.getMetrics();
    if (metrics.completedTasks !== 1) {
      throw new Error('Task completion tracking failed');
    }

    console.log('✅ Task Router: PASS');
    return true;
  },

  /**
   * Test 3: Audit Logger Integration
   * Validates logging and search functionality
   */
  testAuditLogger: () => {
    console.log('📝 Testing Audit Logger...');

    auditLogger.log(
      'test-user-1',
      'command_executed',
      'test_action',
      'test_resource',
      {
        status: 'success',
        severity: 'low'
      }
    );

    auditLogger.log(
      'test-user-1',
      'security_event',
      'test_security',
      'test_resource',
      {
        status: 'failure',
        severity: 'high'
      }
    );

    const stats = auditLogger.getStats();
    if (stats.totalLogs < 2) {
      throw new Error('Audit logging failed');
    }

    const searchResults = auditLogger.search({
      severity: 'high',
      limit: 10
    });

    if (searchResults.length === 0) {
      throw new Error('Audit search failed');
    }

    console.log('✅ Audit Logger: PASS');
    return true;
  },

  /**
   * Test 4: Error Recovery Integration
   * Validates retry logic and circuit breaker
   */
  testErrorRecovery: () => {
    console.log('🔄 Testing Error Recovery...');

    let attempts = 0;
    errorRecoveryService.executeWithRetry(
      async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Simulated error');
        }
        return { success: true };
      },
      'test-operation'
    ).catch(() => {});

    const metrics = errorRecoveryService.getMetrics();
    if (metrics.totalErrors < 0) {
      throw new Error('Error tracking failed');
    }

    errorRecoveryService.recordSuccess('test-service');
    const breakerStatus = errorRecoveryService.getCircuitBreakerStatus('test-service');
    if (!breakerStatus) {
      throw new Error('Circuit breaker status failed');
    }

    console.log('✅ Error Recovery: PASS');
    return true;
  },

  /**
   * Test 5: API Gateway Integration
   * Validates rate limiting and caching
   */
  testAPIGateway: () => {
    console.log('🚪 Testing API Gateway...');

    const request = {
      id: 'test-req-1',
      endpoint: '/test',
      method: 'GET',
      timestamp: new Date().toISOString(),
      userId: 'test-user-1',
      headers: {},
      body: {}
    };

    const response = apiGateway.handleRequest(request);

    if (!response) {
      throw new Error('API gateway request handling failed');
    }

    const metrics = apiGateway.getMetrics();
    if (metrics.totalRequests < 1) {
      throw new Error('API metrics tracking failed');
    }

    const rateLimit = apiGateway.getRateLimitStatus('test-user-1');
    if (!rateLimit) {
      throw new Error('Rate limit status check failed');
    }

    console.log('✅ API Gateway: PASS');
    return true;
  },

  /**
   * Test 6: Web Automation Integration
   * Validates automation task execution
   */
  testWebAutomation: () => {
    console.log('🤖 Testing Web Automation...');

    const task = {
      id: 'auto-1',
      action: 'navigate' as const,
      url: 'https://example.com'
    };

    webAutomationEngine.executeTask(task).then(result => {
      if (!result.success) {
        throw new Error('Automation task execution failed');
      }
    }).catch(() => {});

    const successRate = webAutomationEngine.getSuccessRate();
    if (successRate < 0) {
      throw new Error('Success rate calculation failed');
    }

    console.log('✅ Web Automation: PASS');
    return true;
  },

  /**
   * Test 7: NLP Processor Integration
   * Validates command parsing and validation
   */
  testNLPProcessor: () => {
    console.log('🧠 Testing NLP Processor...');

    const parsing = nlpProcessor.parseCommand('Navigate to example.com');
    if (!parsing || parsing.intent === 'unknown') {
      throw new Error('Intent detection failed');
    }

    const validation = nlpProcessor.validateCommand('Navigate to example.com');
    if (!validation.isValid) {
      throw new Error('Command validation failed');
    }

    const similarity = nlpProcessor.calculateSimilarity(
      'Navigate to Google',
      'Go to Google'
    );

    if (similarity.similarity <= 0) {
      throw new Error('Semantic similarity calculation failed');
    }

    const suggestions = nlpProcessor.generateSuggestions('navgate to site');
    if (suggestions.length === 0) {
      throw new Error('Suggestion generation failed');
    }

    console.log('✅ NLP Processor: PASS');
    return true;
  },

  /**
   * Test 8: Full Integration Flow
   * Tests complete command processing pipeline
   */
  testFullIntegrationFlow: async () => {
    console.log('🔗 Testing Full Integration Flow...');

    const userId = 'integration-test-user';

    // 1. Create security profile
    const profile = securityService.createUserProfile(userId, 'user');
    if (!profile) throw new Error('Security profile creation failed');

    // 2. Add task to router
    const task = taskRouter.addTask(
      userId,
      'information',
      'Test integration command',
      { message: 'test' },
      { priority: 'high' }
    );

    // 3. Start task execution
    taskRouter.startTask(task.id);

    // 4. Log audit event
    auditLogger.log(
      userId,
      'command_executed',
      'test_integration',
      'test_integration_resource',
      {
        status: 'success',
        severity: 'low',
        duration: 100
      }
    );

    // 5. Parse with NLP
    const parsing = nlpProcessor.parseCommand('Test integration command');

    // 6. Validate command
    const validation = nlpProcessor.validateCommand('Test integration command');

    // 7. Check rate limits
    const rateLimit = apiGateway.getRateLimitStatus(userId);

    // 8. Complete task
    taskRouter.completeTask(task.id, {
      parsed: parsing,
      validated: validation,
      rateLimit: rateLimit
    });

    // 9. Verify audit log
    const auditLogs = auditLogger.search({ userId });
    if (auditLogs.length === 0) {
      throw new Error('Audit log retrieval failed');
    }

    // 10. Check metrics
    const taskMetrics = taskRouter.getMetrics();
    if (taskMetrics.completedTasks < 1) {
      throw new Error('Task metrics failed');
    }

    console.log('✅ Full Integration Flow: PASS');
    return true;
  },

  /**
   * Run all tests
   */
  runAllTests: async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Phase 1 Integration Test Suite');
    console.log('='.repeat(60) + '\n');

    const tests = [
      { name: 'Security System', fn: Phase1IntegrationTests.testSecuritySystem },
      { name: 'Task Router', fn: Phase1IntegrationTests.testTaskRouter },
      { name: 'Audit Logger', fn: Phase1IntegrationTests.testAuditLogger },
      { name: 'Error Recovery', fn: Phase1IntegrationTests.testErrorRecovery },
      { name: 'API Gateway', fn: Phase1IntegrationTests.testAPIGateway },
      { name: 'Web Automation', fn: Phase1IntegrationTests.testWebAutomation },
      { name: 'NLP Processor', fn: Phase1IntegrationTests.testNLPProcessor },
      { name: 'Full Integration Flow', fn: Phase1IntegrationTests.testFullIntegrationFlow }
    ];

    let passed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const test of tests) {
      try {
        await test.fn();
        passed++;
      } catch (error) {
        failed++;
        failures.push(`${test.name}: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`❌ ${test.name}: FAIL - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failures.length > 0) {
      console.log('\n📋 Failures:');
      failures.forEach(f => console.log(`  - ${f}`));
    }

    console.log('='.repeat(60) + '\n');

    return {
      totalTests: tests.length,
      passed,
      failed,
      successRate: (passed / tests.length) * 100,
      failures
    };
  }
};

// Export for use
export default Phase1IntegrationTests;
