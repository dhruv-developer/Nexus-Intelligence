'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { insightService, queryService, datasetService } from '@/lib/api';
import { 
  FileText, 
  Download, 
  Search,
  Plus,
  Eye,
  Share,
  Trash2,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Copy,
  Check
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'Analytics' | 'Performance' | 'Data';
  description: string;
  generated: string;
  format: 'CSV' | 'JSON';
  status: 'completed' | 'generating' | 'failed';
  downloads: number;
  /** The actual data to export */
  rawData: any[];
  columns: string[];
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // api.ts now returns plain arrays
      const [insights, queries, datasets] = await Promise.all([
        insightService.getInsights(),
        queryService.getQueries(),
        datasetService.getDatasets()
      ]);

      const newReports: Report[] = [];

      if (insights.length > 0) {
        newReports.push({
          id: 'insights-summary',
          name: 'Insights Summary Report',
          type: 'Analytics',
          description: `All ${insights.length} AI-generated insights with confidence scores`,
          generated: new Date().toISOString().split('T')[0],
          format: 'CSV',
          status: 'completed',
          downloads: 0,
          rawData: insights,
          columns: ['id', 'headline', 'explanation', 'insight_type', 'confidence_score', 'significance_score', 'created_at']
        });
      }

      if (queries.length > 0) {
        newReports.push({
          id: 'query-analysis',
          name: 'Query Analysis Report',
          type: 'Performance',
          description: `${queries.length} user queries with status and execution times`,
          generated: new Date().toISOString().split('T')[0],
          format: 'CSV',
          status: 'completed',
          downloads: 0,
          rawData: queries,
          columns: ['id', 'original_query', 'query_type', 'intent', 'status', 'confidence_score', 'execution_time_ms', 'rows_processed', 'created_at']
        });
      }

      if (datasets.length > 0) {
        newReports.push({
          id: 'dataset-overview',
          name: 'Dataset Overview Report',
          type: 'Data',
          description: `${datasets.length} datasets with processing status and metadata`,
          generated: new Date().toISOString().split('T')[0],
          format: 'CSV',
          status: 'completed',
          downloads: 0,
          rawData: datasets,
          columns: ['id', 'name', 'file_name', 'file_type', 'file_size', 'processing_status', 'row_count', 'column_count', 'data_quality_score', 'created_at']
        });
      }

      setReports(newReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  /** Builds a CSV string from the report's raw data using only the specified columns */
  const buildCSV = (report: Report): string => {
    const cols = report.columns;
    const header = cols.join(',');
    const rows = report.rawData.map(row =>
      cols.map(col => {
        const val = row[col];
        if (val == null) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        // Escape commas and quotes in CSV
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );
    return [header, ...rows].join('\n');
  };

  const handleDownloadReport = (report: Report) => {
    const csv = buildCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${report.generated}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Increment local download count
    setReports(prev =>
      prev.map(r => r.id === report.id ? { ...r, downloads: r.downloads + 1 } : r)
    );
  };

  const handleShareReport = async (report: Report) => {
    const shareText = `Nexus Intelligence Report: ${report.name} — ${report.description} (${report.rawData.length} records, generated ${report.generated})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: report.name, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedId(report.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.warn('Share failed:', err);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Remove this report from the list?')) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    await fetchReports();
    setGenerating(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'Analytics': return <BarChart3 className="w-5 h-5 text-blue-500" />;
      case 'Performance': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'Data': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Export your real platform data as CSV reports</p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{generating ? 'Refreshing…' : 'Refresh Reports'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No reports match your search' : 'No reports available yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Reports are generated automatically from your insights, queries and datasets. Run some queries first.'}
            </p>
            {!searchQuery && (
              <button onClick={handleGenerateReport} className="btn-primary">
                <Plus className="w-4 h-4 mr-2 inline" />
                Refresh Reports
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getReportIcon(report.type)}
                    <div>
                      <h3 className="font-semibold text-foreground">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">{report.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(report.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Generated:</span>
                      <p className="font-medium">{report.generated}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <p className="font-medium">{report.format}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Records:</span>
                      <p className="font-medium">{report.rawData.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Downloads:</span>
                      <p className="font-medium">{report.downloads}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="btn-secondary flex-1 flex items-center justify-center space-x-1"
                      disabled={report.status !== 'completed'}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                    <button
                      onClick={() => handleShareReport(report)}
                      className="btn-ghost p-2"
                      title="Copy report summary to clipboard"
                    >
                      {copiedId === report.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="btn-ghost p-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
