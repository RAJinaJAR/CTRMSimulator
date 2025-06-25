import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface TestFrame {
  url: string;
  hotspots: Hotspot[];
}

interface TestSimulationProps {
  frames: string[];
  hotspots: Hotspot[][];
  onComplete: (results: TestResult[]) => void;
  onExit: () => void;
}

interface TestResult {
  frameIndex: number;
  correct: boolean;
  attempts: number;
  timeSpent: number;
  clickedHotspot?: string;
}

export default function TestSimulation({ frames, hotspots, onComplete, onExit }: TestSimulationProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({
    show: false,
    correct: false,
    message: ''
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const currentFrame = frames[currentFrameIndex];
  const currentHotspots = hotspots[currentFrameIndex] || [];

  useEffect(() => {
    setStartTime(Date.now());
    setAttempts(0);
  }, [currentFrameIndex]);

  const handleHotspotClick = (hotspot: Hotspot) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Any hotspot on the current frame is considered correct for now
    // In the future, you could add logic to specify which hotspot is the "correct" one
    const isCorrect = true; // Since user manually placed these hotspots, any click is valid
    const timeSpent = Date.now() - startTime;

    console.log(`Frame ${currentFrameIndex}: Clicked hotspot "${hotspot.label}" - Correct: ${isCorrect}`);

    const result: TestResult = {
      frameIndex: currentFrameIndex,
      correct: isCorrect,
      attempts: newAttempts,
      timeSpent,
      clickedHotspot: hotspot.label
    };

    setResults(prev => [...prev, result]);

    if (isCorrect) {
      setFeedback({
        show: true,
        correct: true,
        message: `Correct! You clicked "${hotspot.label}"`
      });

      // Move to next frame after a short delay
      setTimeout(() => {
        setFeedback({ show: false, correct: false, message: '' });
        
        if (currentFrameIndex < frames.length - 1) {
          setCurrentFrameIndex(prev => prev + 1);
        } else {
          // Test completed
          setIsCompleted(true);
          onComplete([...results, result]);
        }
      }, 1500);
    } else {
      setFeedback({
        show: true,
        correct: false,
        message: `Incorrect. Try again! (Attempt ${newAttempts})`
      });

      // Hide feedback after a delay but don't advance
      setTimeout(() => {
        setFeedback({ show: false, correct: false, message: '' });
      }, 2000);
    }
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (feedback.show || isCompleted) return;

    // Check if click was on a hotspot
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    console.log(`Click at ${x.toFixed(2)}%, ${y.toFixed(2)}% on frame ${currentFrameIndex}`);
    console.log(`Current frame has ${currentHotspots.length} hotspots:`, currentHotspots);

    // Find clicked hotspot (with larger tolerance for better user experience)
    const tolerance = 8; // 8% tolerance for easier clicking
    const clickedHotspot = currentHotspots.find(hotspot => {
      const distance = Math.sqrt(Math.pow(hotspot.x - x, 2) + Math.pow(hotspot.y - y, 2));
      console.log(`Distance to hotspot "${hotspot.label}" at (${hotspot.x.toFixed(2)}, ${hotspot.y.toFixed(2)}): ${distance.toFixed(2)}`);
      return distance < tolerance;
    });

    if (clickedHotspot) {
      console.log(`Successfully clicked hotspot: ${clickedHotspot.label}`);
      handleHotspotClick(clickedHotspot);
    } else {
      // Clicked outside hotspot
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      console.log(`Missed all hotspots. Attempt ${newAttempts}`);
      setFeedback({
        show: true,
        correct: false,
        message: `No target here. Try again! (Attempt ${newAttempts})`
      });

      setTimeout(() => {
        setFeedback({ show: false, correct: false, message: '' });
      }, 1500);
    }
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Completed!</h2>
            <p className="text-gray-600 mb-6">
              You've successfully completed all {frames.length} frames.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Results Summary</h3>
              <div className="space-y-2 text-sm">
                <p>Total Frames: {frames.length}</p>
                <p>Correct on First Try: {results.filter(r => r.correct && r.attempts === 1).length}</p>
                <p>Total Attempts: {results.reduce((sum, r) => sum + r.attempts, 0)}</p>
                <p>Average Time per Frame: {Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length / 1000)}s</p>
              </div>
            </div>

            <Button onClick={onExit} className="w-full">
              Return to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">CTRM Interface Test</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Frame {currentFrameIndex + 1} of {frames.length}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Attempts: {attempts}
            </span>
            <Button onClick={onExit} variant="outline" size="sm">
              Exit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative max-w-4xl w-full">
          {/* Frame Image */}
          <div 
            className="relative cursor-crosshair"
            onClick={handleImageClick}
          >
            <img
              src={currentFrame}
              alt={`Test frame ${currentFrameIndex + 1}`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            
            {/* Invisible Hotspots (for testing) */}
            {currentHotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className="absolute opacity-0 hover:opacity-20 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: '40px',
                  height: '40px',
                }}
                title={`Hotspot: ${hotspot.label}`}
              />
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-white text-lg">
              Click on the interface element to proceed to the next step
            </p>
            <p className="text-gray-300 text-sm mt-2">
              {currentHotspots.length} interactive element(s) on this frame
            </p>
          </div>

          {/* Feedback Modal */}
          {feedback.show && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white rounded-lg p-6 mx-4 text-center max-w-md">
                {feedback.correct ? (
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                )}
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {feedback.correct ? 'Correct!' : 'Try Again'}
                </p>
                <p className="text-gray-600">{feedback.message}</p>
                {feedback.correct && (
                  <div className="mt-4 flex items-center justify-center text-green-600">
                    <span className="mr-2">Moving to next frame</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-t p-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentFrameIndex + 1) / frames.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Progress: {currentFrameIndex + 1} / {frames.length} frames completed
          </p>
        </div>
      </div>
    </div>
  );
}