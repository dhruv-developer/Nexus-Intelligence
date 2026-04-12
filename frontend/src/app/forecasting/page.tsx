'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { insightService, queryService, forecastService, datasetService } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  LineChart as LineChartIcon,
  Download,
  RefreshCw,
  Plus,
  Target,
  Zap,
  AlertTriangle,
  Loader2,
  Clock,
  ChevronDown
} from 'lucide-react';

interface ForecastResult {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  period: string;
  model: string;
  status: 'completed' | 'generating' | 'failed';
  created: string;
  chartData: { period: string; value: number; confidence_low?: number; confidence_high?: number }[];
  trend?: string;
  methodology?: string;
  rawResult?: any;
}

const PERIOD_LABELS: Record<string, number> = {
  '1month': 1,
  '3months': 3,
  '6months': 6,
  '1year': 12,
};

export default function ForecastingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInitialForecasts();
    }
  }, [user]);

  /**
   * On load, derive a basic forecast from existing query data so the page
   * is never empty on first visit.
   */
  const loadInitialForecasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const queries = await queryService.getQueries();
      if (queries.length > 0) {
        // Build a time-series from daily query counts for the past 14 days
        const series = buildQueryTimeSeries(queries, 14);
        if (series.length >= 2) {
          await runForecast('Query Volume Forecast', series, 'ARIMA', 'Usage prediction based on your query history');
        }
      }
    } catch (err: any) {
      console.error('Failed to load initial forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildQueryTimeSeries = (
    queries: any[],
    days: number
  ): { date: string; value: number }[] => {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = queries.filter(q => {
        const d = new Date(q.created_at);
        return d.toISOString().split('T')[0] === dateStr;
      }).length;
      return { date: dateStr, value: count };
    });
  };

  const runForecast = async (
    name: string,
    series: { date: string; value: number }[],
    model: string,
    type: string
  ) => {
    const periods = PERIOD_LABELS[selectedPeriod] ?? 3;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Add a "generating" placeholder
    setForecasts(prev => [
      {
        id,
        name,
        type,
        accuracy: 0,
        period: selectedPeriod,
        model,
        status: 'generating',
        created: new Date().toISOString().split('T')[0],
        chartData: [],
      },
      ...prev,
    ]);

    try {
      const result = await forecastService.generateForecast(series, periods);
      const chartData = buildChartData(series, result);

      setForecasts(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'completed',
                accuracy: Math.round((result.confidence ?? 0) * 100),
                chartData,
                trend: result.trend ?? 'unknown',
                methodology: result.methodology ?? model,
                rawResult: result,
              }
            : f
        )
      );
    } catch (err: any) {
      setForecasts(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'failed' } : f))
      );
      setError(`Forecast failed: ${err?.response?.data?.detail || err.message}`);
    }
  };

  const buildChartData = (
    historical: { date: string; value: number }[],
    result: any
  ) => {
    const hist = historical.map(p => ({
      period: p.date,
      value: p.value,
      confidence_low: undefined as number | undefined,
      confidence_high: undefined as number | undefined,
    }));

    const forecastPts = (result.forecast ?? []).map((p: any) => ({
      period: p.period,
      value: p.value,
      confidence_low: p.confidence_low,
      confidence_high: p.confidence_high,
    }));

    return [...hist, ...forecastPts];
  };

  const handleGenerateForecast = async () => {
    setGenerating(true);
    setError(null);
    try {
      const [queries, insights, datasets] = await Promise.all([
        queryService.getQueries(),
        insightService.getInsights(),
        datasetService.getDatasets(),
      ]);

      // Forecast 1: Query volume
      if (queries.length >= 2) {
        const series = buildQueryTimeSeries(queries, 14);
        await runForecast('Query Volume Forecast', series, 'ARIMA', 'Usage prediction from query history');
      }

      // Forecast 2: Insight confidence trend
      if (insights.length >= 2) {
        const sorted = [...insights].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const series = sorted.map(ins => ({
          date: new Date(ins.created_at).toISOString().split('T')[0],
          value: Math.round((ins.confidence_score ?? 0) * 100),
        }));
        await runForecast('Insight Confidence Trend', series, 'Linear Regression', 'AI confidence projection');
      }

      if (queries.length < 2 && insights.length < 2) {
        setError('Not enough data to generate a forecast. Run more queries or generate insights first.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadForecast = (forecast: ForecastResult) => {
    const csv = [
      'period,value,confidence_low,confidence_high',
      ...forecast.chartData.map(p =>
        `${p.period},${p.value},${p.confidence_low ?? ''},${p.confidence_high ?? ''}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${forecast.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Target className="w-4 h-4 text-green-500" />;
      case 'generating': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading forecasts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forecasting</h1>
            <p className="text-muted-foreground">AI-powered predictions using your real platform data</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="btn-secondary"
            >
              <option value="1month">1 Month</option>
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
            </select>
            <button
              onClick={handleGenerateForecast}
              disabled={generating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{generating ? 'Generating…' : 'Generate Forecast'}</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Model info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Prophet Model</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Time series forecasting with automatic seasonality detection
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best for:</span>
              <span className="font-medium">Trend data</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <LineChartIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">ARIMA Model</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Autoregressive integrated moving average for stationary data
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best for:</span>
              <span className="font-medium">Time series</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Linear Regression</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Simple linear relationships with confidence intervals
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best for:</span>
              <span className="font-medium">Linear trends</span>
            </div>
          </div>
        </div>

        {/* Forecasts */}
        {forecasts.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No forecasts yet</h3>
            <p className="text-muted-foreground mb-4">
              Click <strong>Generate Forecast</strong> to create AI-powered predictions from your real data
            </p>
            <button onClick={handleGenerateForecast} disabled={generating} className="btn-primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              Generate Forecast
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Active Forecasts ({forecasts.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {forecasts.map((forecast) => (
                <div key={forecast.id} className="bg-card rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(forecast.status)}
                      <div>
                        <h3 className="font-semibold text-foreground">{forecast.name}</h3>
                        <p className="text-sm text-muted-foreground">{forecast.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadForecast(forecast)}
                      disabled={forecast.status !== 'completed'}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      title="Download as CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {forecast.status === 'completed' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">AI Confidence</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-indigo-500"
                                style={{ width: `${forecast.accuracy}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getAccuracyColor(forecast.accuracy)}`}>
                              {forecast.accuracy}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Period:</span>
                            <p className="font-medium">{forecast.period}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <p className="font-medium">{forecast.methodology || forecast.model}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <p className="font-medium">{forecast.created}</p>
                          </div>
                          {forecast.trend && (
                            <div>
                              <span className="text-muted-foreground">Trend:</span>
                              <p className="font-medium capitalize">{forecast.trend}</p>
                            </div>
                          )}
                        </div>

                        {/* Real forecast chart */}
                        {forecast.chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={forecast.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                              <XAxis dataKey="period" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                              <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                              />
                              {forecast.chartData.some(p => p.confidence_low != null) && (
                                <>
                                  <Line type="monotone" dataKey="confidence_low" stroke="#a5b4fc" strokeDasharray="4 2" dot={false} />
                                  <Line type="monotone" dataKey="confidence_high" stroke="#a5b4fc" strokeDasharray="4 2" dot={false} />
                                </>
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                            No time-series data to plot
                          </div>
                        )}
                      </>
                    )}

                    {forecast.status === 'generating' && (
                      <div className="flex items-center justify-center h-32 space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-sm text-muted-foreground">AI is generating your forecast…</span>
                      </div>
                    )}

                    {forecast.status === 'failed' && (
                      <div className="flex items-center justify-center h-32 space-x-2 text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm">Forecast generation failed — check error banner above</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
