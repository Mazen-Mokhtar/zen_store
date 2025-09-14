import React from 'react';

interface PerformanceMonitorProps {
  onReport?: (report: PerformanceReport) => void;
}

interface PerformanceReport {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onReport }) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const report: PerformanceReport = {
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            memoryUsage: (performance as any).memory?.usedJSHeapSize
          };
          onReport?.(report);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    
    return () => observer.disconnect();
  }, [onReport]);

  return (
    <div className="performance-monitor">
      <h3>Performance Monitor</h3>
      <p>Monitoring application performance...</p>
    </div>
  );
};

export default PerformanceMonitor;