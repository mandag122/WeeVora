import { Link } from "wouter";
import { Search, Calendar, Printer, CheckCircle } from "lucide-react";
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
    description: "Found camps you love? Add specific sessions to your personalized calendar. See how different camps fit together in your summer schedule."
  },
  {
    icon: Printer,
    title: "Plan & Print",
    description: "Pop out your calendar for a full view or print it off. Your printout includes all selected camps and session details for easy reference."
  },
  {
    icon: CheckCircle,
    title: "Never Miss Registration",
    description: "We track registration dates so you don't have to. See what's open now, what's coming soon, and what's already closed at a glance."
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

        <section className="py-16 md:py-24">
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
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Lake County families who use WeeVora to discover and organize summer activities.
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
