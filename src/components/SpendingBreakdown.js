import React from 'react';


export default function SpendingBreakdown({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return (
      <article className="chart-card">
        <h3>Spending Breakdown</h3>
        <div className="empty-state">
          <h4>No spending data</h4>
          <p>Spending breakdown chart will appear here once expense data is available.</p>
        </div>
      </article>
    );
  }

  const maxCategory = Math.max(...categories.map((item) => item.value));

  return (
    <article className="chart-card">
      <h3>Spending Breakdown</h3>
      <div className="category-chart" aria-label="Spending breakdown chart">
        {categories.map((item) => (
          <div key={item.category} className="category-row">
            <span>{item.category}</span>
            <div className="category-bar-wrap">
              <div
                className="category-bar"
                style={{ width: `${(item.value / maxCategory) * 100}%` }}
                aria-label={`${item.category} ${item.value.toFixed(1)}%`}
              />
            </div>
            <span>{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </article>
  );
}
