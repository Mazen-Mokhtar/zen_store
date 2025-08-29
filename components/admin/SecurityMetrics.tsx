'use client';

import React, { useState, useEffect } from 'react';
import { SecurityEventType, ErrorSeverity } from '../../lib/securityLogger';

interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastUpdated: string;
}

interface ThreatLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
}

interface SecurityMetricsProps {
  className?: string;
  refreshInterval?: number;
}

const SecurityMetrics: React.FC<SecurityMetricsProps> = ({ 
  className = '',
  refreshInterval = 60000 // 1 minute default
}) => {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>({
    level: 'low',
    score: 0,
    factors: [],
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Calculate security metrics from logs and events
  const calculateMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch recent security data
      const response = await fetch('/api/admin/security-logs?limit=1000&type=all');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch security data: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch security data');
      }

      const { logs, securityEvents, stats } = data.data;
      
      // Calculate metrics
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Recent events (last hour)
      const recentEvents = securityEvents.filter((event: any) => 
        new Date(event.timestamp) > oneHourAgo
      );
      
      // Daily events
      const dailyEvents = securityEvents.filter((event: any) => 
        new Date(event.timestamp) > oneDayAgo
      );
      
      // Weekly events
      const weeklyEvents = securityEvents.filter((event: any) => 
        new Date(event.timestamp) > oneWeekAgo
      );

      // Calculate previous period for comparison
      const previousHourEvents = securityEvents.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        return eventTime > new Date(oneHourAgo.getTime() - 60 * 60 * 1000) && eventTime <= oneHourAgo;
      });
      
      const previousDayEvents = securityEvents.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        return eventTime > new Date(oneDayAgo.getTime() - 24 * 60 * 60 * 1000) && eventTime <= oneDayAgo;
      });

      // High-risk events
      const highRiskEvents = securityEvents.filter((event: any) => event.riskScore >= 70);
      const recentHighRisk = highRiskEvents.filter((event: any) => 
        new Date(event.timestamp) > oneHourAgo
      );
      const previousHighRisk = securityEvents.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        return event.riskScore >= 70 && 
               eventTime > new Date(oneHourAgo.getTime() - 60 * 60 * 1000) && 
               eventTime <= oneHourAgo;
      });

      // Blocked events
      const blockedEvents = securityEvents.filter((event: any) => event.blocked);
      const recentBlocked = blockedEvents.filter((event: any) => 
        new Date(event.timestamp) > oneHourAgo
      );
      const previousBlocked = securityEvents.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        return event.blocked && 
               eventTime > new Date(oneHourAgo.getTime() - 60 * 60 * 1000) && 
               eventTime <= oneHourAgo;
      });

      // Failed authentication attempts
      const authFailures = securityEvents.filter((event: any) => 
        event.type === SecurityEventType.AUTHENTICATION_FAILURE
      );
      const recentAuthFailures = authFailures.filter((event: any) => 
        new Date(event.timestamp) > oneHourAgo
      );
      const previousAuthFailures = securityEvents.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        return event.type === SecurityEventType.AUTHENTICATION_FAILURE &&
               eventTime > new Date(oneHourAgo.getTime() - 60 * 60 * 1000) && 
               eventTime <= oneHourAgo;
      });

      // Critical errors from logs
      const criticalLogs = logs.filter((log: any) => log.level === 'critical');
      const recentCritical = criticalLogs.filter((log: any) => 
        new Date(log.timestamp) > oneHourAgo
      );
      const previousCritical = logs.filter((log: any) => {
        const logTime = new Date(log.timestamp);
        return log.level === 'critical' &&
               logTime > new Date(oneHourAgo.getTime() - 60 * 60 * 1000) && 
               logTime <= oneHourAgo;
      });

      // Calculate changes
      const calculateChange = (current: number, previous: number): { change: number, changeType: 'increase' | 'decrease' | 'neutral' } => {
        if (previous === 0) {
          return { change: current > 0 ? 100 : 0, changeType: current > 0 ? 'increase' : 'neutral' };
        }
        const change = ((current - previous) / previous) * 100;
        return {
          change: Math.abs(change),
          changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
        };
      };

      // Build metrics array
      const calculatedMetrics: SecurityMetric[] = [
        {
          id: 'security_events_hour',
          name: 'Security Events (1h)',
          value: recentEvents.length,
          ...calculateChange(recentEvents.length, previousHourEvents.length),
          severity: recentEvents.length > 50 ? 'critical' : recentEvents.length > 20 ? 'high' : recentEvents.length > 5 ? 'medium' : 'low',
          description: 'Security events detected in the last hour',
          lastUpdated: now.toISOString()
        },
        {
          id: 'high_risk_events',
          name: 'High Risk Events',
          value: recentHighRisk.length,
          ...calculateChange(recentHighRisk.length, previousHighRisk.length),
          severity: recentHighRisk.length > 5 ? 'critical' : recentHighRisk.length > 2 ? 'high' : recentHighRisk.length > 0 ? 'medium' : 'low',
          description: 'High-risk security events (score ≥ 70)',
          lastUpdated: now.toISOString()
        },
        {
          id: 'blocked_attempts',
          name: 'Blocked Attempts',
          value: recentBlocked.length,
          ...calculateChange(recentBlocked.length, previousBlocked.length),
          severity: recentBlocked.length > 20 ? 'high' : recentBlocked.length > 10 ? 'medium' : 'low',
          description: 'Blocked malicious attempts in the last hour',
          lastUpdated: now.toISOString()
        },
        {
          id: 'auth_failures',
          name: 'Auth Failures',
          value: recentAuthFailures.length,
          ...calculateChange(recentAuthFailures.length, previousAuthFailures.length),
          severity: recentAuthFailures.length > 10 ? 'critical' : recentAuthFailures.length > 5 ? 'high' : recentAuthFailures.length > 2 ? 'medium' : 'low',
          description: 'Failed authentication attempts',
          lastUpdated: now.toISOString()
        },
        {
          id: 'critical_errors',
          name: 'Critical Errors',
          value: recentCritical.length,
          ...calculateChange(recentCritical.length, previousCritical.length),
          severity: recentCritical.length > 0 ? 'critical' : 'low',
          description: 'Critical system errors requiring immediate attention',
          lastUpdated: now.toISOString()
        },
        {
          id: 'daily_events',
          name: 'Daily Events',
          value: dailyEvents.length,
          change: 0,
          changeType: 'neutral',
          severity: dailyEvents.length > 500 ? 'high' : dailyEvents.length > 200 ? 'medium' : 'low',
          description: 'Total security events in the last 24 hours',
          lastUpdated: now.toISOString()
        }
      ];

      // Calculate overall threat level
      const threatFactors: string[] = [];
      const recommendations: string[] = [];
      let threatScore = 0;

      // Analyze threat factors
      if (recentHighRisk.length > 5) {
        threatFactors.push(`${recentHighRisk.length} high-risk events in the last hour`);
        threatScore += 30;
        recommendations.push('Investigate high-risk security events immediately');
      }

      if (recentAuthFailures.length > 10) {
        threatFactors.push(`${recentAuthFailures.length} authentication failures`);
        threatScore += 25;
        recommendations.push('Review authentication logs for brute force attacks');
      }

      if (recentCritical.length > 0) {
        threatFactors.push(`${recentCritical.length} critical system errors`);
        threatScore += 20;
        recommendations.push('Address critical system errors immediately');
      }

      if (recentEvents.length > 50) {
        threatFactors.push('High volume of security events');
        threatScore += 15;
        recommendations.push('Monitor system for potential DDoS or coordinated attacks');
      }

      const uniqueIPs = new Set(securityEvents
        .filter((event: any) => new Date(event.timestamp) > oneHourAgo && event.ipAddress)
        .map((event: any) => event.ipAddress)
      ).size;
      
      if (uniqueIPs > 20) {
        threatFactors.push(`Activity from ${uniqueIPs} unique IP addresses`);
        threatScore += 10;
        recommendations.push('Review IP-based access patterns for anomalies');
      }

      // Determine threat level
      let threatLevelValue: 'low' | 'medium' | 'high' | 'critical';
      if (threatScore >= 70) {
        threatLevelValue = 'critical';
        recommendations.unshift('IMMEDIATE ACTION REQUIRED: System under potential attack');
      } else if (threatScore >= 40) {
        threatLevelValue = 'high';
        recommendations.unshift('Heightened security monitoring recommended');
      } else if (threatScore >= 20) {
        threatLevelValue = 'medium';
        recommendations.unshift('Continue monitoring security events');
      } else {
        threatLevelValue = 'low';
        recommendations.unshift('Security status normal');
      }

      if (threatFactors.length === 0) {
        threatFactors.push('No significant security threats detected');
      }

      setMetrics(calculatedMetrics);
      setThreatLevel({
        level: threatLevelValue,
        score: threatScore,
        factors: threatFactors,
        recommendations: recommendations
      });
      setLastUpdate(now);
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate security metrics');
      console.error('Error calculating security metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    calculateMetrics();
    
    const interval = setInterval(calculateMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Get severity color classes
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get threat level color
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get change icon
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading security metrics...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security Metrics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time security monitoring and threat assessment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={calculateMetrics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Threat Level */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Threat Level</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getThreatLevelColor(threatLevel.level)}`}>
            {threatLevel.level.toUpperCase()} ({threatLevel.score}/100)
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Threat Factors</h4>
            <ul className="space-y-1">
              {threatLevel.factors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {threatLevel.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">{metric.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(metric.severity)}`}>
                {metric.severity.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              {metric.change > 0 && (
                <div className="flex items-center space-x-1">
                  {getChangeIcon(metric.changeType)}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'increase' ? 'text-red-600' : 
                    metric.changeType === 'decrease' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {metric.change.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
            
            <div className="text-xs text-gray-500">
              Updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityMetrics;