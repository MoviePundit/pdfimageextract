import { FileText } from "lucide-react";
import FileUpload from "@/components/file-upload";
import ProcessingStatus from "@/components/processing-status";
import ProcessingLogs from "@/components/processing-logs";
import ResultsSection from "@/components/results-section";
import { useExtraction } from "@/hooks/use-extraction";

export default function Home() {
  const { 
    job, 
    isProcessing, 
    isCompleted, 
    uploadFile, 
    reset,
    isUploading 
  } = useExtraction();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <FileText className="text-primary-foreground text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PDF Image Extractor</h1>
              <p className="text-muted-foreground text-sm">Extract and download all images from PDF files</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* File Upload */}
        <FileUpload 
          onFileUpload={uploadFile}
          isUploading={isUploading}
          disabled={isProcessing}
        />

        {/* Processing Status */}
        {isProcessing && job && (
          <ProcessingStatus job={job} />
        )}

        {/* Processing Logs */}
        {(isProcessing || isCompleted) && job && (
          <ProcessingLogs job={job} />
        )}

        {/* Results */}
        {isCompleted && job && (
          <ResultsSection job={job} onReset={reset} />
        )}
      </main>
    </div>
  );
}
