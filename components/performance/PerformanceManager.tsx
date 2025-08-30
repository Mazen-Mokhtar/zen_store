'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { memoryOptimizer, useMemoryMonitor } from '../../lib/memory-optimization';
import { logger } from '../../lib/utils';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  errorCount: number;
  userInteractions: number;
}

interface PerformanceAlert {
  id: string;
  type: 'memory' | 'render' | 'network' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    networkRequests: 0,
    errorCount: 0,
    userInteractions: 0
  };
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private listeners: ((metrics: PerformanceMetrics, alerts: PerformanceAlert[]) => void)[] = [];
  private startTime = Date.now();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring(): void {
    // Monitor paint and layout metrics
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint and Largest Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.updateMetric('renderTime', entry.startTime);
              
              if (entry.startTime > 3000) { // 3 seconds
                this.addAlert({
                  type: 'render',
                  severity: 'high',
                  message: `Slow ${entry.name}: ${entry.startTime.toFixed(2)}ms`
                });
              }
            }
          }
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Layout shift monitoring
        const layoutObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              const score = (entry as any).value;
              if (score > 0.1) {
                this.addAlert({
                  type: 'render',
                  severity: 'medium',
                  message: `Layout shift detected: ${score.toFixed(3)}`
                });
              }
            }
          }
        });
        
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutObserver);

        // Long task monitoring
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.addAlert({
                type: 'render',
                severity: 'high',
                message: `Long task detected: ${entry.duration.toFixed(2)}ms`
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);

        // Navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
              
              this.updateMetric('renderTime', loadTime);
              
              if (loadTime > 5000) {
                this.addAlert({
                  type: 'network',
                  severity: 'high',
                  message: `Slow page load: ${loadTime.toFixed(2)}ms`
                });
              }
            }
          }
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

      } catch (error) {
        logger.error('Error setting up performance observers:', error);
      }
    }

    // Monitor network requests
    this.monitorNetworkRequests();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor errors
    this.monitorErrors();
  }

  private monitorNetworkRequests(): void {
    const originalFetch = window.fetch;
    let requestCount = 0;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      requestCount++;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.updateMetric('networkRequests', requestCount);
        
        if (duration > 5000) {
          this.addAlert({
            type: 'network',
            severity: 'medium',
            message: `Slow network request: ${duration}ms`
          });
        }
        
        return response;
      } catch (error) {
        this.updateMetric('errorCount', this.metrics.errorCount + 1);
        throw error;
      }
    };
  }

  private monitorMemoryUsage(): void {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usage = memInfo.usedJSHeapSize / (1024 * 1024); // MB
          this.updateMetric('memoryUsage', usage);
          
          if (usage > 100) { // 100MB
            this.addAlert({
              type: 'memory',
              severity: 'high',
              message: `High memory usage: ${usage.toFixed(2)}MB`
            });
          }
        }
      }
    };
    
    memoryOptimizer.trackInterval(setInterval(checkMemory, 10000));
  }

  private monitorUserInteractions(): void {
    let interactionCount = 0;
    
    const trackInteraction = () => {
      interactionCount++;
      this.updateMetric('userInteractions', interactionCount);
    };
    
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      memoryOptimizer.trackEventListener(document, event, trackInteraction, { passive: true });
    });
  }

  private monitorErrors(): void {
    const handleError = (event: Event) => {
      const errorEvent = event as ErrorEvent;
      this.updateMetric('errorCount', this.metrics.errorCount + 1);
      this.addAlert({
        type: 'error',
        severity: 'critical',
        message: `JavaScript error: ${errorEvent.message || 'Unknown error'}`
      });
    };
    
    const handleUnhandledRejection = (event: Event) => {
      const rejectionEvent = event as PromiseRejectionEvent;
      this.updateMetric('errorCount', this.metrics.errorCount + 1);
      this.addAlert({
        type: 'error',
        severity: 'high',
        message: `Unhandled promise rejection: ${rejectionEvent.reason}`
      });
    };
    
    memoryOptimizer.trackEventListener(window, 'error', handleError);
    memoryOptimizer.trackEventListener(window, 'unhandledrejection', handleUnhandledRejection);
  }

  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    this.metrics[key] = value;
    this.notifyListeners();
  }

  private addAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.unshift(newAlert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    this.notifyListeners();
    
    // Log critical alerts
    if (alert.severity === 'critical') {
      logger.error('Critical performance alert:', alert.message);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.metrics, this.alerts);
      } catch (error) {
        logger.error('Error notifying performance listener:', error);
      }
    });
  }

  public subscribe(listener: (metrics: PerformanceMetrics, alerts: PerformanceAlert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.notifyListeners();
    }
  }

  public clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    this.notifyListeners();
  }

  public getPerformanceReport(): {
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    uptime: number;
    score: number;
  } {
    const uptime = Date.now() - this.startTime;
    const unresolvedAlerts = this.alerts.filter(a => !a.resolved);
    
    // Calculate performance score (0-100)
    let score = 100;
    
    // Deduct points for alerts
    unresolvedAlerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });
    
    // Deduct points for high memory usage
    if (this.metrics.memoryUsage > 100) score -= 15;
    
    // Deduct points for slow render times
    if (this.metrics.renderTime > 3000) score -= 10;
    
    score = Math.max(0, score);
    
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      uptime,
      score
    };
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.listeners = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React component for performance monitoring
interface PerformanceManagerProps {
  children: React.ReactNode;
  showAlerts?: boolean;
  alertThreshold?: 'low' | 'medium' | 'high' | 'critical';
}

export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  children,
  showAlerts = false,
  alertThreshold = 'medium'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics());
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(performanceMonitor.getAlerts());
  const { memoryStats, isHighUsage } = useMemoryMonitor();

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics, newAlerts) => {
      setMetrics(newMetrics);
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  const filteredAlerts = useMemo(() => {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const thresholdIndex = severityLevels.indexOf(alertThreshold);
    
    return alerts.filter(alert => {
      const alertIndex = severityLevels.indexOf(alert.severity);
      return alertIndex >= thresholdIndex && !alert.resolved;
    });
  }, [alerts, alertThreshold]);

  const handleResolveAlert = useCallback((alertId: string) => {
    performanceMonitor.resolveAlert(alertId);
  }, []);

  const handleClearResolved = useCallback(() => {
    performanceMonitor.clearResolvedAlerts();
  }, []);

  return (
    <>
      {children}
      
      {showAlerts && filteredAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Performance Alerts ({filteredAlerts.length})
              </h3>
              <button
                onClick={handleClearResolved}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear Resolved
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`p-2 rounded text-xs ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : alert.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex-1">{alert.message}</span>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            
            {isHighUsage && (
              <div className="mt-3 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs">
                ⚠️ High memory usage detected
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Hook for using performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics());
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(performanceMonitor.getAlerts());

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics, newAlerts) => {
      setMetrics(newMetrics);
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  const performanceScore = useMemo(() => {
    return performanceMonitor.getPerformanceReport().score;
  }, [metrics, alerts]);

  return {
    metrics,
    alerts,
    performanceScore,
    resolveAlert: (alertId: string) => performanceMonitor.resolveAlert(alertId),
    clearResolvedAlerts: () => performanceMonitor.clearResolvedAlerts(),
    getReport: () => performanceMonitor.getPerformanceReport()
  };
}

export default PerformanceManager;