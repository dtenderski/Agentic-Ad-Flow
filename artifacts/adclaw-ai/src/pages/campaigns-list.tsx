import { useListCampaigns } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Target, Search, Filter, Globe } from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { formatCurrency, formatDate } from "@/lib/utils";

function PlacementBadge({ placement }: { placement: string }) {
  switch (placement) {
    case "instagram":
      return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400"><SiInstagram className="w-2.5 h-2.5" /> IG</span>;
    case "whatsapp":
      return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400"><SiWhatsapp className="w-2.5 h-2.5" /> WA</span>;
    case "all":
      return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400"><Globe className="w-2.5 h-2.5" /> Auto</span>;
    default:
      return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400"><SiFacebook className="w-2.5 h-2.5" /> FB</span>;
  }
}

export default function CampaignsList() {
  // Can pass status filters if needed, using empty for all
  const { data: campaigns, isLoading } = useListCampaigns({});

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'learning':
      case 'optimizing':
      case 'scaling':
        return <Badge variant="success" className="uppercase text-[10px]">{status}</Badge>;
      case 'paused':
      case 'review':
        return <Badge variant="warning" className="uppercase text-[10px]">{status}</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="uppercase text-[10px]">{status}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Operations</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor Meta Ads deployments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Link href="/campaigns/new">
            <Button className="gap-2">
              <Target className="w-4 h-4" /> Deploy Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">Syncing with Meta Graph API...</TableCell>
                </TableRow>
              ) : (!campaigns || campaigns.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <span className="text-muted-foreground">No campaigns deployed.</span>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map(campaign => (
                  <TableRow key={campaign.id} className="cursor-pointer group" onClick={() => window.location.href = `/campaigns/${campaign.id}`}>
                    <TableCell>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {campaign.campaignName}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>ID: {campaign.metaCampaignId || `INT-${campaign.id}`}</span>
                        {campaign.blueprintId && <span>• Blueprint #{campaign.blueprintId}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background text-[10px] font-mono tracking-wider">{campaign.objective}</Badge>
                    </TableCell>
                    <TableCell>
                      <PlacementBadge placement={campaign.placement ?? "facebook"} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {campaign.budgetType === 'daily' ? `${formatCurrency(campaign.dailyBudget)}/d` : `${formatCurrency(campaign.lifetimeBudget)} LTV`}
                    </TableCell>
                    <TableCell>
                      {campaign.metaCampaignId ? (
                        <div className="flex items-center gap-1.5" title={campaign.metaCampaignId}>
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            {campaign.metaCampaignId.substring(0, 8)}...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <span className="text-xs">Not pushed</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                       {campaign.approvalStatus === 'approved' ? (
                          <Badge variant="success" className="text-[10px]">Gate Cleared</Badge>
                       ) : campaign.approvalStatus === 'pending' ? (
                          <Badge variant="warning" className="text-[10px]">Awaiting Human</Badge>
                       ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                       )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                          Manage
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