import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Mail, MessageSquare } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormData = z.infer<typeof contactSchema>;

const SUBJECT_OPTIONS = [
  "General Question",
  "Suggest a Camp",
  "Report Incorrect Info",
  "Other",
  "Remove my camp from WeeVora",
] as const;

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible."
      });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="page-contact">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-eggplant mb-4" data-testid="text-contact-title">
                Get in Touch
              </h1>
              <p className="text-lg text-muted-foreground">
                Have questions, feedback, or want to add your camp to our directory? We'd love to hear from you.
              </p>
            </div>

            {isSubmitted ? (
              <Card className="bg-white border-border/50 shadow-paper text-center py-12" data-testid="contact-success">
                <CardContent>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-forest/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-forest" />
                  </div>
                  <h2 className="text-2xl font-semibold text-eggplant mb-2">
                    Message Sent!
                  </h2>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll get back to you as soon as possible.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white border-border/50 shadow-paper">
                <CardHeader>
                  <CardTitle className="text-eggplant flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send us a message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your name" 
                                  {...field} 
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="you@example.com" 
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="input-subject">
                                  <SelectValue placeholder="Select a topic" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUBJECT_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us what's on your mind..."
                                className="min-h-32 resize-none"
                                {...field}
                                data-testid="input-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full py-6"
                        disabled={mutation.isPending}
                        data-testid="button-submit"
                      >
                        {mutation.isPending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            <div className="mt-12 text-center">
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Or email us directly at{" "}
                <a 
                  href="mailto:support@weevora.com" 
                  className="text-eggplant hover:underline"
                >
                  support@weevora.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
