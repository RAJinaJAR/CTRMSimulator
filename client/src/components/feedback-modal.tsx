import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  timeSpent?: number;
  onClose: () => void;
}

export default function FeedbackModal({
  show,
  type,
  message,
  timeSpent,
  onClose
}: FeedbackModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 transform transition-all">
        {type === 'success' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 success" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Correct!</h3>
            <p className="text-gray-600">{message}</p>
            {timeSpent && (
              <div className="text-sm text-gray-500">
                <span>Time taken: </span>
                <span className="font-medium">{timeSpent.toFixed(1)} seconds</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <X className="h-8 w-8 error" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Try Again</h3>
            <p className="text-gray-600">{message}</p>
            <Button onClick={onClose} className="bg-primary text-white hover:bg-blue-700">
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
