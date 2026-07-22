import { useGetBlueprint, getGetBlueprintQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Target, Users, Megaphone, PenTool, CircleDollarSign, Check, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function BlueprintDetail() {
  const [, params] = useRoute("/blueprints/:id");
  const id = parseInt(params?.id || "0", 10);

  const { data: blueprint, isLoading } = useGetBlueprint(id, {
    query: { enabled: !!id, queryKey: getGetBlueprintQueryKey(id) }
  });

  if (isLoading) {
    return <Shell><div className="animate-pulse h-64 bg-card rounded-lg" /></Shell>;
  }

  if (!blueprint) {
    return <Shell><div>Blueprint not found</div></Shell>;
  }

  // Parse JSON sections safely
  const parseSection = (jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return { raw: jsonString };
    }
  };

  const strategy = parseSection(blueprint.campaignStrategy);
  const audience = parseSection(blueprint.audiencePlan);
  const offer = parseSection(blueprint.offerStrategy);
  const creative = parseSection(blueprint.creativeBlueprint);
  const budget = parseSection(blueprint.budgetPlan);
  const policy = parseSection(blueprint.policyReview);

  const renderGauge = (value: number | null | undefined, title: string, invertColors = false) => {
    const val = value || 0;
    const data = [{ value: val }, { value: 100 - val }];
    
    let color = "hsl(var(--success))"; // green
    if (invertColors) {
      if (val > 60) color = "hsl(var(--destructive))"; // red
      else if (val > 30) color = "hsl(var(--warning))"; // amber
    } else {
      if (val < 40) color = "hsl(var(--destructive))";
      else if (val < 70) color = "hsl(var(--warning))";
    }

    return (
      <div className="flex flex-col items-center">
        <div className="h-24 w-24 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={40}
                startAngle={180}
                endAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center mt-4">
            <span className="text-xl font-bold font-display">{val}</span>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground uppercase text-center mt-[-10px]">{title}</span>
      </div>
    );
  };

  const renderJsonBlock = (data: any) => {
    if (!data) return <div className="text-muted-foreground">Data unavailable</div>;
    return (
      <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto text-foreground border border-border">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <Shell>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{blueprint.title}</h1>
            <Badge variant={blueprint.approvalStatus === 'approved' ? 'success' : 'outline'}>
              {blueprint.approvalStatus?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">BP-{blueprint.id.toString().padStart(4, '0')} • Source Pipeline: RUN_{blueprint.pipelineRunId}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/approvals`}>
            <Button variant="outline" className="gap-2">
              <Check className="w-4 h-4" /> Request Approval
            </Button>
          </Link>
          <Link href={`/campaigns/new?blueprintId=${blueprint.id}`}>
            <Button className="gap-2">
              <Target className="w-4 h-4 fill-current" /> Deploy to Meta
            </Button>
          </Link>
        </div>
      </div>

      {/* Scoring Top Bar */}
      <Card className="mt-8 border-t-4 border-t-primary bg-gradient-to-b from-card to-background">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
            {renderGauge(blueprint.conversionReadinessScore, "Conversion")}
            {renderGauge(blueprint.creativeStrengthScore, "Creative")}
            {renderGauge(blueprint.funnelFitScore, "Funnel")}
            {renderGauge(blueprint.policyRiskScore, "Policy Risk", true)}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="strategy" className="mt-8">
        <TabsList className="grid w-full grid-cols-6 h-12 bg-card border border-border">
          <TabsTrigger value="strategy" className="gap-2"><Target className="w-4 h-4"/> Strategy</TabsTrigger>
          <TabsTrigger value="audience" className="gap-2"><Users className="w-4 h-4"/> Audience</TabsTrigger>
          <TabsTrigger value="offer" className="gap-2"><Megaphone className="w-4 h-4"/> Offer</TabsTrigger>
          <TabsTrigger value="creative" className="gap-2"><PenTool className="w-4 h-4"/> Creative</TabsTrigger>
          <TabsTrigger value="budget" className="gap-2"><CircleDollarSign className="w-4 h-4"/> Budget</TabsTrigger>
          <TabsTrigger value="policy" className="gap-2"><ShieldAlert className="w-4 h-4"/> Policy</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 border border-border bg-card rounded-lg min-h-[400px] p-6 shadow-sm">
          <TabsContent value="strategy" className="m-0 focus-visible:outline-none">
            <h3 className="text-xl font-bold mb-4">Campaign Strategy</h3>
            {renderJsonBlock(strategy)}
          </TabsContent>
          <TabsContent value="audience" className="m-0 focus-visible:outline-none">
            <h3 className="text-xl font-bold mb-4">Audience Matrix</h3>
            {renderJsonBlock(audience)}
          </TabsContent>
          <TabsContent value="offer" className="m-0 focus-visible:outline-none">
            <h3 className="text-xl font-bold mb-4">Offer Architecture</h3>
            {renderJsonBlock(offer)}
          </TabsContent>
          <TabsContent value="creative" className="m-0 focus-visible:outline-none">
            <h3 className="text-xl font-bold mb-4">Creative Blueprint</h3>
            {renderJsonBlock(creative)}
          </TabsContent>
          <TabsContent value="budget" className="m-0 focus-visible:outline-none">
            <h3 className="text-xl font-bold mb-4">Budget Allocation</h3>
            {renderJsonBlock(budget)}
          </TabsContent>
          <TabsContent value="policy" className="m-0 focus-visible:outline-none">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold">Policy & Compliance Review</h3>
              {blueprint.policyRiskScore && blueprint.policyRiskScore > 40 && (
                <Badge variant="destructive">High Risk Detected</Badge>
              )}
            </div>
            {renderJsonBlock(policy)}
          </TabsContent>
        </div>
      </Tabs>
    </Shell>
  );
}