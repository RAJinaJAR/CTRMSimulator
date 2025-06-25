import { TrendingUp, HelpCircle } from "lucide-react";

interface AppHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export default function AppHeader({ currentStep, totalSteps }: AppHeaderProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">CTRM Testing Platform</h1>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {currentStep}/{totalSteps}
                </span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
