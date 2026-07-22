import { useListBusinesses } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Building2, Globe, MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BusinessesList() {
  const { data: businesses, isLoading } = useListBusinesses();

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profiles</h1>
          <p className="text-muted-foreground mt-1">Manage brand entities and core intelligence.</p>
        </div>
        <Link href="/businesses/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Profile
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50 rounded-t-lg" />
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      ) : (!businesses || businesses.length === 0) ? (
        <div className="text-center py-24 border border-dashed border-border rounded-lg bg-card">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Profiles Detected</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            AdClaw agents require a business profile to understand your brand, voice, and market position before generating campaigns.
          </p>
          <Link href="/businesses/new">
            <Button>Create First Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map(business => (
            <Link key={business.id} href={`/businesses/${business.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col hover-elevate">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider font-mono">
                      {business.industry}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{business.businessName}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 h-10">
                    {business.valueProposition || "No value proposition defined."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    {business.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{business.website}</span>
                      </div>
                    )}
                    {business.whatsapp && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="truncate">{business.whatsapp}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <span className="text-xs">Added {formatDate(business.createdAt)}</span>
                      <span className="text-primary text-xs font-medium group-hover:underline">View Profile &rarr;</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}