import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import type { TestSession, HotspotData } from "@shared/schema";

interface TestDisplayProps {
  session: TestSession | null;
  currentFrame: string | null;
  currentHotspots: HotspotData[];
  stepTimer: number;
  onHotspotClick: (hotspotId: string, clickX: number, clickY: number, isCorrect: boolean, timeSpent: number) => void;
}

export default function TestDisplay({
  session,
  currentFrame,
  currentHotspots,
  stepTimer,
  onHotspotClick
}: TestDisplayProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  };

  const handleHotspotClick = (event: React.MouseEvent, hotspot: HotspotData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert click coordinates to original image coordinates
    const img = (event.currentTarget.parentElement as HTMLElement).querySelector('img');
    if (!img) return;
    
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    
    const originalX = clickX * scaleX;
    const originalY = clickY * scaleY;
    
    // Check if click is within 50px tolerance of expected coordinates
    const tolerance = 25; // 50px total (25px in each direction)
    const isCorrect = Math.abs(originalX - hotspot.x) <= tolerance && 
                     Math.abs(originalY - hotspot.y) <= tolerance;
    
    onHotspotClick(hotspot.id, originalX, originalY, isCorrect, stepTimer);
  };

  if (!session || !currentFrame) {
    return (
      <main className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600">
            Upload a video to start testing
          </h2>
          <p className="text-gray-500">
            Upload a CTRM software recording to begin the interactive assessment
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 relative overflow-hidden bg-gray-100">
      {/* Current Step Indicator */}
      <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-900">
            Step {session.currentStep}: Navigate Interface
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono font-medium text-gray-900">
            {formatTime(stepTimer)}
          </span>
        </div>
      </div>

      {/* Screenshot Display Area */}
      <div className="h-full w-full relative">
        <img
          src={currentFrame}
          alt="CTRM software interface screenshot"
          className="w-full h-full object-contain bg-white"
          onLoad={handleImageLoad}
        />

        {/* Invisible Hotspot Overlays */}
        <div className="absolute inset-0">
          {currentHotspots.map((hotspot) => {
            // Calculate scaled coordinates based on current image size
            // Get actual image dimensions for proper scaling
            const img = document.querySelector('img');
            const naturalWidth = img?.naturalWidth || 1920;
            const naturalHeight = img?.naturalHeight || 1080;
            
            const scaleX = imageSize.width / naturalWidth;
            const scaleY = imageSize.height / naturalHeight;
            
            const scaledX = hotspot.x * scaleX;
            const scaledY = hotspot.y * scaleY;
            
            return (
              <div
                key={hotspot.id}
                className="absolute w-12 h-12 cursor-pointer"
                style={{
                  left: `${scaledX - 24}px`, // Center the 48px div on the coordinate
                  top: `${scaledY - 24}px`,
                }}
                onClick={(event) => handleHotspotClick(event, hotspot)}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
