import React from 'react';

interface MonitoringConfig {
  enabled?: boolean;
  sampleRate?: number;
  endpoint?: string;
}

interface AnalyticsDashboardProps {
  config?: MonitoringConfig;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ config }) => {
  const [metrics, setMetrics] = React.useState({
    pageViews: 0,
    userSessions: 0,
    averageLoadTime: 0,
    errorRate: 0
  });

  React.useEffect(() => {
    if (!config?.enabled) return;

    // Simulate analytics data collection
    const interval = setInterval(() => {
      setMetrics(prev => ({
        pageViews: prev.pageViews + Math.floor(Math.random() * 5),
        userSessions: prev.userSessions + Math.floor(Math.random() * 2),
        averageLoadTime: Math.random() * 1000 + 500,
        errorRate: Math.random() * 0.05
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [config]);

  if (!config?.enabled) {
    return (
      <div className="analytics-dashboard disabled">
        <p>Analytics monitoring is disabled</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <h3>Analytics Dashboard</h3>
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Page Views</h4>
          <span className="metric-value">{metrics.pageViews}</span>
        </div>
        <div className="metric-card">
          <h4>User Sessions</h4>
          <span className="metric-value">{metrics.userSessions}</span>
        </div>
        <div className="metric-card">
          <h4>Avg Load Time</h4>
          <span className="metric-value">{metrics.averageLoadTime.toFixed(0)}ms</span>
        </div>
        <div className="metric-card">
          <h4>Error Rate</h4>
          <span className="metric-value">{(metrics.errorRate * 100).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;