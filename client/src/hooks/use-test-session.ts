import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TestSession, TestAttempt, HotspotData } from "@shared/schema";

export interface PerformanceMetrics {
  correctClicks: number;
  incorrectClicks: number;
  averageTime: number;
  currentStepTime: number;
  accuracy: number;
}

export interface StepHistory {
  stepNumber: number;
  label: string;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
}

export function useTestSession() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [stepTimer, setStepTimer] = useState(0);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    correctClicks: 0,
    incorrectClicks: 0,
    averageTime: 0,
    currentStepTime: 0,
    accuracy: 0
  });
  const [stepHistory, setStepHistory] = useState<StepHistory[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch current session
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['/api/test-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Fetch test attempts for performance tracking
  const { data: attempts = [] } = useQuery({
    queryKey: ['/api/test-attempts/session', sessionId],
    enabled: !!sessionId,
  });

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - stepStartTime) / 1000;
      setStepTimer(elapsed);
      setPerformance(prev => ({ ...prev, currentStepTime: elapsed }));
    }, 100);

    return () => clearInterval(interval);
  }, [stepStartTime]);

  // Update performance metrics when attempts change
  useEffect(() => {
    if (attempts.length > 0) {
      const correctAttempts = attempts.filter(a => a.isCorrect);
      const incorrectAttempts = attempts.filter(a => !a.isCorrect);
      const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
      const averageTime = totalTime / attempts.length / 1000; // Convert to seconds
      const accuracy = attempts.length > 0 ? Math.round((correctAttempts.length / attempts.length) * 100) : 0;

      setPerformance(prev => ({
        ...prev,
        correctClicks: correctAttempts.length,
        incorrectClicks: incorrectAttempts.length,
        averageTime: Number(averageTime.toFixed(1)),
        accuracy
      }));

      // Update step history
      const history: StepHistory[] = [];
      for (let i = 1; i <= (session?.currentStep || 1) - 1; i++) {
        const stepAttempts = attempts.filter(a => a.stepNumber === i);
        if (stepAttempts.length > 0) {
          const lastAttempt = stepAttempts[stepAttempts.length - 1];
          history.push({
            stepNumber: i,
            label: `Step ${i}`,
            isCorrect: lastAttempt.isCorrect,
            timeSpent: Number((lastAttempt.timeSpent / 1000).toFixed(1)),
            attempts: stepAttempts.length
          });
        }
      }
      setStepHistory(history);
    }
  }, [attempts, session]);

  // Video upload mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload video');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      // Create test session with extracted data
      const sessionResponse = await apiRequest('POST', '/api/test-sessions', {
        testName: 'CTRM Interface Test',
        userId: null,
        extractedFrames: data.frames,
        hotspotData: data.hotspotData,
        totalSteps: data.totalSteps
      });
      
      const newSession = await sessionResponse.json();
      setSessionId(newSession.id);
      setStepStartTime(Date.now());
      setUploadProgress(0);
    }
  });

  // Test attempt mutation
  const recordAttemptMutation = useMutation({
    mutationFn: async (attemptData: {
      sessionId: number;
      stepNumber: number;
      hotspotId: string;
      clickX: number;
      clickY: number;
      expectedX: number;
      expectedY: number;
      isCorrect: boolean;
      timeSpent: number;
    }) => {
      const response = await apiRequest('POST', '/api/test-attempts', attemptData);
      return response.json();
    }
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<TestSession>) => {
      if (!sessionId) throw new Error('No session ID');
      const response = await apiRequest('PATCH', `/api/test-sessions/${sessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      refetchSession();
    }
  });

  const handleVideoUpload = useCallback((file: File) => {
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    uploadVideoMutation.mutate(file);
  }, [uploadVideoMutation]);

  const handleHotspotClick = useCallback((
    hotspotId: string,
    clickX: number,
    clickY: number,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    if (!session) return;

    const currentHotspots = session.hotspotData[session.currentStep - 1] || [];
    const targetHotspot = currentHotspots.find(h => h.id === hotspotId);
    
    if (!targetHotspot) return;

    // Record the attempt
    recordAttemptMutation.mutate({
      sessionId: session.id,
      stepNumber: session.currentStep,
      hotspotId,
      clickX,
      clickY,
      expectedX: targetHotspot.x,
      expectedY: targetHotspot.y,
      isCorrect,
      timeSpent: Math.round(timeSpent * 1000) // Convert to milliseconds
    });

    // If correct, advance to next step
    if (isCorrect) {
      const nextStep = session.currentStep + 1;
      const isCompleted = nextStep > session.totalSteps;
      
      updateSessionMutation.mutate({
        currentStep: nextStep,
        isCompleted,
        completedTime: isCompleted ? new Date() : undefined
      });

      if (!isCompleted) {
        setStepStartTime(Date.now());
      }
    }
  }, [session, recordAttemptMutation, updateSessionMutation]);

  const resetTest = useCallback(() => {
    setSessionId(null);
    setStepStartTime(Date.now());
    setStepTimer(0);
    setPerformance({
      correctClicks: 0,
      incorrectClicks: 0,
      averageTime: 0,
      currentStepTime: 0,
      accuracy: 0
    });
    setStepHistory([]);
    setUploadProgress(0);
  }, []);

  // Get current frame and hotspots
  const currentFrame = session?.extractedFrames[session.currentStep - 1] || null;
  const currentHotspots: HotspotData[] = session?.hotspotData[session.currentStep - 1] || [];

  return {
    session,
    currentFrame,
    currentHotspots,
    stepTimer,
    performance,
    stepHistory,
    handleVideoUpload,
    handleHotspotClick,
    resetTest,
    isLoading: uploadVideoMutation.isPending,
    uploadProgress
  };
}
