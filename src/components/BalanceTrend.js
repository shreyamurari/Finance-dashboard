import React from 'react';

export default function BalanceTrend({ trend = [] }) {
  if (!trend || trend.length === 0) {
    return (
      <article className="chart-card">
        <h3>Balance Trend</h3>
        <div className="empty-state">
          <h4>No trend data</h4>
          <p>Balance trend chart will appear here once data is available.</p>
        </div>
      </article>
    );
  }

  const maxTrend = Math.max(...trend.map((item) => item.value));

  return (
    <article className="chart-card">
      <h3>Balance Trend</h3>
      <div className="line-chart" aria-label="Balance trend chart">
        {trend.map((point) => (
          <div
            key={point.month}
            className="line-chart-bar"
            style={{ height: `${(point.value / maxTrend) * 100}%` }}
            title={`${point.month}: ${point.value}`}
          >
            <span>{point.month}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
