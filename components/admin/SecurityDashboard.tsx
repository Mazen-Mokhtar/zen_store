'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { SecurityEventType, LogLevel, ErrorSeverity } from '../../lib/securityLogger';
import SecurityStatsOverview, { SecurityStats } from './security/SecurityStats';
import SecurityEventsTable, { SecurityEvent } from './security/SecurityEventsTable';
import SecurityLogsTable, { SecurityLog } from './security/SecurityLogsTable';
import SecurityFiltersPanel, { SecurityFilters } from './security/SecurityFilters';

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalLogs: 0,
    totalSecurityEvents: 0,
    highRiskEvents: 0,
    criticalErrors: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'events' | 'export'>('overview');
  const [filters, setFilters] = useState<SecurityFilters>({
    type: 'all',
    severity: '',
    eventType: '',
    limit: 50,
    startDate: '',
    endDate: '',
    userId: '',
    ipAddress: ''
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/security-logs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
        setSecurityEvents(data.data.securityEvents || []);
        setStats(data.data.stats);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch security data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

    } finally {
      setLoading(false);
    }
  };

  // Export security data
  const exportData = async (format: 'json' | 'csv', includeContext: boolean = false) => {
    try {
      const response = await fetch('/api/admin/security-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format, includeContext })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Clear logs (super admin only)
  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all security logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/security-logs?confirm=true', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Clear failed: ${response.statusText}`);
      }

      await fetchSecurityData();
      alert('Security logs cleared successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    }
  };

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, fetchSecurityData, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchSecurityData();
  }, [filters, fetchSecurityData]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor security events and system logs</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
            </label>
            <button
              onClick={fetchSecurityData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

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
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex px-6">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'logs', name: 'Application Logs', icon: '📝' },
            { id: 'events', name: 'Security Events', icon: '🚨' },
            { id: 'export', name: 'Export', icon: '📤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SecurityStatsOverview stats={stats} loading={loading} />

            {/* Recent High-Risk Events */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent High-Risk Events</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {securityEvents
                    .filter(event => event.riskScore >= 70)
                    .slice(0, 10)
                    .map((event) => (
                      <div key={event.id} className="p-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(event.riskScore)}`}>
                                Risk: {event.riskScore}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{event.type}</span>
                              {event.blocked && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  Blocked
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(event.timestamp)} • IP: {event.ipAddress || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {securityEvents.filter(event => event.riskScore >= 70).length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No high-risk events found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <SecurityFiltersPanel 
              filters={filters} 
              onFiltersChange={setFilters}
              onRefresh={fetchSecurityData}
              onExport={exportData}
              onClearLogs={clearLogs}
              loading={loading}
              autoRefresh={autoRefresh}
              onAutoRefreshToggle={setAutoRefresh}
            />

            <SecurityLogsTable logs={logs} loading={loading} />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <SecurityFiltersPanel 
              filters={filters} 
              onFiltersChange={setFilters}
              onRefresh={fetchSecurityData}
              onExport={exportData}
              onClearLogs={clearLogs}
              loading={loading}
              autoRefresh={autoRefresh}
              onAutoRefreshToggle={setAutoRefresh}
            />

            <SecurityEventsTable events={securityEvents} loading={loading} />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Export Security Data</h3>
              <p className="text-blue-700 text-sm">
                Export security logs and events for analysis, compliance, or backup purposes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Export Options</h4>
                
                <div className="space-y-3">
                  <button
                    onClick={() => exportData('json', false)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as JSON (Basic)
                  </button>
                  
                  <button
                    onClick={() => exportData('json', true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as JSON (Full Context)
                  </button>
                  
                  <button
                    onClick={() => exportData('csv', false)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as CSV
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Maintenance</h4>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-2">⚠️ Danger Zone</h5>
                  <p className="text-red-700 text-sm mb-3">
                    Clear all security logs. This action cannot be undone and requires super admin privileges.
                  </p>
                  <button
                    onClick={clearLogs}
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;