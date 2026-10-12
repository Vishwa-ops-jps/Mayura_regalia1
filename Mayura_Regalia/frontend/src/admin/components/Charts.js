import React from 'react';
import { formatCurrency } from '../utils';

const PALETTE = ['#7a1f2b', '#c9a227', '#a3811a', '#8f2733', '#591722', '#cfa46b', '#4a3f38', '#b98b56'];

export const DailyRevenueChart = ({ data, large = false }) => {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const width = 760;
  const height = large ? 430 : 260;
  const pad = { top: 20, right: 24, bottom: 40, left: 76 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => Number(d.revenue || 0)));
  const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const point = (value, index) => ({
    x: pad.left + step * index,
    y: pad.top + plotHeight - (Number(value || 0) / max) * plotHeight,
  });
  const points = data.map((d, index) => point(d.revenue, index));
  const path = points.map((p, index) => `${index ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const labelIndexes = data.map((_, index) => index).filter((index) => index % 5 === 0 || index === data.length - 1);
  const active = hoverIdx == null ? null : data[hoverIdx];

  return (
    <div className="daily-revenue-chart">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" onMouseLeave={() => setHoverIdx(null)}>
        {[0, 1, 2, 3, 4].map((index) => {
          const value = max - (max / 4) * index;
          const y = pad.top + (plotHeight / 4) * index;
          return (
            <g key={index}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--a-border)" strokeDasharray="3 4" />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--a-text-soft)">{formatCurrency(value)}</text>
            </g>
          );
        })}
        <path d={path || `M ${pad.left} ${pad.top + plotHeight}`} fill="none" stroke="#C9A227" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, index) => (
          <circle key={data[index].date} cx={p.x} cy={p.y} r={hoverIdx === index ? 6 : 3.5} fill="#C9A227" onMouseEnter={() => setHoverIdx(index)} />
        ))}
        {labelIndexes.map((index) => {
          const date = new Date(`${data[index].date}T00:00:00`);
          const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          return <text key={data[index].date} x={points[index].x} y={height - 12} textAnchor="middle" fontSize="10" fill="var(--a-text-soft)">{label}</text>;
        })}
        {hoverIdx != null && <line x1={points[hoverIdx].x} x2={points[hoverIdx].x} y1={pad.top} y2={pad.top + plotHeight} stroke="var(--a-gold)" strokeDasharray="3 3" />}
        {data.map((d, index) => (
          <rect key={`hit-${d.date}`} x={Math.max(pad.left, points[index].x - step / 2)} y={pad.top} width={step} height={plotHeight} fill="transparent" onMouseEnter={() => setHoverIdx(index)} />
        ))}
      </svg>
      {active && (
        <div className="statistic-tooltip daily-revenue-tooltip" style={{ left: `${(points[hoverIdx].x / width) * 100}%` }}>
          <strong>{new Date(`${active.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
          <span><i style={{ background: '#C9A227' }} />Revenue: {formatCurrency(active.revenue)}</span>
          <span>Orders: {active.orders}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Donut chart built from plain SVG circles (no chart library required).
 * Used on the Dashboard to show revenue share by category.
 */
export const DonutChart = ({ data, size = 190, thickness = 26 }) => {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  // Tracks which slice/legend row is active so we can show its price - set on
  // hover (desktop) and on tap (touchscreens, where :hover / <title> tooltips
  // don't fire), and cleared when the finger/mouse leaves.
  const [activeIndex, setActiveIndex] = React.useState(null);
  const active = activeIndex != null ? data[activeIndex] : null;

  return (
    <div className="donut-wrap">
      <div className="donut-svg-holder">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
            {total <= 0 ? (
              <circle r={radius} fill="none" stroke="#f2ece3" strokeWidth={thickness} />
            ) : (
              data.map((d, i) => {
                const fraction = d.revenue / total;
                const dash = Math.max(fraction * circumference, 0);
                const offset = -cumulative;
                cumulative += dash;
                const isActive = activeIndex === i;
                return (
                  <circle
                    key={d.category}
                    r={radius}
                    fill="none"
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={isActive ? thickness + 5 : thickness}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                    opacity={activeIndex == null || isActive ? 1 : 0.45}
                    style={{ cursor: 'pointer', transition: 'stroke-width .15s ease, opacity .15s ease' }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onTouchStart={() => setActiveIndex(activeIndex === i ? null : i)}
                    onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                  >
                    <title>{`${d.category}: ${formatCurrency(d.revenue)}`}</title>
                  </circle>
                );
              })
            )}
          </g>
          <text x="50%" y="47%" textAnchor="middle" className="donut-center-value">
            {active ? formatCurrency(active.revenue) : formatCurrency(total)}
          </text>
          <text x="50%" y="60%" textAnchor="middle" className="donut-center-label">
            {active ? active.category : 'Total sales'}
          </text>
        </svg>
      </div>
      <ul className="donut-legend">
        {data.map((d, i) => (
          <li
            key={d.category}
            className={activeIndex === i ? 'donut-legend-active' : ''}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onTouchStart={() => setActiveIndex(activeIndex === i ? null : i)}
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
          >
            <span className="donut-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="donut-legend-name">{d.category}</span>
            <span className="donut-legend-value">
              {activeIndex === i
                ? formatCurrency(d.revenue)
                : (total > 0 ? `${Math.round((d.revenue / total) * 100)}%` : '0%')}
            </span>
          </li>
        ))}
        {!data.length && <li className="donut-empty">No sales recorded yet.</li>}
      </ul>
    </div>
  );
};

/**
 * Classic filled pie chart (no centre hole, unlike DonutChart) — used on the
 * Dashboard to show order-status distribution (Delivered / Pending /
 * Cancelled / Processing) as simple wedges with a side legend.
 */
export const PieChart = ({ data, size = 190 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let cumulativeAngle = -90;

  const [activeIndex, setActiveIndex] = React.useState(null);
  const active = activeIndex != null ? data[activeIndex] : null;

  const polar = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div className="pie-wrap">
      <div className="pie-svg-holder">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total <= 0 ? (
            <circle cx={cx} cy={cy} r={radius} fill="#f2ece3" />
          ) : (
            data.map((d, i) => {
              const fraction = d.value / total;
              const sweep = fraction * 360;
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + sweep;
              cumulativeAngle = endAngle;
              const isFull = fraction >= 0.999;
              const start = polar(startAngle, radius);
              const end = polar(endAngle, radius);
              const largeArc = sweep > 180 ? 1 : 0;
              const isActive = activeIndex === i;
              const pushR = isActive ? 6 : 0;
              const midAngle = (startAngle + endAngle) / 2;
              const push = polar(midAngle, pushR);
              const path = isFull
                ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} Z`
                : `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
              return (
                <path
                  key={d.label}
                  d={path}
                  fill={d.color || PALETTE[i % PALETTE.length]}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity={activeIndex == null || isActive ? 1 : 0.5}
                  transform={`translate(${push.x - cx}, ${push.y - cy})`}
                  style={{ cursor: 'pointer', transition: 'opacity .15s ease, transform .15s ease' }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onTouchStart={() => setActiveIndex(activeIndex === i ? null : i)}
                  onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                >
                  <title>{`${d.label}: ${d.value} (${total ? Math.round((d.value / total) * 100) : 0}%)`}</title>
                </path>
              );
            })
          )}
        </svg>
      </div>
      <ul className="donut-legend">
        {data.map((d, i) => (
          <li
            key={d.label}
            className={activeIndex === i ? 'donut-legend-active' : ''}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onTouchStart={() => setActiveIndex(activeIndex === i ? null : i)}
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
          >
            <span className="donut-dot" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span className="donut-legend-name">{d.label}</span>
            <span className="donut-legend-value">
              {active === d ? d.value : (total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%')}
            </span>
          </li>
        ))}
        {(!data.length || total <= 0) && <li className="donut-empty">No orders recorded yet.</li>}
      </ul>
    </div>
  );
};

/**
 * Month-by-month revenue chart styled like a stock ticker: each bar is green
 * when revenue rose vs the previous month and red when it fell, with a
 * trend line drawn across the bar tops and a %-change badge per month.
 */
export const StockTrendChart = ({ data }) => {
  if (!data.length) return <div className="empty-table">No revenue history yet.</div>;

  const max = Math.max(1, ...data.map((d) => d.revenue));
  const width = 640;
  const height = 190;
  const padX = 26;
  // Bars stay readable even when most months have little/no revenue yet:
  // a real value gets a real proportional height, a true-zero month still
  // gets a small visible stub instead of vanishing into the white background.
  const minBarHeight = 6;
  const barGap = data.length ? (width - padX * 2) / data.length : 0;

  const points = data.map((d, i) => {
    const x = padX + barGap * i + barGap / 2;
    const barHeight = d.revenue > 0 ? Math.max((d.revenue / max) * (height - 30), minBarHeight) : 0;
    const y = height - barHeight - 4;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="stock-chart-wrap">
      <svg width="100%" height={height + 40} viewBox={`0 0 ${width} ${height + 40}`} preserveAspectRatio="xMidYMid meet">
        {/* Faint reference gridlines so a chart with mostly-small bars still reads as "populated" rather than blank */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`grid${i}`}
            x1={padX}
            x2={width - padX}
            y1={4 + (i * (height - 30)) / 3}
            y2={4 + (i * (height - 30)) / 3}
            stroke="var(--a-border)"
            strokeDasharray="3 4"
          />
        ))}
        {/* Baseline so a run of zero-revenue months still shows an axis instead of empty white space */}
        <line x1={padX} x2={width - padX} y1={height - 4} y2={height - 4} stroke="var(--a-border)" strokeWidth="1.5" />
        {data.map((d, i) => {
          const prev = i > 0 ? data[i - 1].revenue : null;
          const isUp = prev == null ? null : d.revenue >= prev;
          const barHeight = d.revenue > 0 ? Math.max((d.revenue / max) * (height - 30), minBarHeight) : minBarHeight * 0.4;
          const x = padX + barGap * i + barGap * 0.22;
          const barWidth = barGap * 0.56;
          const y = height - barHeight - 4;
          const pctChange = prev ? Math.round(((d.revenue - prev) / prev) * 100) : null;
          const color = isUp === null ? '#a3811a' : isUp ? '#267343' : '#a52d22';
          return (
            <g key={d.month}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={color} opacity="0.85" />
              {pctChange !== null && (
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
                  {pctChange >= 0 ? `▲${pctChange}%` : `▼${Math.abs(pctChange)}%`}
                </text>
              )}
              <text x={x + barWidth / 2} y={height + 20} textAnchor="middle" fontSize="10" fill="#6f6560">{d.label}</text>
            </g>
          );
        })}
        {points.length > 1 && <path d={linePath} fill="none" stroke="#c9a227" strokeWidth="2" strokeDasharray="4 3" />}
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c9a227" />)}
      </svg>
    </div>
  );
};

/**
 * Semi-circle "Target" gauge — shows a single percentage (e.g. order
 * completion rate) as a gilded arc, with the number floating inside the
 * open half and a breakdown row underneath.
 */
export const GaugeChart = ({ percent, size = 220, thickness = 20 }) => {
  const pct = Math.max(0, Math.min(100, percent));
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const gradientId = 'gaugeGoldGrad';

  return (
    <div className="gauge-wrap">
      <svg width={size} height={size / 2 + thickness} viewBox={`0 0 ${size} ${size / 2 + thickness}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E3C468" />
            <stop offset="100%" stopColor="#9C7A12" />
          </linearGradient>
        </defs>
        <path d={pathD} fill="none" stroke="var(--a-border)" strokeWidth={thickness} strokeLinecap="round" pathLength="100" />
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - pct}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="gauge-value">
        <strong>{pct.toFixed(2)}%</strong>
      </div>
    </div>
  );
};

/**
 * "Statistic" panel — multi-line chart plotting revenue and order-count
 * trends together (each normalised to its own scale, 0-100%, so both are
 * legible on one axis), with a hover tooltip showing the real values.
 */
export const MultiLineChart = ({ data, large = false }) => {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const width = 640;
  const height = large ? 430 : 220;
  const padX = 28;
  const padY = 22;

  if (!data.length) return <div className="empty-table">Not enough data yet.</div>;

  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
  const plotY = (val, max) => height - padY - (val / max) * (height - padY * 2);

  const revenuePts = data.map((d, i) => ({ x: padX + stepX * i, y: plotY(d.revenue, maxRevenue) }));
  const ordersPts = data.map((d, i) => ({ x: padX + stepX * i, y: plotY(d.orders, maxOrders) }));
  const linePath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const active = hoverIdx != null ? data[hoverIdx] : null;
  const activeX = hoverIdx != null ? revenuePts[hoverIdx].x : 0;

  return (
    <div className="statistic-chart-wrap">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={padX}
            x2={width - padX}
            y1={padY + (i * (height - padY * 2)) / 3}
            y2={padY + (i * (height - padY * 2)) / 3}
            stroke="var(--a-border)"
            strokeDasharray="3 4"
          />
        ))}
        <path d={linePath(revenuePts)} fill="none" stroke="#C9A227" strokeWidth="2.5" />
        <path d={linePath(ordersPts)} fill="none" stroke="#2C6E9E" strokeWidth="2.5" />
        {hoverIdx != null && (
          <line x1={activeX} x2={activeX} y1={padY} y2={height - padY} stroke="var(--a-gold)" strokeDasharray="3 3" />
        )}
        {revenuePts.map((p, i) => (
          <circle key={`r${i}`} cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3} fill="#C9A227" />
        ))}
        {ordersPts.map((p, i) => (
          <circle key={`o${i}`} cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3} fill="#2C6E9E" />
        ))}
        {data.map((d, i) => (
          <rect
            key={`hit${i}`}
            x={padX + stepX * i - stepX / 2}
            y={0}
            width={stepX || width}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}
        {data.map((d, i) => (
          <text key={`l${i}`} x={padX + stepX * i} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--a-text-soft)">
            {d.label}
          </text>
        ))}
      </svg>
      {active && (
        <div className="statistic-tooltip" style={{ left: `${(activeX / width) * 100}%` }}>
          <strong>{active.label}</strong>
          <span><i style={{ background: '#C9A227' }} />Revenue: {formatCurrency(active.revenue)}</span>
          <span><i style={{ background: '#2C6E9E' }} />Orders: {active.orders}</span>
        </div>
      )}
      <div className="statistic-legend">
        <span><i style={{ background: '#C9A227' }} />Revenue</span>
        <span><i style={{ background: '#2C6E9E' }} />Orders</span>
      </div>
    </div>
  );
};
