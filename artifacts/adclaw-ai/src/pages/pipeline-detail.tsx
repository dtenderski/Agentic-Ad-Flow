import { useGetPipelineRun, getGetPipelineRunQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Terminal, FileText, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import * as React from "react";

export default function PipelineDetail() {
  const [, params] = useRoute("/pipeline/:id");
  const id = parseInt(params?.id || "0", 10);

  const { data: run, isLoading } = useGetPipelineRun(id, {
    query: {
      enabled: !!id,
      queryKey: getGetPipelineRunQueryKey(id),
      refetchInterval: (data) => data?.status === 'running' || data?.status === 'pending' ? 2000 : false
    }
  });

  const agents = [
    { name: "Diagnosis Claw", desc: "Analyzes business & product", status: run?.status === 'completed' ? 'done' : run?.status === 'running' ? 'active' : 'pending' },
    { name: "Audience Claw", desc: "Builds targeting matrix", status: run?.status === 'completed' ? 'done' : run?.status === 'running' ? 'active' : 'pending' },
    { name: "Offer Claw", desc: "Structures the hook", status: run?.status === 'completed' ? 'done' : run?.status === 'running' ? 'active' : 'pending' },
    { name: "Creative Claw", desc: "Writes copy & angles", status: run?.status === 'completed' ? 'done' : run?.status === 'pending' ? 'pending' : 'pending' },
    { name: "Budget Claw", desc: "Allocates spend", status: run?.status === 'completed' ? 'done' : 'pending' },
    { name: "Policy Claw", desc: "Checks Meta compliance", status: run?.status === 'completed' ? 'done' : 'pending' },
  ];

  if (isLoading) {
    return <Shell><div className="animate-pulse h-64 bg-card rounded-lg" /></Shell>;
  }

  if (!run) {
    return <Shell><div>Pipeline run not found</div></Shell>;
  }

  return (
    <Shell>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight font-mono">RUN_{run.id.toString().padStart(4, '0')}</h1>
            {run.status === 'running' ? (
              <Badge className="bg-info text-info-foreground border-transparent animate-pulse">EXECUTING</Badge>
            ) : run.status === 'completed' ? (
              <Badge variant="success">COMPLETED</Badge>
            ) : run.status === 'failed' ? (
              <Badge variant="destructive">FAILED</Badge>
            ) : (
              <Badge variant="outline">PENDING</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Goal: {run.campaignGoal} | Budget: ${run.budget}</p>
        </div>
        
        {run.blueprintId && (
          <Link href={`/blueprints/${run.blueprintId}`}>
            <Button className="gap-2" size="lg">
              <FileText className="w-4 h-4" />
              View Generated Blueprint
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Col - Agent Flow */}
        <div className="space-y-4">
          <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-4">MultiClaw Agent Swarm</h3>
          
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {agents.map((agent, i) => (
              <Card key={i} className={`relative z-10 ${agent.status === 'active' ? 'border-info shadow-[0_0_15px_rgba(6,182,212,0.1)]' : agent.status === 'done' ? 'border-success/50' : 'opacity-50'}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${agent.status === 'active' ? 'bg-info/20 text-info' : agent.status === 'done' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {agent.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : agent.status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDashed className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Col - Logs */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col border-border bg-[#0A0E17]">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                <Terminal className="w-4 h-4" />
                terminal/output.log
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[600px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
                {run.agentLog ? (
                  <div className="text-foreground whitespace-pre-wrap flex flex-col gap-1">
                    {run.agentLog.split('\n').map((line, idx) => {
                      let colorClass = "text-muted-foreground"; // default
                      
                      if (line.includes("[OpenClaw]")) {
                        colorClass = "text-cyan-400";
                      } else if (line.includes("[Business Claw]") || line.includes("[Audience Claw]") || line.includes("[Offer Claw]") || line.includes("[Creative Claw]") || line.includes("[Budget Claw]")) {
                        colorClass = "text-amber-400";
                      } else if (line.includes("[Human Gate]")) {
                        colorClass = "text-orange-500 animate-pulse";
                      } else if (line.includes("[Policy Claw]")) {
                        if (line.includes("HIGH") || line.includes("CRITICAL")) {
                          colorClass = "text-red-500 font-bold";
                        } else {
                          colorClass = "text-amber-400";
                        }
                      } else if (line.startsWith(">") || line.startsWith("-")) {
                        colorClass = "text-foreground/80 pl-4";
                      }

                      return (
                        <div key={idx} className={colorClass}>
                          {line}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center h-full opacity-50">
                    <Cpu className="w-12 h-12 mb-4" />
                    Waiting for agent telemetry...
                  </div>
                )}
                {run.status === 'running' && (
                  <div className="flex items-center gap-2 mt-4 text-info animate-pulse">
                    <span className="w-2 h-4 bg-info inline-block" /> Processing...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}