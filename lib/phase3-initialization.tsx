// Phase 3 Advanced Systems Initialization
// This file initializes all Phase 3 optimization systems

import React from 'react';
import { initializeMonitoring } from './monitoring-analytics';
import { initializeErrorTracking } from './error-tracking';
import { initializeAccessibility } from './accessibility-compliance';
import { securityHardening } from './security-hardening';
import { seoOptimizer } from './seo-optimization';
import { BundleAnalyzer } from './bundle-analyzer';
import { AdvancedCache } from './advanced-caching';
import { performanceMonitor } from './performance-monitoring';

interface Phase3Config {
  enableMonitoring: boolean;
  enableErrorTracking: boolean;
  enableAccessibility: boolean;
  enableSecurity: boolean;
  enableSEO: boolean;
  enableBundleAnalysis: boolean;
  enableAdvancedCaching: boolean;
  enablePerformanceMonitoring: boolean;
  userId?: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
}

// Default Phase 3 configuration
export const PHASE3_CONFIG: Phase3Config = {
  enableMonitoring: true,
  enableErrorTracking: true,
  enableAccessibility: true,
  enableSecurity: true,
  enableSEO: true,
  enableBundleAnalysis: process.env.NODE_ENV === 'development',
  enableAdvancedCaching: true,
  enablePerformanceMonitoring: true,
  environment: (process.env.NODE_ENV as any) || 'development',
  debug: process.env.NODE_ENV === 'development'
};

// Phase 3 initialization status
export interface InitializationStatus {
  monitoring: boolean;
  errorTracking: boolean;
  accessibility: boolean;
  security: boolean;
  seo: boolean;
  bundleAnalysis: boolean;
  advancedCaching: boolean;
  performanceMonitoring: boolean;
  startTime: number;
  errors: string[];
}

let initializationStatus: InitializationStatus = {
  monitoring: false,
  errorTracking: false,
  accessibility: false,
  security: false,
  seo: false,
  bundleAnalysis: false,
  advancedCaching: false,
  performanceMonitoring: false,
  startTime: 0,
  errors: []
};

