import { Link } from "wouter";
import weeVoraLogo from "../assets/weevora-logo.png";
import { SiInstagram, SiFacebook } from "react-icons/si";

const LAKE_COUNTY_CITIES = [
  "Antioch", "Barrington", "Buffalo Grove", "Deerfield", "Fox Lake",
  "Grayslake", "Gurnee", "Highland Park", "Lake Bluff", "Lake Forest",
  "Libertyville", "Lincolnshire", "Mundelein", "North Chicago", "Round Lake",
  "Round Lake Beach", "Vernon Hills", "Waukegan", "Zion"
].sort();

export function Footer() {
  return (
    <footer className="bg-eggplant text-white/90 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-1">
            <img 
              src={weeVoraLogo} 
              alt="WeeVora" 
              className="h-16 mb-4 brightness-0 invert opacity-90"
              data-testid="img-footer-logo"
            />
            <p className="text-white/70 text-base leading-relaxed">
              Never miss registration again
            </p>
            <div className="flex gap-3 mt-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="link-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="link-facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Lake County Camps by City
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {LAKE_COUNTY_CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/camps?location=${encodeURIComponent(city)}`}
                  className="text-white/70 hover:text-gold text-sm transition-colors"
                  data-testid={`link-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Resources
            </h3>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/about" 
                className="text-white/70 hover:text-gold text-sm transition-colors"
                data-testid="link-footer-about"
              >
                About Us
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-white/70 hover:text-gold text-sm transition-colors"
                data-testid="link-footer-how-it-works"
              >
                How It Works
              </Link>
              <Link 
                href="/contact" 
                className="text-white/70 hover:text-gold text-sm transition-colors"
                data-testid="link-footer-contact"
              >
                Contact Us
              </Link>
              <Link 
                href="/privacy" 
                className="text-white/70 hover:text-gold text-sm transition-colors"
                data-testid="link-footer-privacy"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-white/70 hover:text-gold text-sm transition-colors"
                data-testid="link-footer-terms"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} WeeVora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
