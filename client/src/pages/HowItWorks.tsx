import { Link } from "wouter";
import { Search, Calendar, Printer, CheckCircle, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    title: "Browse & Search",
    description: "Explore our comprehensive directory of Lake County summer camps. Filter by age, location, activity type, price, and registration status to find the perfect fit."
  },
  {
    icon: Calendar,
    title: "Select Sessions",
    description: "Found camps you love? Add specific sessions to your personalized calendar. See how different camps fit together in your summer schedule. Remember: adding sessions here does NOT register you for camp."
  },
  {
    icon: Printer,
    title: "Plan & Print",
    description: "Pop out your calendar for a full view or print it off. Your printout includes all selected camps, session details, and estimated costs for easy reference when you're ready to register."
  },
  {
    icon: CheckCircle,
    title: "Register on Camp Websites",
    description: "Once you've finalized your plan, visit each camp's official website to complete registration and payment. WeeVora shows you where to go—each camp card links directly to their registration page."
  }
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="page-how-it-works">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-br from-eggplant/5 to-gold/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-eggplant mb-4" data-testid="text-how-title">
              How WeeVora Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Planning summer camp has never been easier. Here's how to make the most of WeeVora.
            </p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start gap-4 p-5 bg-gold/15 border-2 border-gold rounded-xl shadow-md">
                <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-gold/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-gold-dark" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gold-dark mb-2">
                    Important: WeeVora is a Planning Tool Only
                  </h3>
                  <p className="text-sm text-gold-dark leading-relaxed">
                    WeeVora helps you discover, compare, and organize summer camp options—but <strong>we do not process registrations or payments</strong>. Once you've built your ideal schedule, you must visit each camp's official website to register and pay. Think of WeeVora as your summer camp planner, not your registration portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-16">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex flex-col md:flex-row items-start gap-6"
                  data-testid={`step-${index + 1}`}
                >
                  <div className="flex items-center gap-4 md:flex-col md:items-start">
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-eggplant/10 text-eggplant shrink-0">
                      <step.icon className="w-8 h-8" />
                    </div>
                    <span className="text-5xl font-bold text-eggplant/20 md:hidden">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="hidden md:block text-5xl font-bold text-eggplant/20">
                        {index + 1}
                      </span>
                      <h2 className="text-2xl font-semibold text-eggplant">
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-eggplant text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to plan your summer?
            </h2>
            <p className="text-white/80 text-lg mb-4 max-w-xl mx-auto">
              Join thousands of Lake County families who use WeeVora to discover and organize summer activities.
            </p>
            <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">
              Remember: After planning with WeeVora, complete your registrations on each camp's website.
            </p>
            <Link href="/camps">
              <Button 
                size="lg"
                className="bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full px-8 shadow-paper-lg"
                data-testid="button-start-browsing"
              >
                Start Browsing Camps
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
