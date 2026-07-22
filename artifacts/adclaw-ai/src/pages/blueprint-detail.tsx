import { useGetBlueprint, getGetBlueprintQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldAlert, Target, Users, Megaphone, PenTool, CircleDollarSign, Check, X, Briefcase } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function StructuredDataViewer({ data }: { data: any }) {
  if (typeof data !== 'object' || data === null) {
    return <span className="text-foreground">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="bg-secondary/20 p-3 rounded-md border border-border">
            <StructuredDataViewer data={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-y-3 gap-x-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
          <span className="font-mono text-xs text-muted-foreground uppercase w-1/3 shrink-0 pt-1">
            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
          </span>
          <div className="text-sm text-foreground flex-1">
            {typeof value === 'object' && value !== null ? (
              <StructuredDataViewer data={value} />
            ) : (
              <span>{String(value)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
      const parsed = JSON.parse(jsonString);
      return { parsed, raw: jsonString };
    } catch (e) {
      return { parsed: null, raw: jsonString };
    }
  };

  const business = parseSection(blueprint.businessContext);
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

  const renderSectionContent = (sectionData: { parsed: any, raw: string } | null) => {
    if (!sectionData) return <div className="text-muted-foreground">Data unavailable</div>;
    if (sectionData.parsed) {
      return <StructuredDataViewer data={sectionData.parsed} />;
    }
    return (
      <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto text-foreground border border-border">
        {sectionData.raw}
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

      <div className="mt-8">
        <Accordion type="multiple" defaultValue={["businessContext", "campaignStrategy"]} className="space-y-4">
          <AccordionItem value="businessContext" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Business Context</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(business)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="campaignStrategy" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Campaign Strategy</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(strategy)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="audiencePlan" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Audience Plan</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(audience)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="offerStrategy" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Offer Strategy</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(offer)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="creativeBlueprint" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Creative Blueprint</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(creative)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="budgetPlan" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Budget Plan</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(budget)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="policyReview" className="border border-border bg-card rounded-lg overflow-hidden">
            <AccordionTrigger className="px-6 hover:bg-secondary/50 hover:no-underline">
              <div className="flex items-center gap-3 w-full">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Policy Review</h3>
                {blueprint.policyRiskScore && blueprint.policyRiskScore > 40 && (
                  <Badge variant="destructive" className="ml-4">High Risk Detected</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {renderSectionContent(policy)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Shell>
  );
}