'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useAuth } from '@/contexts/auth-context';
import { datasetService, queryService, insightService } from '@/lib/api';
import { 
  TrendingUp, 
  Database, 
  MessageSquare, 
  Users, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: string;
  activeUsers: number;
  dataPoints: number;
  aiQueries: number;
  revenueChange: string;
  usersChange: string;
  dataChange: string;
  queriesChange: string;
}

interface RecentActivity {
  id: string;
  type: 'query' | 'dataset' | 'insight';
  message: string;
  time: string;
  icon: any;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [queryPerformance, setQueryPerformance] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend (api.ts returns plain arrays now via parseList)
      const [datasets, queries, insights] = await Promise.all([
        datasetService.getDatasets(),
        queryService.getQueries(),
        insightService.getInsights()
      ]);

      // Calculate real stats from backend data
      const realStats: DashboardStats = {
        totalRevenue: calculateRevenue(insights),
        activeUsers: 1, // Single-user app; multi-user counting requires an admin endpoint
        dataPoints: calculateDataPoints(datasets),
        aiQueries: queries.length,
        revenueChange: 'N/A', // Requires historical financial data
        usersChange: 'N/A',
        dataChange: calculateDatasetsChange(datasets),
        queriesChange: calculateQueriesChange(queries)
      };

      const activity = generateRecentActivity(datasets, queries, insights);
      const performance = generateQueryPerformance(queries);

      setStats(realStats);
      setRecentActivity(activity);
      setQueryPerformance(performance);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty state instead of dummy data
      setStats({
        totalRevenue: '$0',
        activeUsers: 0,
        dataPoints: 0,
        aiQueries: 0,
        revenueChange: 'N/A',
        usersChange: 'N/A',
        dataChange: 'N/A',
        queriesChange: 'N/A'
      });
      setRecentActivity([]);
      setQueryPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (insights: any[]) => {
    // Calculate real revenue from insights if available
    const revenueInsights = insights.filter(i => i.insight_type === 'revenue');
    if (revenueInsights.length > 0) {
      // This would calculate based on actual insight data
      return '$0'; // Placeholder until real revenue calculation
    }
    return '$0';
  };

  const calculateDataPoints = (datasets: any[]) => {
    return datasets.reduce((total, dataset) => {
      return total + (dataset.row_count || 0);
    }, 0);
  };

  const calculateQueriesChange = (queries: any[]) => {
    if (queries.length === 0) return 'N/A';
    // Calculate change based on query dates
    const recentQueries = queries.filter(q => {
      const queryDate = new Date(q.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return queryDate > weekAgo;
    });
    return recentQueries.length > 0 ? `+${recentQueries.length} this week` : '0 this week';
  };

  const calculateDatasetsChange = (datasets: any[]) => {
    if (datasets.length === 0) return 'N/A';
    const recentDatasets = datasets.filter(d => {
      const date = new Date(d.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    });
    return recentDatasets.length > 0 ? `+${recentDatasets.length} this week` : '0 this week';
  };

  const generateRecentActivity = (datasets: any[], queries: any[], insights: any[]) => {
    const activity: RecentActivity[] = [];
    
    // Add recent queries
    const recentQueries = queries.slice(0, 3);
    recentQueries.forEach((query, index) => {
      activity.push({
        id: `query-${query.id}`,
        type: 'query',
        message: query.original_query,
        time: formatRelativeTime(query.created_at),
        icon: MessageSquare
      });
    });

    // Add recent datasets
    const recentDatasets = datasets.slice(0, 2);
    recentDatasets.forEach((dataset) => {
      activity.push({
        id: `dataset-${dataset.id}`,
        type: 'dataset',
        message: `Uploaded ${dataset.name}`,
        time: formatRelativeTime(dataset.created_at),
        icon: Database
      });
    });

    // Add recent insights
    const recentInsights = insights.slice(0, 2);
    recentInsights.forEach((insight) => {
      activity.push({
        id: `insight-${insight.id}`,
        type: 'insight',
        message: `Generated: ${insight.headline}`,
        time: formatRelativeTime(insight.created_at),
        icon: TrendingUp
      });
    });

    return activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  };

  const generateQueryPerformance = (queries: any[]) => {
    // Generate performance data based on actual query execution times
    return queries.slice(0, 7).map(query => {
      const executionTime = query.execution_time_ms || 1000;
      return Math.min(95, Math.max(20, 100 - (executionTime / 100) * 80));
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getStatIcon = (title: string) => {
    switch (title) {
      case 'Total Revenue': return DollarSign;
      case 'Active Users': return Users;
      case 'Data Points': return Database;
      case 'AI Queries': return MessageSquare;
      default: return Activity;
    }
  };

  const getStatColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No data available</h3>
          <p className="text-muted-foreground">Start by uploading data or running queries</p>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      change: stats.revenueChange,
      trend: stats.revenueChange.includes('+') ? 'up' : 'down',
      icon: DollarSign,
      color: getStatColor(stats.revenueChange.includes('+') ? 'up' : 'down')
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: stats.usersChange,
      trend: stats.usersChange.includes('+') ? 'up' : 'down',
      icon: Users,
      color: getStatColor(stats.usersChange.includes('+') ? 'up' : 'down')
    },
    {
      title: 'Data Points',
      value: stats.dataPoints.toLocaleString(),
      change: stats.dataChange,
      trend: stats.dataChange.includes('+') ? 'up' : 'down',
      icon: Database,
      color: getStatColor(stats.dataChange.includes('+') ? 'up' : 'down')
    },
    {
      title: 'AI Queries',
      value: stats.aiQueries.toLocaleString(),
      change: stats.queriesChange,
      trend: stats.queriesChange.includes('+') ? 'up' : 'down',
      icon: MessageSquare,
      color: getStatColor(stats.queriesChange.includes('+') ? 'up' : 'down')
    }
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Stats and Activity Section */}
      <div className="lg:w-80 xl:w-96 border-r border-border bg-card/50 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your data today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {statsData.map((stat, index) => (
              <div key={index} className="dashboard-card p-4 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div className={`flex items-center text-xs font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                className="w-full btn-primary flex items-center justify-center space-x-2"
                onClick={() => router.push('/chat')}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Start New Analysis</span>
              </button>
              <button 
                className="w-full btn-secondary flex items-center justify-center space-x-2"
                onClick={() => router.push('/upload')}
              >
                <Database className="w-4 h-4" />
                <span>Upload Data</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-8 h-8 bg-nexus-100 dark:bg-nexus-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity. Start by uploading data or running queries.
                </p>
              )}
            </div>
          </div>

          {/* Performance Chart */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Query Performance</h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Query Response Time</span>
                <span className="text-sm font-medium text-foreground">
                  {queryPerformance.length > 0 
                    ? `${Math.round(queryPerformance.reduce((a, b) => a + b, 0) / queryPerformance.length)}% avg`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="space-y-2">
                {queryPerformance.length > 0 ? (
                  queryPerformance.map((height, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-nexus-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${height}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No queries yet. Start by asking questions about your data.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface />
      </div>
    </div>
  );
}
