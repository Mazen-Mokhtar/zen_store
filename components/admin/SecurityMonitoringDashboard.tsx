'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Eye, 
  RefreshCw, 
  Download, 
  Filter, 
  Search,
  Clock,
  Globe,
  User,
  Activity
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userId?: string;
  userAgent?: string;
  blocked: boolean;
  metadata?: Record<string, any>;
}

interface IPAnalysis {
  ip: string;
  country: string;
  city: string;
  isp: string;
  threatLevel: 'low' | 'medium' | 'high';
  isVPN: boolean;
  isProxy: boolean;
  recentEvents: number;
  blocked: boolean;
}

const SecurityMonitoringDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIP, setSelectedIP] = useState('');
  const [ipAnalysis, setIpAnalysis] = useState<IPAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [activeTab, setActiveTab] = useState('events');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/security-monitoring?limit=${limit}&search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, searchTerm]);

  const analyzeIP = async () => {
    if (!selectedIP) return;
    
    setAnalysisLoading(true);
    try {
      const response = await fetch(`/api/admin/security-monitoring/ip-analysis?ip=${encodeURIComponent(selectedIP)}`);
      if (response.ok) {
        const data = await response.json();
        setIpAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to analyze IP:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const blockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/security-monitoring/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (response.ok) {
        fetchEvents();
        if (ipAnalysis?.ip === ip) {
          setIpAnalysis({ ...ipAnalysis, blocked: true });
        }
      }
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  };

  const exportEvents = () => {
    const csv = events.map(event => 
      `${event.timestamp},${event.type},${event.severity},"${event.description}",${event.ipAddress},${event.userId || ''},${event.blocked}`
    ).join('\n');
    
    const blob = new Blob([`Timestamp,Type,Severity,Description,IP Address,User ID,Blocked\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
        </div>
        <button
          onClick={exportEvents}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Security Events
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              IP Analysis
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search IP, user, description..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Limit</label>
                  <select 
                    value={limit.toString()} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLimit(parseInt(e.target.value))} 
                    className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>

                <button
                  onClick={fetchEvents}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Globe className="h-4 w-4 inline mr-1" />
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <User className="h-4 w-4 inline mr-1" />
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {event.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {event.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.userId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!event.blocked && (
                            <button
                              onClick={() => blockIP(event.ipAddress)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            >
                              <Ban className="h-4 w-4" />
                              <span>Block</span>
                            </button>
                          )}
                          {event.blocked && (
                            <span className="text-red-600 flex items-center space-x-1">
                              <Ban className="h-4 w-4" />
                              <span>Blocked</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {events.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No security events found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">IP Address Analysis</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter IP address"
                    value={selectedIP}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedIP(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    onClick={analyzeIP} 
                    disabled={analysisLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {analysisLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {ipAnalysis && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Location Information</h5>
                      <p><strong>Country:</strong> {ipAnalysis.country}</p>
                      <p><strong>City:</strong> {ipAnalysis.city}</p>
                      <p><strong>ISP:</strong> {ipAnalysis.isp}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Threat Assessment</h5>
                      <p><strong>Threat Level:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(ipAnalysis.threatLevel)}`}>
                          {ipAnalysis.threatLevel}
                        </span>
                      </p>
                      <p><strong>VPN:</strong> {ipAnalysis.isVPN ? 'Yes' : 'No'}</p>
                      <p><strong>Proxy:</strong> {ipAnalysis.isProxy ? 'Yes' : 'No'}</p>
                      <p><strong>Recent Events:</strong> {ipAnalysis.recentEvents}</p>
                      <p><strong>Status:</strong> {ipAnalysis.blocked ? 'Blocked' : 'Active'}</p>
                    </div>
                  </div>
                  
                  {!ipAnalysis.blocked && ipAnalysis.threatLevel !== 'low' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => blockIP(ipAnalysis.ip)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                      >
                        <Ban className="h-4 w-4" />
                        <span>Block IP Address</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;