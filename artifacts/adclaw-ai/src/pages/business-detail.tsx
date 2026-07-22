import { useGetBusiness, useListProducts, useCreateProduct, getGetBusinessQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoute, Link } from "wouter";
import { Box, Play, Plus, Target, Tag, Globe, MessageCircle, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BusinessDetail() {
  const [, params] = useRoute("/businesses/:id");
  const businessId = parseInt(params?.id || "0", 10);
  
  const { data: business, isLoading: isBusinessLoading } = useGetBusiness(businessId, { 
    query: { enabled: !!businessId, queryKey: getGetBusinessQueryKey(businessId) } 
  });
  
  const { data: products, isLoading: isProductsLoading } = useListProducts(businessId, {
    query: { enabled: !!businessId, queryKey: getListProductsQueryKey(businessId) }
  });

  const createProduct = useCreateProduct();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newProduct, setNewProduct] = React.useState({
    productName: "",
    price: "",
    landingPageUrl: "",
    benefit: ""
  });

  const handleCreateProduct = () => {
    createProduct.mutate({
      businessId,
      data: {
        productName: newProduct.productName,
        price: newProduct.price ? parseFloat(newProduct.price) : undefined,
        landingPageUrl: newProduct.landingPageUrl,
        benefit: newProduct.benefit
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        // Note: in a real app we'd invalidate the query cache here
      }
    });
  };

  if (isBusinessLoading) {
    return <Shell><div className="animate-pulse h-64 bg-card rounded-lg" /></Shell>;
  }

  if (!business) {
    return <Shell><div>Business not found</div></Shell>;
  }

  return (
    <Shell>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{business.businessName}</h1>
            <Badge variant="outline" className="bg-secondary text-xs uppercase font-mono">{business.industry}</Badge>
          </div>
          <p className="text-muted-foreground">{business.valueProposition || "No UVP defined"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/pipeline/new?businessId=${business.id}`}>
            <Button className="gap-2">
              <Play className="w-4 h-4 fill-current" />
              Launch Pipeline
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {business.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Domain</div>
                    <a href={business.website} className="text-info hover:underline break-all" target="_blank" rel="noreferrer">
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
              {business.whatsapp && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Contact Line</div>
                    <div className="text-muted-foreground">{business.whatsapp}</div>
                  </div>
                </div>
              )}
              {business.targetMarket && (
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Target Market</div>
                    <div className="text-muted-foreground mt-1 leading-relaxed">
                      {business.targetMarket}
                    </div>
                  </div>
                </div>
              )}
              {business.brandVoice && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Brand Voice</div>
                    <Badge variant="secondary" className="mt-1">{business.brandVoice}</Badge>
                  </div>
                </div>
              )}
              {business.complianceNotes && (
                <div className="flex items-start gap-3 mt-4 pt-4 border-t border-border">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div>
                    <div className="font-medium text-warning">Compliance Rules</div>
                    <div className="text-muted-foreground mt-1">
                      {business.complianceNotes}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Memory</CardTitle>
              <CardDescription>Learnings retained for this entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-sm text-muted-foreground">
                Memory node indexing... <br/>
                <Link href="/memory" className="text-info hover:underline mt-2 inline-block">View full brain state</Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Items available for campaign generation</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Product / Offer</DialogTitle>
                    <DialogDescription>Register a new sku or offer to be promoted.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" value={newProduct.productName} onChange={e => setNewProduct({...newProduct, productName: e.target.value})} placeholder="e.g. Masterclass Suite" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input id="price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="99.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url">Landing Page URL</Label>
                      <Input id="url" value={newProduct.landingPageUrl} onChange={e => setNewProduct({...newProduct, landingPageUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="benefit">Core Benefit</Label>
                      <Textarea id="benefit" value={newProduct.benefit} onChange={e => setNewProduct({...newProduct, benefit: e.target.value})} placeholder="What does this product actually do for the customer?" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateProduct} disabled={createProduct.isPending || !newProduct.productName}>
                      {createProduct.isPending ? "Saving..." : "Save Product"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isProductsLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-muted/50 rounded" />
                  <div className="h-10 bg-muted/50 rounded" />
                </div>
              ) : (!products || products.length === 0) ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-background/50">
                  <Box className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h4 className="font-medium text-sm">No products configured</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">You need at least one product to generate campaigns.</p>
                  <Button size="sm" variant="secondary" onClick={() => setIsDialogOpen(true)}>Add Product</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Core Benefit</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(product => (
                      <TableRow key={product.id} className="border-border">
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {product.benefit || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/pipeline/new?businessId=${business.id}&productId=${product.id}`}>
                            <Button size="sm" variant="ghost" className="text-info hover:text-info">
                              Launch
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}