'use client';

import * as React from 'react';
import { AlertTriangle, Shield, Ban, Eye, Clock, User, Globe } from 'lucide-react';
import { SecurityEventType, ErrorSeverity } from '../../../lib/securityLogger';

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: ErrorSeverity;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  message: string;
  blocked: boolean;
  riskScore: number;
}

interface SecurityEventsTableProps {
  events: SecurityEvent[];
  loading: boolean;
}

const getSeverityColor = (severity: ErrorSeverity): string => {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'text-red-600 bg-red-50';
    case ErrorSeverity.HIGH:
      return 'text-orange-600 bg-orange-50';
    case ErrorSeverity.MEDIUM:
      return 'text-yellow-600 bg-yellow-50';
    case ErrorSeverity.LOW:
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return <AlertTriangle size={16} className="text-red-600" />;
    case ErrorSeverity.HIGH:
      return <AlertTriangle size={16} className="text-orange-600" />;
    case ErrorSeverity.MEDIUM:
      return <Shield size={16} className="text-yellow-600" />;
    case ErrorSeverity.LOW:
      return <Eye size={16} className="text-green-600" />;
    default:
      return <Shield size={16} className="text-gray-600" />;
  }
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const SecurityEventRow: React.FC<{ event: SecurityEvent }> = ({ event }) => (
  <tr className="hover:bg-gray-50 border-b border-gray-200">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        {getSeverityIcon(event.severity)}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
          {event.severity}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {formatTimestamp(event.timestamp)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
        {event.type}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
      {event.message}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {event.ipAddress && (
        <div className="flex items-center space-x-1">
          <Globe size={14} />
          <span className="font-mono">{event.ipAddress}</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {event.userId && (
        <div className="flex items-center space-x-1">
          <User size={14} />
          <span className="font-mono">{event.userId.substring(0, 8)}...</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          event.riskScore >= 80 ? 'bg-red-500' :
          event.riskScore >= 60 ? 'bg-orange-500' :
          event.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>
        <span className="text-sm font-medium">{event.riskScore}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      {event.blocked ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Ban size={12} className="mr-1" />
          Blocked
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Eye size={12} className="mr-1" />
          Allowed
        </span>
      )}
    </td>
  </tr>
);

const SecurityEventsTable: React.FC<SecurityEventsTableProps> = ({ events, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Shield size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No security events found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Security Events ({events.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>Timestamp</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <SecurityEventRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityEventsTable;
export type { SecurityEvent, SecurityEventsTableProps };