import { useListBlueprints } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, ChevronRight, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BlueprintsList() {
  const { data: blueprints, isLoading } = useListBlueprints();

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 71) return "text-success";
    if (score >= 41) return "text-warning";
    return "text-destructive";
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategy Blueprints</h1>
          <p className="text-muted-foreground mt-1">Generated campaign architectures pending approval and deployment.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-card" />
          ))}
        </div>
      ) : (!blueprints || blueprints.length === 0) ? (
        <div className="text-center py-24 border border-dashed border-border rounded-lg bg-card">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Blueprints Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Run a pipeline to generate your first campaign blueprint.
          </p>
          <Link href="/pipeline/new">
            <Button>Launch Pipeline</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blueprints.map(blueprint => (
            <Card key={blueprint.id} className="flex flex-col hover-elevate transition-colors border-border hover:border-primary/50 group">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-secondary text-xs uppercase tracking-widest font-mono">
                    BP-{blueprint.id.toString().padStart(4, '0')}
                  </Badge>
                  {blueprint.approvalStatus === 'approved' ? (
                    <Badge variant="success">Approved</Badge>
                  ) : blueprint.approvalStatus === 'draft' ? (
                    <Badge variant="secondary">Draft</Badge>
                  ) : (
                    <Badge variant="outline">{blueprint.approvalStatus}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{blueprint.title}</CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex-1">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Conv. Readiness</div>
                    <div className={`text-2xl font-bold font-display ${getScoreColor(blueprint.conversionReadinessScore)}`}>
                      {blueprint.conversionReadinessScore || "--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Creative Strength</div>
                    <div className={`text-2xl font-bold font-display ${getScoreColor(blueprint.creativeStrengthScore)}`}>
                      {blueprint.creativeStrengthScore || "--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Funnel Fit</div>
                    <div className={`text-2xl font-bold font-display ${getScoreColor(blueprint.funnelFitScore)}`}>
                      {blueprint.funnelFitScore || "--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Policy Risk</div>
                    <div className={`text-2xl font-bold font-display ${blueprint.policyRiskScore && blueprint.policyRiskScore > 40 ? 'text-destructive' : 'text-success'}`}>
                      {blueprint.policyRiskScore || "--"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50 bg-secondary/20 flex justify-between items-center">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {formatDate(blueprint.createdAt)}
                </div>
                <Link href={`/blueprints/${blueprint.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary">
                    Analyze <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}