'use client';

import { useState, useEffect, useRef } from 'react';
import { datasetService, chatService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import {
  Database,
  Upload,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Lightbulb,
  Table,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────────────── */

interface Dataset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  row_count: number | null;
  column_count: number | null;
  processing_status: string;
  data_quality_score: number | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string | null;
  last_accessed_at: string | null;
}

interface PreviewData {
  columns: string[];
  rows: string[][];
  total_rows: number;
  preview_rows: number;
}

interface AnalysisResult {
  datasetName: string;
  reply: string;
  insights: {
    title?: string;
    headline?: string;
    explanation?: string;
    key_drivers?: string[];
    recommendations?: string[];
  } | null;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── Component ─────────────────────────────────────────────────────────── */

export function DatasetManager() {
  const { user } = useAuth();

  // list state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  // view modal state
  const [viewDataset, setViewDataset] = useState<Dataset | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState(20);
  const [previewPage, setPreviewPage] = useState(0);

  // analyse panel state
  const [analysing, setAnalysing] = useState<string | null>(null); // dataset id being analysed
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchDatasets(); }, [user]);

  /* ── Data fetching ── */

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await datasetService.getDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch datasets error:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Upload ── */

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadName(prev => prev || file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true);
    try {
      await datasetService.uploadDataset(uploadFile, uploadName.trim(), uploadDesc.trim());
      await fetchDatasets();
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ── View / Preview ── */

  const handleView = async (dataset: Dataset) => {
    setViewDataset(dataset);
    setPreview(null);
    setPreviewPage(0);
    setPreviewLoading(true);
    try {
      const raw = await datasetService.previewDataset(dataset.id, previewRows);
      // Normalise — backend may return { columns, rows } or { data, columns }
      const cols: string[] = raw?.columns || Object.keys(raw?.data?.[0] || {});
      const rows: string[][] = raw?.rows
        || (raw?.data || []).map((r: Record<string, any>) => cols.map(c => String(r[c] ?? '')));
      setPreview({
        columns: cols,
        rows,
        total_rows: raw?.total_rows ?? rows.length,
        preview_rows: rows.length,
      });
    } catch (e) {
      console.error('Preview error:', e);
      setPreview({ columns: [], rows: [], total_rows: 0, preview_rows: 0 });
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ── Analyse ── */

  const handleAnalyse = async (dataset: Dataset) => {
    setAnalysing(dataset.id);
    setAnalysis(null);
    try {
      const query = `Analyse the dataset named "${dataset.name}". It has ${dataset.row_count ?? 'unknown'} rows and ${dataset.column_count ?? 'unknown'} columns. Description: ${dataset.description || 'not provided'}. Provide key insights, trends, anomalies, and recommendations.`;
      const response = await chatService.sendMessage(query, {
        dataset_id: dataset.id,
        dataset_name: dataset.name,
        row_count: dataset.row_count,
        column_count: dataset.column_count,
      });

      const reply: string = response?.message || response?.reply || '';
      const insightsRaw = response?.insights;

      setAnalysis({
        datasetName: dataset.name,
        reply,
        insights: insightsRaw
          ? {
              title:           insightsRaw.title        || `Analysis: ${dataset.name}`,
              headline:        insightsRaw.headline      || '',
              explanation:     insightsRaw.explanation   || reply,
              key_drivers:     insightsRaw.key_drivers   || [],
              recommendations: insightsRaw.recommendations || [],
            }
          : { title: `Analysis: ${dataset.name}`, explanation: reply, key_drivers: [], recommendations: [] },
      });
    } catch (e: any) {
      console.error('Analyse error:', e);
      setAnalysis({
        datasetName: dataset.name,
        reply: `Error: ${e?.message || 'Analysis failed. Please try again.'}`,
        insights: null,
      });
    } finally {
      setAnalysing(null);
    }
  };

  /* ── Delete ── */

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await datasetService.deleteDataset(id);
      setDatasets(prev => prev.filter(d => d.id !== id));
      if (viewDataset?.id === id) setViewDataset(null);
      if (analysis?.datasetName === name) setAnalysis(null);
    } catch (e) {
      console.error('Delete error:', e);
      alert('Delete failed. Please try again.');
    }
  };

  /* ── Status helpers ── */

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'processing') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Calendar className="w-4 h-4 text-gray-400" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      failed:     'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] || 'bg-muted text-muted-foreground border-border'}`;
  };

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Render ─────────────────────────────────────────────────────────── */

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Please login to manage datasets</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dataset Management</h2>
          <p className="text-muted-foreground">Upload, preview, and analyse your datasets with AI</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDatasets} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Upload Dataset
          </button>
        </div>
      </div>

      {/* ── Analysis Result Panel ── */}
      {analysis && (
        <div className="bg-card rounded-xl border-2 border-yellow-500/30 p-6 relative">
          <button onClick={() => setAnalysis(null)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">{analysis.insights?.title || `Analysis: ${analysis.datasetName}`}</h3>
          </div>

          {analysis.insights?.headline && (
            <p className="font-medium text-foreground mb-3">{analysis.insights.headline}</p>
          )}

          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-4">
            {analysis.insights?.explanation || analysis.reply}
          </div>

          {(analysis.insights?.key_drivers?.length ?? 0) > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Key Drivers</p>
              <ul className="space-y-1">
                {analysis.insights!.key_drivers!.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">▸</span><span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(analysis.insights?.recommendations?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Recommendations</p>
              <ul className="space-y-1">
                {analysis.insights!.recommendations!.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search datasets…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* ── Stats strip ── */}
      {datasets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Datasets', value: datasets.length },
            { label: 'Completed', value: datasets.filter(d => d.processing_status === 'completed').length },
            { label: 'Total Rows', value: datasets.reduce((s, d) => s + (d.row_count ?? 0), 0).toLocaleString() },
            { label: 'Total Size', value: formatFileSize(datasets.reduce((s, d) => s + d.file_size, 0)) },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Dataset Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="text-center py-16">
          <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No datasets found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? 'Try a different search term' : 'Upload your first dataset to get started'}
          </p>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" /> Upload Dataset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDatasets.map(dataset => (
            <div key={dataset.id} className="bg-card rounded-xl border p-5 hover:shadow-md transition-all">

              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {dataset.file_type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={dataset.processing_status} />
                  <span className={statusBadge(dataset.processing_status)}>
                    {dataset.processing_status}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1 truncate">{dataset.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {dataset.description || 'No description'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground block">Size</span>
                  <span className="font-medium">{formatFileSize(dataset.file_size)}</span>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground block">Rows</span>
                  <span className="font-medium">{dataset.row_count?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground block">Columns</span>
                  <span className="font-medium">{dataset.column_count ?? '—'}</span>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground block">Uploaded</span>
                  <span className="font-medium">{formatDate(dataset.created_at)}</span>
                </div>
              </div>

              {/* Data quality */}
              {dataset.data_quality_score != null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Data Quality</span>
                    <span className="font-medium">{dataset.data_quality_score}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                      style={{ width: `${Math.min(dataset.data_quality_score, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleView(dataset)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button
                  onClick={() => handleAnalyse(dataset)}
                  disabled={analysing === dataset.id}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 disabled:opacity-60"
                >
                  {analysing === dataset.id
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing…</>
                    : <><BarChart3 className="w-3.5 h-3.5" /> Analyse</>
                  }
                </button>
                <button
                  onClick={() => handleDelete(dataset.id, dataset.name)}
                  className="p-2 hover:bg-destructive/10 rounded text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           VIEW MODAL  
      ═══════════════════════════════════════════════════════════ */}
      {viewDataset && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-background rounded-xl border w-full max-w-6xl my-8">

            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  {viewDataset.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">{viewDataset.description || 'No description'}</p>
              </div>
              <button onClick={() => setViewDataset(null)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info grid */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'File', value: viewDataset.file_name },
                  { label: 'Type', value: viewDataset.file_type.toUpperCase() },
                  { label: 'Size', value: formatFileSize(viewDataset.file_size) },
                  { label: 'Status', value: viewDataset.processing_status },
                  { label: 'Rows', value: viewDataset.row_count?.toLocaleString() ?? '—' },
                  { label: 'Columns', value: viewDataset.column_count ?? '—' },
                  { label: 'Uploaded', value: formatDate(viewDataset.created_at) },
                  { label: 'Last accessed', value: formatDate(viewDataset.last_accessed_at) },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    <p className="font-medium text-xs truncate">{String(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Table className="w-4 h-4" /> Data Preview
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={previewRows}
                    onChange={async e => {
                      const n = Number(e.target.value);
                      setPreviewRows(n);
                      setPreviewLoading(true);
                      try {
                        const raw = await datasetService.previewDataset(viewDataset.id, n);
                        const cols: string[] = raw?.columns || Object.keys(raw?.data?.[0] || {});
                        const rows: string[][] = raw?.rows
                          || (raw?.data || []).map((r: Record<string, any>) => cols.map(c => String(r[c] ?? '')));
                        setPreview({ columns: cols, rows, total_rows: raw?.total_rows ?? rows.length, preview_rows: rows.length });
                      } finally { setPreviewLoading(false); }
                    }}
                    className="text-xs border border-input rounded px-2 py-1 bg-background"
                  >
                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
                  </select>
                  <button
                    onClick={() => handleAnalyse(viewDataset)}
                    disabled={analysing === viewDataset.id}
                    className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
                  >
                    {analysing === viewDataset.id
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing…</>
                      : <><BarChart3 className="w-3.5 h-3.5" /> Analyse with AI</>
                    }
                  </button>
                </div>
              </div>

              {previewLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !preview || preview.columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-sm">Preview unavailable for this file type</p>
                </div>
              ) : (
                <>
                  <div className="overflow-auto rounded-lg border max-h-96">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium w-10">#</th>
                          {preview.columns.map(col => (
                            <th key={col} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, ri) => (
                          <tr key={ri} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-1.5 text-muted-foreground">{ri + 1}</td>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-1.5 max-w-xs truncate" title={cell}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing {preview.preview_rows} of {preview.total_rows.toLocaleString()} rows · {preview.columns.length} columns
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           UPLOAD MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Upload Dataset</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all"
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                {uploadFile
                  ? <p className="text-sm font-medium">{uploadFile.name} ({formatFileSize(uploadFile.size)})</p>
                  : <>
                      <p className="text-sm font-medium">Click to select a file</p>
                      <p className="text-xs text-muted-foreground mt-1">CSV, Excel, JSON, TXT</p>
                    </>
                }
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Dataset Name *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="e.g. Q1 Sales Data"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="What does this dataset contain?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadName(''); setUploadDesc(''); }}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadName.trim() || uploading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Uploading…</>
                  : <><Upload className="w-4 h-4 mr-2 inline" /> Upload</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
