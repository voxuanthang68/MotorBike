'use client';

import React, { useState } from 'react';

export interface MonthlyChartDatum {
  label: string;
  inspections: number;
  maintenance: number;
  repairs: number;
  cost: number;
}

export function MonthlyWorkBarChart({ data }: { data: MonthlyChartDatum[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(
    10,
    ...data.flatMap(d => [d.inspections, d.maintenance, d.repairs])
  );
  const ceilMax = Math.ceil(maxVal / 5) * 5;

  const chartHeight = 190;
  const chartWidth = 560;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 14;
  const padBottom = 30;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;
  const groupW = innerW / data.length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#16a34a', display: 'inline-block' }} />
          Kiểm tra trả xe
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2563eb', display: 'inline-block' }} />
          Bảo dưỡng
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#dc2626', display: 'inline-block' }} />
          Sửa chữa
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', minWidth: '420px', height: '220px', display: 'block' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
            const y = padTop + innerH * (1 - t);
            const val = Math.round(ceilMax * t);
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                  {val}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const gx = padLeft + i * groupW + groupW * 0.16;
            const barW = Math.max(10, Math.min(18, (groupW * 0.68) / 3 - 2));
            const gap = 4;

            const h1 = (d.inspections / ceilMax) * innerH;
            const h2 = (d.maintenance / ceilMax) * innerH;
            const h3 = (d.repairs / ceilMax) * innerH;

            return (
              <g
                key={d.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {hoveredIdx === i && (
                  <rect
                    x={padLeft + i * groupW + 4}
                    y={padTop}
                    width={groupW - 8}
                    height={innerH}
                    rx="6"
                    fill="#f8fafc"
                  />
                )}
                <rect
                  x={gx}
                  y={padTop + innerH - h1}
                  width={barW}
                  height={Math.max(2, h1)}
                  rx="4"
                  fill="#16a34a"
                />
                <rect
                  x={gx + barW + gap}
                  y={padTop + innerH - h2}
                  width={barW}
                  height={Math.max(2, h2)}
                  rx="4"
                  fill="#2563eb"
                />
                <rect
                  x={gx + (barW + gap) * 2}
                  y={padTop + innerH - h3}
                  width={barW}
                  height={Math.max(2, h3)}
                  rx="4"
                  fill="#dc2626"
                />
                <text
                  x={padLeft + i * groupW + groupW / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#475569"
                  fontWeight="700"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            style={{
              marginTop: '6px',
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155'
            }}
          >
            <strong>Tháng {data[hoveredIdx].label}:</strong>
            <span>
              Kiểm tra: <strong style={{ color: '#16a34a' }}>{data[hoveredIdx].inspections}</strong> • Bảo dưỡng:{' '}
              <strong style={{ color: '#2563eb' }}>{data[hoveredIdx].maintenance}</strong> • Sửa chữa:{' '}
              <strong style={{ color: '#dc2626' }}>{data[hoveredIdx].repairs}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function VehicleStatusDonutChart({
  segments
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 56;
  const cx = 74;
  const cy = 74;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '148px', height: '148px', flexShrink: 0, margin: '0 auto' }}>
        <svg viewBox="0 0 148 148" style={{ width: '148px', height: '148px', transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {segments.map((seg, idx) => {
            const len = (seg.value / total) * circumference;
            const dashArray = `${Math.max(0, len - 2)} ${circumference}`;
            const dashOffset = -offset;
            offset += len;
            if (seg.value <= 0) return null;
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {segments.reduce((s, x) => s + x.value, 0)}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>
            Tổng xe
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {segments.map((seg, idx) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
                <span>{seg.label}</span>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{seg.value}</strong>
                <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CostTrendLineChart({ data }: { data: MonthlyChartDatum[] }) {
  const maxCost = Math.max(1000000, ...data.map(d => d.cost));
  const ceilCost = Math.ceil(maxCost / 1000000) * 1000000;
  const w = 540;
  const h = 210;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const pts = data.map((d, i) => {
    const x = padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padT + innerH - (d.cost / ceilCost) * innerH;
    return { x, y, ...d };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1]?.x || padL} ${padT + innerH} L ${pts[0]?.x || padL} ${padT + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', minWidth: '400px', height: '220px', display: 'block' }}>
      <defs>
        <linearGradient id="techCostGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
        const y = padT + innerH * (1 - t);
        const val = ((ceilCost * t) / 1000000).toFixed(1);
        return (
          <g key={idx}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
              {val}M
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#techCostGrad)" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map(p => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="700">
            {(p.cost / 1000000).toFixed(1)}M
          </text>
          <text x={p.x} y={h - 8} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="700">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
