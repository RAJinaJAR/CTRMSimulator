import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import HotspotEditor from "@/components/hotspot-editor";
import TestSimulation from "@/components/test-simulation";

interface FrameData {
  url: string;
  type: string;
  filename: string;
  timestamp: number;
  selected: boolean;
  clickData?: {
    x: number;
    y: number;
    confidence: number;
    reason: string;
  };
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
}

export default function TestInterface() {
  const [frameAnalysis, setFrameAnalysis] = useState<FrameData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  const [frameHotspots, setFrameHotspots] = useState<Record<number, Hotspot[]>>({});
  const [isEditingHotspots, setIsEditingHotspots] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const handleHotspotsChange = (frameIndex: number, hotspots: Hotspot[]) => {
    setFrameHotspots(prev => ({
      ...prev,
      [frameIndex]: hotspots
    }));
  };

  const toggleFrameSelection = (frameIndex: number) => {
    setFrameAnalysis(prev => prev.map((frame, index) => 
      index === frameIndex ? { ...frame, selected: !frame.selected } : frame
    ));
  };

  const uploadVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Starting upload for file:', file.name, file.size, file.type);
      
      const formData = new FormData();
      formData.append('video', file);
      formData.append('quickMode', quickMode.toString());
      
      console.log('FormData created, sending request...');
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    },
    onSuccess: (data) => {
      setFrameAnalysis(data.frameAnalysis || []);
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setIsProcessing(false);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setFrameAnalysis([]);
      setSelectedFrame(null);
      setFrameHotspots({});
      uploadVideoMutation.mutate(file);
    }
  };

  const createTestSession = () => {
    const selectedFrames = frameAnalysis.filter(frame => frame.selected);
    const testData = {
      frames: selectedFrames.map(frame => frame.url),
      hotspots: selectedFrames.map((frame) => {
        const originalIndex = frameAnalysis.findIndex(f => f.url === frame.url);
        return frameHotspots[originalIndex] || [];
      })
    };
    
    console.log('Creating test session with frames and their specific hotspots:', {
      frameCount: testData.frames.length,
      hotspotsPerFrame: testData.hotspots.map((h, i) => ({ frameIndex: i, hotspotCount: h.length })),
      fullData: testData
    });
    setIsTestRunning(true);
  };

  const handleTestComplete = (results: any[]) => {
    setTestResults(results);
    setIsTestRunning(false);
    console.log('Test completed with results:', results);
  };

  const handleTestExit = () => {
    setIsTestRunning(false);
  };

  // Prepare test data - ensure each frame gets only its own hotspots
  const selectedFrames = frameAnalysis.filter(frame => frame.selected);
  const testFrames = selectedFrames.map(frame => frame.url);
  const testHotspots = selectedFrames.map((frame) => {
    const originalIndex = frameAnalysis.findIndex(f => f.url === frame.url);
    const frameSpecificHotspots = frameHotspots[originalIndex] || [];
    console.log(`Frame ${originalIndex} (${frame.url}) has ${frameSpecificHotspots.length} hotspots:`, frameSpecificHotspots);
    return frameSpecificHotspots;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {isTestRunning && (
        <TestSimulation
          frames={testFrames}
          hotspots={testHotspots}
          onComplete={handleTestComplete}
          onExit={handleTestExit}
        />
      )}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Video Frame Extraction Tool
          </h1>
          <p className="text-gray-600 mb-6">
            Upload a video to extract frames. Choose Quick Mode for fast processing or Smart Mode for audio-based analysis.
          </p>

          {/* Processing Mode Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Mode</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={quickMode}
                  onChange={() => setQuickMode(true)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-green-700">Quick Mode</span>
                  <p className="text-sm text-gray-600">Fast extraction every 10 seconds (~30 seconds processing)</p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!quickMode}
                  onChange={() => setQuickMode(false)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-blue-700">Smart Mode</span>
                  <p className="text-sm text-gray-600">Audio-based extraction at speech moments (~5-10 minutes processing)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="video-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  MP4, MOV files up to 100MB
                </span>
              </label>
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept="video/mp4,video/mov,video/avi"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">
                {quickMode ? 'Extracting frames at regular intervals...' : 'Analyzing audio patterns and detecting speech segments...'}
              </p>
            </div>
          )}
        </div>

        {/* Admin Mode Toggle */}
        {frameAnalysis.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Admin Controls</h2>
              <Button
                onClick={() => setShowAdminMode(!showAdminMode)}
                variant={showAdminMode ? "default" : "outline"}
              >
                {showAdminMode ? "Hide Admin" : "Show Admin"}
              </Button>
            </div>
            {showAdminMode && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Use admin mode to review frames, select which ones to keep, and manually add hotspots.
                </p>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setIsEditingHotspots(!isEditingHotspots)}
                    variant={isEditingHotspots ? "destructive" : "default"}
                    size="sm"
                  >
                    {isEditingHotspots ? "Stop Editing" : "Edit Hotspots"}
                  </Button>
                  <span className="text-xs text-gray-500">
                    {Object.keys(frameHotspots).length} frames have hotspots
                  </span>
                  <Button
                    onClick={createTestSession}
                    disabled={frameAnalysis.filter(f => f.selected).length === 0}
                    size="sm"
                  >
                    Create Test Session
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {frameAnalysis.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Frame List */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Extracted Frames ({frameAnalysis.length})
                </h2>
                {showAdminMode && (
                  <div className="text-xs text-gray-500">
                    {frameAnalysis.filter(f => f.selected).length} selected
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {frameAnalysis.map((frame, index) => (
                  <div key={frame.url} className="relative">
                    <button
                      onClick={() => setSelectedFrame(frame)}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedFrame?.url === frame.url
                          ? 'border-blue-500 bg-blue-50'
                          : frame.selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={frame.url}
                          alt={`Frame ${index + 1}`}
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm">Frame {index + 1}</p>
                            <span className={`px-2 py-1 text-xs rounded ${
                              frame.type.includes('speech') 
                                ? 'bg-green-100 text-green-800' 
                                : frame.type === 'click'
                                ? 'bg-red-100 text-red-800'
                                : frame.type === 'scene'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {frame.type.includes('speech') ? 'Speech' : 
                               frame.type === 'click' ? 'Click' : 
                               frame.type === 'scene' ? 'Scene' : frame.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {frame.clickData?.reason || 'No analysis available'}
                          </p>
                          {frame.clickData && (
                            <p className="text-xs text-gray-400">
                              Confidence: {Math.round(frame.clickData.confidence * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    {showAdminMode && (
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <input
                          type="checkbox"
                          checked={frame.selected}
                          onChange={() => toggleFrameSelection(index)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        {frameHotspots[index] && frameHotspots[index].length > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {frameHotspots[index].length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Frame Preview and Hotspot Editor */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4">
              {selectedFrame ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Frame Preview & Hotspot Editor
                    </h2>
                    {showAdminMode && isEditingHotspots && (
                      <span className="text-sm text-blue-600">
                        Click on the image to add hotspots
                      </span>
                    )}
                  </div>
                  
                  {showAdminMode && isEditingHotspots ? (
                    <HotspotEditor
                      frameUrl={selectedFrame.url}
                      frameIndex={frameAnalysis.findIndex(f => f.url === selectedFrame.url)}
                      initialHotspots={frameHotspots[frameAnalysis.findIndex(f => f.url === selectedFrame.url)] || []}
                      onHotspotsChange={handleHotspotsChange}
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={selectedFrame.url}
                        alt="Selected frame"
                        className="w-full h-auto rounded border"
                      />
                      {/* Show existing hotspots */}
                      {frameHotspots[frameAnalysis.findIndex(f => f.url === selectedFrame.url)]?.map((hotspot) => (
                        <div
                          key={hotspot.id}
                          className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                          }}
                          title={hotspot.label}
                        >
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {hotspot.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h3 className="font-medium text-gray-900 mb-2">Frame Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Type:</span> {selectedFrame.type}</p>
                      <p><span className="font-medium">Selected:</span> {selectedFrame.selected ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Hotspots:</span> {frameHotspots[frameAnalysis.findIndex(f => f.url === selectedFrame.url)]?.length || 0}</p>
                      {selectedFrame.clickData && (
                        <div>
                          <p><span className="font-medium">Confidence:</span> {Math.round(selectedFrame.clickData.confidence * 100)}%</p>
                          <p><span className="font-medium">Analysis:</span> {selectedFrame.clickData.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>Select a frame to preview and edit hotspots</p>
                  {showAdminMode && (
                    <p className="text-sm mt-2">
                      Enable "Edit Hotspots" mode to manually add click areas
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}