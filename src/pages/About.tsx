import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Users, MapPin, Mail } from "lucide-react";
import familyPortrait from "@assets/woven_papercraft_family_1769894346976.png";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1" data-testid="page-about">
        <section className="bg-gradient-to-br from-eggplant/5 via-white to-gold/5 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-bold text-4xl md:text-5xl text-eggplant mb-6" data-testid="text-about-title">
                The Story Behind WeeVora
              </h1>
              <p className="text-lg text-foreground/70">
                Built by a Lake County mom, for Lake County families.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                  <div className="shrink-0 mx-auto md:mx-0">
                    <img 
                      src={familyPortrait} 
                      alt="The WeeVora family" 
                      className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-paper object-cover border-4 border-white"
                      data-testid="img-family-portrait"
                    />
                  </div>
                  <p className="text-xl text-foreground/80 leading-relaxed">
                    Hi! I'm Amanda, a mom of three in Mundelein, and I created WeeVora because I learned the hard way that summer camp planning in our area is no joke.
                  </p>
                </div>

                <div className="bg-gold/10 border-l-4 border-gold rounded-r-lg p-6 my-8">
                  <p className="text-foreground/80 italic mb-0">
                    Back when my oldest was in kindergarten, I thought I was ahead of the game. It was March—snow still on the ground in Mundelein—and I confidently sat down to register for summer camps. Surely I was early, right?
                  </p>
                  <p className="text-2xl font-bold text-eggplant mt-4 mb-0">Wrong.</p>
                </div>

                <p className="text-foreground/80 mb-6">
                  Everything was already booked. Full waitlists. Programs I didn't even know existed in Lake County, gone. I scrambled to piece together a summer from whatever spots were left at our park district and the few camps I knew about in Mundelein, Libertyville, and Lake Forest.
                </p>

                <p className="text-foreground/80 mb-6">
                  That frustrating experience stuck with me. As my family grew to three kids, the juggling act only got more complicated. Different ages, different interests, different schedules across multiple Lake County communities. Spreadsheets, browser tabs, sticky notes—it was chaos. I kept thinking: there has to be a better way to see all the Lake County options in one place.
                </p>

                <p className="text-xl font-semibold text-eggplant mb-4">
                  So I built one.
                </p>

                <h2 className="font-bold text-2xl text-eggplant mt-12 mb-6 flex items-center gap-3">
                  <Heart className="w-7 h-7 text-coral" />
                  What Started as a Personal Tool
                </h2>

                <p className="text-foreground/80 mb-6">
                  WeeVora began as a hobby project—something I made for myself to visualize Lake County camps, activities, and our family schedule in one place. No more forgotten registration deadlines. No more wondering if there was a better camp in Gurnee or Vernon Hills I'd missed. Just a simple, visual way to see everything happening in our area and plan with confidence.
                </p>

                <p className="text-foreground/80 mb-6">
                  But as I built it, I realized other Lake County parents were probably dealing with the same overwhelm. The same mad scramble every spring. The same feeling of being one step behind while navigating options across Mundelein, Libertyville, Lake Forest, Gurnee, Vernon Hills, and beyond.
                </p>

                <p className="text-foreground/80 mb-8">
                  That's when I decided to add some structure, polish it up, and share it with our community. If this tool could save even one Lake County parent from my March snow-day panic, it would be worth it.
                </p>

                <h2 className="font-bold text-2xl text-eggplant mt-12 mb-6 flex items-center gap-3">
                  <MapPin className="w-7 h-7 text-forest" />
                  Where We're Going
                </h2>

                <p className="text-foreground/80 mb-6">
                  What started as a Lake County summer camp planner is growing into something bigger. I'm adding year-round activities available in our area, crafts for rainy days, kid-friendly recipes, and resources for school breaks. Basically, anything that helps busy Lake County families like ours weave together a full, fun, and organized year.
                </p>

                <p className="text-foreground/80 mb-8">
                  This is still very much a work in progress, and I have plenty of dreams and ideas for features that might be worthwhile. I'm committed to keep building this out going forward, focusing on what matters most to families right here in Lake County.
                </p>

                <h2 className="font-bold text-2xl text-eggplant mt-12 mb-6 flex items-center gap-3">
                  <Users className="w-7 h-7 text-sky" />
                  I Need Your Help
                </h2>

                <p className="text-foreground/80 mb-6">
                  I say it a million times on this site, but I mean it: <strong>PLEASE</strong> hit the Contact button and fill out a form with any feedback, suggestions, or camp additions and edits!
                </p>

                <p className="text-foreground/80 mb-6">
                  Know about an amazing Lake County camp I'm missing? A hidden gem in Antioch or Long Grove? Found a broken link? Have an idea for a feature that would make your life easier? I want to hear it. WeeVora gets better when local parents like you share what you know.
                </p>

                <p className="text-foreground/80 mb-8">
                  This isn't some big corporate site—it's a tool built by a Mundelein mom, for Lake County families. Your input directly shapes what this becomes.
                </p>

                <div className="flex justify-center my-8">
                  <Link href="/contact">
                    <Button 
                      size="lg"
                      className="bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full px-8 shadow-paper hover:shadow-paper-hover transition-all"
                      data-testid="button-contact-us"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Share Your Feedback
                    </Button>
                  </Link>
                </div>

                <h2 className="font-bold text-2xl text-eggplant mt-12 mb-6">
                  Why "WeeVora"?
                </h2>

                <p className="text-foreground/80 mb-6">
                  The name WeeVora comes from my three kids: <strong>We</strong>ston, <strong>Ev</strong>erett, and C<strong>ora</strong>. It also represents what we're doing here—weaving together camps, activities, crafts, and plans into one beautiful, organized picture.
                </p>

                <p className="text-xl text-foreground/80 mb-8">
                  Because parenting is already hard enough. Planning summer in Lake County shouldn't make it harder.
                </p>

                <div className="bg-eggplant/5 rounded-lg p-8 mt-12 text-center">
                  <p className="text-foreground/70 mb-4">
                    Thanks for being here. Let's weave something great together.
                  </p>
                  <p className="text-xl font-semibold text-eggplant mb-1">
                    —Amanda
                  </p>
                  <p className="text-sm text-foreground/60">
                    Founder, WeeVora<br />
                    Mundelein, Lake County, Illinois
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
