'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/upload/file-uploader';
import { datasetService } from '@/lib/api';
import { 
  Upload, 
  Database, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Info,
  Loader2
} from 'lucide-react';

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUploadComplete = (dataset: any) => {
    setRecentUploads(prev => [dataset, ...prev.slice(0, 4)]);
  };

  const fetchRecentUploads = async () => {
    try {
      setLoading(true);
      const response = await datasetService.getDatasets();
      const datasets: any[] = response; // api.ts returns plain array via parseList

      // Sort by creation date and take the most recent 5
      const recent = datasets
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentUploads(recent);
    } catch (error) {
      console.error('Failed to fetch recent uploads:', error);
      setRecentUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchRecentUploads();
  });

  const formatDate = (dateString: string) => {
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

  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown';
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Data</h1>
          <p className="text-muted-foreground">Upload your datasets to start getting AI-powered insights</p>
        </div>

        {/* File Upload Component */}
        <FileUploader onUploadComplete={handleUploadComplete} />

        {/* Upload Guidelines */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Upload Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Supported Formats</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>CSV files with comma-separated values</li>
                <li>Excel files (.xlsx, .xls)</li>
                <li>JSON files with structured data</li>
                <li>Text files (.txt) with tabular data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Ensure consistent column headers</li>
                <li>Remove empty rows and columns</li>
                <li>Use standard date formats</li>
                <li>Keep file sizes under 50MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Recent Uploads
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading recent uploads...</span>
            </div>
          ) : recentUploads.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No uploads yet</h4>
              <p className="text-muted-foreground">Upload your first dataset to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{upload.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {upload.row_count?.toLocaleString() || 'Unknown'} rows
                        {' '}· {formatFileSize(upload.file_size)}
                        {' '}· {formatDate(upload.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      upload.processing_status === 'completed' 
                        ? 'bg-green-500' 
                        : upload.processing_status === 'processing'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-muted-foreground capitalize">
                      {upload.processing_status || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processing Information */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Processing Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Automatic Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Your data will be automatically processed and analyzed by our AI to generate insights
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Data Validation</h4>
                <p className="text-sm text-muted-foreground">
                  We validate your data for quality and consistency before processing
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Insight Generation</h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered insights are generated automatically once processing is complete
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
