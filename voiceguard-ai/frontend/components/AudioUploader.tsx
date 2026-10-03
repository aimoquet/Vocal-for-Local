"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioUploaderProps {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
}

export function AudioUploader({ onAnalyze, isLoading }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.flac', '.m4a']
    },
    maxFiles: 1,
    maxSize: 26214400, // 25MB
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-white/20 hover:border-primary/50 bg-black/20"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Drop your audio here</p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-white/5 rounded">WAV</span>
            <span className="px-2 py-1 bg-white/5 rounded">MP3</span>
            <span className="px-2 py-1 bg-white/5 rounded">FLAC</span>
            <span className="px-2 py-1 bg-white/5 rounded">M4A</span>
            <span>· Max 25 MB</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-xl relative">
          <button onClick={clearFile} className="absolute top-4 right-4 text-muted-foreground hover:text-white" disabled={isLoading}>
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-primary/20 p-3 rounded-lg">
              <FileAudio className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium truncate max-w-[300px]">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          
          <audio controls className="w-full mb-6" src={URL.createObjectURL(file)} />
          
          <Button 
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white" 
            onClick={() => onAnalyze(file)}
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze Audio"}
          </Button>
        </div>
      )}
    </div>
  );
}
