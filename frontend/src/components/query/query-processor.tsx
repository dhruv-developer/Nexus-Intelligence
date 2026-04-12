'use client';

import { useState, useEffect } from 'react';
import { queryService, chatService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import {
  Search,
  Send,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Filter,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Lightbulb,
} from 'lucide-react';

interface Query {
  id: string;
  original_query: string;
  processed_query: string;
  query_type: string;
  intent: string;
  entities: Record<string, any>;
  confidence_score: number;   // stored as integer 0-100 by backend (or 0-10000 — we normalise)
  status: string;
  execution_time_ms: number;
  created_at: string;
  updated_at: string;
  dataset_id?: string;
}

interface QueryResult {
  query: Query;
  aiResponse: string;
  insight?: {
    title?: string;
    headline?: string;
    explanation?: string;
    key_drivers?: string[];
    recommendations?: string[];
    confidence?: number;
  };
}

interface QueryFormData {
  original_query: string;
  query_type: string;
  dataset_id?: string;
}

/** Backend stores confidence as 0-100 but sometimes multiplied by 100 accidentally → clamp */
function normaliseConfidence(score: number | null | undefined): number {
  if (!score) return 0;
  return score > 100 ? Math.round(score / 100) : score;
}

export function QueryProcessor() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [resultPanel, setResultPanel] = useState<QueryResult | null>(null);
  const [formData, setFormData] = useState<QueryFormData>({
    original_query: '',
    query_type: 'descriptive',
  });

  useEffect(() => {
    if (user) fetchQueries();
  }, [user]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await queryService.getQueries();
      setQueries(response);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!formData.original_query.trim()) return;
    setProcessing(true);
    try {
      const response = await queryService.createQuery(formData);
      setQueries(prev => [response, ...prev]);
      setShowCreateModal(false);
      setFormData({ original_query: '', query_type: 'descriptive' });
      // Immediately execute the newly created query
      handleExecuteQuery(response, true);
    } catch (error) {
      console.error('Failed to create query:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuery = (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    setQueries(prev => prev.filter(q => q.id !== queryId));
    if (resultPanel?.query.id === queryId) setResultPanel(null);
  };

  const handleExecuteQuery = async (query: Query, silent = false) => {
    if (!silent) setExecutingId(query.id);
    try {
      const response = await chatService.sendMessage(query.original_query);

      // Backend returns: { message, insights, query_type, confidence, suggestions, timestamp }
      const reply: string = response?.message || response?.reply || JSON.stringify(response);
      const insightsRaw = response?.insights;

      const insight = insightsRaw
        ? {
            title:           insightsRaw.title           || query.intent || 'AI Analysis',
            headline:        insightsRaw.headline         || '',
            explanation:     insightsRaw.explanation      || reply,
            key_drivers:     insightsRaw.key_drivers      || [],
            recommendations: insightsRaw.recommendations  || [],
            confidence:      insightsRaw.confidence_score || normaliseConfidence(query.confidence_score),
          }
        : {
            title:       query.intent || 'Query Result',
            headline:    '',
            explanation: reply,
            key_drivers:    [],
            recommendations:[],
          };

      setResultPanel({
        query: { ...query, status: 'completed', execution_time_ms: response?.execution_time_ms || 0 },
        aiResponse: reply,
        insight,
      });
    } catch (error: any) {
      console.error('Failed to execute query:', error);
      setResultPanel({
        query,
        aiResponse: `Error: ${error?.message || 'Could not reach the AI service. Please try again.'}`,
      });
    } finally {
      setExecutingId(null);
    }
  };

  const handleViewResults = (query: Query) => {
    // If we have a cached panel for this query, show it; otherwise re-execute
    if (resultPanel?.query.id === query.id) return setResultPanel({ ...resultPanel });
    handleExecuteQuery(query);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString() + ' ' + new Date(s).toLocaleTimeString();

  const formatMs = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQueryTypeIcon = (type: string) => {
    switch (type) {
      case 'predictive': return <TrendingUp className="w-4 h-4" />;
      case 'comparative': return <PieChart className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const filteredQueries = queries.filter(q =>
    q.original_query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.query_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickQueries = [
    { text: 'Show me sales trends for the last quarter', type: 'descriptive' },
    { text: 'Predict revenue for next month', type: 'predictive' },
    { text: 'Compare performance across regions', type: 'comparative' },
    { text: 'What are the top selling products?', type: 'descriptive' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please login to use query processing</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Query Processing</h2>
          <p className="text-muted-foreground">Ask questions and get AI-powered insights from your data</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={fetchQueries} className="btn-secondary flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Query</span>
          </button>
        </div>
      </div>

      {/* Quick Queries */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setFormData({ original_query: q.text, query_type: q.type });
                setShowCreateModal(true);
              }}
              className="text-left p-3 border border-input rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-2 mb-1">
                {getQueryTypeIcon(q.type)}
                <span className="text-xs font-medium text-muted-foreground capitalize">{q.type}</span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{q.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Results Panel */}
      {resultPanel && (
        <div className="bg-card rounded-lg border-2 border-blue-500/30 p-6 relative">
          <button
            onClick={() => setResultPanel(null)}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">
              {resultPanel.insight?.title || 'Query Result'}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground mb-3 italic">
            "{resultPanel.query.original_query}"
          </p>

          {resultPanel.insight?.headline && (
            <p className="font-semibold text-foreground mb-3">{resultPanel.insight.headline}</p>
          )}

          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed mb-4">
            {resultPanel.insight?.explanation || resultPanel.aiResponse}
          </div>

          {resultPanel.insight?.key_drivers && resultPanel.insight.key_drivers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Key Drivers</p>
              <ul className="space-y-1">
                {resultPanel.insight.key_drivers.map((d, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm">
                    <span className="text-blue-500 mt-1">▸</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultPanel.insight?.recommendations && resultPanel.insight.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Recommendations</p>
              <ul className="space-y-1">
                {resultPanel.insight.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Query List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No queries found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Start by asking a question about your data'}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Query
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map(query => {
            const conf = normaliseConfidence(query.confidence_score);
            const isExecuting = executingId === query.id;
            return (
              <div key={query.id} className="bg-card rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getQueryTypeIcon(query.query_type)}
                    <div>
                      <h4 className="font-semibold text-foreground">{query.original_query}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{query.query_type} query</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(query.status)}
                    <button className="p-1 hover:bg-muted rounded" onClick={() => handleViewResults(query)}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(query.id)}
                      className="p-1 hover:bg-muted rounded text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground block mb-1">Confidence</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(conf, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{conf}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Execution Time:</span>
                    <p className="font-medium">{query.execution_time_ms ? formatMs(query.execution_time_ms) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intent:</span>
                    <p className="font-medium capitalize">{query.intent || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{formatDate(query.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExecuteQuery(query)}
                    disabled={isExecuting}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-60"
                  >
                    {isExecuting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Running…</span></>
                      : <><Send className="w-4 h-4" /><span>Execute Query</span></>
                    }
                  </button>
                  <button
                    onClick={() => handleViewResults(query)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>View Results</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Query Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Query</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Query Type</label>
                <select
                  value={formData.query_type}
                  onChange={e => setFormData({ ...formData, query_type: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="descriptive">Descriptive — What happened?</option>
                  <option value="predictive">Predictive — What will happen?</option>
                  <option value="comparative">Comparative — How do things compare?</option>
                  <option value="diagnostic">Diagnostic — Why did it happen?</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Question</label>
                <textarea
                  value={formData.original_query}
                  onChange={e => setFormData({ ...formData, original_query: e.target.value })}
                  className="w-full p-3 border border-input rounded-md h-32 bg-background"
                  placeholder="Ask a question about your data…"
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Tips for better queries:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Be specific about time periods (e.g., "last quarter", "past 6 months")</li>
                  <li>Mention specific metrics (e.g., "revenue", "sales", "customers")</li>
                  <li>Include comparisons if needed (e.g., "compare regions", "vs last year")</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuery}
                disabled={!formData.original_query.trim() || processing}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {processing
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" />Processing…</>
                  : <><Send className="w-4 h-4 mr-2 inline" />Submit & Execute</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
