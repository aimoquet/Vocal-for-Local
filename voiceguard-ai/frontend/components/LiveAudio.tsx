"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Activity, AlertCircle, RefreshCw, ServerOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeAudio, AnalysisResponse, getModelInfo } from "@/lib/api";
import { PredictionCard } from "./PredictionCard";

export function LiveAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [resultsHistory, setResultsHistory] = useState<AnalysisResponse[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CHUNK_DURATION_MS = 4000;

  // Check backend health on mount and periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await getModelInfo();
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const analyzeChunk = async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) return;
    setIsAnalyzing(true);
    try {
      const file = new File([audioBlob], `live_chunk_${Date.now()}.webm`, { type: audioBlob.type || "audio/webm" });
      const res = await analyzeAudio(file);
      setResultsHistory(prev => [res, ...prev].slice(0, 6));
      setError(null);
      setBackendOnline(true);
    } catch (err: any) {
      console.error("Error analyzing live chunk:", err);
      setBackendOnline(false);
      setError("Cannot connect to backend server at http://localhost:8000. Please make sure the Python backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recordNextChunk = useCallback(() => {
    if (!isRecordingRef.current || !streamRef.current) return;

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          analyzeChunk(blob);
        }
        if (isRecordingRef.current) {
          recordNextChunk();
        }
      };

      recorder.start();

      timeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, CHUNK_DURATION_MS);
    } catch (e: any) {
      console.error("Failed to start recorder segment:", e);
      setError("Failed to record audio segment.");
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);

      // Setup audio level meter
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!isRecordingRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.warn("Audio visualizer init error:", e);
      }

      recordNextChunk();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setError(err?.message || "Microphone access denied. Please allow microphone permissions in browser settings.");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsAnalyzing(false);
    setAudioLevel(0);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const latestResult = resultsHistory[0] || null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="glass-panel p-8 rounded-xl text-center border-white/10 relative">
        {/* Backend Status Badge */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Backend Status:</span>
          {backendOnline === true && (
            <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Online (FastAPI + PyTorch)
            </span>
          )}
          {backendOnline === false && (
            <span className="inline-flex items-center text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              <ServerOff className="h-3.5 w-3.5 mr-1" /> Offline (Port 8000 Not Running)
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3">Live Microphone Deepfake Analysis</h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-2xl mx-auto">
          Stream real-time voice directly to the PyTorch Convolutional Neural Network. Audio is evaluated in 4-second continuous sliding windows for deepfake artifacts.
        </p>

        {backendOnline === false && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-left max-w-lg mx-auto">
            <div className="flex items-center font-semibold mb-1">
              <AlertCircle className="h-4 w-4 mr-2" /> Backend Server Offline
            </div>
            <p className="text-xs text-rose-200/80 mb-2">
              Start the backend server in a separate terminal:
            </p>
            <code className="block bg-black/50 p-2 rounded text-xs font-mono text-white">
              cd voiceguard-ai\backend<br />
              &amp; "venv\Scripts\python.exe" main.py
            </code>
          </div>
        )}

        {error && backendOnline !== false && (
          <div className="flex items-center justify-center text-destructive mb-6 space-x-2 bg-destructive/10 p-3 rounded-lg w-fit mx-auto text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {isRecording && (
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Microphone Input Level</span>
            </div>
            <div className="w-64 h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500"
                style={{ width: `${Math.max(5, audioLevel)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-center items-center">
          {!isRecording ? (
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(150,50,250,0.3)] transition-all text-base font-semibold"
              onClick={startRecording}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Live Listening
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Button 
                size="lg" 
                variant="destructive"
                className="h-14 px-8 rounded-full shadow-[0_0_30px_rgba(250,50,50,0.4)] animate-pulse text-base font-semibold"
                onClick={stopRecording}
              >
                <Square className="mr-2 h-5 w-5 fill-current" />
                Stop Listening
              </Button>
              <div className="flex items-center text-primary text-sm font-medium">
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin text-amber-400" />
                    <span className="text-amber-300">Processing audio with PyTorch CNN...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse text-emerald-400" />
                    <span className="text-emerald-400">Listening to audio stream...</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {latestResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <PredictionCard result={latestResult} />
          
          <div className="glass-panel p-6 rounded-xl border-white/10">
            <h3 className="text-lg font-semibold mb-4">Real-Time Feature Stream</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                <p className="text-xs text-muted-foreground mb-1">Spectral Centroid</p>
                <p className="font-mono text-xl text-white">
                  {latestResult.features?.spectral_centroid ? latestResult.features.spectral_centroid.toFixed(0) : "N/A"} Hz
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                <p className="text-xs text-muted-foreground mb-1">Zero Crossing Rate</p>
                <p className="font-mono text-xl text-white">
                  {latestResult.features?.zero_crossing_rate ? latestResult.features.zero_crossing_rate.toFixed(4) : "N/A"}
                </p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Live Stream History</h3>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {resultsHistory.map((res, i) => (
                <div 
                  key={res.analysis_id || i} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    res.prediction === 'FAKE' ? 'bg-destructive/10 border-destructive/20' : 'bg-emerald-500/10 border-emerald-500/20'
                  } transition-all`}
                >
                  <span className="text-xs text-muted-foreground font-mono">
                    {i === 0 ? "Latest Chunk" : `Chunk -${i * 4}s`}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Confidence: {(res.confidence * 100).toFixed(1)}%
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    res.prediction === 'FAKE' ? 'bg-destructive/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {res.prediction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
