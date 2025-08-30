'use client';

import * as React from 'react';
import { Shield, AlertTriangle, Activity, Clock } from 'lucide-react';

interface SecurityStats {
  totalLogs: number;
  totalSecurityEvents: number;
  highRiskEvents: number;
  criticalErrors: number;
  recentActivity: number;
}

interface SecurityStatsProps {
  stats: SecurityStats;
  loading: boolean;
}

const SecurityStatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}> = ({ title, value, icon, color, description }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  </div>
);

const SecurityStatsOverview: React.FC<SecurityStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <SecurityStatsCard
        title="Total Logs"
        value={stats.totalLogs}
        icon={<Activity size={24} />}
        color="border-blue-500"
        description="All security logs"
      />
      
      <SecurityStatsCard
        title="Security Events"
        value={stats.totalSecurityEvents}
        icon={<Shield size={24} />}
        color="border-green-500"
        description="Security incidents"
      />
      
      <SecurityStatsCard
        title="High Risk Events"
        value={stats.highRiskEvents}
        icon={<AlertTriangle size={24} />}
        color="border-yellow-500"
        description="Requires attention"
      />
      
      <SecurityStatsCard
        title="Critical Errors"
        value={stats.criticalErrors}
        icon={<AlertTriangle size={24} />}
        color="border-red-500"
        description="Immediate action needed"
      />
      
      <SecurityStatsCard
        title="Recent Activity"
        value={stats.recentActivity}
        icon={<Clock size={24} />}
        color="border-purple-500"
        description="Last 24 hours"
      />
    </div>
  );
};

export default SecurityStatsOverview;
export type { SecurityStats, SecurityStatsProps };