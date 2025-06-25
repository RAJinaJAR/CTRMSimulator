import { Upload, BarChart, RotateCcw, Pause, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TestSession } from "@shared/schema";
import type { PerformanceMetrics, StepHistory } from "@/hooks/use-test-session";

interface ControlSidebarProps {
  session: TestSession | null;
  performance: PerformanceMetrics;
  stepHistory: StepHistory[];
  onVideoUpload: (file: File) => void;
  onResetTest: () => void;
  isLoading: boolean;
  uploadProgress: number;
}

export default function ControlSidebar({
  session,
  performance,
  stepHistory,
  onVideoUpload,
  onResetTest,
  isLoading,
  uploadProgress
}: ControlSidebarProps) {
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onVideoUpload(file);
    }
  };

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Test Setup Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Upload className="mr-2 text-primary h-5 w-5" />
            Test Setup
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              type="file"
              accept=".mp4,.mov"
              onChange={handleFileChange}
              className="hidden"
              id="video-upload"
              disabled={isLoading}
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">
                  {isLoading ? 'Processing Video...' : 'Upload CTRM Video'}
                </p>
                <p className="text-xs text-gray-500">MP4, MOV up to 100MB</p>
              </div>
            </label>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500 text-center">
                Extracting frames and analyzing video...
              </p>
            </div>
          )}

          {session && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Test Name:</span>
                <span className="font-medium text-gray-900">{session.testName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Steps:</span>
                <span className="font-medium text-gray-900">{session.totalSteps}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Extracted Frames:</span>
                <span className="font-medium success">{session.extractedFrames.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart className="mr-2 text-primary h-5 w-5" />
            Performance
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold success">{performance.correctClicks}</div>
              <div className="text-xs text-gray-600">Correct</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold error">{performance.incorrectClicks}</div>
              <div className="text-xs text-gray-600">Incorrect</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Time:</span>
              <span className="font-medium text-gray-900">{performance.averageTime}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Step Time:</span>
              <span className="font-medium warning">{performance.currentStepTime}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-medium success">{performance.accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Step History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Step History</h3>
          
          <div className="space-y-2">
            {stepHistory.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-2 rounded border-l-4 ${
                  step.isCorrect 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {step.isCorrect ? (
                    <Check className="h-4 w-4 success" />
                  ) : (
                    <X className="h-4 w-4 error" />
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <span className="text-xs text-gray-600">{step.timeSpent}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onResetTest}
            className="w-full"
            variant="default"
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Test
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause Test
          </Button>
        </div>
      </div>
    </aside>
  );
}
