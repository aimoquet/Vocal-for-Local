"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getHistory } from "@/lib/api";

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalAnalyses = history.length;
  const fakeCount = history.filter(h => h.prediction === "FAKE").length;
  const realCount = history.filter(h => h.prediction === "REAL").length;
  const avgConfidence = totalAnalyses > 0 
    ? (history.reduce((acc, curr) => acc + curr.confidence, 0) / totalAnalyses * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : totalAnalyses}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Synthetic Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{loading ? "..." : fakeCount}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Real Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{loading ? "..." : realCount}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : `${avgConfidence}%`}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Filename</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No data available.</TableCell>
                  </TableRow>
                ) : (
                  history.slice(0, 5).map((row, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium">{row.filename}</TableCell>
                      <TableCell>
                        <Badge variant={row.prediction === "FAKE" ? "destructive" : "secondary"}>
                          {row.prediction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{(row.confidence * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-white/10 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Awaiting enough real data to render charts.</p>
            <p className="text-sm">Run real analyses to populate.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
