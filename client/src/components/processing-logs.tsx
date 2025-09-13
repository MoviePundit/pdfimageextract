import { useState } from "react";
import { Trash2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExtractionJob, LogEntry } from "@shared/schema";

interface ProcessingLogsProps {
  job: ExtractionJob;
}

export default function ProcessingLogs({ job }: ProcessingLogsProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const logs = Array.isArray(job.logs) ? job.logs as LogEntry[] : [];

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'INFO':
        return 'text-green-600';
      case 'DEBUG':
        return 'text-blue-600';
      case 'WARN':
        return 'text-yellow-600';
      case 'ERROR':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `${formatTime(log.timestamp)} [${log.level}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.filename.replace('.pdf', '')}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8" data-testid="processing-logs">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Processing Logs</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadLogs}
            className="text-sm text-muted-foreground hover:text-foreground"
            data-testid="button-download-logs"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      
      <div 
        className="bg-secondary/30 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-1"
        data-testid="log-container"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            No logs available yet
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-2 py-1 animate-in slide-in-from-top-2 duration-300"
              data-testid={`log-entry-${index}`}
            >
              <span className="text-muted-foreground text-xs mt-1">
                {formatTime(log.timestamp)}
              </span>
              <span className={getLevelColor(log.level)}>
                [{log.level}]
              </span>
              <span className="text-foreground flex-1">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
