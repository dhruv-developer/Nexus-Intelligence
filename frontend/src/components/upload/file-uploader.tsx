'use client';

import { useState, useRef } from 'react';
import { datasetService } from '@/lib/api';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (dataset: any) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export function FileUploader({ onUploadComplete, maxSize = 50, acceptedTypes = ['.csv', '.xlsx', '.json', '.txt'] }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setErrorMessage(`File size exceeds ${maxSize}MB limit`);
      setUploadStatus('error');
      return;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setErrorMessage(`File type ${fileExtension} not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !datasetName.trim()) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      const response = await datasetService.uploadDataset(
        selectedFile,
        datasetName,
        datasetDescription
      );

      setUploadProgress(100);
      setUploadStatus('success');
      
      if (onUploadComplete) {
        onUploadComplete(response);
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setDatasetName('');
        setDatasetDescription('');
        setUploadStatus('idle');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    setSelectedFile(null);
    setDatasetName('');
    setDatasetDescription('');
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/10'
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-500 bg-red-50'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={acceptedTypes.join(',')}
          className="hidden"
          disabled={uploading}
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Drop your file here or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                  disabled={uploading}
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: {acceptedTypes.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {maxSize}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)} - {selectedFile.type || 'Unknown type'}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="btn-ghost text-sm"
              disabled={uploading}
            >
              Remove file
            </button>
          </div>
        )}
      </div>

      {/* Dataset Details Form */}
      {selectedFile && (
        <div className="space-y-4 bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Dataset Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dataset Name *</label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
                placeholder="Enter dataset name"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={datasetDescription}
                onChange={(e) => setDatasetDescription(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background h-24"
                placeholder="Describe your dataset..."
                disabled={uploading}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>File uploaded successfully!</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-start space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <span>Upload failed</span>
                {errorMessage && (
                  <p className="text-sm mt-1">{errorMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !datasetName.trim() || uploading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Dataset
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