// Initialize all Phase 3 systems
export const initializePhase3 = async (config: Partial<Phase3Config> = {}): Promise<InitializationStatus> => {
  const finalConfig = { ...PHASE3_CONFIG, ...config };
  initializationStatus.startTime = Date.now();
  initializationStatus.errors = [];
  
  if (finalConfig.debug) {
    console.group('🚀 Phase 3 Advanced Systems Initialization');
    console.log('Configuration:', finalConfig);
  }

  try {
    // Initialize monitoring and analytics
    if (finalConfig.enableMonitoring) {
      try {
        initializeMonitoring(finalConfig.userId);
        initializationStatus.monitoring = true;
        if (finalConfig.debug) console.log('✅ Monitoring & Analytics initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize monitoring: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize error tracking
    if (finalConfig.enableErrorTracking) {
      try {
        initializeErrorTracking({
          sampleRate: finalConfig.environment === 'production' ? 0.1 : 1.0,
          enableConsoleCapture: finalConfig.debug,
          enableNetworkCapture: true,
          enableUserInteractionCapture: true,
          enablePerformanceCapture: true
        });
        initializationStatus.errorTracking = true;
        if (finalConfig.debug) console.log('✅ Error Tracking initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize error tracking: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize accessibility
    if (finalConfig.enableAccessibility) {
      try {
        initializeAccessibility({
          enableKeyboardNavigation: true,
          enableScreenReaderSupport: true,
          enableHighContrast: true,
          enableFocusManagement: true,
          enableAriaLiveRegions: true,
          enableColorBlindnessSupport: true,
          enableMotionReduction: true,
          announcePageChanges: true,
          announceErrors: true,
          announceSuccess: true
        });
        initializationStatus.accessibility = true;
        if (finalConfig.debug) console.log('✅ Accessibility Compliance initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize accessibility: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize security hardening
    if (finalConfig.enableSecurity) {
      try {
        // Security hardening is already initialized as a global instance
        initializationStatus.security = true;
        if (finalConfig.debug) console.log('✅ Security Hardening initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize security: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize SEO optimization
    if (finalConfig.enableSEO) {
      try {
        // SEO optimizer is already available as a global instance
        initializationStatus.seo = true;
        if (finalConfig.debug) console.log('✅ SEO Optimization initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize SEO: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize bundle analysis (development only)
    if (finalConfig.enableBundleAnalysis) {
      try {
        const bundleAnalyzer = new BundleAnalyzer();
        // Bundle analyzer is ready to use after instantiation
        initializationStatus.bundleAnalysis = true;
        if (finalConfig.debug) console.log('✅ Bundle Analysis initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize bundle analysis: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize advanced caching
    if (finalConfig.enableAdvancedCaching) {
      try {
        const advancedCache = new AdvancedCache({
          maxSize: 100,
          ttl: 3600000, // 1 hour
          updateAgeOnGet: false
        });
        // Advanced cache is ready to use after instantiation
        initializationStatus.advancedCaching = true;
        if (finalConfig.debug) console.log('✅ Advanced Caching initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize advanced caching: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    // Initialize performance monitoring
    if (finalConfig.enablePerformanceMonitoring) {
      try {
        // Performance monitor is already initialized as a global instance
        initializationStatus.performanceMonitoring = true;
        if (finalConfig.debug) console.log('✅ Performance Monitoring initialized');
      } catch (error) {
        const errorMsg = `Failed to initialize performance monitoring: ${error}`;
        initializationStatus.errors.push(errorMsg);
        if (finalConfig.debug) console.error('❌', errorMsg);
      }
    }

    const initTime = Date.now() - initializationStatus.startTime;
    
    if (finalConfig.debug) {
      console.log(`🎉 Phase 3 initialization completed in ${initTime}ms`);
      
      if (initializationStatus.errors.length > 0) {
        console.warn(`⚠️ ${initializationStatus.errors.length} errors occurred during initialization:`);
        initializationStatus.errors.forEach(error => console.warn('  -', error));
      }
      
      console.groupEnd();
    }

    // Report initialization status to monitoring
    if (initializationStatus.monitoring) {
      const { monitoring } = await import('./monitoring-analytics');
      monitoring.trackEvent('phase3_initialization', {
        status: 'completed',
        duration: initTime,
        errors: initializationStatus.errors.length,
        systems: Object.keys(initializationStatus).filter(key => 
          key !== 'startTime' && key !== 'errors' && initializationStatus[key as keyof InitializationStatus]
        )
      });
    }

  } catch (error) {
    const errorMsg = `Critical error during Phase 3 initialization: ${error}`;
    initializationStatus.errors.push(errorMsg);
    
    if (finalConfig.debug) {
      console.error('💥', errorMsg);
      console.groupEnd();
    }
  }

  return initializationStatus;
};

// Get initialization status
export const getInitializationStatus = (): InitializationStatus => {
  return { ...initializationStatus };
};

// Check if all systems are initialized
export const isPhase3Ready = (): boolean => {
  const status = initializationStatus;
  return status.monitoring && 
         status.errorTracking && 
         status.accessibility && 
         status.security && 
         status.seo && 
         status.advancedCaching && 
         status.performanceMonitoring;
};

// Get system health status
export const getSystemHealth = (): {
  overall: 'healthy' | 'degraded' | 'critical';
  systems: Record<string, boolean>;
  errors: string[];
  uptime: number;
} => {
  const systems = {
    monitoring: initializationStatus.monitoring,
    errorTracking: initializationStatus.errorTracking,
    accessibility: initializationStatus.accessibility,
    security: initializationStatus.security,
    seo: initializationStatus.seo,
    bundleAnalysis: initializationStatus.bundleAnalysis,
    advancedCaching: initializationStatus.advancedCaching,
    performanceMonitoring: initializationStatus.performanceMonitoring
  };
  
  const healthySystems = Object.values(systems).filter(Boolean).length;
  const totalSystems = Object.values(systems).length;
  const healthPercentage = (healthySystems / totalSystems) * 100;
  
  let overall: 'healthy' | 'degraded' | 'critical';
  if (healthPercentage >= 90) {
    overall = 'healthy';
  } else if (healthPercentage >= 70) {
    overall = 'degraded';
  } else {
    overall = 'critical';
  }
  
  return {
    overall,
    systems,
    errors: initializationStatus.errors,
    uptime: initializationStatus.startTime ? Date.now() - initializationStatus.startTime : 0
  };
};

// React hook for Phase 3 status
export const usePhase3Status = () => {
  const [status, setStatus] = React.useState(getInitializationStatus());
  const [health, setHealth] = React.useState(getSystemHealth());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getInitializationStatus());
      setHealth(getSystemHealth());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    status,
    health,
    isReady: isPhase3Ready()
  };
};

// Phase 3 status dashboard component
export const Phase3StatusDashboard: React.FC = () => {
  const { status, health, isReady } = usePhase3Status();
  
  return (
    <div className="phase3-status-dashboard">
      <h3>Phase 3 Systems Status</h3>
      
      <div className={`overall-status ${health.overall}`}>
        <span className="status-indicator"></span>
        <span>Overall Status: {health.overall.toUpperCase()}</span>
        {isReady && <span className="ready-badge">READY</span>}
      </div>
      
      <div className="systems-grid">
        {Object.entries(health.systems).map(([system, isHealthy]) => (
          <div key={system} className={`system-status ${isHealthy ? 'healthy' : 'unhealthy'}`}>
            <span className="system-name">{system.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            <span className="system-indicator">{isHealthy ? '✅' : '❌'}</span>
          </div>
        ))}
      </div>
      
      {health.errors.length > 0 && (
        <div className="errors-section">
          <h4>Errors ({health.errors.length})</h4>
          <ul>
            {health.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="uptime-info">
        <span>Uptime: {Math.floor(health.uptime / 1000)}s</span>
      </div>
    </div>
  );
};

// Cleanup all Phase 3 systems
export const cleanupPhase3 = (): void => {
  try {
    // Cleanup monitoring
    if (initializationStatus.monitoring) {
      const { monitoring } = require('./monitoring-analytics');
      monitoring.cleanup();
    }
    
    // Cleanup accessibility
    if (initializationStatus.accessibility) {
      const { accessibilityManager } = require('./accessibility-compliance');
      accessibilityManager.cleanup();
    }
    
    // Reset status
    initializationStatus = {
      monitoring: false,
      errorTracking: false,
      accessibility: false,
      security: false,
      seo: false,
      bundleAnalysis: false,
      advancedCaching: false,
      performanceMonitoring: false,
      startTime: 0,
      errors: []
    };
    
    console.log('🧹 Phase 3 systems cleaned up');
  } catch (error) {
    console.error('Error during Phase 3 cleanup:', error);
  }
};

// Auto-initialize Phase 3 in browser environment
if (typeof window !== 'undefined') {
  // Initialize Phase 3 when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializePhase3();
    });
  } else {
    // DOM is already ready
    initializePhase3();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupPhase3);
}

// Export for manual initialization
const Phase3Manager = {
  initialize: initializePhase3,
  getStatus: getInitializationStatus,
  getHealth: getSystemHealth,
  isReady: isPhase3Ready,
  cleanup: cleanupPhase3
};

export default Phase3Manager;

// Debug Phase 3 systems
export const debugPhase3 = (): void => {
  console.group('🔍 Phase 3 Debug Information');
  
  const status = getInitializationStatus();
  console.log('Initialization Status:', status);
  
  const health = getSystemHealth();
  console.log('System Health:', health);
  
  console.log('Is Ready:', isPhase3Ready());
  
  // Debug individual systems
  if (status.monitoring) {
    const { debugMonitoring } = require('./monitoring-analytics');
    debugMonitoring();
  }
  
  if (status.errorTracking) {
    const { debugErrorTracking } = require('./error-tracking');
    debugErrorTracking();
  }
  
  if (status.accessibility) {
    const { debugAccessibility } = require('./accessibility-compliance');
    debugAccessibility();
  }
  
  console.groupEnd();
};

// Performance metrics for Phase 3
export const getPhase3Metrics = () => {
  const status = getInitializationStatus();
  const health = getSystemHealth();
  
  return {
    initializationTime: status.startTime ? Date.now() - status.startTime : 0,
    systemsOnline: Object.values(health.systems).filter(Boolean).length,
    totalSystems: Object.values(health.systems).length,
    errorCount: health.errors.length,
    healthScore: (Object.values(health.systems).filter(Boolean).length / Object.values(health.systems).length) * 100,
    uptime: health.uptime
  };
};