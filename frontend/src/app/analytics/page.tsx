'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { queryService, insightService, datasetService } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Loader2,
  Lightbulb
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface AnalyticsData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  metric: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  value: string;
  period: string;
  chartData: any[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [insightData, setInsightData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // api.ts now returns plain arrays directly
      const [queries, insights, datasets] = await Promise.all([
        queryService.getQueries(),
        insightService.getInsights(),
        datasetService.getDatasets()
      ]);

      const realAnalyticsData: AnalyticsData[] = [
        {
          id: '1',
          title: 'Query Activity (Last 7 Days)',
          type: 'bar',
          metric: 'queries',
          change: calculateChange(queries),
          trend: queries.length > 0 ? 'up' : 'neutral',
          value: queries.length.toString(),
          period: `Last ${selectedTimeRange}`,
          chartData: generateDailyTrend(queries, 7)
        },
        {
          id: '2',
          title: 'Insight Types',
          type: 'pie',
          metric: 'insights',
          change: calculateChange(insights),
          trend: insights.length > 0 ? 'up' : 'neutral',
          value: insights.length.toString(),
          period: `Last ${selectedTimeRange}`,
          chartData: generateInsightTypeChart(insights)
        },
        {
          id: '3',
          title: 'Dataset Status',
          type: 'pie',
          metric: 'datasets',
          change: calculateChange(datasets),
          trend: datasets.length > 0 ? 'up' : 'neutral',
          value: datasets.length.toString(),
          period: `Last ${selectedTimeRange}`,
          chartData: generateDatasetStatusChart(datasets)
        },
        {
          id: '4',
          title: 'Query Types Breakdown',
          type: 'bar',
          metric: 'query_types',
          change: calculateChange(queries),
          trend: queries.length > 0 ? 'up' : 'neutral',
          value: queries.length.toString(),
          period: `Last ${selectedTimeRange}`,
          chartData: generateQueryTypeChart(queries)
        }
      ];

      setAnalyticsData(realAnalyticsData);
      setInsightData(insights);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setAnalyticsData([]);
      setInsightData([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- Data helpers -------------------------------------------------------

  const calculateChange = (items: any[]): string => {
    if (items.length === 0) return 'No data';
    const recentItems = items.filter(item => {
      const date = new Date(item.created_at);
      const cutoff = new Date();
      if (selectedTimeRange === '7days') cutoff.setDate(cutoff.getDate() - 7);
      else if (selectedTimeRange === '30days') cutoff.setDate(cutoff.getDate() - 30);
      else cutoff.setDate(cutoff.getDate() - 90);
      return date > cutoff;
    });
    return recentItems.length > 0 ? `+${recentItems.length} in period` : 'None in period';
  };

  const generateDailyTrend = (items: any[], days: number) => {
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const count = items.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate.toDateString() === date.toDateString();
      }).length;
      result.push({ date: dayStr, count });
    }
    return result;
  };

  const generateInsightTypeChart = (insights: any[]) => {
    const distribution: Record<string, number> = {};
    insights.forEach(insight => {
      const type = insight.insight_type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const generateDatasetStatusChart = (datasets: any[]) => {
    const statusMap: Record<string, number> = {};
    datasets.forEach(ds => {
      const s = ds.processing_status || 'unknown';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  };

  const generateQueryTypeChart = (queries: any[]) => {
    const distribution: Record<string, number> = {};
    queries.forEach(q => {
      const type = q.query_type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  // ---- Chart renderers ----------------------------------------------------

  const renderChart = (item: AnalyticsData) => {
    if (item.chartData.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
          No data yet — start using the platform to see charts
        </div>
      );
    }

    if (item.type === 'bar') {
      const dataKey = item.chartData[0] && 'count' in item.chartData[0] ? 'count' : 'value';
      const labelKey = item.chartData[0] && 'date' in item.chartData[0] ? 'date' : 'name';
      return (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={item.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (item.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={item.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (item.type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={item.chartData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {item.chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  const getTrendIcon = (trend: string) => trend === 'up' ? TrendingUp : TrendingDown;
  const getTrendColor = (trend: string) => trend === 'up' ? 'text-green-600' : trend === 'neutral' ? 'text-muted-foreground' : 'text-red-600';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Live insights into your data and platform activity</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="btn-secondary"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsData.map((item) => {
            const TrendIcon = getTrendIcon(item.trend);
            return (
              <div key={item.id} className="bg-card rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.period}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendIcon className={`w-4 h-4 ${getTrendColor(item.trend)}`} />
                    <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {item.change}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-foreground mb-4">{item.value} total</div>

                {/* Real chart rendered by recharts */}
                {renderChart(item)}
              </div>
            );
          })}
        </div>

        {/* Recent Insights */}
        {insightData.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Insights</h3>
            <div className="space-y-3">
              {insightData.slice(0, 5).map((insight) => (
                <div key={insight.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{insight.headline}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{insight.explanation}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-medium text-foreground">
                      {Math.round((insight.confidence_score || 0) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyticsData.length === 0 && !loading && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No analytics data yet</h3>
              <p className="text-muted-foreground">Start by uploading data and running queries</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
