'use client';

import * as React from 'react';
import { Activity, Clock, User, Code, Timer } from 'lucide-react';
import { LogLevel } from '../../../lib/securityLogger';

interface SecurityLog {
  id: string;
  level: string;
  timestamp: string;
  message: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
}

interface SecurityLogsTableProps {
  logs: SecurityLog[];
  loading: boolean;
}

const getLogLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'warn':
    case 'warning':
      return 'text-orange-600 bg-orange-50';
    case 'info':
      return 'text-blue-600 bg-blue-50';
    case 'debug':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getLogLevelIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return <Activity size={16} className="text-red-600" />;
    case 'warn':
    case 'warning':
      return <Activity size={16} className="text-orange-600" />;
    case 'info':
      return <Activity size={16} className="text-blue-600" />;
    case 'debug':
      return <Activity size={16} className="text-gray-600" />;
    default:
      return <Activity size={16} className="text-gray-600" />;
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

const formatDuration = (duration?: number): string => {
  if (!duration) return '-';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
};

const SecurityLogRow: React.FC<{ log: SecurityLog }> = ({ log }) => (
  <tr className="hover:bg-gray-50 border-b border-gray-200">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        {getLogLevelIcon(log.level)}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
          {log.level.toUpperCase()}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="flex items-center space-x-1">
        <Clock size={14} className="text-gray-400" />
        <span>{formatTimestamp(log.timestamp)}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
      <div className="truncate" title={log.message}>
        {log.message}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {log.component && (
        <div className="flex items-center space-x-1">
          <Code size={14} className="text-gray-400" />
          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
            {log.component}
          </span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {log.action && (
        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          {log.action}
        </span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {log.userId && (
        <div className="flex items-center space-x-1">
          <User size={14} className="text-gray-400" />
          <span className="font-mono">{log.userId.substring(0, 8)}...</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {log.sessionId && (
        <span className="font-mono text-xs">{log.sessionId.substring(0, 8)}...</span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {log.duration && (
        <div className="flex items-center space-x-1">
          <Timer size={14} className="text-gray-400" />
          <span className="font-mono">{formatDuration(log.duration)}</span>
        </div>
      )}
    </td>
  </tr>
);

const SecurityLogsTable: React.FC<SecurityLogsTableProps> = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security Logs</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-2/5"></div>
                <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                <div className="h-4 bg-gray-200 rounded w-1/8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security Logs</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Activity size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No security logs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Security Logs ({logs.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>Timestamp</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Code size={14} />
                  <span>Component</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <User size={14} />
                  <span>User ID</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Timer size={14} />
                  <span>Duration</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <SecurityLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityLogsTable;
export type { SecurityLog, SecurityLogsTableProps };