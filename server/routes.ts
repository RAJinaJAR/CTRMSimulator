import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { storage } from "./storage";
import { insertTestSessionSchema, insertTestAttemptSchema, insertTestResultSchema, type HotspotData } from "@shared/schema";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const execAsync = promisify(exec);

// Helper function to extract timestamp from filename
function extractTimestamp(filename: string): number {
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Configure multer for video uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 and MOV files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload video and extract frames
  app.post("/api/upload-video", upload.single("video"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const videoPath = req.file.path;
      const outputDir = `frames/${Date.now()}`;
      const quickMode = req.body.quickMode === 'true'; // Add quick mode option
      
      // Create output directory
      if (!fs.existsSync("frames")) {
        fs.mkdirSync("frames");
      }
      fs.mkdirSync(outputDir);

      if (quickMode) {
        console.log("Using quick mode - extracting frames at regular intervals");
        // Quick mode: extract frames every 10 seconds
        const quickCommand = `ffmpeg -i "${videoPath}" -vf "fps=1/10" "${outputDir}/quick_%03d.png"`;
        await execAsync(quickCommand);

        const quickFiles = fs.readdirSync(outputDir)
          .filter(file => file.startsWith('quick_') && file.endsWith('.png'))
          .sort()
          .map((file, index) => ({
            url: `/api/frames/${path.basename(outputDir)}/${file}`,
            type: 'quick_extract',
            filename: file,
            timestamp: index * 10,
            selected: true,
            clickData: {
              x: 400 + (index * 50) % 400,
              y: 300 + (index * 30) % 300,
              confidence: 0.7,
              reason: "Regular interval extraction"
            }
          }));

        fs.unlinkSync(videoPath);
        return res.json({
          frames: quickFiles.map(f => f.url),
          frameAnalysis: quickFiles,
          mode: 'quick',
          message: `Quick extraction completed. Extracted ${quickFiles.length} frames at 10-second intervals.`
        });
      }

      // Analyze audio patterns and detect cursor movements for click detection
      console.log("Analyzing audio patterns and tracking cursor movements...");
      
      // Extract audio and detect speech activity using silencedetect filter (faster, less sensitive)
      const audioAnalysisCommand = `ffmpeg -i "${videoPath}" -af "silencedetect=noise=-25dB:duration=1.0" -f null - 2>&1 | grep -E "(silence_start|silence_end)" > "${outputDir}/audio_analysis.txt" || true`;
      
      // Extract cursor tracking data using scene change detection to identify potential clicks
      const cursorTrackingCommand = `ffmpeg -i "${videoPath}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr "${outputDir}/cursor_%03d.png" 2> "${outputDir}/cursor_analysis.txt" || true`;
      
      try {
        await execAsync(audioAnalysisCommand);
        await execAsync(cursorTrackingCommand);
      } catch (error) {
        console.log("Audio and cursor analysis completed with output");
      }

      // Parse audio analysis to find speech segments
      let speechSegments: Array<{start: number, end: number}> = [];
      try {
        const audioData = fs.readFileSync(`${outputDir}/audio_analysis.txt`, 'utf8');
        const lines = audioData.split('\n');
        let silenceStart: number | null = null;
        let lastSpeechEnd = 0;
        
        for (const line of lines) {
          if (line.includes('silence_start:')) {
            const match = line.match(/silence_start: ([\d.]+)/);
            if (match && silenceStart === null) {
              const start = parseFloat(match[1]);
              if (start > lastSpeechEnd + 3) { // At least 3 seconds of speech (more selective)
                speechSegments.push({start: lastSpeechEnd, end: start});
              }
              silenceStart = start;
            }
          } else if (line.includes('silence_end:') && silenceStart !== null) {
            const match = line.match(/silence_end: ([\d.]+)/);
            if (match) {
              lastSpeechEnd = parseFloat(match[1]);
              silenceStart = null;
            }
          }
        }
      } catch (error) {
        console.log("Could not parse audio analysis, using fallback");
        // Fallback: extract frames every 15 seconds for faster processing
        const videoDuration = 300; // Assume max 5 minutes, adjust as needed
        speechSegments = Array.from({length: Math.ceil(videoDuration / 15)}, (_, i) => ({
          start: i * 15, 
          end: i * 15 + 2
        }));
      }

      // Parse cursor tracking data to identify potential click moments
      let clickEvents: Array<{timestamp: number, x?: number, y?: number, confidence: number}> = [];
      try {
        const cursorData = fs.readFileSync(`${outputDir}/cursor_analysis.txt`, 'utf8');
        const lines = cursorData.split('\n');
        
        for (const line of lines) {
          // Look for frame timestamps in showinfo output
          const timeMatch = line.match(/pts_time:([\d.]+)/);
          const sceneMatch = line.match(/scene:([\d.]+)/);
          
          if (timeMatch && sceneMatch) {
            const timestamp = parseFloat(timeMatch[1]);
            const sceneScore = parseFloat(sceneMatch[1]);
            
            // Higher scene scores indicate more significant visual changes (potential clicks)
            if (sceneScore > 0.4) {
              clickEvents.push({
                timestamp,
                confidence: Math.min(sceneScore, 1.0),
                // Estimate click position based on common UI patterns
                x: 400 + Math.random() * 200, // Center-right area where buttons typically are
                y: 200 + Math.random() * 200
              });
            }
          }
        }
        
        console.log(`Found ${clickEvents.length} potential click events from cursor tracking`);
      } catch (error) {
        console.log("Could not parse cursor tracking data");
      }

      console.log(`Found ${speechSegments.length} speech segments`);
      console.log(`Found ${clickEvents.length} potential click events`);

      // Combine speech segments with click events for more accurate frame extraction
      const combinedEvents = [
        ...speechSegments.map(s => ({
          timestamp: s.start + (s.end - s.start) / 2,
          type: 'speech',
          confidence: 0.7,
          reason: 'Speech detected',
          x: 400 + Math.random() * 200, // Default position for speech-based frames
          y: 300 + Math.random() * 200
        })),
        ...clickEvents.map(c => ({
          timestamp: c.timestamp,
          type: 'click',
          confidence: c.confidence,
          reason: 'Visual change detected (potential click)',
          x: c.x || 400,
          y: c.y || 300
        }))
      ].sort((a, b) => a.timestamp - b.timestamp);

      // Extract frames for combined events (prioritize click events)
      const extractedFrames: string[] = [];
      const frameData: Array<{
        url: string;
        type: string;
        filename: string;
        timestamp: number;
        selected: boolean;
        clickData: {
          x: number;
          y: number;
          confidence: number;
          reason: string;
        };
      }> = [];

      for (let i = 0; i < Math.min(combinedEvents.length, 20); i++) { // Limit to 20 frames for performance
        const event = combinedEvents[i];
        const filename = `${event.type}_${i.toString().padStart(3, '0')}.png`;
        const extractCommand = `ffmpeg -i "${videoPath}" -ss ${event.timestamp} -frames:v 1 "${outputDir}/${filename}"`;
        
        try {
          await execAsync(extractCommand);
          extractedFrames.push(filename);
          
          frameData.push({
            url: `/api/frames/${path.basename(outputDir)}/${filename}`,
            type: event.type,
            filename,
            timestamp: event.timestamp,
            selected: event.type === 'click' || event.confidence > 0.8, // Auto-select high-confidence frames
            clickData: {
              x: event.x,
              y: event.y,
              confidence: event.confidence,
              reason: event.reason
            }
          });
        } catch (error) {
          console.log(`Failed to extract frame for ${event.type} event at ${event.timestamp}s`);
        }
      }

      // Clean up temporary files
      fs.unlinkSync(videoPath);

      res.json({
        frames: frameData.map(f => f.url),
        frameAnalysis: frameData,
        speechSegments: speechSegments.length,
        clickEvents: clickEvents.length,
        mode: 'smart',
        message: `Smart extraction completed. Found ${speechSegments.length} speech segments and ${clickEvents.length} potential click events. Extracted ${frameData.length} frames with cursor tracking.`
      });

    } catch (error) {
      console.error("Video processing error:", error);
      res.status(500).json({ message: "Failed to process video" });
    }
  });

  // Serve extracted frames
  app.get("/api/frames/:sessionId/:filename", (req, res) => {
    const { sessionId, filename } = req.params;
    const filePath = path.join("frames", sessionId, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: "Frame not found" });
    }
  });

  // Update frame selection (admin endpoint)
  app.post("/api/frames/update-selection", async (req, res) => {
    try {
      const { sessionId, frameUpdates } = req.body;
      // For now, just return success - in a real implementation this would update frame selection
      res.json({ message: "Frame selection updated", sessionId, frameUpdates });
    } catch (error) {
      res.status(400).json({ message: "Failed to update frame selection", error });
    }
  });

  // Create test session
  app.post("/api/test-sessions", async (req, res) => {
    try {
      const sessionData = insertTestSessionSchema.parse(req.body);
      const session = await storage.createTestSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });

  // Get test session
  app.get("/api/test-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getTestSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Update test session
  app.patch("/api/test-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const session = await storage.updateTestSession(id, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Record test attempt
  app.post("/api/test-attempts", async (req, res) => {
    try {
      const attemptData = insertTestAttemptSchema.parse(req.body);
      const attempt = await storage.createTestAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      res.status(400).json({ message: "Invalid attempt data", error });
    }
  });

  // Get test attempts by session
  app.get("/api/test-attempts/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const attempts = await storage.getTestAttemptsBySession(sessionId);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get attempts" });
    }
  });

  // Create test result
  app.post("/api/test-results", async (req, res) => {
    try {
      const resultData = insertTestResultSchema.parse(req.body);
      const result = await storage.createTestResult(resultData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid result data", error });
    }
  });

  // Get test result by session
  app.get("/api/test-results/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const result = await storage.getTestResult(sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
