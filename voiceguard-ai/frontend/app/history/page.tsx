"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHistory } from "@/lib/api";
import { History, RefreshCw, Trash2, ShieldAlert, ShieldCheck } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = async () => {
    setIsRefreshing(true);
    try {
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load history", error);
      setHistory([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Scan History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historical log of all processed voice recordings and live mic evaluations.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHistory} 
          disabled={isRefreshing}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-white w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh History
        </Button>
      </div>
      
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/5 hover:bg-transparent">
              <TableHead className="text-xs">Filename</TableHead>
              <TableHead className="text-xs">Timestamp</TableHead>
              <TableHead className="text-xs">Verdict</TableHead>
              <TableHead className="text-xs">Risk Level</TableHead>
              <TableHead className="text-xs text-right">Confidence</TableHead>
              <TableHead className="text-xs text-right">Duration</TableHead>
              <TableHead className="text-xs text-right">Model</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  Loading analysis history...
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground text-sm">
                  No scan records found in the database.
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => {
                const dateStr = item.created_at 
                  ? new Date(item.created_at).toLocaleString() 
                  : "Just now";
                const isFake = item.prediction === "FAKE";

                return (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-xs text-white max-w-[220px] truncate">
                      {item.filename || "Audio stream"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {dateStr}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={isFake ? "destructive" : "secondary"}
                        className={`text-[10px] px-2 ${!isFake ? "bg-emerald-500/20 text-emerald-300" : ""}`}
                      >
                        {isFake ? (
                          <ShieldAlert className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <ShieldCheck className="h-3 w-3 mr-1 inline" />
                        )}
                        {item.prediction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold ${
                        item.risk_level === 'HIGH' ? 'text-rose-400' : 
                        item.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.risk_level || "LOW"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-white font-medium">
                      {((item.confidence || 0) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {item.duration ? `${item.duration.toFixed(1)}s` : "2.0s"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.model_version || "1.0"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
