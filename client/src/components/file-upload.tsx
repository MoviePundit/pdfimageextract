import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  disabled: boolean;
}

export default function FileUpload({ onFileUpload, isUploading, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    disabled
  });

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleExtract = () => {
    if (selectedFile && !isUploading) {
      onFileUpload(selectedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Upload PDF File</h2>
        <p className="text-muted-foreground">Drag and drop your PDF file or click to browse</p>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-primary bg-muted/50' : 'border-border hover:border-primary hover:bg-muted/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        data-testid="dropzone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
            <CloudUpload className="text-2xl text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">Drop your PDF file here</p>
            <p className="text-muted-foreground">
              or <span className="text-primary font-medium">click to browse</span>
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Check className="w-4 h-4 text-green-500" />
              <span>PDF files only</span>
            </span>
            <span className="flex items-center space-x-1">
              <Check className="w-4 h-4 text-green-500" />
              <span>Max 500MB</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* File Info Display */}
      {selectedFile && (
        <div className="mt-6 p-4 bg-secondary rounded-lg" data-testid="file-info">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <FileText className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive"
              data-testid="button-remove-file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-center">
        <Button 
          onClick={handleExtract}
          disabled={!selectedFile || isUploading || disabled}
          className="px-8 py-3 flex items-center space-x-2"
          data-testid="button-extract"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Extract Images'}</span>
        </Button>
      </div>
    </Card>
  );
}
