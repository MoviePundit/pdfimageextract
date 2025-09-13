import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ExtractionJob } from "@shared/schema";

export function useExtraction() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Poll for job status
  const { data: job, refetch } = useQuery<ExtractionJob>({
    queryKey: ['/api/jobs', jobId],
    enabled: !!jobId,
    refetchInterval: 2000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<{ jobId: string }> => {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const reset = useCallback(() => {
    setJobId(null);
    setIsUploading(false);
  }, []);

  const isProcessing = job?.status === 'processing' || job?.status === 'pending';
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  return {
    job,
    isProcessing,
    isCompleted,
    isFailed,
    isUploading,
    uploadFile,
    reset,
    error: uploadMutation.error?.message || job?.errorMessage,
  };
}
