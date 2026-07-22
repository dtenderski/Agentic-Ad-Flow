import { useGetDashboardSummary, useGetPipelineActivity, useGetRecentCampaigns } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, TrendingUp, Activity, CheckCircle, Clock, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: pipelineRuns } = useGetPipelineActivity();
  const { data: campaigns } = useGetRecentCampaigns();

  const mockChartData = [
    { name: "Mon", value: 12 },
    { name: "Tue", value: 19 },
    { name: "Wed", value: 15 },
    { name: "Thu", value: 24 },
    { name: "Fri", value: 31 },
    { name: "Sat", value: 28 },
    { name: "Sun", value: 35 },
  ];

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">System operational. Ready for execution.</p>
        </div>
        <Link href="/pipeline/new">
          <Button size="lg" className="gap-2">
            <Play className="w-4 h-4 fill-current" />
            Launch Pipeline
          </Button>
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Conversion Readiness</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{summary?.conversionReadinessAvg || 0}</div>
              <span className="text-sm font-medium text-success">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average across active blueprints</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
              <Zap className="h-4 w-4 text-info" />
            </div>
            <div className="text-4xl font-bold">{summary?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {summary?.draftCampaigns || 0} drafts standing by
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Pipeline Runs</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-4xl font-bold">{summary?.pipelineRunsToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">Executions today</p>
          </CardContent>
        </Card>

        <Card className={summary?.pendingApprovals ? "border-warning" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <CheckCircle className={`h-4 w-4 ${summary?.pendingApprovals ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-4xl font-bold">{summary?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {summary?.pendingApprovals ? "Requires human review" : "All gates cleared"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>Execution Velocity</CardTitle>
              <CardDescription>Pipeline throughput over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{backgroundColor: '#0b121e', border: '1px solid #1e293b', borderRadius: '4px'}} 
                  />
                  <Bar dataKey="value" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Active and drafting Meta deployments</CardDescription>
              </div>
              <Link href="/campaigns">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(!campaigns || campaigns.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent campaigns. <Link href="/pipeline/new" className="text-primary hover:underline">Run a pipeline</Link> to generate one.
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map(campaign => (
                    <div key={campaign.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium text-sm">{campaign.campaignName}</div>
                        <div className="text-xs text-muted-foreground">{campaign.objective}</div>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Pipeline Feed */}
        <div className="space-y-6">
          <Card className="h-[calc(100vh-14rem)] flex flex-col">
            <CardHeader>
              <CardTitle>Active Pipelines</CardTitle>
              <CardDescription>Real-time agent execution log</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(!pipelineRuns || pipelineRuns.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No pipelines running.
                </div>
              ) : (
                pipelineRuns.map(run => (
                  <Link href={`/pipeline/${run.id}`} key={run.id}>
                    <div className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(run.createdAt).toLocaleTimeString()}
                        </div>
                        {run.status === 'running' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-info font-mono uppercase tracking-wider">Executing</span>
                            <div className="w-2 h-2 rounded-full bg-info animate-pulse-glow" />
                          </div>
                        )}
                        {run.status === 'completed' && <Badge variant="success" className="h-5 text-[10px]">COMPLETED</Badge>}
                        {run.status === 'failed' && <Badge variant="destructive" className="h-5 text-[10px]">FAILED</Badge>}
                        {run.status === 'pending' && <Badge variant="outline" className="h-5 text-[10px]">PENDING</Badge>}
                      </div>
                      <div className="font-medium text-sm mb-1 line-clamp-1">{run.campaignGoal || "Strategic Analysis"}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Goal: {run.campaignGoal}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}