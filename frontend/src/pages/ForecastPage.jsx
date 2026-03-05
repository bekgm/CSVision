import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, Area, ComposedChart,
} from 'recharts';
import api from '../api';

export default function ForecastPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [dateCol, setDateCol] = useState('');
  const [valueCol, setValueCol] = useState('');
  const [periods, setPeriods] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/dataset/${id}/summary`).then((r) => {
      setSummary(r.data);
      const dateCols = r.data.columns.filter((c) => c.type === 'date' || c.type === 'category');
      const numCols = r.data.columns.filter((c) => c.type === 'number');
      if (dateCols.length) setDateCol(dateCols[0].name);
      if (numCols.length) setValueCol(numCols[0].name);
    });
  }, [id]);

  const runForecast = async () => {
    if (!dateCol || !valueCol) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/dataset/${id}/forecast`, {
        date_column: dateCol,
        value_column: valueCol,
        periods,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Forecast failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <div>
        <div className="skeleton w-40 h-4 mb-4 rounded" />
        <div className="skeleton w-60 h-8 mb-6 rounded" />
        <div className="skeleton h-32 rounded-xl mb-6" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const allColumns = summary.columns.map((c) => c.name);
  const numericColumns = summary.columns.filter((c) => c.type === 'number').map((c) => c.name);

  const chartData = result
    ? [
        ...result.historical.map((p) => ({ date: p.date, actual: p.value })),
        ...result.forecast.map((p) => ({ date: p.date, forecast: p.value })),
      ]
    : [];

  // Compute forecast stats
  const forecastStats = result
    ? {
        lastActual: result.historical[result.historical.length - 1]?.value,
        lastForecast: result.forecast[result.forecast.length - 1]?.value,
        minForecast: Math.min(...result.forecast.map((f) => f.value)),
        maxForecast: Math.max(...result.forecast.map((f) => f.value)),
      }
    : null;

  return (
    <div className="animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/dataset/${id}`} className="hover:text-indigo-600 transition-colors">
          {summary.filename}
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Forecast</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Time Series Forecast
      </h1>

      {/* Config panel */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <SettingsIcon />
          Configuration
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
              Date Column
            </label>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="input-field"
            >
              {allColumns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
              Value Column
            </label>
            <select
              value={valueCol}
              onChange={(e) => setValueCol(e.target.value)}
              className="input-field"
            >
              {numericColumns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
              Periods
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={periods}
              onChange={(e) => setPeriods(Number(e.target.value))}
              className="input-field"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runForecast}
              disabled={loading}
              className="btn-success w-full py-2.5"
            >
              {loading ? (
                <>
                  <Spinner /> Running…
                </>
              ) : (
                <>
                  <PlayIcon /> Run Forecast
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-fade-in">
          {/* Forecast stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="card p-4">
              <p className="text-xs text-slate-500">Historical Points</p>
              <p className="text-xl font-bold text-slate-800">{result.historical.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Predicted Points</p>
              <p className="text-xl font-bold text-amber-600">{result.forecast.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Last Actual</p>
              <p className="text-xl font-bold text-indigo-600">
                {forecastStats.lastActual?.toLocaleString()}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Last Predicted</p>
              <p className="text-xl font-bold text-amber-600">
                {forecastStats.lastForecast?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-slate-700 mb-4">
              {valueCol} over {dateCol}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f1f5f9',
                    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                  }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  fill="url(#colorActual)"
                  stroke="transparent"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Historical"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">Ready to forecast</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Select your date and value columns above, then click "Run Forecast" to generate predictions.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function SettingsIcon() { return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function PlayIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function Spinner() { return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>; }
