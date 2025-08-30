'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import React from 'react';
import { logger } from './utils';

// Memory optimization utilities for React components
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Map<string, { element: EventTarget; event: string; handler: EventListener }[]> = new Map();
  private observers: Set<IntersectionObserver | MutationObserver | ResizeObserver> = new Set();
  private abortControllers: Set<AbortController> = new Set();
  private memoryUsage: { timestamp: number; usage: number }[] = [];
  private readonly MAX_MEMORY_HISTORY = 100;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Monitor memory usage
      this.startMemoryMonitoring();
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
      
      // Cleanup on visibility change (tab switch)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.performGarbageCollection();
        }
      });
    }
  }

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  // Track intervals to prevent memory leaks
  trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  // Track timeouts to prevent memory leaks
  trackTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.timeouts.add(timeout);
    return timeout;
  }

  // Track event listeners
  trackEventListener(element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    const key = `${element.constructor.name}_${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push({ element, event, handler });
    element.addEventListener(event, handler, options);
  }

  // Track observers
  trackObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    this.observers.add(observer);
  }

  // Track abort controllers
  trackAbortController(controller: AbortController): AbortController {
    this.abortControllers.add(controller);
    return controller;
  }

  // Clear specific interval
  clearTrackedInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  // Clear specific timeout
  clearTrackedTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout);
    this.timeouts.delete(timeout);
  }

  // Remove specific event listener
  removeTrackedEventListener(element: EventTarget, event: string, handler: EventListener): void {
    const key = `${element.constructor.name}_${event}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.findIndex(l => l.element === element && l.event === event && l.handler === handler);
      if (index !== -1) {
        element.removeEventListener(event, handler);
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.eventListeners.delete(key);
        }
      }
    }
  }

  // Monitor memory usage
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
          this.memoryUsage.push({ timestamp: Date.now(), usage });
          
          // Keep only recent history
          if (this.memoryUsage.length > this.MAX_MEMORY_HISTORY) {
            this.memoryUsage.shift();
          }
          
          // Alert if memory usage is high
          if (usage > 0.9) {
            logger.warn('High memory usage detected:', usage);
            this.performGarbageCollection();
          }
        }
      };
      
      this.trackInterval(setInterval(checkMemory, 30000)); // Check every 30 seconds
    }
  }

  // Perform garbage collection
  private performGarbageCollection(): void {
    // Clear old timeouts and intervals
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.timeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    
    // Disconnect observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    
    // Abort pending requests
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    
    // Clear collections
    this.intervals.clear();
    this.timeouts.clear();
    this.observers.clear();
    this.abortControllers.clear();
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Get memory statistics
  getMemoryStats(): { current: number; average: number; peak: number } | null {
    if (this.memoryUsage.length === 0) return null;
    
    const current = this.memoryUsage[this.memoryUsage.length - 1].usage;
    const average = this.memoryUsage.reduce((sum, item) => sum + item.usage, 0) / this.memoryUsage.length;
    const peak = Math.max(...this.memoryUsage.map(item => item.usage));
    
    return { current, average, peak };
  }

  // Cleanup all tracked resources
  cleanup(): void {
    this.performGarbageCollection();
    
    // Remove all event listeners
    this.eventListeners.forEach((listeners, key) => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }
}

export const memoryOptimizer = MemoryOptimizer.getInstance();

// React hooks for memory optimization

// Optimized useEffect that automatically cleans up
export function useOptimizedEffect(
  effect: () => void | (() => void),
  deps?: React.DependencyList
): void {
  const cleanupRef = useRef<(() => void) | void>();
  
  useEffect(() => {
    // Clean up previous effect
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    
    // Run new effect
    cleanupRef.current = effect();
    
    // Return cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);
}

// Optimized interval hook
export function useOptimizedInterval(
  callback: () => void,
  delay: number | null,
  immediate = false
): void {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    if (immediate) {
      savedCallback.current();
    }
    
    const interval = memoryOptimizer.trackInterval(
      setInterval(() => savedCallback.current(), delay)
    );
    
    return () => memoryOptimizer.clearTrackedInterval(interval);
  }, [delay, immediate]);
}

// Optimized timeout hook
export function useOptimizedTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const timeout = memoryOptimizer.trackTimeout(
      setTimeout(() => savedCallback.current(), delay)
    );
    
    return () => memoryOptimizer.clearTrackedTimeout(timeout);
  }, [delay]);
}

// Optimized event listener hook
export function useOptimizedEventListener<T extends EventTarget>(
  element: T | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    if (!element) return;
    
    const eventHandler = (e: Event) => savedHandler.current(e);
    memoryOptimizer.trackEventListener(element, event, eventHandler, options);
    
    return () => {
      memoryOptimizer.removeTrackedEventListener(element, event, eventHandler);
    };
  }, [element, event, options]);
}

// Optimized fetch hook with abort controller
export function useOptimizedFetch<T>(
  url: string | null,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = useCallback(async () => {
    if (!url) return;
    
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const controller = memoryOptimizer.trackAbortController(new AbortController());
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url, options]);
  
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}

// Memoized component wrapper
export function withMemoryOptimization<P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, (prevProps, nextProps) => {
    // Deep comparison for props
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

// Debounced value hook
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useOptimizedTimeout(() => {
    setDebouncedValue(value);
  }, delay);
  
  return debouncedValue;
}

// Throttled callback hook
export function useThrottled<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
}

// Memory usage monitor hook
export function useMemoryMonitor(): {
  memoryStats: { current: number; average: number; peak: number } | null;
  isHighUsage: boolean;
} {
  const [memoryStats, setMemoryStats] = useState<{ current: number; average: number; peak: number } | null>(null);
  
  useOptimizedInterval(() => {
    const stats = memoryOptimizer.getMemoryStats();
    setMemoryStats(stats);
  }, 5000); // Update every 5 seconds
  
  const isHighUsage = useMemo(() => {
    return memoryStats ? memoryStats.current > 0.8 : false;
  }, [memoryStats]);
  
  return { memoryStats, isHighUsage };
}

// Component cleanup hook
export function useComponentCleanup(cleanupFn: () => void): void {
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
}

// Export types
export interface MemoryStats {
  current: number;
  average: number;
  peak: number;
}

export interface OptimizedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}