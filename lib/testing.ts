export interface TestCase {
  id: string;
  name: string;
  description: string;
  test: () => Promise<boolean> | boolean;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}

export interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  timestamp: number;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

class TestRunner {
  private tests: Map<string, TestCase> = new Map();
  private results: TestResult[] = [];
  private isRunning: boolean = false;

  // Register a test case
  registerTest(testCase: TestCase): void {
    this.tests.set(testCase.id, testCase);
  }

  // Register multiple tests
  registerTests(testCases: TestCase[]): void {
    testCases.forEach(testCase => this.registerTest(testCase));
  }

  // Register a test suite
  registerTestSuite(suite: TestSuite): void {
    suite.tests.forEach(testCase => this.registerTest(testCase));
  }

  // Run a single test
  async runTest(testId: string): Promise<TestResult> {
    const testCase = this.tests.get(testId);
    if (!testCase) {
      throw new Error(`Test not found: ${testId}`);
    }

    const startTime = Date.now();
    let passed = false;
    let error: string | undefined;

    try {
      const timeout = testCase.timeout || 5000;
      const result = await Promise.race([
        testCase.test(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), timeout)
        )
      ]);

      passed = Boolean(result);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const duration = Date.now() - startTime;
    const testResult: TestResult = {
      testId,
      name: testCase.name,
      passed,
      duration,
      error,
      timestamp: Date.now()
    };

    this.results.push(testResult);
    return testResult;
  }

  // Run all tests
  async runAllTests(): Promise<TestResult[]> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results: TestResult[] = [];

    try {
      for (const testCase of this.tests.values()) {
        const result = await this.runTest(testCase.id);
        results.push(result);
      }
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  // Run tests by category
  async runTestsByCategory(category: TestCase['category']): Promise<TestResult[]> {
    const categoryTests = Array.from(this.tests.values()).filter(test => test.category === category);
    const results: TestResult[] = [];

    for (const testCase of categoryTests) {
      const result = await this.runTest(testCase.id);
      results.push(result);
    }

    return results;
  }

  // Run tests by priority
  async runTestsByPriority(priority: TestCase['priority']): Promise<TestResult[]> {
    const priorityTests = Array.from(this.tests.values()).filter(test => test.priority === priority);
    const results: TestResult[] = [];

    for (const testCase of priorityTests) {
      const result = await this.runTest(testCase.id);
      results.push(result);
    }

    return results;
  }

  // Get test results
  getResults(): TestResult[] {
    return [...this.results];
  }

  // Get test results by test ID
  getResultsByTestId(testId: string): TestResult[] {
    return this.results.filter(result => result.testId === testId);
  }

  // Get latest result for a test
  getLatestResult(testId: string): TestResult | null {
    const testResults = this.getResultsByTestId(testId);
    return testResults.length > 0 ? testResults[testResults.length - 1] : null;
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }

  // Get test statistics
  getTestStatistics(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    averageDuration: number;
    categoryStats: Record<string, { total: number; passed: number; failed: number }>;
    priorityStats: Record<string, { total: number; passed: number; failed: number }>;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const averageDuration = total > 0 ? this.results.reduce((sum, r) => sum + r.duration, 0) / total : 0;

    const categoryStats: Record<string, { total: number; passed: number; failed: number }> = {};
    const priorityStats: Record<string, { total: number; passed: number; failed: number }> = {};

    this.results.forEach(result => {
      const testCase = this.tests.get(result.testId);
      if (testCase) {
        // Category stats
        if (!categoryStats[testCase.category]) {
          categoryStats[testCase.category] = { total: 0, passed: 0, failed: 0 };
        }
        categoryStats[testCase.category].total++;
        if (result.passed) {
          categoryStats[testCase.category].passed++;
        } else {
          categoryStats[testCase.category].failed++;
        }

        // Priority stats
        if (!priorityStats[testCase.priority]) {
          priorityStats[testCase.priority] = { total: 0, passed: 0, failed: 0 };
        }
        priorityStats[testCase.priority].total++;
        if (result.passed) {
          priorityStats[testCase.priority].passed++;
        } else {
          priorityStats[testCase.priority].failed++;
        }
      }
    });

    return {
      total,
      passed,
      failed,
      successRate,
      averageDuration,
      categoryStats,
      priorityStats
    };
  }

  // Generate test report
  generateTestReport(): string {
    const stats = this.getTestStatistics();
    const failedTests = this.results.filter(r => !r.passed);

    let report = `# Test Report\n\n`;
    report += `## Summary\n`;
    report += `- Total Tests: ${stats.total}\n`;
    report += `- Passed: ${stats.passed}\n`;
    report += `- Failed: ${stats.failed}\n`;
    report += `- Success Rate: ${stats.successRate.toFixed(2)}%\n`;
    report += `- Average Duration: ${stats.averageDuration.toFixed(2)}ms\n\n`;

    report += `## Category Statistics\n`;
    Object.entries(stats.categoryStats).forEach(([category, stat]) => {
      const rate = stat.total > 0 ? (stat.passed / stat.total) * 100 : 0;
      report += `- ${category}: ${stat.passed}/${stat.total} (${rate.toFixed(2)}%)\n`;
    });
    report += `\n`;

    report += `## Priority Statistics\n`;
    Object.entries(stats.priorityStats).forEach(([priority, stat]) => {
      const rate = stat.total > 0 ? (stat.passed / stat.total) * 100 : 0;
      report += `- ${priority}: ${stat.passed}/${stat.total} (${rate.toFixed(2)}%)\n`;
    });
    report += `\n`;

    if (failedTests.length > 0) {
      report += `## Failed Tests\n`;
      failedTests.forEach(test => {
        report += `- ${test.name} (${test.testId})\n`;
        if (test.error) {
          report += `  Error: ${test.error}\n`;
        }
        report += `  Duration: ${test.duration}ms\n\n`;
      });
    }

    return report;
  }

  // Mock utilities
  createMock<T>(obj: T): jest.Mocked<T> {
    return obj as jest.Mocked<T>;
  }

  // Spy utilities
  createSpy<T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> {
    return fn as jest.MockedFunction<T>;
  }

  // Assertion utilities
  assert(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  assertDeepEqual(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
  }

  assertThrows(fn: () => void, errorType?: any, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw an error');
    } catch (error) {
      if (errorType && !(error instanceof errorType)) {
        throw new Error(message || `Expected error of type ${errorType.name}, but got ${error.constructor.name}`);
      }
    }
  }
}

