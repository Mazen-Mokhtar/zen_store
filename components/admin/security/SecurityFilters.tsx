'use client';

import * as React from 'react';
import { Filter, RefreshCw, Download, Trash2, Calendar, User, Globe } from 'lucide-react';
import { SecurityEventType, ErrorSeverity } from '../../../lib/securityLogger';

interface SecurityFilters {
  type: string;
  severity: string;
  eventType: string;
  limit: number;
  startDate: string;
  endDate: string;
  userId: string;
  ipAddress: string;
}

interface SecurityFiltersProps {
  filters: SecurityFilters;
  onFiltersChange: (filters: SecurityFilters) => void;
  onRefresh: () => void;
  onExport: (format: 'json' | 'csv', includeContext: boolean) => void;
  onClearLogs: () => void;
  loading: boolean;
  autoRefresh: boolean;
  onAutoRefreshToggle: (enabled: boolean) => void;
}

const SecurityFiltersPanel: React.FC<SecurityFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  onClearLogs,
  loading,
  autoRefresh,
  onAutoRefreshToggle
}) => {
  const handleFilterChange = (key: keyof SecurityFilters, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      type: 'all',
      severity: '',
      eventType: '',
      limit: 50,
      startDate: '',
      endDate: '',
      userId: '',
      ipAddress: ''
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="mr-2" size={20} />
          Security Filters & Controls
        </h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto Refresh</span>
          </label>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Data Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Data</option>
            <option value="logs">Security Logs</option>
            <option value="events">Security Events</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Severity Level
          </label>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Severities</option>
            <option value={ErrorSeverity.CRITICAL}>Critical</option>
            <option value={ErrorSeverity.HIGH}>High</option>
            <option value={ErrorSeverity.MEDIUM}>Medium</option>
            <option value={ErrorSeverity.LOW}>Low</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <select
            value={filters.eventType}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Events</option>
            {Object.values(SecurityEventType).map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Results Limit
          </label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={25}>25 Results</option>
            <option value={50}>50 Results</option>
            <option value={100}>100 Results</option>
            <option value={250}>250 Results</option>
            <option value={500}>500 Results</option>
          </select>
        </div>
      </div>

      {/* Date Range and Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline mr-1" size={14} />
            Start Date
          </label>
          <input
            type="datetime-local"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline mr-1" size={14} />
            End Date
          </label>
          <input
            type="datetime-local"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* User ID Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="inline mr-1" size={14} />
            User ID
          </label>
          <input
            type="text"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            placeholder="Filter by user ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* IP Address Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="inline mr-1" size={14} />
            IP Address
          </label>
          <input
            type="text"
            value={filters.ipAddress}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
            placeholder="Filter by IP address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onExport('json', false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="mr-1 h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={() => onExport('csv', false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Clear Logs Button */}
          <button
            onClick={onClearLogs}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityFiltersPanel;
export type { SecurityFilters, SecurityFiltersProps };