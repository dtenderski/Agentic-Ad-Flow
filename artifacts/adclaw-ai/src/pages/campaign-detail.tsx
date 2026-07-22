import { useRoute, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Edit, Play, Pause, ExternalLink, Settings, GitMerge, FileImage, Loader2, Zap, Globe } from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { useGetCampaign, useListAdSets, useListCreatives, getGetCampaignQueryKey, getListAdSetsQueryKey, usePushToMeta, useUpdateAdSet, useGetMetaCampaignInsights, getGetMetaCampaignInsightsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { InterestPicker } from "@/components/interest-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

function PlacementBadge({ placement }: { placement: string }) {
  switch (placement) {
    case "instagram":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
          <SiInstagram className="w-3 h-3" /> Instagram
        </span>
      );
    case "whatsapp":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <SiWhatsapp className="w-3 h-3" /> WhatsApp (CTWA)
        </span>
      );
    case "all":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <Globe className="w-3 h-3" /> All Placements
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <SiFacebook className="w-3 h-3" /> Facebook
        </span>
      );
  }
}

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const id = parseInt(params?.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading: loadingCampaign } = useGetCampaign(id, {
    query: { enabled: !!id, queryKey: getGetCampaignQueryKey(id) }
  });

  const { data: adSets, isLoading: loadingAdSets } = useListAdSets(id, {
    query: { enabled: !!id, queryKey: getListAdSetsQueryKey(id) }
  });

  const pushToMeta = usePushToMeta();

  const handlePushToMeta = () => {
    pushToMeta.mutate(
      { campaignId: id },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(id) });
          toast({
            title: "Success",
            description: `Successfully pushed to Meta Ads Manager. Campaign is live in PAUSED state pending review.`,
            variant: "default",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error pushing to Meta",
            description: error.message || "Failed to push campaign to Meta Ads.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (loadingCampaign) {
    return <Shell><div className="animate-pulse h-64 bg-card rounded-lg" /></Shell>;
  }

  if (!campaign) {
    return <Shell><div>Campaign not found</div></Shell>;
  }

  return (
    <Shell>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{campaign.campaignName}</h1>
            <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'} className="uppercase">
              {campaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-mono">
            <span>OBJ: {campaign.objective}</span>
            <span>|</span>
            <span>BUDGET: {campaign.budgetType === 'daily' ? `${formatCurrency(campaign.dailyBudget)}/day` : `${formatCurrency(campaign.lifetimeBudget)} total`}</span>
            {campaign.blueprintId && (
              <>
                <span>|</span>
                <Link href={`/blueprints/${campaign.blueprintId}`} className="text-info hover:underline">
                  BP-{campaign.blueprintId.toString().padStart(4, '0')}
                </Link>
              </>
            )}
          </p>
          <div className="mt-2">
            <PlacementBadge placement={campaign.placement ?? "facebook"} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {campaign.approvalStatus === "approved" && !campaign.metaCampaignId && (
            <Button 
              onClick={handlePushToMeta}
              disabled={pushToMeta.isPending}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-transparent"
            >
              {pushToMeta.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SiFacebook className="w-4 h-4" />
              )}
              Push to Meta Ads
            </Button>
          )}

          {campaign.metaCampaignId && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 flex items-center gap-2">
              <SiFacebook className="w-3 h-3" />
              {campaign.metaCampaignId}
            </Badge>
          )}
          
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <a href={campaign.metaCampaignId ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?campaign_id=${campaign.metaCampaignId}` : "https://adsmanager.facebook.com"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" /> Open in Ads Manager
            </a>
          </Button>
          <Button className="gap-2" variant={campaign.status === 'active' ? 'destructive' : 'default'}>
            {campaign.status === 'active' ? (
              <><Pause className="w-4 h-4 fill-current" /> Pause Delivery</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Activate</>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Ad Sets & Creatives</h2>
        </div>

        {campaign.metaCampaignId && (
          <LiveMetaPerformanceCard campaignId={id} metaCampaignId={campaign.metaCampaignId} />
        )}

        {loadingAdSets ? (
          <div className="animate-pulse h-32 bg-card rounded-lg" />
        ) : !adSets || adSets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No ad sets generated yet. If this campaign was just deployed, agents might still be building the structure.
            </CardContent>
          </Card>
        ) : (
          adSets.map(adSet => {
            let interestsArray: string[] = [];
            if (adSet.interests) {
              try {
                interestsArray = JSON.parse(adSet.interests);
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            return (
            <Card key={adSet.id} className="border-l-4 border-l-info overflow-hidden">
              <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {adSet.adsetName}
                    <EditAdSetModal adSet={adSet} campaignId={id} />
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-2 text-muted-foreground max-w-2xl leading-relaxed">
                    TARGET: {adSet.location || 'Broad'} | AGE: {adSet.ageMin}-{adSet.ageMax || '65+'} | 
                    INT: {interestsArray.length > 0 ? (
                      <span className="inline-flex gap-1 items-center ml-1">
                        {interestsArray.map((int, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4 bg-background">{int}</Badge>
                        ))}
                      </span>
                    ) : "None"} <br/>
                    OPT: {adSet.optimizationEvent || "N/A"} | PLACEMENT: {adSet.placement || "Auto"}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">{formatCurrency(adSet.budget)}</div>
                  <div className="text-xs text-muted-foreground uppercase">Daily Limit</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent bg-muted/20">
                      <TableHead className="pl-6 w-[300px]">Creative Name</TableHead>
                      <TableHead>Format & Angle</TableHead>
                      <TableHead>Scores</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <CreativeList adSetId={adSet.id} />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )})
        )}
      </div>
    </Shell>
  );
}

function CreativeList({ adSetId }: { adSetId: number }) {
  const { data: creatives, isLoading } = useListCreatives(adSetId);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="pl-6 text-muted-foreground text-sm">Loading creatives...</TableCell>
      </TableRow>
    );
  }

  if (!creatives || creatives.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="pl-6 text-muted-foreground text-sm">No creatives configured.</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {creatives.map(c => (
        <TableRow key={c.id}>
          <TableCell className="pl-6 font-medium text-sm flex items-center gap-2">
            <FileImage className="w-4 h-4 text-muted-foreground" />
            {c.adName}
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px]">{c.format || "Image"}</Badge>
              <Badge variant="secondary" className="text-[10px] bg-secondary/50">{c.angle}</Badge>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span title="Policy Score" className={c.policyScore && c.policyScore > 40 ? 'text-destructive' : 'text-success'}>
                POL: {c.policyScore || "--"}
              </span>
              <span title="Creative Score" className="text-info">
                CRT: {c.creativeScore || "--"}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right pr-6">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Edit className="w-4 h-4" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EditAdSetModal({ adSet, campaignId }: { adSet: any; campaignId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateAdSet = useUpdateAdSet();

  const [name, setName] = useState(adSet.adsetName || "");
  const [interests, setInterests] = useState<string[]>([]);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setName(adSet.adsetName || "");
      if (adSet.interests) {
        try {
          setInterests(JSON.parse(adSet.interests));
        } catch (e) {
          setInterests([]);
        }
      } else {
        setInterests([]);
      }
    }
  }, [open, adSet]);

  const handleSave = () => {
    updateAdSet.mutate(
      {
        adsetId: adSet.id,
        data: {
          adsetName: name,
          interests: JSON.stringify(interests),
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey(campaignId) });
          toast({ title: "Ad Set updated", description: "Your changes have been saved." });
          setOpen(false);
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.message || "Failed to update Ad Set.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary ml-2">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Ad Set</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Ad Set Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Meta Interests</Label>
            <InterestPicker value={interests} onChange={setInterests} />
            <p className="text-xs text-muted-foreground mt-1">
              Select up to 5 interests to target for this ad set.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateAdSet.isPending}>
            {updateAdSet.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveMetaPerformanceCard({ campaignId, metaCampaignId }: { campaignId: number, metaCampaignId: string }) {
  const { data: insights, isLoading } = useGetMetaCampaignInsights(
    { campaignId, datePreset: "last_7d" },
    { query: { enabled: !!metaCampaignId, queryKey: getGetMetaCampaignInsightsQueryKey({ campaignId, datePreset: "last_7d" }) } }
  );

  return (
    <Card className="mb-6 bg-secondary/10">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Live Meta Performance</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex gap-8 px-4">
            <div className="h-8 w-64 bg-secondary/50 rounded animate-pulse" />
          </div>
        ) : !insights ? (
          <div className="text-sm text-muted-foreground px-4">
            No performance data yet — campaign may need 24h after activation.
          </div>
        ) : (
          <div className="flex items-center gap-8 px-4">
            <div>
              <div className="text-xs text-muted-foreground">Spend</div>
              <div className="text-sm font-bold">{formatCurrency(insights.spend || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Leads</div>
              <div className="text-sm font-bold">{Math.round(insights.leads || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CPL</div>
              <div className="text-sm font-bold">
                {(insights.leads && insights.leads > 0) ? formatCurrency(insights.spend / insights.leads) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CTR</div>
              <div className="text-sm font-bold">{Number(insights.ctr || 0).toFixed(2)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}