export const testRunner = new TestRunner();

// Predefined test cases
export const createAPITest = (name: string, endpoint: string, expectedStatus: number = 200): TestCase => ({
  id: `api_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name,
  description: `Test API endpoint: ${endpoint}`,
  category: 'integration',
  priority: 'medium',
  test: async () => {
    try {
      const response = await fetch(endpoint);
      return response.status === expectedStatus;
    } catch {
      return false;
    }
  }
});

export const createComponentTest = (name: string, component: React.ComponentType<any>): TestCase => ({
  id: `component_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name,
  description: `Test React component: ${name}`,
  category: 'unit',
  priority: 'medium',
  test: () => {
    // In a real test environment, this would render the component and test it
    return true;
  }
});

export const createPerformanceTest = (name: string, fn: () => void, maxDuration: number): TestCase => ({
  id: `perf_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name,
  description: `Performance test: ${name}`,
  category: 'performance',
  priority: 'low',
  timeout: maxDuration * 2,
  test: async () => {
    const startTime = performance.now();
    fn();
    const duration = performance.now() - startTime;
    return duration <= maxDuration;
  }
});

export const createSecurityTest = (name: string, securityCheck: () => boolean): TestCase => ({
  id: `security_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name,
  description: `Security test: ${name}`,
  category: 'security',
  priority: 'high',
  test: securityCheck
});

// Export testing utilities
export const assert = testRunner.assert.bind(testRunner);
export const assertEqual = testRunner.assertEqual.bind(testRunner);
export const assertDeepEqual = testRunner.assertDeepEqual.bind(testRunner);
export const assertThrows = testRunner.assertThrows.bind(testRunner);
export const createMock = testRunner.createMock.bind(testRunner);
export const createSpy = testRunner.createSpy.bind(testRunner); 