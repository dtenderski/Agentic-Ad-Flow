import { useListApprovals, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, XCircle, CheckCircle2, Eye, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ApprovalsList() {
  const { data: approvals, isLoading } = useListApprovals();

  const handleApprove = (id: number) => {
    // In a real app we'd call a mutation here, then invalidate queries.
    // Assuming UI display only for now as requested.
  };

  const handleReject = (id: number) => {
    // In a real app we'd call a mutation here.
  };

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
        ) : (!approvals || approvals.filter(a => a.status === 'pending').length === 0) ? (
          <div className="text-center py-24 border border-dashed border-border rounded-lg bg-card">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2 text-foreground">All Gates Clear</h3>
            <p className="text-muted-foreground">Agents have no pending actions requiring human authorization.</p>
          </div>
        ) : (
          approvals.filter(a => a.status === 'pending').map(approval => (
            <Card key={approval.id} className="border-warning/50 shadow-[0_0_10px_rgba(250,204,21,0.05)] bg-gradient-to-r from-warning/5 to-transparent">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex gap-6 items-center">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-background text-xs uppercase font-mono tracking-wider text-muted-foreground border-warning/30">
                        {approval.entityType}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">ID: {approval.entityId}</span>
                    </div>
                    <h3 className="text-lg font-bold">Review Required for {approval.entityType} Deployment</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated on {formatDate(approval.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" /> Inspect Data
                  </Button>
                  <Button variant="destructive" onClick={() => handleReject(approval.id)}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(approval.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Deploy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* History section */}
      <h2 className="text-xl font-bold mt-12 mb-4 text-muted-foreground">Gate History</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {approvals?.filter(a => a.status !== 'pending').map(approval => (
              <div key={approval.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {approval.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div>
                    <span className="font-medium capitalize">{approval.entityType} #{approval.entityId}</span>
                    <span className="text-sm text-muted-foreground ml-2">was {approval.status} on {formatDate(approval.reviewedAt || approval.createdAt)}</span>
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