import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRunPipeline, useListBusinesses, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Cpu } from "lucide-react";

const pipelineSchema = z.object({
  businessId: z.string().min(1, "Business is required"),
  productId: z.string().min(1, "Product is required"),
  campaignGoal: z.string().min(1, "Goal is required"),
  budget: z.string().min(1, "Budget is required"),
  targetLocation: z.string().optional(),
  additionalContext: z.string().optional(),
});

export default function PipelineNew() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialBusinessId = searchParams.get('businessId') || "";
  const initialProductId = searchParams.get('productId') || "";

  const { data: businesses } = useListBusinesses();
  
  const form = useForm<z.infer<typeof pipelineSchema>>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      businessId: initialBusinessId,
      productId: initialProductId,
      campaignGoal: "SALES",
      budget: "50",
      targetLocation: "",
      additionalContext: "",
    },
  });

  const selectedBusinessId = form.watch("businessId");
  
  const { data: products } = useListProducts(
    parseInt(selectedBusinessId || "0", 10), 
    { query: { enabled: !!selectedBusinessId, queryKey: getListProductsQueryKey(parseInt(selectedBusinessId || "0", 10)) } }
  );

  const runPipeline = useRunPipeline();

  function onSubmit(values: z.infer<typeof pipelineSchema>) {
    runPipeline.mutate({
      data: {
        businessId: parseInt(values.businessId, 10),
        productId: parseInt(values.productId, 10),
        campaignGoal: values.campaignGoal,
        budget: parseFloat(values.budget),
        targetLocation: values.targetLocation,
        additionalContext: values.additionalContext
      }
    }, {
      onSuccess: (data) => {
        setLocation(`/pipeline/${data.id}`);
      }
    });
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Launch OpenClaw Pipeline</h1>
          </div>
          <p className="text-muted-foreground">Configure initial parameters to spin up the MultiClaw agent swarm.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-primary/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
              <CardHeader>
                <CardTitle>Mission Parameters</CardTitle>
                <CardDescription>Target definitions for the swarm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity Profile</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Business" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businesses?.map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.businessName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product / Offer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBusinessId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedBusinessId ? "Select Entity First" : "Select Product"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.productName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="campaignGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Objective</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Objective" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SALES">Sales / Conversions</SelectItem>
                            <SelectItem value="LEADS">Lead Generation</SelectItem>
                            <SelectItem value="TRAFFIC">Link Clicks / Traffic</SelectItem>
                            <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                            <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Budget (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geo-Targeting (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. United States, London, Global English..." {...field} />
                      </FormControl>
                      <FormDescription>Leave blank for agents to recommend based on entity data.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commander's Intent (Additional Context)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Force the agents to consider specific angles. e.g., 'Focus heavily on the upcoming Black Friday promo. Avoid mentioning competitors by name.'" 
                          className="h-24 bg-background font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto font-bold tracking-wide" disabled={runPipeline.isPending}>
                {runPipeline.isPending ? (
                  "Initiating Swarm..."
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    ENGAGE MULTICLAW SWARM
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Visual fluff for cockpit vibe */}
        <div className="mt-12 grid grid-cols-5 gap-2 opacity-50">
          {["Business", "Audience", "Offer", "Creative", "Budget"].map(agent => (
            <div key={agent} className="border border-border rounded p-2 text-center">
              <div className="text-[10px] font-mono uppercase text-muted-foreground">{agent} Claw</div>
              <div className="text-xs font-mono text-info mt-1">Standby</div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}