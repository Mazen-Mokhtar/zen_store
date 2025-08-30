'use client';

import * as React from 'react';
import { SecurityEvent } from './SecurityEventsTable';

interface RecentSecurityEventsProps {
  events: SecurityEvent[];
  loading: boolean;
  maxEvents?: number;
}

const RecentSecurityEvents: React.FC<RecentSecurityEventsProps> = ({ 
  events, 
  loading, 
  maxEvents = 10 
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'failed_login':
      case 'brute_force':
        return '🔐';
      case 'suspicious_activity':
        return '⚠️';
      case 'rate_limit_exceeded':
        return '🚫';
      case 'sql_injection':
      case 'xss_attempt':
        return '💉';
      case 'csrf_attempt':
        return '🎭';
      case 'file_upload_violation':
        return '📁';
      default:
        return '🚨';
    }
  };

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

  const recentEvents = events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxEvents);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
        <p className="text-sm text-gray-600 mt-1">Latest security incidents and alerts</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {recentEvents.map((event) => (
          <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {getEventIcon(event.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    {event.blocked && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Blocked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {event.message}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {event.ipAddress && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {event.ipAddress}
                    </span>
                  )}
                  {event.userId && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      User: {event.userId}
                    </span>
                  )}
                  {event.riskScore && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Risk: {event.riskScore}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {recentEvents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No recent security events</p>
            <p className="text-sm mt-1">Your system is secure</p>
          </div>
        )}
      </div>
      
      {recentEvents.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all events →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentSecurityEvents;