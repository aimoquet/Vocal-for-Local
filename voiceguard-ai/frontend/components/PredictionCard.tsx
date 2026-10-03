"use client";

import { AnalysisResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface PredictionCardProps {
  result: AnalysisResponse;
}

export function PredictionCard({ result }: PredictionCardProps) {
  const isFake = result.prediction === "FAKE";
  
  return (
    <Card className="glass-panel border-white/10 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${isFake ? 'bg-destructive' : 'bg-success'}`} />
      
      <CardHeader className="text-center pb-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Analysis Complete</p>
        <div className="flex justify-center mb-2">
          {isFake ? (
            <AlertTriangle className="h-12 w-12 text-destructive" />
          ) : (
            <CheckCircle className="h-12 w-12 text-success" />
          )}
        </div>
        <CardTitle className={`text-4xl font-extrabold ${isFake ? 'text-destructive' : 'text-success'}`}>
          {isFake ? "SYNTHETIC / FAKE" : "REAL / HUMAN"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center space-x-2">
          <Badge variant={isFake ? "destructive" : "secondary"} className="px-3 py-1 text-sm">
            {(result.confidence * 100).toFixed(1)}% Confidence
          </Badge>
          {isFake && (
            <Badge variant="outline" className="px-3 py-1 text-sm border-destructive/50 text-destructive">
              {result.risk_level} RISK
            </Badge>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">REAL Probability</span>
              <span className="font-mono">{(result.real_probability * 100).toFixed(1)}%</span>
            </div>
            <Progress value={result.real_probability * 100} className="h-2 bg-white/5 [&>div]:bg-success" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">FAKE Probability</span>
              <span className="font-mono">{(result.fake_probability * 100).toFixed(1)}%</span>
            </div>
            <Progress value={result.fake_probability * 100} className="h-2 bg-white/5 [&>div]:bg-destructive" />
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-white/10">
          Model: {result.model_version} • Duration: {result.duration.toFixed(2)}s
        </div>
      </CardContent>
    </Card>
  );
}
