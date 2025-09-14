'use client';

import React, { useState } from 'react';
import SecurityDashboard from '../../../components/admin/SecurityDashboard';
import SecurityMetrics from '../../../components/admin/SecurityMetrics';
import SecurityAlerts from '../../../components/admin/SecurityAlerts';
import SecurityMonitoringDashboard from '../../../components/admin/SecurityMonitoringDashboard';

interface SecurityAlertDetail {
  id: string;
  type: string;
  severity: string;
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
  context?: Record<string, any>;
}

const SecurityPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'dashboard' | 'metrics' | 'alerts' | 'monitoring'>('overview');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertDetail | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Handle alert click
  const handleAlertClick = (alert: any) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  // Close alert modal
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setSelectedAlert(null);
  };

  // Format alert details for display
  const formatAlertDetails = (alert: SecurityAlertDetail) => {
    const details = [];
    
    if (alert.ipAddress) details.push({ label: 'IP Address', value: alert.ipAddress });
    if (alert.userId) details.push({ label: 'User ID', value: alert.userId });
    if (alert.userAgent) details.push({ label: 'User Agent', value: alert.userAgent });
    if (alert.url) details.push({ label: 'URL', value: alert.url });
    if (alert.method) details.push({ label: 'HTTP Method', value: alert.method });
    
    details.push({ label: 'Risk Score', value: alert.riskScore.toString() });
    details.push({ label: 'Blocked', value: alert.blocked ? 'Yes' : 'No' });
    details.push({ label: 'Timestamp', value: new Date(alert.timestamp).toLocaleString() });
    
    return details;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">🛡️ Security Center</h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <button
                    onClick={() => setActiveView('overview')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeView === 'overview'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    📊 Overview
                  </button>
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeView === 'dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    📈 Dashboard
                  </button>
                  <button
                    onClick={() => setActiveView('metrics')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeView === 'metrics'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    📊 Metrics
                  </button>
                  <button
                    onClick={() => setActiveView('alerts')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeView === 'alerts'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🚨 Alerts
                  </button>
                  <button
                    onClick={() => setActiveView('monitoring')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeView === 'monitoring'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    👁️ Monitoring
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="overview">📊 Overview</option>
            <option value="dashboard">📈 Dashboard</option>
            <option value="metrics">📊 Metrics</option>
            <option value="alerts">🚨 Alerts</option>
            <option value="monitoring">👁️ Monitoring</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Security Overview</h2>
              <p className="text-blue-100 mb-4">
                Monitor your application&apos;s security status, track threats, and manage security events in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-2xl font-bold">🛡️</div>
                  <div className="text-sm font-medium">Real-time Protection</div>
                  <div className="text-xs text-blue-100">Active monitoring & blocking</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-2xl font-bold">📊</div>
                  <div className="text-sm font-medium">Advanced Analytics</div>
                  <div className="text-xs text-blue-100">Threat intelligence & metrics</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-2xl font-bold">🚨</div>
                  <div className="text-sm font-medium">Instant Alerts</div>
                  <div className="text-xs text-blue-100">Immediate threat notifications</div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <SecurityMetrics className="" refreshInterval={60000} />
            
            {/* Recent Alerts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Alerts</h3>
              <SecurityAlerts 
                className="" 
                maxAlerts={10} 
                autoRefresh={true}
                onAlertClick={handleAlertClick}
              />
            </div>
          </div>
        )}

        {activeView === 'dashboard' && (
          <div>
            <SecurityDashboard className="" />
          </div>
        )}

        {activeView === 'metrics' && (
          <div>
            <SecurityMetrics className="" refreshInterval={30000} />
          </div>
        )}

        {activeView === 'alerts' && (
          <div>
            <SecurityAlerts 
              className="" 
              maxAlerts={100} 
              autoRefresh={true}
              refreshInterval={15000}
              onAlertClick={handleAlertClick}
            />
          </div>
        )}

        {activeView === 'monitoring' && (
          <div>
            <SecurityMonitoringDashboard />
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {showAlertModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Security Alert Details
                </h3>
                <button
                  onClick={closeAlertModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-4">
                {/* Alert Title */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedAlert.title}</h4>
                  <p className="text-gray-600 mt-1">{selectedAlert.message}</p>
                </div>

                {/* Alert Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedAlert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedAlert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAlert.riskScore >= 90 ? 'bg-red-100 text-red-800' :
                    selectedAlert.riskScore >= 70 ? 'bg-orange-100 text-orange-800' :
                    selectedAlert.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Risk: {selectedAlert.riskScore}
                  </span>
                  {selectedAlert.blocked && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Blocked
                    </span>
                  )}
                  {selectedAlert.acknowledged && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ Acknowledged
                    </span>
                  )}
                </div>

                {/* Alert Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Alert Details</h5>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formatAlertDetails(selectedAlert).map((detail, index) => (
                      <div key={index}>
                        <dt className="text-sm font-medium text-gray-500">{detail.label}</dt>
                        <dd className="text-sm text-gray-900 mt-1 break-all">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Context Information */}
                {selectedAlert.context && Object.keys(selectedAlert.context).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Additional Context</h5>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedAlert.context, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeAlertModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                  {!selectedAlert.acknowledged && (
                    <button
                      onClick={() => {
                        // In a real implementation, this would call an API to acknowledge the alert
                        closeAlertModal();
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPage;