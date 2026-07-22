import { useState, useRef, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, BarChart3, Send, Loader2, RefreshCw, Clock, Zap } from "lucide-react";
import { useListCopilotReports, useRunCopilotCommand, useGenerateCopilotBrief, useGenerateCopilotReport, getListCopilotReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const TYPE_CONFIG = {
  trend_brief: {
    label: "Morning Brief",
    icon: Sparkles,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    badgeCn: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  },
  performance_report: {
    label: "Performance Report",
    icon: BarChart3,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    badgeCn: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  },
  command_response: {
    label: "Copilot Command",
    icon: Bot,
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
    badgeCn: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  },
};

const EXAMPLE_COMMANDS = [
  "Berapa total spend hari ini?",
  "List semua campaign yang active",
  "Apa CPL campaign saya kemarin?",
  "Pause campaign ID 3",
  "Naikkan budget campaign 2 jadi 150000",
  "What's the overall account performance today?",
];

function ReportCard({ report }: { report: { id: number; type: string; response: string; createdAt: string; metaData?: string | null } }) {
  const config = TYPE_CONFIG[report.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.command_response;
  const Icon = config.icon;
  const date = new Date(report.createdAt);
  const toolsUsed: string[] = (() => {
    try {
      const md = report.metaData ? JSON.parse(report.metaData) : null;
      return md?.toolsUsed ?? [];
    } catch { return []; }
  })();

  return (
    <Card className={`border ${config.bg}`}>
      <CardHeader className="pb-3 flex flex-row items-start gap-3">
        <div className={`p-2 rounded-full bg-background border ${config.bg} mt-0.5 shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.badgeCn}`}>
              {config.label}
            </span>
            {toolsUsed.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> {toolsUsed.join(", ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            {date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-medium [&_strong]:text-foreground [&_ul]:text-sm [&_li]:text-sm [&_p]:text-sm">
          <ReactMarkdown>{report.response}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CopilotPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [command, setCommand] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: reports, isLoading } = useListCopilotReports({
    query: { queryKey: getListCopilotReportsQueryKey(), refetchInterval: 30000 }
  });

  const runCommand = useRunCopilotCommand();
  const generateBrief = useGenerateCopilotBrief();
  const generateReport = useGenerateCopilotReport();

  const refreshReports = () => queryClient.invalidateQueries({ queryKey: getListCopilotReportsQueryKey() });

  const handleSendCommand = async () => {
    const msg = command.trim();
    if (!msg) return;
    setCommand("");
    runCommand.mutate(
      { data: { message: msg } },
      {
        onSuccess: () => refreshReports(),
        onError: (err: unknown) => {
          toast({ title: "Command failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSendCommand();
    }
  };

  const handleGenerateBrief = () => {
    generateBrief.mutate(undefined, {
      onSuccess: () => { toast({ title: "Morning brief generated!" }); refreshReports(); },
      onError: (err: unknown) => toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" }),
    });
  };

  const handleGenerateReport = () => {
    generateReport.mutate(undefined, {
      onSuccess: () => { toast({ title: "Performance report generated!" }); refreshReports(); },
      onError: (err: unknown) => toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" }),
    });
  };

  const anyLoading = runCommand.isPending || generateBrief.isPending || generateReport.isPending;

  return (
    <Shell>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <Bot className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AdClaw Copilot</h1>
            <p className="text-muted-foreground text-sm mt-0.5">AI-powered reports & commands. Briefs at 06:00 WIB · Reports at 16:00 WIB.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateBrief} disabled={anyLoading}>
            {generateBrief.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            Morning Brief
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateReport} disabled={anyLoading}>
            {generateReport.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5 text-blue-400" />}
            Performance Report
          </Button>
          <Button variant="ghost" size="icon" onClick={refreshReports} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Command input — left column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                Ask Copilot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Berapa CPL hari ini? / Pause campaign 3 / What's my best performing campaign?"
                className="min-h-[100px] resize-none text-sm"
                disabled={runCommand.isPending}
              />
              <Button
                className="w-full gap-2"
                onClick={handleSendCommand}
                disabled={runCommand.isPending || !command.trim()}
              >
                {runCommand.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send (⌘+Enter)</>
                )}
              </Button>

              {/* Example commands */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Try:</p>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLE_COMMANDS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setCommand(ex)}
                      className="text-left text-xs px-2.5 py-1.5 rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduler info */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="text-amber-400 font-medium">☀️ 06:00 WIB</span> — Morning trend brief<br />
                  <span className="text-blue-400 font-medium">📊 16:00 WIB</span> — Performance report
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report feed — right 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {anyLoading && (
            <Card className="border-violet-500/20 bg-violet-500/5 animate-pulse">
              <CardContent className="py-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-300">
                    {runCommand.isPending ? "Claude is thinking…" : "Generating report…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">This takes 10-20 seconds</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 bg-card rounded-lg animate-pulse border border-border" />
            ))
          ) : !reports || reports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No reports yet.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Generate a brief or ask a command to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            reports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}
