import React from 'react';

const generateSparklinePoints = (data = []) => {
  const width = 120;
  const height = 40;
  if (!data || !data.length) return [];

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  return data.map((value, index) => {
    const x = step * index;
    const y = height - ((value - min) / range) * (height - 6) - 3;
    return [x, y];
  });
};

const generateSparklineAreaPath = (data = []) => {
  const points = generateSparklinePoints(data);
  if (!points.length) return '';

  const line = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];

  return `${line} L ${last[0]} 40 L ${first[0]} 40 Z`;
};

const generateSparklineLinePath = (data = []) => {
  const points = generateSparklinePoints(data);
  if (!points.length) return '';

  return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
};

export default function SummaryCards({ cards = [] }) {
  if (!cards || cards.length === 0) {
    return (
      <section className="summary-cards">
        <div className="card empty-state">
          <h4>No summary data</h4>
          <p>Summary cards will appear here once data is available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="summary-cards">
      {cards.map((item) => (
        <article key={item.label} className={`card card-${item.type}`}>
          <div className="card-top">
            <h2>{item.label}</h2>
            <span className={`trend ${item.change.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
              {item.change}
            </span>
          </div>

          <p className="card-value">{item.value}</p>
          <p className="card-subtitle">Micro chart this period to previous period</p>

          <div className="sparkline-container">
            <span className="sparkline-indicator" />
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="sparkline" aria-label={`${item.label} trend`}>
              <path d={generateSparklineAreaPath(item.data)} className="sparkline-area" />
              <path d={generateSparklineLinePath(item.data)} className="sparkline-line" />
            </svg>
          </div>
        </article>
      ))}
    </section>
  );
}
