'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Activity,
  Eye
} from 'lucide-react';
import SecurityEventsTable, { SecurityEvent } from './security/SecurityEventsTable';
import SecurityIPAnalysis, { IPAnalysis } from './security/SecurityIPAnalysis';
import RecentSecurityEvents from './security/RecentSecurityEvents';



const SecurityMonitoringDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipAnalysisList, setIpAnalysisList] = useState<IPAnalysis[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security-monitoring');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const blockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/security-monitoring/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (response.ok) {
          fetchEvents();
          // Update IP analysis list if needed
          setIpAnalysisList(prev => 
            prev.map(analysis => 
              analysis.ip === ip ? { ...analysis, blocked: analysis.blocked + 1 } : analysis
            )
          );
        }
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  };



  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);



  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SecurityEventsTable events={events} loading={loading} />
                </div>
                <div>
                  <RecentSecurityEvents events={events} loading={loading} maxEvents={5} />
                </div>
              </div>


            </div>
          )}

          {activeTab === 'analysis' && (
            <SecurityIPAnalysis 
              ipAnalysis={ipAnalysisList}
              loading={analysisLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;