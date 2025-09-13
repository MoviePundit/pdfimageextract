import { useState } from "react";
import { Archive, FileCode, ChevronDown, ChevronUp, RotateCcw, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExtractionJob, ExtractionMetadata } from "@shared/schema";

interface ResultsSectionProps {
  job: ExtractionJob;
  onReset: () => void;
}

export default function ResultsSection({ job, onReset }: ResultsSectionProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  const metadata = job.metadata as ExtractionMetadata | null;

  const formatTime = (startTime: Date, endTime: Date | null): string => {
    if (!endTime) return '0:00';
    const elapsed = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const downloadZip = async () => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/download/zip`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.filename.replace('.pdf', '')}-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const downloadJson = async () => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/download/json`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.filename.replace('.pdf', '')}-metadata.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Card className="p-8" data-testid="results-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Extraction Complete</h2>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground">Successfully extracted</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-2xl font-bold text-green-600" data-testid="text-total-images">
            {job.imagesFound}
          </p>
          <p className="text-sm text-foreground">Images Extracted</p>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-total-size-result">
            {formatSize(job.totalImageSize || 0).split(' ')[0]}
          </p>
          <p className="text-sm text-foreground">{formatSize(job.totalImageSize || 0).split(' ')[1]} Total Size</p>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-processing-time">
            {job.startedAt && job.completedAt ? formatTime(job.startedAt, job.completedAt) : '0:00'}
          </p>
          <p className="text-sm text-foreground">Processing Time</p>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-pages-processed-result">
            {job.totalPages || 0}
          </p>
          <p className="text-sm text-foreground">Pages Processed</p>
        </div>
      </div>
      
      {/* Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg">
                <Archive className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Images Archive</h3>
                <p className="text-sm text-muted-foreground">ZIP file with all extracted images</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {job.filename.replace('.pdf', '')}-images.zip
            </span>
            <span className="text-sm font-medium text-foreground" data-testid="text-zip-size">
              {formatSize(job.totalImageSize || 0)}
            </span>
          </div>
          <Button
            onClick={downloadZip}
            className="w-full flex items-center justify-center space-x-2"
            data-testid="button-download-zip"
          >
            <Download className="w-4 h-4" />
            <span>Download ZIP</span>
          </Button>
        </div>
        
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg">
                <FileCode className="text-green-500 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Metadata JSON</h3>
                <p className="text-sm text-muted-foreground">Image details and properties</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {job.filename.replace('.pdf', '')}-metadata.json
            </span>
            <span className="text-sm font-medium text-foreground" data-testid="text-json-size">
              {metadata ? formatSize(JSON.stringify(metadata).length) : '0 B'}
            </span>
          </div>
          <Button
            onClick={downloadJson}
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2"
            data-testid="button-download-json"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </Button>
        </div>
      </div>
      
      {/* Metadata Preview */}
      {metadata && (
        <div className="border border-border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Metadata Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-metadata"
            >
              {showMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          {showMetadata && (
            <div className="p-4 bg-secondary/30" data-testid="metadata-content">
              <pre className="text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* Reset Button */}
      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground flex items-center space-x-2 mx-auto"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Process Another PDF</span>
        </Button>
      </div>
    </Card>
  );
}
