'use client';

import { useState, useEffect } from 'react';
import { insightService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Lightbulb, 
  Eye, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  Target, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  headline: string;
  explanation: string;
  insight_type: string;
  confidence_score: number;
  significance_score: number;
  data_points: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_public: boolean;
  tags?: string[];
  chart_data?: any;
}

interface InsightFormData {
  title: string;
  headline: string;
  explanation: string;
  insight_type: string;
  confidence_score: number;
  significance_score: number;
  tags: string[];
}

export function InsightViewer() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<InsightFormData>({
    title: '',
    headline: '',
    explanation: '',
    insight_type: 'trend',
    confidence_score: 0.8,
    significance_score: 0.7,
    tags: []
  });

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await insightService.getInsights();
      setInsights(response);

    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInsight = async () => {
    if (!formData.title.trim() || !formData.headline.trim()) return;

    setCreating(true);
    try {
      const response = await insightService.createInsight(formData);
      setInsights(prev => [response, ...prev]);
      setShowCreateModal(false);
      setFormData({
        title: '',
        headline: '',
        explanation: '',
        insight_type: 'trend',
        confidence_score: 0.8,
        significance_score: 0.7,
        tags: []
      });
    } catch (error) {
      console.error('Failed to create insight:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;

    try {
      // Filter locally — no delete endpoint is currently exposed by the backend router
      setInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (error) {
      console.error('Failed to delete insight:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'comparison':
        return <BarChart3 className="w-5 h-5 text-green-500" />;
      case 'distribution':
        return <PieChart className="w-5 h-5 text-purple-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSignificanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredInsights = insights.filter(insight =>
    insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const insightTypes = [
    { value: 'trend', label: 'Trend Analysis', icon: TrendingUp },
    { value: 'anomaly', label: 'Anomaly Detection', icon: AlertTriangle },
    { value: 'comparison', label: 'Comparison', icon: BarChart3 },
    { value: 'distribution', label: 'Distribution', icon: PieChart },
    { value: 'correlation', label: 'Correlation', icon: Target }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please login to view insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Insights Dashboard</h2>
          <p className="text-muted-foreground">AI-generated insights and analysis from your data</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInsights}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Insight</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No insights found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Start by creating your first insight'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Insight
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((insight) => (
            <div key={insight.id} className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.insight_type)}
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {insight.insight_type}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{insight.significance_score.toFixed(1)}</span>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
              <p className="text-lg font-medium text-foreground mb-3">{insight.headline}</p>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{insight.explanation}</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getConfidenceColor(insight.confidence_score)}`}
                        style={{ width: `${insight.confidence_score * 100}%` }}
                      />
                    </div>
                    <span className={getConfidenceColor(insight.confidence_score)}>
                      {Math.round(insight.confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Significance:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getSignificanceColor(insight.significance_score)}`}
                        style={{ width: `${insight.significance_score * 100}%` }}
                      />
                    </div>
                    <span className={getSignificanceColor(insight.significance_score)}>
                      {Math.round(insight.significance_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data Points:</span>
                  <span>{insight.data_points.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(insight.created_at)}</span>
                </div>
              </div>

              {insight.tags && insight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                  {insight.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-muted rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                <button className="btn-secondary flex-1 flex items-center justify-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button className="btn-secondary flex-1 flex items-center justify-center space-x-1">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button 
                  onClick={() => handleDeleteInsight(insight.id)}
                  className="btn-ghost p-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Insight Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Insight</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Insight Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {insightTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, insight_type: type.value})}
                      className={`p-3 border rounded-md flex flex-col items-center space-y-2 transition-colors ${
                        formData.insight_type === type.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-input hover:bg-muted'
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  placeholder="Brief, descriptive title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({...formData, headline: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  placeholder="Key finding or main takeaway"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Explanation</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                  className="w-full p-3 border border-input rounded-md h-32 bg-background"
                  placeholder="Detailed explanation of the insight..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Confidence Score</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.confidence_score}
                      onChange={(e) => setFormData({...formData, confidence_score: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-center text-sm font-medium">
                      {Math.round(formData.confidence_score * 100)}%
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Significance Score</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.significance_score}
                      onChange={(e) => setFormData({...formData, significance_score: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-center text-sm font-medium">
                      {Math.round(formData.significance_score * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  placeholder="sales, revenue, Q3 2024"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInsight}
                disabled={!formData.title.trim() || !formData.headline.trim() || creating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2 inline"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2 inline" />
                    Create Insight
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
