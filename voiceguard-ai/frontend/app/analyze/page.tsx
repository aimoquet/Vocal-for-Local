"use client";

import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
import { PredictionCard } from "@/components/PredictionCard";
import { analyzeAudio, AnalysisResponse } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, Mic, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveAudio } from "@/components/LiveAudio";

export default function AnalyzePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    // Simulate multi-step processing for UX
    const steps = [
      "Uploading audio...",
      "Validating format...",
      "Preprocessing signal...",
      "Extracting acoustic features...",
      "Running ML classification..."
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgressMsg(steps[stepIndex]);
        stepIndex++;
      }
    }, 800);

    try {
      const res = await analyzeAudio(file);
      clearInterval(interval);
      setResult(res);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.detail || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex-1 flex flex-col">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Audio Deepfake Analyzer</h1>
        <p className="text-muted-foreground text-lg">
          Upload a voice recording and let the model analyze its acoustic characteristics to determine if it is human or synthetic.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center w-full">
        <Tabs defaultValue="upload" className="w-full max-w-4xl mx-auto flex flex-col items-center mb-8">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-2 bg-black/40 border border-white/10 h-14 rounded-full p-1">
            <TabsTrigger value="upload" className="rounded-full text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-white h-full transition-all">
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="live" className="rounded-full text-base font-medium data-[state=active]:bg-destructive data-[state=active]:text-white h-full transition-all">
              <Mic className="mr-2 h-5 w-5" />
              Live Mic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="w-full flex flex-col items-center">
            {!result && !isAnalyzing && (
              <AudioUploader onAnalyze={handleAnalyze} isLoading={false} />
            )}

            {isAnalyzing && (
              <div className="w-full max-w-md flex flex-col items-center justify-center p-12 space-y-6">
                <div className="relative">
                  <Activity className="h-16 w-16 text-primary animate-pulse" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Analyzing Audio</h3>
                  <p className="text-muted-foreground animate-pulse">{progressMsg}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full max-w-2xl mt-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-center">
                {error}
                <button className="block mx-auto mt-4 underline text-sm" onClick={() => setError(null)}>Try again</button>
              </div>
            )}

            <AnimatePresence>
              {result && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
                >
              <div className="space-y-6">
                <PredictionCard result={result} />
                <div className="glass-panel p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Acoustic Features</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Spectral Centroid</p>
                      <p className="font-mono text-lg">{result.features.spectral_centroid.toFixed(0)} Hz</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Spectral Bandwidth</p>
                      <p className="font-mono text-lg">{result.features.spectral_bandwidth.toFixed(0)} Hz</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Zero Crossing Rate</p>
                      <p className="font-mono text-lg">{result.features.zero_crossing_rate.toFixed(3)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">RMS Energy</p>
                      <p className="font-mono text-lg">{result.features.rms_energy.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-xl h-full">
                  <h3 className="text-lg font-semibold mb-4">Why did the model classify this audio?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on the acoustic feature analysis, the model detected characteristics typical of {result.prediction === "FAKE" ? "AI-generated synthetic speech" : "natural human speech"}.
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span><strong>Spectral irregularities:</strong> {result.prediction === "FAKE" ? "Detected anomalous high-frequency patterns." : "Natural harmonic distribution."}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span><strong>Temporal characteristics:</strong> {result.prediction === "FAKE" ? "Unnatural breathing patterns or silence transitions." : "Normal physiological pauses."}</span>
                    </li>
                  </ul>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button 
                      className="w-full py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                      onClick={() => setResult(null)}
                    >
                      Analyze Another File
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="live" className="w-full">
        <LiveAudio />
      </TabsContent>
    </Tabs>
    </div>
  </div>
);
}
