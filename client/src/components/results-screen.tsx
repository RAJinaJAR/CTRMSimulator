import { Trophy, RotateCcw, Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestSession } from "@shared/schema";
import type { PerformanceMetrics, StepHistory } from "@/hooks/use-test-session";

interface ResultsScreenProps {
  session: TestSession;
  performance: PerformanceMetrics;
  stepHistory: StepHistory[];
  onRetakeTest: () => void;
}

export default function ResultsScreen({
  session,
  performance,
  stepHistory,
  onRetakeTest
}: ResultsScreenProps) {
  
  const exportResults = () => {
    const results = {
      session,
      performance,
      stepHistory,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctrm-test-results-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-10 w-10 success" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Test Complete!</h1>
            <p className="text-lg text-gray-600">
              You've successfully completed the CTRM interface test.
            </p>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary">{performance.accuracy}%</div>
              <div className="text-sm text-gray-600 mt-1">Overall Score</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold success">
                {performance.correctClicks}/{session.totalSteps}
              </div>
              <div className="text-sm text-gray-600 mt-1">Correct Clicks</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold warning">{performance.averageTime}s</div>
              <div className="text-sm text-gray-600 mt-1">Avg. Time</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {((performance.correctClicks + performance.incorrectClicks) * performance.averageTime).toFixed(0)}s
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Time</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Step-by-Step Breakdown
            </h2>
            <div className="space-y-2">
              {stepHistory.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {step.isCorrect ? (
                      <Check className="h-5 w-5 success" />
                    ) : (
                      <X className="h-5 w-5 error" />
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{step.timeSpent}s</span>
                    <span className={`font-medium ${step.isCorrect ? 'success' : 'error'}`}>
                      {step.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button onClick={onRetakeTest} className="bg-primary text-white hover:bg-blue-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Test
            </Button>
            <Button onClick={exportResults} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
