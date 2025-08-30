'use client';

import * as React from 'react';

export interface IPAnalysis {
  ip: string;
  requests: number;
  blocked: number;
  riskScore: number;
  lastSeen: string;
  country?: string;
  city?: string;
  isp?: string;
}

interface SecurityIPAnalysisProps {
  ipAnalysis: IPAnalysis[];
  loading: boolean;
}

const SecurityIPAnalysis: React.FC<SecurityIPAnalysisProps> = ({ ipAnalysis, loading }) => {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">IP Address Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">Top suspicious IP addresses and their activity</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ipAnalysis.map((ip, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {ip.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ip.requests.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="text-red-600 font-medium">{ip.blocked}</span>
                  {ip.requests > 0 && (
                    <span className="text-gray-500 ml-1">
                      ({Math.round((ip.blocked / ip.requests) * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(ip.riskScore)}`}>
                    {ip.riskScore}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ip.city && ip.country ? `${ip.city}, ${ip.country}` : ip.country || '-'}
                  {ip.isp && (
                    <div className="text-xs text-gray-400">{ip.isp}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(ip.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {ipAnalysis.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No IP analysis data available
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityIPAnalysis;