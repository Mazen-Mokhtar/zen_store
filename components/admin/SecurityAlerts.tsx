'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SecurityEventType, ErrorSeverity } from '../../lib/securityLogger';

interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  timestamp: string;
  riskScore: number;
  ipAddress?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  blocked: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  context?: Record<string, any>;
}

interface SecurityAlertsProps {
  className?: string;
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAlertClick?: (alert: SecurityAlert) => void;
}

const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  className = '',
  maxAlerts = 50,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onAlertClick
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    severity: string;
    type: string;
    acknowledged: string;
    timeRange: string;
  }>({
    severity: '',
    type: '',
    acknowledged: 'unacknowledged',
    timeRange: '24h'
  });
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastAlertCount, setLastAlertCount] = useState(0);

  // Fetch security alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', maxAlerts.toString());
      params.append('type', 'events');
      
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.type) params.append('eventType', filter.type);
      if (filter.timeRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (filter.timeRange) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '6h':
            startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/admin/security-logs?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch security alerts');
      }

      // Transform security events to alerts
      const securityEvents = data.data.securityEvents || [];
      const transformedAlerts: SecurityAlert[] = securityEvents
        .filter((event: any) => {
          // Apply filters
          if (filter.acknowledged === 'acknowledged' && !event.acknowledged) return false;
          if (filter.acknowledged === 'unacknowledged' && event.acknowledged) return false;
          
          // Only show high-risk events as alerts (score >= 50)
          return event.riskScore >= 50;
        })
        .map((event: any) => ({
          id: event.id,
          type: event.type,
          severity: event.severity,
          title: getAlertTitle(event.type, event.severity),
          message: event.message,
          timestamp: event.timestamp,
          riskScore: event.riskScore,
          ipAddress: event.ipAddress,
          userId: event.userId,
          userAgent: event.userAgent,
          url: event.url,
          method: event.method,
          blocked: event.blocked,
          acknowledged: event.acknowledged || false,
          acknowledgedBy: event.acknowledgedBy,
          acknowledgedAt: event.acknowledgedAt,
          context: event.context
        }))
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Play sound for new high-severity alerts
      if (soundEnabled && transformedAlerts.length > lastAlertCount) {
        const newHighSeverityAlerts = transformedAlerts
          .slice(0, transformedAlerts.length - lastAlertCount)
          .filter(alert => 
            (alert.severity === ErrorSeverity.CRITICAL || alert.severity === ErrorSeverity.HIGH) &&
            !alert.acknowledged
          );
        
        if (newHighSeverityAlerts.length > 0) {
          playAlertSound();
        }
      }

      setAlerts(transformedAlerts);
      setLastAlertCount(transformedAlerts.length);
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security alerts');
      console.error('Error fetching security alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, maxAlerts, soundEnabled, lastAlertCount]);

  // Get alert title based on type and severity
  const getAlertTitle = (type: SecurityEventType, severity: ErrorSeverity): string => {
    const severityPrefix = severity === ErrorSeverity.CRITICAL ? '🚨 CRITICAL' : 
                          severity === ErrorSeverity.HIGH ? '⚠️ HIGH' : 
                          severity === ErrorSeverity.MEDIUM ? '⚡ MEDIUM' : '📋 LOW';
    
    const typeMap: Record<SecurityEventType, string> = {
      [SecurityEventType.AUTHENTICATION_FAILURE]: 'Authentication Failure',
      [SecurityEventType.AUTHORIZATION_FAILURE]: 'Authorization Failure',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'Suspicious Activity',
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'Rate Limit Exceeded',
      [SecurityEventType.INVALID_INPUT]: 'Invalid Input Detected',
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 'SQL Injection Attempt',
      [SecurityEventType.XSS_ATTEMPT]: 'XSS Attack Attempt',
      [SecurityEventType.CSRF_ATTEMPT]: 'CSRF Attack Attempt',
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: 'Path Traversal Attempt',
      [SecurityEventType.SESSION_HIJACK_ATTEMPT]: 'Session Hijack Attempt',
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 'Brute Force Attack',
      [SecurityEventType.DATA_BREACH_ATTEMPT]: 'Data Breach Attempt',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'Privilege Escalation',
      [SecurityEventType.MALICIOUS_FILE_UPLOAD]: 'Malicious File Upload',
      [SecurityEventType.SECURITY_SCAN_DETECTED]: 'Security Scan Detected',
      [SecurityEventType.ACCOUNT_LOCKOUT]: 'Account Lockout',
      [SecurityEventType.ACCESS_VIOLATION]: 'Access Violation'
    };
    
    return `${severityPrefix}: ${typeMap[type] || type.replace(/_/g, ' ')}`;
  };

  // Play alert sound
  const playAlertSound = () => {
    try {
      // Create audio context for alert sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.warn('Could not play alert sound:', err);
    }
  };

  // Acknowledge alert(s)
  const acknowledgeAlerts = async (alertIds: string[]) => {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll just update the local state
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { 
              ...alert, 
              acknowledged: true, 
              acknowledgedBy: 'current_user', // Would be actual user ID
              acknowledgedAt: new Date().toISOString() 
            }
          : alert
      ));
      
      setSelectedAlerts(new Set());
    } catch (err) {
      setError('Failed to acknowledge alerts');
    }
  };

  // Auto-refresh alerts
  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, autoRefresh, refreshInterval]);

  // Get severity color
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case ErrorSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ErrorSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-600 bg-red-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle alert selection
  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  // Select all visible alerts
  const selectAllAlerts = () => {
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
    setSelectedAlerts(new Set(unacknowledgedAlerts.map(alert => alert.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedAlerts(new Set());
  };

  if (loading && alerts.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading security alerts...</span>
      </div>
    );
  }

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;
  const criticalCount = alerts.filter(alert => alert.severity === ErrorSeverity.CRITICAL && !alert.acknowledged).length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Alerts</h2>
              <p className="text-sm text-gray-600 mt-1">
                {unacknowledgedCount} unacknowledged alerts
                {criticalCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {criticalCount} critical
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSoundEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">🔊 Sound</span>
            </label>
            
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filter.severity}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filter.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">All Types</option>
            {Object.values(SecurityEventType).map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          
          <select
            value={filter.acknowledged}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(prev => ({ ...prev, acknowledged: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
          
          <select
            value={filter.timeRange}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(prev => ({ ...prev, timeRange: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAlerts.size > 0 && (
        <div className="border-b border-gray-200 px-6 py-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedAlerts.size} alert{selectedAlerts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => acknowledgeAlerts(Array.from(selectedAlerts))}
                className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ✓ Acknowledge
              </button>
              <button
                onClick={clearSelection}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No security alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter.acknowledged === 'unacknowledged' 
                ? 'All alerts have been acknowledged' 
                : 'No alerts match the current filters'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === alerts.filter(alert => !alert.acknowledged).length && alerts.filter(alert => !alert.acknowledged).length > 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.checked ? selectAllAlerts() : clearSelection()}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Select all unacknowledged alerts</span>
              </label>
            </div>
            
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                  alert.acknowledged ? 'opacity-60' : ''
                } ${
                  selectedAlerts.has(alert.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start space-x-4">
                  {!alert.acknowledged && (
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        e.stopPropagation();
                        toggleAlertSelection(alert.id);
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(alert.riskScore)}`}>
                          Risk: {alert.riskScore}
                        </span>
                        {alert.blocked && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Blocked
                          </span>
                        )}
                        {alert.acknowledged && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Acknowledged
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {alert.ipAddress && (
                        <span>IP: {alert.ipAddress}</span>
                      )}
                      {alert.userId && (
                        <span>User: {alert.userId}</span>
                      )}
                      {alert.url && (
                        <span>URL: {alert.url}</span>
                      )}
                      {alert.method && (
                        <span>Method: {alert.method}</span>
                      )}
                    </div>
                    
                    {alert.acknowledged && alert.acknowledgedBy && (
                      <div className="mt-2 text-xs text-green-600">
                        Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt!).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityAlerts;