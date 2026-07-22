import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateBusiness } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const businessSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().min(2, "Industry is required"),
  productCategory: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  targetMarket: z.string().optional(),
  valueProposition: z.string().optional(),
  brandVoice: z.string().optional(),
  complianceNotes: z.string().optional(),
});

export default function BusinessNew() {
  const [, setLocation] = useLocation();
  const createBusiness = useCreateBusiness();

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      productCategory: "",
      location: "",
      website: "",
      whatsapp: "",
      targetMarket: "",
      valueProposition: "",
      brandVoice: "",
      complianceNotes: "",
    },
  });

  function onSubmit(values: z.infer<typeof businessSchema>) {
    createBusiness.mutate({ data: values }, {
      onSuccess: (data) => {
        setLocation(`/businesses/${data.id}`);
      }
    });
  }

  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Onboard Entity</h1>
          <p className="text-muted-foreground mt-1">Inject brand DNA into the AdClaw neural network.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Core Identity</CardTitle>
                <CardDescription>Basic information for agent context.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="E-commerce, SaaS, Real Estate..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp / Contact Line</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Intelligence</CardTitle>
                <CardDescription>Deep parameters for the Audience and Offer agents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience Persona</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the ideal customer profile, demographics, psychographics..." className="h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueProposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unique Value Proposition (UVP)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What makes this business fundamentally different from competitors?" className="h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="brandVoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice</FormLabel>
                        <FormControl>
                          <Input placeholder="Professional, witty, aggressive, calm..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="complianceNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Constraints (Red Lines)</FormLabel>
                        <FormControl>
                          <Input placeholder="No medical claims, no income guarantees..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/businesses")}>Cancel</Button>
              <Button type="submit" disabled={createBusiness.isPending}>
                {createBusiness.isPending ? "Initializing Entity..." : "Save Profile & Initialize Memory"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Shell>
  );
}