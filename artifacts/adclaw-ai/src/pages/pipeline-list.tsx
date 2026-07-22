import { useListPipelineRuns } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Play, Activity, Clock, FileText } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function PipelineList() {
  const { data: pipelineRuns, isLoading } = useListPipelineRuns();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-info animate-pulse-glow" />
            <span className="text-info font-mono text-xs uppercase tracking-wider">Executing</span>
          </div>
        );
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OpenClaw Pipelines</h1>
          <p className="text-muted-foreground mt-1">Monitor autonomous agent execution across your entities.</p>
        </div>
        <Link href="/pipeline/new">
          <Button className="gap-2">
            <Play className="w-4 h-4 fill-current" />
            Launch Pipeline
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Entity / Goal</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading pipelines...</TableCell>
                </TableRow>
              ) : (!pipelineRuns || pipelineRuns.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <span className="text-muted-foreground">No pipeline activity found.</span>
                  </TableCell>
                </TableRow>
              ) : (
                pipelineRuns.map(run => (
                  <TableRow key={run.id} className="cursor-pointer group">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{run.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {run.campaignGoal || "General Strategy"}
                      </div>
                      <div className="text-xs text-muted-foreground">Business ID: {run.businessId}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(run.budget)} / day
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(run.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(run.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/pipeline/${run.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-info hover:text-info">
                          {run.status === 'completed' && run.blueprintId ? (
                            <>
                              <FileText className="w-4 h-4" />
                              Blueprint #{run.blueprintId}
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4" />
                              View Logs
                            </>
                          )}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}