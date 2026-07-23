import {
  useListApprovals,
  useGetCampaignInterestPreview,
  useApproveCampaign,
  getListApprovalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Eye,
  Clock,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ─── Interest preview for a single campaign approval ─────────────────────────

function CampaignInterestPreview({ campaignId }: { campaignId: number }) {
  const { data, isLoading, isError } = useGetCampaignInterestPreview(campaignId);

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 py-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking audience interests against Meta…
      </div>
    );

  if (isError || !data)
    return (
      <p className="text-xs text-destructive mt-3">
        Could not fetch interest preview from Meta.
      </p>
    );

  if (data.totalInterests === 0)
    return (
      <p className="text-xs text-muted-foreground mt-3">
        No audience interests configured for this campaign.
      </p>
    );

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Meta Audience Interests —{" "}
          <span className={data.matchedCount === 0 ? "text-destructive font-semibold" : data.hasUnmatchedInterests ? "text-warning font-semibold" : "text-success font-semibold"}>
            {data.matchedCount}/{data.totalInterests} matched
          </span>
        </span>
        {!data.canApprove && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
            BLOCKED
          </Badge>
        )}
      </div>

      {data.adsets.map((adset) => {
        if (adset.interests.length === 0) return null;
        return (
          <div key={adset.adsetId} className="pl-5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">{adset.adsetName}</p>
            <div className="flex flex-wrap gap-1">
              {adset.interests.map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  {item.matched ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 border-success/40 bg-success/10 text-success gap-1"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {item.matched.name}
                      {item.matched.audienceSize && (
                        <span className="opacity-60">
                          ({(item.matched.audienceSize / 1_000_000).toFixed(1)}M)
                        </span>
                      )}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 border-destructive/40 bg-destructive/10 text-destructive gap-1"
                    >
                      <XCircle className="w-2.5 h-2.5" />
                      {item.query}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!data.canApprove && (
        <div className="flex items-start gap-2 mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
          <p className="text-[11px] text-destructive">
            None of the audience interests could be matched in Meta. Edit the ad set interests before approving.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Approval card ────────────────────────────────────────────────────────────

function ApprovalCard({ approval }: { approval: { id: number; entityType: string; entityId: number; createdAt: string; status: string } }) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [deciding, setDeciding] = useState<"approved" | "rejected" | null>(null);

  const approveMutation = useApproveCampaign({
    mutation: {
      onSuccess: (_, vars) => {
        const action = vars.data.decision === "approved" ? "approved" : "rejected";
        toast.success(`Campaign #${vars.campaignId} ${action}`);
        queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() });
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Action failed";
        toast.error(msg);
      },
      onSettled: () => setDeciding(null),
    },
  });

  const { data: preview } = useGetCampaignInterestPreview(
    approval.entityType === "campaign" ? approval.entityId : 0,
    { query: { enabled: approval.entityType === "campaign" } }
  );

  const canApprove = !preview || preview.canApprove;
  const isLoading = approveMutation.isPending;

  const handleApprove = () => {
    setDeciding("approved");
    approveMutation.mutate({ campaignId: approval.entityId, data: { decision: "approved" } });
  };

  const handleReject = () => {
    setDeciding("rejected");
    approveMutation.mutate({ campaignId: approval.entityId, data: { decision: "rejected" } });
  };

  return (
    <Card className="border-warning/50 shadow-[0_0_10px_rgba(250,204,21,0.05)] bg-gradient-to-r from-warning/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: info */}
          <div className="flex gap-5 items-start min-w-0">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0 mt-0.5">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-background text-xs uppercase font-mono tracking-wider text-muted-foreground border-warning/30">
                  {approval.entityType}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">ID: {approval.entityId}</span>
              </div>
              <h3 className="text-lg font-bold">Review Required for {approval.entityType} Deployment</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Generated on {formatDate(approval.createdAt)}
              </p>

              {approval.entityType === "campaign" && (
                <CampaignInterestPreview campaignId={approval.entityId} />
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/campaigns/${approval.entityId}`)}
            >
              <Eye className="w-4 h-4" /> Inspect
            </Button>
            <Button
              variant="destructive"
              disabled={isLoading}
              onClick={handleReject}
            >
              {deciding === "rejected" && isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !canApprove}
              title={!canApprove ? "Cannot approve: no audience interests matched in Meta" : undefined}
              onClick={handleApprove}
            >
              {deciding === "approved" && isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve & Deploy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsList() {
  const { data: approvals, isLoading } = useListApprovals();

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-warning flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" /> Human Gate
          </h1>
          <p className="text-muted-foreground mt-1">Review agent outputs before Meta Ads deployment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="animate-pulse h-32 bg-card rounded-lg" />
        ) : (!approvals || approvals.filter((a) => a.status === "pending").length === 0) ? (
          <div className="text-center py-24 border border-dashed border-border rounded-lg bg-card">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2 text-foreground">All Gates Clear</h3>
            <p className="text-muted-foreground">Agents have no pending actions requiring human authorization.</p>
          </div>
        ) : (
          approvals
            .filter((a) => a.status === "pending")
            .map((approval) => (
              <ApprovalCard key={approval.id} approval={approval as { id: number; entityType: string; entityId: number; createdAt: string; status: string }} />
            ))
        )}
      </div>

      {/* History */}
      <h2 className="text-xl font-bold mt-12 mb-4 text-muted-foreground">Gate History</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {approvals?.filter((a) => a.status !== "pending").map((approval) => (
              <div key={approval.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {approval.status === "approved" ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div>
                    <span className="font-medium capitalize">{approval.entityType} #{approval.entityId}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      was {approval.status} on {formatDate(approval.reviewedAt ?? approval.createdAt)}
                    </span>
                  </div>
                </div>
                {approval.reviewerNotes && (
                  <div className="text-sm italic text-muted-foreground">"{approval.reviewerNotes}"</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
