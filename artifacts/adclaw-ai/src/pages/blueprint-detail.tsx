import { useGetBlueprint, getGetBlueprintQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldAlert, Target, Users, Megaphone, PenTool, CircleDollarSign, Check, X, Briefcase, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── Resolved Interest Table ──────────────────────────────────────────────────

interface ResolvedInterest {
  name: string;
  id?: string;
  resolvedName?: string;
  audienceSize?: number;
  resolved: boolean;
}

function InterestTable({ interests, summary }: { interests: ResolvedInterest[]; summary?: string }) {
  const resolvedCount = interests.filter((i) => i.resolved).length;
  const totalCount = interests.length;
  const allResolved = resolvedCount === totalCount;
  const noneResolved = resolvedCount === 0;

  return (
    <div className="space-y-3">
      {/* Summary line */}
      <div className="flex items-center gap-2">
        {noneResolved ? (
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        ) : !allResolved ? (
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        )}
        <span
          className={
            noneResolved
              ? "text-sm font-semibold text-destructive"
              : !allResolved
              ? "text-sm font-semibold text-warning"
              : "text-sm font-semibold text-success"
          }
        >
          {summary ?? `${resolvedCount}/${totalCount} interests resolved via Meta Interest Search API`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase text-muted-foreground">Interest Name</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase text-muted-foreground">Meta Status</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase text-muted-foreground">Meta Canonical Name</th>
              <th className="text-right px-4 py-2.5 font-mono text-xs uppercase text-muted-foreground">Audience Size</th>
            </tr>
          </thead>
          <tbody>
            {interests.map((interest, idx) => (
              <tr
                key={idx}
                className={
                  interest.resolved
                    ? "border-b border-border/50 last:border-0"
                    : "border-b border-border/50 last:border-0 bg-destructive/5"
                }
              >
                <td className="px-4 py-2.5 font-medium text-foreground">{interest.name}</td>
                <td className="px-4 py-2.5">
                  {interest.resolved ? (
                    <Badge
                      variant="outline"
                      className="border-success/40 bg-success/10 text-success gap-1 text-[11px]"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-destructive/10 text-destructive gap-1 text-[11px]"
                    >
                      <XCircle className="w-2.5 h-2.5" />
                      Not Found
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {interest.resolvedName ?? (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">
                  {interest.audienceSize != null
                    ? interest.audienceSize >= 1_000_000
                      ? `${(interest.audienceSize / 1_000_000).toFixed(1)}M`
                      : interest.audienceSize >= 1_000
                      ? `${(interest.audienceSize / 1_000).toFixed(0)}K`
                      : String(interest.audienceSize)
                    : <span className="italic text-muted-foreground/50">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {noneResolved && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">
            None of the audience interests matched Meta's catalogue. Fix the interest targeting before approving this blueprint.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Audience Plan Viewer ─────────────────────────────────────────────────────
// Renders the audiencePlan JSON with a special interest-resolution table for
// coldAudience.interests, falling back to the generic viewer for all other fields.

function AudiencePlanViewer({ plan }: { plan: Record<string, unknown> }) {
  const cold = plan.coldAudience as Record<string, unknown> | undefined;
  const interests = cold?.interests;
  const summary = cold?.interestResolutionSummary as string | undefined;

  const hasEnrichedInterests =
    Array.isArray(interests) &&
    interests.length > 0 &&
    typeof (interests[0] as any)?.resolved === "boolean";

  // Fields to render with the generic viewer (everything except coldAudience)
  const otherFields = Object.fromEntries(
    Object.entries(plan).filter(([k]) => k !== "coldAudience")
  );

  // coldAudience fields except interests + summary (those go into the table)
  const coldOtherFields = cold
    ? Object.fromEntries(
        Object.entries(cold).filter(
          ([k]) => k !== "interests" && k !== "interestResolutionSummary"
        )
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Other top-level fields */}
      {Object.keys(otherFields).length > 0 && (
        <StructuredDataViewer data={otherFields} />
      )}

      {/* Cold Audience section */}
      {cold && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Cold Audience
          </h4>

          {/* Non-interest cold audience fields */}
          {coldOtherFields && Object.keys(coldOtherFields).length > 0 && (
            <StructuredDataViewer data={coldOtherFields} />
          )}

          {/* Interest table or raw interests */}
          {hasEnrichedInterests ? (
            <InterestTable
              interests={interests as ResolvedInterest[]}
              summary={summary}
            />
          ) : Array.isArray(interests) && interests.length > 0 ? (
            <StructuredDataViewer data={{ interests }} />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Generic Structured Data Viewer ──────────────────────────────────────────

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
              <div className="flex items-center gap-3 w-full">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Audience Plan</h3>
                {(() => {
                  if (!audience?.parsed) return null;
                  const cold = audience.parsed.coldAudience as Record<string, unknown> | undefined;
                  const interests = cold?.interests;
                  if (!Array.isArray(interests) || interests.length === 0) return null;
                  const hasEnriched = typeof (interests[0] as any)?.resolved === "boolean";
                  if (!hasEnriched) return null;
                  const resolvedCount = (interests as Array<{ resolved: boolean }>).filter(i => i.resolved).length;
                  const total = interests.length;
                  const allOk = resolvedCount === total;
                  const noneOk = resolvedCount === 0;
                  return (
                    <Badge
                      variant="outline"
                      className={
                        noneOk
                          ? "ml-3 border-destructive/40 bg-destructive/10 text-destructive text-[11px]"
                          : !allOk
                          ? "ml-3 border-warning/40 bg-warning/10 text-warning text-[11px]"
                          : "ml-3 border-success/40 bg-success/10 text-success text-[11px]"
                      }
                    >
                      {resolvedCount}/{total} interests matched
                    </Badge>
                  );
                })()}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {audience?.parsed && typeof audience.parsed === "object" && !Array.isArray(audience.parsed)
                ? <AudiencePlanViewer plan={audience.parsed as Record<string, unknown>} />
                : renderSectionContent(audience)}
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