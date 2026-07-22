import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Loader2, Globe, Lock } from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { useCreateCampaign, useListBusinesses } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PLATFORM_CONFIG, type AdPlatform } from "@/components/platform-badge";

const PLATFORMS: { value: AdPlatform; description: string; available: boolean }[] = [
  { value: "meta", description: "Facebook, Instagram, WhatsApp CTWA", available: true },
  { value: "google", description: "Search, Display, Shopping, YouTube", available: false },
  { value: "tiktok", description: "In-Feed, TopView, Spark Ads", available: false },
  { value: "linkedin", description: "Sponsored Content, Lead Gen Forms", available: false },
];

const PLACEMENTS = [
  {
    value: "facebook",
    label: "Facebook",
    description: "Feed, Marketplace, Right column",
    icon: SiFacebook,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
    activeBg: "bg-blue-500/20 border-blue-500",
  },
  {
    value: "instagram",
    label: "Instagram",
    description: "Feed, Stories, Reels",
    icon: SiInstagram,
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/30",
    activeBg: "bg-pink-500/20 border-pink-500",
  },
  {
    value: "whatsapp",
    label: "WhatsApp (CTWA)",
    description: "Click-to-WhatsApp from Facebook Feed",
    icon: SiWhatsapp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-500/20 border-emerald-500",
  },
  {
    value: "all",
    label: "All Placements",
    description: "Advantage+ automatic placements",
    icon: Globe,
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/30",
    activeBg: "bg-violet-500/20 border-violet-500",
  },
];

const OBJECTIVES = [
  { value: "LEADS", label: "Lead Generation" },
  { value: "AWARENESS", label: "Awareness" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "SALES", label: "Sales / Conversions" },
  { value: "APP_PROMOTION", label: "App Promotion" },
];

export default function CampaignsNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const { data: businesses } = useListBusinesses();

  const [form, setForm] = useState({
    businessId: "",
    campaignName: "",
    objective: "LEADS",
    platform: "meta" as AdPlatform,
    placement: "facebook",
    budgetType: "daily",
    dailyBudget: "",
  });

  const selectedPlacement = PLACEMENTS.find(p => p.value === form.placement)!;
  const isMeta = form.platform === "meta";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessId) {
      toast({ title: "Business required", description: "Please select a business.", variant: "destructive" });
      return;
    }
    if (!form.campaignName.trim()) {
      toast({ title: "Name required", description: "Please enter a campaign name.", variant: "destructive" });
      return;
    }

    createCampaign.mutate(
      {
        data: {
          businessId: parseInt(form.businessId),
          campaignName: form.campaignName.trim(),
          objective: form.objective,
          platform: form.platform,
          placement: isMeta ? form.placement : "facebook",
          budgetType: form.dailyBudget ? form.budgetType : undefined,
          dailyBudget: form.dailyBudget ? parseFloat(form.dailyBudget) : undefined,
        },
      },
      {
        onSuccess: (campaign) => {
          toast({ title: "Campaign created", description: `"${campaign.campaignName}" is in draft.` });
          navigate(`/campaigns/${campaign.id}`);
        },
        onError: (err: unknown) => {
          toast({ title: "Error", description: (err as Error).message || "Failed to create campaign.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Target className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
            <p className="text-muted-foreground mt-0.5">Choose your platform, placement, and objective.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Platform selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ad Platform</CardTitle>
              <CardDescription>Where do you want to run this campaign?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => {
                  const config = PLATFORM_CONFIG[p.value];
                  const Icon = config.Icon;
                  const isSelected = form.platform === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={!p.available}
                      onClick={() => p.available && setForm(f => ({ ...f, platform: p.value }))}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all relative",
                        !p.available && "opacity-50 cursor-not-allowed",
                        p.available && isSelected && config.cardActive,
                        p.available && !isSelected && `${config.cardBg} hover:border-opacity-60`,
                      )}
                    >
                      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {config.label}
                          {!p.available && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                        {!p.available && (
                          <div className="text-[10px] text-primary mt-1 font-medium">Integration coming soon</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Placement selector — Meta only */}
          <Card className={!isMeta ? "opacity-50" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Meta Placement
                {!isMeta && <span className="text-xs font-normal text-muted-foreground">(Meta only)</span>}
              </CardTitle>
              <CardDescription>
                {isMeta
                  ? "Choose where your Meta ads will be shown."
                  : "Platform-specific placements will be configurable once the integration is available."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid grid-cols-2 gap-3", !isMeta && "pointer-events-none")}>
                {PLACEMENTS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = form.placement === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, placement: p.value }))}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                        isSelected ? p.activeBg : `${p.bg} hover:border-opacity-60`
                      )}
                    >
                      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", p.color)} />
                      <div>
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isMeta && form.placement === "whatsapp" && (
                <div className="mt-3 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                  <strong>CTWA requirement:</strong> Set <code className="bg-emerald-900/30 px-1 rounded text-xs">META_WHATSAPP_NUMBER</code> in Replit Secrets (e.g. <code className="bg-emerald-900/30 px-1 rounded text-xs">6281234567890</code>) before pushing to Meta.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="business">Business *</Label>
                <Select value={form.businessId} onValueChange={v => setForm(f => ({ ...f, businessId: v }))}>
                  <SelectTrigger id="business">
                    <SelectValue placeholder="Select a business…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(businesses ?? []).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.businessName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Promo Ramadan - WhatsApp Lead Gen"
                  value={form.campaignName}
                  onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select value={form.objective} onValueChange={v => setForm(f => ({ ...f, objective: v }))}>
                  <SelectTrigger id="objective">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetType">Budget Type</Label>
                  <Select value={form.budgetType} onValueChange={v => setForm(f => ({ ...f, budgetType: v }))}>
                    <SelectTrigger id="budgetType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Budget</SelectItem>
                      <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Daily Budget (IDR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 100000"
                    value={form.dailyBudget}
                    onChange={e => setForm(f => ({ ...f, dailyBudget: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => navigate("/campaigns")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending} className="gap-2 min-w-[160px]">
              {createCampaign.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <selectedPlacement.icon className="w-4 h-4" />
              )}
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
