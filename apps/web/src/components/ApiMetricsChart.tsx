'use client';

import React, { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface MetricSummary {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  successRate: number;
  avgLatency: number;
}

interface MetricPoint {
  label: string;
  date: string;
  hits: number;
  success: number;
  error: number;
}

interface TopEndpoint {
  id: string;
  name: string;
  slug: string;
  method: string;
  isActive: boolean;
  hits: number;
  success: number;
  error: number;
}

interface AnalyticsData {
  range: string;
  summary: MetricSummary;
  series: MetricPoint[];
  topEndpoints: TopEndpoint[];
}

export default function ApiMetricsChart() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await endpoints.analytics(selectedRange);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load API metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const series = data?.series || [];
  const maxHits = Math.max(...series.map((s) => s.hits), 6);
  const summary = data?.summary || {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    successRate: 100,
    avgLatency: 0,
  };

  // SVG dimensions
  const svgWidth = 760;
  const svgHeight = 220;
  const paddingX = 30;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Calculate points
  const points = series.map((item, idx) => {
    const x =
      series.length > 1
        ? paddingX + (idx / (series.length - 1)) * graphWidth
        : paddingX + graphWidth / 2;
    const y = paddingY + graphHeight - (item.hits / maxHits) * graphHeight;
    return { x, y, ...item };
  });

  // Construct SVG Area and Line path
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth curve using cubic bezier
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = paddingY + graphHeight;
    areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header with Title & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Metrik Hit API Sandbox</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full border border-primary/20">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statistik panggilan endpoint, latensi rata-rata, dan tingkat keberhasilan request.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  range === r
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === '24h' ? '24 Jam' : r === '7d' ? '7 Hari' : '30 Hari'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(range)}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            title="Muat ulang metrik"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Hits */}
        <div className="p-4 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Panggilan
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {summary.totalRequests.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ArrowTrendingUpIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Success Rate
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-bold text-emerald-500">{summary.successRate}%</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Latency */}
        <div className="p-4 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Rata-rata Latensi
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {summary.avgLatency} <span className="text-xs font-normal text-muted-foreground">ms</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Errors */}
        <div className="p-4 rounded-xl bg-background border border-border/80 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Gagal (Error)
            </p>
            <p className={`text-2xl font-bold mt-1 ${summary.errorRequests > 0 ? 'text-rose-500' : 'text-foreground'}`}>
              {summary.errorRequests.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ExclamationCircleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="relative p-5 rounded-2xl bg-background/60 border border-border/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-foreground">Grafik Tren Panggilan API</span>
          </div>

          {activePoint && (
            <div className="text-xs font-mono bg-card px-3 py-1 rounded-lg border border-border shadow-xs flex items-center gap-3">
              <span className="text-muted-foreground">{activePoint.label}</span>
              <span className="font-bold text-primary">{activePoint.hits} hits</span>
              <span className="text-emerald-500 font-semibold">{activePoint.success} ok</span>
              {activePoint.error > 0 && (
                <span className="text-rose-500 font-semibold">{activePoint.error} err</span>
              )}
            </div>
          )}
        </div>

        {/* SVG Graph */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + graphHeight * (1 - ratio);
              const value = Math.round(maxHits * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={paddingX + graphWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/60"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    className="fill-muted-foreground font-mono"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#chartAreaGradient)" />
            )}

            {/* Line stroke */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points */}
            {points.map((pt, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* Invisible hit box for easier hover */}
                  <rect
                    x={pt.x - 15}
                    y={paddingY}
                    width={30}
                    height={graphHeight}
                    fill="transparent"
                  />

                  {/* Vertical hover line indicator */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingY}
                      x2={pt.x}
                      y2={paddingY + graphHeight}
                      stroke="currentColor"
                      className="text-primary/40"
                      strokeDasharray="2 2"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Point dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : pt.hits > 0 ? 4 : 2.5}
                    className={`${
                      isHovered
                        ? 'fill-primary stroke-background'
                        : pt.hits > 0
                        ? 'fill-primary stroke-card'
                        : 'fill-muted-foreground/40 stroke-card'
                    } transition-all duration-150`}
                    strokeWidth="2"
                  />

                  {/* X-axis label (show every N labels to avoid clutter) */}
                  {(range === '24h' ? idx % 3 === 0 : range === '30d' ? idx % 5 === 0 : true) && (
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      fontSize="10"
                      className="fill-muted-foreground font-mono"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Top Active Endpoints List */}
      {data?.topEndpoints && data.topEndpoints.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Top Endpoint Paling Sering Dipanggil
          </h4>
          <div className="space-y-2">
            {data.topEndpoints.map((ep) => {
              const share =
                summary.totalRequests > 0
                  ? Math.round((ep.hits / summary.totalRequests) * 100)
                  : 0;

              return (
                <div
                  key={ep.id}
                  className="p-3 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      {ep.method}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ep.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        /{ep.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Traffic Share</span>
                        <span>{share}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(share, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {ep.hits.toLocaleString('id-ID')} <span className="text-xs font-normal text-muted-foreground">hits</span>
                      </p>
                      <p className="text-[11px] text-emerald-500 font-medium">
                        {ep.success} sukses
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
