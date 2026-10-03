"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getHistory, getModelInfo } from "@/lib/api";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Volume2, 
  Cpu, 
  RefreshCw, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Layers
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [histData, mInfo] = await Promise.all([
        getHistory().catch(() => []),
        getModelInfo().catch(() => null)
      ]);
      setHistory(Array.isArray(histData) ? histData : []);
      setModelInfo(mInfo);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAnalyses = history.length;
  const fakeCount = history.filter(h => h.prediction === "FAKE").length;
  const realCount = history.filter(h => h.prediction === "REAL").length;
  
  const highRiskCount = history.filter(h => h.risk_level === "HIGH").length;
  const mediumRiskCount = history.filter(h => h.risk_level === "MEDIUM").length;
  const lowRiskCount = history.filter(h => h.risk_level === "LOW").length;

  const fakePercentage = totalAnalyses > 0 ? ((fakeCount / totalAnalyses) * 100).toFixed(1) : "0.0";
  const realPercentage = totalAnalyses > 0 ? ((realCount / totalAnalyses) * 100).toFixed(1) : "0.0";
  
  const avgConfidence = totalAnalyses > 0 
    ? (history.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / totalAnalyses * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
            Security Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time telemetry and deepfake audio classification metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            disabled={isRefreshing}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link href="/analyze">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
              <Volume2 className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Model Spec & Status Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Active Architecture:</span>
          <span className="font-semibold text-white">
            {modelInfo?.model_type || "Deep Residual Spectrogram CNN + SE Attention"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="text-muted-foreground">Input Resolution:</span>
          <span className="font-mono text-white">{modelInfo?.input || "Mel Spectrogram (128x128)"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-medium">Neural Engine Online</span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-white/10 relative overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Audio Scanned</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{loading ? "..." : totalAnalyses}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" /> All recorded & uploaded files
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Synthetic / Fake</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-destructive">{loading ? "..." : fakeCount}</div>
            <p className="text-xs text-destructive/80 mt-1">
              {loading ? "..." : `${fakePercentage}% of total scans`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Real / Human</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-400">{loading ? "..." : realCount}</div>
            <p className="text-xs text-emerald-400/80 mt-1">
              {loading ? "..." : `${realPercentage}% verified authentic`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10 relative overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">{loading ? "..." : `${avgConfidence}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cross-entropy certainty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Ratio Card */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Authenticity Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Ratio of synthesized vocoders vs. human voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Real Human Speech
                </span>
                <span className="font-mono text-white">{realCount} ({realPercentage}%)</span>
              </div>
              <Progress value={parseFloat(realPercentage)} className="h-2.5 bg-white/10 [&>div]:bg-emerald-400" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> Synthetic / Deepfake
                </span>
                <span className="font-mono text-white">{fakeCount} ({fakePercentage}%)</span>
              </div>
              <Progress value={parseFloat(fakePercentage)} className="h-2.5 bg-white/10 [&>div]:bg-rose-500" />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-muted-foreground">
              <span>Database Sync</span>
              <span className="text-emerald-400 font-mono">SQLite Local DB</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution Card */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Threat Risk Assessment
            </CardTitle>
            <CardDescription className="text-xs">
              Categorization by vocoder confidence severity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2.5">
                <Badge variant="destructive" className="text-[10px] px-2">HIGH RISK</Badge>
                <span className="text-xs text-rose-200">Confidence &gt; 80%</span>
              </div>
              <span className="font-mono text-base font-bold text-rose-300">{highRiskCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="text-[10px] px-2 border-amber-500/40 text-amber-400">MED RISK</Badge>
                <span className="text-xs text-amber-200">Confidence 50-80%</span>
              </div>
              <span className="font-mono text-base font-bold text-amber-300">{mediumRiskCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <Badge variant="secondary" className="text-[10px] px-2 bg-emerald-500/20 text-emerald-300">LOW RISK</Badge>
                <span className="text-xs text-emerald-200">Natural Acoustics</span>
              </div>
              <span className="font-mono text-base font-bold text-emerald-300">{lowRiskCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick System Info Card */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Inference Hardware
            </CardTitle>
            <CardDescription className="text-xs">
              PyTorch runtime & deployment status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-semibold text-white">PyTorch 2.x + TorchAudio</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Feature Extraction</span>
              <span className="font-semibold text-white">STFT / Mel Spectrogram (128-Mel)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Attention Type</span>
              <span className="font-semibold text-white">Squeeze & Excitation (SE-ResNet)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Sampling Rate</span>
              <span className="font-semibold text-white">16,000 Hz Standardized Mono</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses Table */}
      <Card className="glass-panel border-white/10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Latest Scans</CardTitle>
            <CardDescription className="text-xs">Recent microphone streams and audio file evaluations</CardDescription>
          </div>
          <Link href="/history" className="text-xs text-primary hover:underline font-medium">
            View All History &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/5 hover:bg-transparent">
                  <TableHead className="text-xs">Filename</TableHead>
                  <TableHead className="text-xs">Verdict</TableHead>
                  <TableHead className="text-xs">Risk Level</TableHead>
                  <TableHead className="text-xs text-right">Confidence</TableHead>
                  <TableHead className="text-xs text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Loading latest scans...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                      No scans recorded yet. Upload an audio file or start live listening to populate analytics!
                    </TableCell>
                  </TableRow>
                ) : (
                  history.slice(0, 6).map((row, i) => (
                    <TableRow key={row.id || i} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-xs text-white max-w-[200px] truncate">
                        {row.filename || "Audio Stream"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={row.prediction === "FAKE" ? "destructive" : "secondary"}
                          className={`text-[10px] px-2 ${row.prediction === "REAL" ? "bg-emerald-500/20 text-emerald-300" : ""}`}
                        >
                          {row.prediction}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold ${
                          row.risk_level === 'HIGH' ? 'text-rose-400' : 
                          row.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {row.risk_level || "LOW"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-white">
                        {((row.confidence || 0) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {row.duration ? `${row.duration.toFixed(1)}s` : "2.0s"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
