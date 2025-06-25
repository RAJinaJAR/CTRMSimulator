import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import HotspotEditor from "@/components/hotspot-editor";

interface FrameData {
  url: string;
  type: string;
  filename: string;
  timestamp: number;
  selected: boolean;
  speechSegment?: number;
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
      const formData = new FormData();
      formData.append('video', file);
      formData.append('quickMode', quickMode.toString());
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setFrameAnalysis(data.frameAnalysis || []);
      setIsProcessing(false);
      if (data.frameAnalysis && data.frameAnalysis.length > 0) {
        setSelectedFrame(data.frameAnalysis[0]);
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setIsProcessing(false);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setFrameAnalysis([]);
      setSelectedFrame(null);
      uploadVideoMutation.mutate(file);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".mp4,.mov,.avi,.mkv"
              onChange={handleFileUpload}
              className="hidden"
              id="video-upload"
              disabled={isProcessing}
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-600">
                    {isProcessing ? 'Processing Video...' : 'Upload Video File'}
                  </p>
                  <p className="text-sm text-gray-500">
                    MP4, MOV, AVI, MKV up to 100MB
                  </p>
                </div>
                {!isProcessing && (
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    Choose File
                  </Button>
                )}
              </div>
            </label>
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
                            {frame.clickData?.reason || 'No click detected'}
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
                      <button
                        onClick={() => toggleFrameSelection(index)}
                        className={`absolute top-2 right-2 w-6 h-6 rounded border-2 ${
                          frame.selected 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {frame.selected && '✓'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Frame Display */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Frame Analysis
              </h2>
              {selectedFrame ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedFrame.url}
                      alt="Selected frame"
                      className="w-full h-auto rounded border"
                    />
                    {selectedFrame.clickData && (
                      <div
                        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${(selectedFrame.clickData.x / 800) * 100}%`,
                          top: `${(selectedFrame.clickData.y / 600) * 100}%`
                        }}
                        title={`Click detected: ${selectedFrame.clickData.reason}`}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Frame Info</p>
                      <p className="text-gray-600">Type: {selectedFrame.type}</p>
                      <p className="text-gray-600">File: {selectedFrame.filename}</p>
                      <p className="text-gray-600">Selected: {selectedFrame.selected ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Click Detection</p>
                      {selectedFrame.clickData ? (
                        <>
                          <p className="text-gray-600">Position: ({selectedFrame.clickData.x}, {selectedFrame.clickData.y})</p>
                          <p className="text-gray-600">Confidence: {Math.round(selectedFrame.clickData.confidence * 100)}%</p>
                          <p className="text-gray-600">Reason: {selectedFrame.clickData.reason}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No click detected</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded border">
                  <p className="text-gray-500">Select a frame to analyze</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
