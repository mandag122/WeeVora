import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-playground.png";

export function Hero() {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Softer overlay so you can still see the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-gold/20" />

      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-eggplant/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-coral/10 rounded-full blur-2xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-sans font-bold text-4xl sm:text-5xl md:text-6xl text-eggplant mb-4 leading-tight tracking-tight">
            Weave together your perfect summer
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 leading-relaxed max-w-2xl">
            Your copilot for summer camps, activities, and keeping the kids busy.
            Find, compare, and plan summer camps across Lake County, Illinois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/camps">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full px-8 py-6 text-lg shadow-paper-lg hover:shadow-paper-hover transition-all hover:-translate-y-1"
              >
                Find Camps Near You
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-eggplant text-eggplant hover:bg-eggplant hover:text-white rounded-full px-8 py-6 text-lg transition-all"
              >
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
