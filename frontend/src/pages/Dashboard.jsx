import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/datasets').then((res) => {
      setDatasets(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {datasets.length} dataset{datasets.length !== 1 && 's'} uploaded
          </p>
        </div>
        <Link to="/upload" className="btn-primary">
          <PlusIcon />
          Upload Dataset
        </Link>
      </div>

      {/* Stats bar */}
      {datasets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Datasets" value={datasets.length} color="indigo" />
          <StatCard
            label="Total Rows"
            value={datasets.reduce((s, d) => s + d.rows, 0).toLocaleString()}
            color="emerald"
          />
          <StatCard
            label="Total Columns"
            value={datasets.reduce((s, d) => s + d.columns, 0)}
            color="amber"
          />
          <StatCard
            label="Latest Upload"
            value={timeAgo(datasets[0]?.created_at)}
            color="sky"
          />
        </div>
      )}

      {/* Dataset grid */}
      {datasets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds, i) => (
            <Link
              key={ds.id}
              to={`/dataset/${ds.id}`}
              className="card-hover p-5 group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileIcon />
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  #{ds.id}
                </span>
              </div>
              <h2 className="font-semibold text-slate-800 mt-3 truncate group-hover:text-indigo-600 transition-colors">
                {ds.filename}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <RowsIcon /> {ds.rows.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <ColsIcon /> {ds.columns}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {timeAgo(ds.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ label, value, color }) {
  const colors = {
    indigo:  'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    sky:     'bg-sky-50 text-sky-700',
  };
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colors[color]?.split(' ')[1] || 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-700 text-lg">No datasets yet</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6 max-w-xs">
        Upload a CSV or Excel file to get started with your data analysis.
      </p>
      <Link to="/upload" className="btn-primary">
        Upload your first dataset
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex justify-between mb-8">
        <div><div className="skeleton w-32 h-7 mb-2" /><div className="skeleton w-24 h-4" /></div>
        <div className="skeleton w-40 h-10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── Icons ── */
function PlusIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function FileIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>; }
function RowsIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" /></svg>; }
function ColsIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 3v18M15 3v18" /></svg>; }
