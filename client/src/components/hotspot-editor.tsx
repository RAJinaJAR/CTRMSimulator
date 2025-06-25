import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface HotspotEditorProps {
  frameUrl: string;
  frameIndex: number;
  initialHotspots?: Hotspot[];
  onHotspotsChange: (frameIndex: number, hotspots: Hotspot[]) => void;
}

export default function HotspotEditor({ 
  frameUrl, 
  frameIndex, 
  initialHotspots = [], 
  onHotspotsChange 
}: HotspotEditorProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    console.log('Image clicked, isAddingHotspot:', isAddingHotspot);
    
    if (!isAddingHotspot || !imageRef.current) {
      console.log('Not in adding mode or no image ref');
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('Click position:', x, y, 'Image size:', rect.width, rect.height);
    
    // Convert to percentage coordinates for responsive hotspots
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    console.log('Percentage position:', xPercent, yPercent);

    const newHotspot: Hotspot = {
      id: `hotspot-${Date.now()}`,
      x: xPercent,
      y: yPercent,
      label: `Click ${hotspots.length + 1}`
    };

    const updatedHotspots = [...hotspots, newHotspot];
    console.log('Adding hotspot:', newHotspot, 'Total hotspots:', updatedHotspots.length);
    
    setHotspots(updatedHotspots);
    onHotspotsChange(frameIndex, updatedHotspots);
    setIsAddingHotspot(false);
  };

  const removeHotspot = (hotspotId: string) => {
    const updatedHotspots = hotspots.filter(h => h.id !== hotspotId);
    setHotspots(updatedHotspots);
    onHotspotsChange(frameIndex, updatedHotspots);
  };

  const updateHotspotLabel = (hotspotId: string, newLabel: string) => {
    const updatedHotspots = hotspots.map(h => 
      h.id === hotspotId ? { ...h, label: newLabel } : h
    );
    setHotspots(updatedHotspots);
    onHotspotsChange(frameIndex, updatedHotspots);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Edit Hotspots</h3>
        <Button
          onClick={() => setIsAddingHotspot(!isAddingHotspot)}
          variant={isAddingHotspot ? "destructive" : "default"}
          size="sm"
        >
          {isAddingHotspot ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Hotspot
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <img
          ref={imageRef}
          src={frameUrl}
          alt={`Frame ${frameIndex + 1}`}
          className={`w-full h-auto rounded border ${
            isAddingHotspot ? 'cursor-crosshair' : 'cursor-default'
          }`}
          onClick={handleImageClick}
        />
        
        {/* Render hotspots */}
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:bg-red-600 transition-colors"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
            }}
            title={hotspot.label}
            onClick={(e) => {
              e.stopPropagation();
              removeHotspot(hotspot.id);
            }}
          >
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {hotspot.label}
            </div>
          </div>
        ))}

        {isAddingHotspot && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-sm px-3 py-1 rounded">
            Click anywhere to add a hotspot
          </div>
        )}
      </div>

      {/* Hotspot list */}
      {hotspots.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Hotspots ({hotspots.length})</h4>
          {hotspots.map((hotspot, index) => (
            <div key={hotspot.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <span className="text-sm font-mono">#{index + 1}</span>
              <input
                type="text"
                value={hotspot.label}
                onChange={(e) => updateHotspotLabel(hotspot.id, e.target.value)}
                className="flex-1 text-sm border rounded px-2 py-1"
                placeholder="Hotspot label"
              />
              <span className="text-xs text-gray-500">
                ({Math.round(hotspot.x)}%, {Math.round(hotspot.y)}%)
              </span>
              <Button
                onClick={() => removeHotspot(hotspot.id)}
                variant="destructive"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}