import { CheckCircle, Loader2, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ExtractionJob } from "@shared/schema";

interface ProcessingStatusProps {
  job: ExtractionJob;
}

export default function ProcessingStatus({ job }: ProcessingStatusProps) {
  const getStageIcon = (stage: string, currentStage: string) => {
    if (stage === currentStage) {
      return <Loader2 className="w-4 h-4 animate-spin text-white" />;
    } else if (getStageOrder(stage) < getStageOrder(currentStage)) {
      return <CheckCircle className="w-4 h-4 text-white" />;
    } else {
      return <Archive className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStageOrder = (stage: string): number => {
    const order = { parsing: 0, extracting: 1, zipping: 2 };
    return order[stage as keyof typeof order] || 0;
  };

  const getStageStatus = (stage: string, currentStage: string): string => {
    if (stage === currentStage) {
      return getStageProgress(stage, job);
    } else if (getStageOrder(stage) < getStageOrder(currentStage)) {
      return "Completed";
    } else {
      return "Pending";
    }
  };

  const getStageProgress = (stage: string, job: ExtractionJob): string => {
    switch (stage) {
      case 'parsing':
        return 'Analyzing PDF...';
      case 'extracting':
        return `Processing page ${job.pagesProcessed}/${job.totalPages || '?'}`;
      case 'zipping':
        return 'Creating archive...';
      default:
        return 'Processing...';
    }
  };

  const formatTime = (startTime: Date): string => {
    const elapsed = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-8" data-testid="processing-status">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Extraction Progress</h2>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-muted-foreground">Processing...</span>
        </div>
      </div>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-muted-foreground" data-testid="text-progress">
            {job.progress}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300 relative overflow-hidden" 
            style={{ width: `${job.progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Stage Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['parsing', 'extracting', 'zipping'].map((stage) => {
          const isCurrent = job.currentStage === stage;
          const isCompleted = getStageOrder(stage) < getStageOrder(job.currentStage || 'parsing');
          
          return (
            <div 
              key={stage}
              className={`text-center p-4 rounded-lg ${
                isCurrent 
                  ? 'bg-yellow-500/10 border border-yellow-500/20' 
                  : isCompleted 
                  ? 'bg-secondary/50' 
                  : 'bg-muted/50'
              }`}
              data-testid={`stage-${stage}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                isCurrent 
                  ? 'bg-yellow-500' 
                  : isCompleted 
                  ? 'bg-green-500' 
                  : 'bg-muted border-2 border-border'
              }`}>
                {getStageIcon(stage, job.currentStage || 'parsing')}
              </div>
              <p className="text-sm font-medium text-foreground capitalize">
                {stage === 'parsing' ? 'PDF Parsing' : stage === 'extracting' ? 'Image Extraction' : 'ZIP Creation'}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStageStatus(stage, job.currentStage || 'parsing')}
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-images-found">
            {job.imagesFound}
          </p>
          <p className="text-xs text-muted-foreground">Images Found</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-pages-processed">
            {job.pagesProcessed}
          </p>
          <p className="text-xs text-muted-foreground">Pages Processed</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-total-size">
            {formatSize(job.totalImageSize || 0).split(' ')[0]}
          </p>
          <p className="text-xs text-muted-foreground">{formatSize(job.totalImageSize || 0).split(' ')[1]} Total Size</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-2xl font-bold text-primary" data-testid="text-time-elapsed">
            {job.startedAt ? formatTime(job.startedAt) : '0:00'}
          </p>
          <p className="text-xs text-muted-foreground">Time Elapsed</p>
        </div>
      </div>
    </Card>
  );
}
