import { useListMemories } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, BrainCircuit, LineChart, AlertOctagon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MemoryList() {
  const { data: memories, isLoading } = useListMemories();

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-info flex items-center gap-3">
            <BrainCircuit className="w-8 h-8" /> Agent Memory Core
          </h1>
          <p className="text-muted-foreground mt-1">Cross-campaign learnings and winning patterns extracted by the swarm.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          <Card className="animate-pulse h-64 bg-card" />
        </div>
      ) : (!memories || memories.length === 0) ? (
        <div className="text-center py-24 border border-dashed border-info/30 rounded-lg bg-info/5">
          <Database className="w-12 h-12 text-info/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-info">Neural Weights Empty</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Agents need to run campaigns and analyze results to build memory patterns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {memories.map(memory => (
            <Card key={memory.id} className="border-info/20 shadow-[0_0_20px_rgba(6,182,212,0.05)] bg-[#0A0E17]">
              <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Database className="w-5 h-5 text-info" />
                    Entity #{memory.businessId} Knowledge Graph
                  </CardTitle>
                  <div className="text-xs text-muted-foreground font-mono">
                    Last Updated: {formatDate(memory.updatedAt || memory.createdAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Winning Patterns */}
                  <div className="space-y-6">
                    <h3 className="font-mono text-sm uppercase tracking-widest text-success flex items-center gap-2">
                      <LineChart className="w-4 h-4" /> Proven Patterns
                    </h3>
                    
                    <div className="space-y-4">
                      {memory.winningAudience && (
                        <div className="bg-success/5 border border-success/20 rounded p-3">
                          <div className="text-xs font-mono text-success/70 mb-1">WINNING_AUDIENCE</div>
                          <div className="text-sm font-medium">{memory.winningAudience}</div>
                        </div>
                      )}
                      
                      {memory.winningOffer && (
                        <div className="bg-success/5 border border-success/20 rounded p-3">
                          <div className="text-xs font-mono text-success/70 mb-1">WINNING_OFFER</div>
                          <div className="text-sm font-medium">{memory.winningOffer}</div>
                        </div>
                      )}

                      {memory.winningCopy && (
                        <div className="bg-success/5 border border-success/20 rounded p-3">
                          <div className="text-xs font-mono text-success/70 mb-1">WINNING_COPY_ANGLE</div>
                          <div className="text-sm font-medium italic">"{memory.winningCopy}"</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failed Patterns & Policy */}
                  <div className="space-y-6">
                    <h3 className="font-mono text-sm uppercase tracking-widest text-destructive flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4" /> Negative Weights
                    </h3>
                    
                    <div className="space-y-4">
                      {memory.failedPattern && (
                        <div className="bg-destructive/5 border border-destructive/20 rounded p-3">
                          <div className="text-xs font-mono text-destructive/70 mb-1">FAILED_PATTERN (AVOID)</div>
                          <div className="text-sm text-muted-foreground">{memory.failedPattern}</div>
                        </div>
                      )}
                      
                      {memory.policyIssue && (
                        <div className="bg-warning/5 border border-warning/20 rounded p-3">
                          <div className="text-xs font-mono text-warning/70 mb-1">POLICY_STRIKE (AVOID)</div>
                          <div className="text-sm text-muted-foreground">{memory.policyIssue}</div>
                        </div>
                      )}
                    </div>

                    {memory.learningSummary && (
                      <div className="mt-8">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Agent Synthesis</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground border-l-2 border-info pl-3 py-1">
                          {memory.learningSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}