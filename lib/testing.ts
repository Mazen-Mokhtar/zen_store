// Define our own mock types to avoid jest dependency
type Mocked<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? MockedFunction<T[P]> : T[P];
};

type MockedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): ReturnType<T>;
  calls: Array<Parameters<T>>;
  mockClear(): void;
  mockReset(): void;
};

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e';
  fn: () => Promise<void> | void;
}

export interface TestResult {
  id: string;
  name: string;
  category: TestCase['category'];
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
}

export interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

class TestRunner {
  private tests: Map<string, TestCase> = new Map();
  private isRunning: boolean = false;
  private hooks: {
    beforeEach: Array<() => Promise<void> | void>;
    afterEach: Array<() => Promise<void> | void>;
    beforeAll: Array<() => Promise<void> | void>;
    afterAll: Array<() => Promise<void> | void>;
  } = {
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: []
  };

  // Test registration
  registerTest(test: TestCase): void {
    if (this.tests.has(test.id)) {
      throw new Error(`Test with id ${test.id} already exists`);
    }
    this.tests.set(test.id, test);
  }

  // Hook registration
  beforeEach(fn: () => Promise<void> | void): void {
    this.hooks.beforeEach.push(fn);
  }

  afterEach(fn: () => Promise<void> | void): void {
    this.hooks.afterEach.push(fn);
  }

  beforeAll(fn: () => Promise<void> | void): void {
    this.hooks.beforeAll.push(fn);
  }

  afterAll(fn: () => Promise<void> | void): void {
    this.hooks.afterAll.push(fn);
  }

  // Run all tests
  async runAllTests(): Promise<TestResult[]> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results: TestResult[] = [];

    try {
      const testCases = Array.from(this.tests.values());
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
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

    for (const test of categoryTests) {
      const result = await this.runTest(test.id);
      results.push(result);
    }

    return results;
  }

  // Run a single test
  async runTest(id: string): Promise<TestResult> {
    const test = this.tests.get(id);
    if (!test) {
      throw new Error(`Test with id ${id} not found`);
    }

    // Run beforeEach hooks
    for (const hook of this.hooks.beforeEach) {
      await hook();
    }

    const startTime = performance.now();
    let status: TestResult['status'] = 'passed';
    let error: Error | undefined;

    try {
      await test.fn();
    } catch (e) {
      status = 'failed';
      error = e instanceof Error ? e : new Error(String(e));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Run afterEach hooks
    for (const hook of this.hooks.afterEach) {
      await hook();
    }

    return {
      id: test.id,
      name: test.name,
      category: test.category,
      status,
      duration,
      error
    };
  }

  // Skip a test
  skipTest(id: string): void {
    const test = this.tests.get(id);
    if (!test) {
      throw new Error(`Test with id ${id} not found`);
    }

    // Replace the test function with a no-op that marks as skipped
    const skippedTest: TestCase = {
      ...test,
      fn: async () => {
        // Don't return anything, just a no-op function
      }
    };

    this.tests.set(id, skippedTest);
  }

  // Get test report
  getTestReport(results: TestResult[]): TestReport {
    const totalTests = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      results
    };
  }

  // Clear all tests
  clearTests(): void {
    this.tests.clear();
  }

  // Test utilities
  async assertThrows(fn: () => any, errorType?: any): Promise<void> {
    let thrown = false;
    let error: any;

    try {
      await fn();
    } catch (e) {
      thrown = true;
      error = e;
    }

    if (!thrown) {
      throw new Error('Expected function to throw an error');
    }

    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error to be instance of ${errorType.name}`);
    }
  }

  // Generate test report
  generateReport(results: TestResult[]): string {
    const report = this.getTestReport(results);
    let output = '\n=== Test Report ===\n';
    output += `Total Tests: ${report.totalTests}\n`;
    output += `Passed: ${report.passed}\n`;
    output += `Failed: ${report.failed}\n`;
    output += `Skipped: ${report.skipped}\n`;
    output += `Duration: ${report.duration.toFixed(2)}ms\n\n`;

    output += '=== Test Results ===\n';
    for (const result of report.results) {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      output += `${status} ${result.name} (${result.duration.toFixed(2)}ms)\n`;
      if (result.error) {
        output += `   Error: ${result.error.message}\n`;
      }
    }

    return output;
  }

  // Mock utilities
  createMock<T>(obj: T): Mocked<T> {
    const mockedObj = { ...obj } as any;
    
    // Add mock properties to functions
    for (const key in obj) {
      if (typeof obj[key] === 'function') {
        mockedObj[key] = this.createSpy(obj[key] as unknown as (...args: any[]) => any);
      }
    }
    
    return mockedObj as Mocked<T>;
  }

  // Spy utilities
  createSpy<T extends (...args: any[]) => any>(fn: T): MockedFunction<T> {
    const calls: Array<Parameters<T>> = [];
    
    const spy = ((...args: Parameters<T>): ReturnType<T> => {
      calls.push(args);
      return fn(...args);
    }) as MockedFunction<T>;
    
    spy.calls = calls;
    spy.mockClear = () => { calls.length = 0; };
    spy.mockReset = () => { calls.length = 0; };
    
    return spy;
  }

  // Assertion utilities
  assert(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEquals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  assertDeepEquals<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr} but got ${actualStr}`);
    }
  }

  assertContains(haystack: string, needle: string, message?: string): void {
    if (!haystack.includes(needle)) {
      throw new Error(message || `Expected "${haystack}" to contain "${needle}"`);
    }
  }

  assertNotEquals<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} to not equal ${expected}`);
    }
  }

  assertTruthy(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected ${value} to be truthy`);
    }
  }

  assertFalsy(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected ${value} to be falsy`);
    }
  }
}

export const testRunner = new TestRunner();

// Export test utilities
export const test = (name: string, category: TestCase['category'], fn: () => Promise<void> | void): void => {
  const id = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  testRunner.registerTest({
    id,
    name,
    description: name,
    category,
    fn
  });
};

export const beforeEach = testRunner.beforeEach.bind(testRunner);
export const afterEach = testRunner.afterEach.bind(testRunner);
export const beforeAll = testRunner.beforeAll.bind(testRunner);
export const afterAll = testRunner.afterAll.bind(testRunner);
export const runTests = testRunner.runAllTests.bind(testRunner);
export const runTestsByCategory = testRunner.runTestsByCategory.bind(testRunner);
export const skipTest = testRunner.skipTest.bind(testRunner);
export const assert = testRunner.assert.bind(testRunner);
export const assertEquals = testRunner.assertEquals.bind(testRunner);
export const assertDeepEquals = testRunner.assertDeepEquals.bind(testRunner);
export const assertContains = testRunner.assertContains.bind(testRunner);
export const assertNotEquals = testRunner.assertNotEquals.bind(testRunner);
export const assertTruthy = testRunner.assertTruthy.bind(testRunner);
export const assertFalsy = testRunner.assertFalsy.bind(testRunner);
export const assertThrows = testRunner.assertThrows.bind(testRunner);
export const createMock = testRunner.createMock.bind(testRunner);
export const createSpy = testRunner.createSpy.bind(testRunner);