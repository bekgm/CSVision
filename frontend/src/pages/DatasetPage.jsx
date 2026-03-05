import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
  ResponsiveContainer,
} from 'recharts';
import api from '../api';

export default function DatasetPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [charts, setCharts] = useState([]);
  const [tab, setTab] = useState('preview');

  useEffect(() => {
    api.get(`/dataset/${id}/summary`).then((r) => setSummary(r.data));
    api.get(`/dataset/${id}/preview`).then((r) => setPreview(r.data));
    api.get(`/dataset/${id}/charts`).then((r) => setCharts(r.data.charts));
  }, [id]);

  if (!summary) return <PageSkeleton />;

  const tabs = [
    { key: 'preview', label: 'Preview', icon: TableIcon },
    { key: 'summary', label: 'Summary', icon: StatsIcon },
    { key: 'charts', label: 'Charts', icon: ChartIcon },
  ];

  const numericCols = summary.columns.filter((c) => c.type === 'number');
  const catCols = summary.columns.filter((c) => c.type === 'category');
  const dateCols = summary.columns.filter((c) => c.type === 'date');

  return (
    <div className="animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium truncate">{summary.filename}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{summary.filename}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {summary.rows.toLocaleString()} rows &middot; {summary.columns_count} columns
          </p>
        </div>
        <Link to={`/dataset/${id}/forecast`} className="btn-success">
          <TrendIcon />
          Forecast
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Rows" value={summary.rows.toLocaleString()} icon="📊" />
        <MiniStat label="Numeric" value={numericCols.length} icon="🔢" />
        <MiniStat label="Categorical" value={catCols.length} icon="🏷️" />
        <MiniStat label="Date" value={dateCols.length} icon="📅" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              tab === t.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={tab}>
        {tab === 'preview' && preview && <PreviewTable data={preview} />}
        {tab === 'summary' && <SummaryTable columns={summary.columns} />}
        {tab === 'charts' && <ChartsPanel charts={charts} />}
      </div>
    </div>
  );
}

/* ── Preview Table ── */
function PreviewTable({ data }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {data.columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                    {cell === '' || cell === null ? (
                      <span className="text-slate-300 italic">null</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500">
          Showing <span className="font-medium">{data.rows.length}</span> of{' '}
          <span className="font-medium">{data.total.toLocaleString()}</span> rows
        </p>
      </div>
    </div>
  );
}

/* ── Summary Table ── */
function SummaryTable({ columns }) {
  const headers = ['Column', 'Type', 'Missing', 'Unique', 'Mean', 'Min', 'Max', 'Std'];
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {columns.map((c) => (
              <tr key={c.name} className="hover:bg-indigo-50/40 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${
                    c.type === 'number'
                      ? 'bg-blue-100 text-blue-700'
                      : c.type === 'date'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {c.missing > 0 ? (
                    <span className="text-red-500 font-medium">{c.missing}</span>
                  ) : (
                    <span className="text-emerald-500">0</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.unique}</td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{c.mean != null ? c.mean.toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{c.min != null ? c.min.toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{c.max != null ? c.max.toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{c.std != null ? c.std.toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Charts Panel ── */
function ChartsPanel({ charts }) {
  if (charts.length === 0)
    return (
      <div className="card flex flex-col items-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <ChartIcon />
        </div>
        <p className="text-slate-500">No charts could be generated for this dataset.</p>
      </div>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {charts.map((chart, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-800 truncate">
              {chart.column}
            </h3>
            <span className="badge bg-slate-100 text-slate-500">{chart.chart_type}</span>
          </div>
          <ChartRenderer chart={chart} />
        </div>
      ))}
    </div>
  );
}

/* ── Chart Renderer ── */
const CHART_COLORS = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  emerald: '#10b981',
  sky: '#0ea5e9',
};

const tooltipStyle = {
  contentStyle: {
    background: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#f1f5f9',
    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
  },
  itemStyle: { color: '#f1f5f9' },
};

function ChartRenderer({ chart }) {
  const { chart_type, data } = chart;

  if (chart_type === 'histogram') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill={CHART_COLORS.indigo} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill={CHART_COLORS.violet} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke={CHART_COLORS.indigo} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === 'boxplot') {
    const d = data[0];
    if (!d) return null;
    const boxData = [
      { name: 'Min', value: d.min },
      { name: 'Q1', value: d.q1 },
      { name: 'Median', value: d.median },
      { name: 'Q3', value: d.q3 },
      { name: 'Max', value: d.max },
    ];
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={boxData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="value" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <p className="text-slate-400 text-sm">Unsupported chart type.</p>;
}

/* ── Mini Stat Card ── */
function MiniStat({ label, value, icon }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ── */
function PageSkeleton() {
  return (
    <div>
      <div className="skeleton w-48 h-4 mb-4 rounded" />
      <div className="skeleton w-64 h-8 mb-2 rounded" />
      <div className="skeleton w-40 h-4 mb-6 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
      <div className="skeleton w-72 h-10 rounded-lg mb-6" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}

/* ── Icons ── */
function TableIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M9 4v16M15 4v16M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /></svg>; }
function StatsIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function ChartIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z" /></svg>; }
function TrendIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
