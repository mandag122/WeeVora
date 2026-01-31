import { Link } from "wouter";
import weeVoraLogo from "../assets/weevora-logo.png";
import { SiInstagram, SiFacebook } from "react-icons/si";

const lakeCountyCities = [
  "Antioch", "Deerfield", "Grayslake", "Gurnee", "Highland Park",
  "Lake Bluff", "Lake Forest", "Lake Zurich", "Libertyville", 
  "Lincolnshire", "Mundelein", "Vernon Hills", "Waukegan"
];

export function Footer() {
  return (
    <footer className="bg-eggplant text-white/90 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-1">
            <img 
              src={weeVoraLogo} 
              alt="WeeVora" 
              className="h-12 mb-4 brightness-0 invert opacity-90"
              data-testid="img-footer-logo"
            />
            <p className="text-white/70 text-sm leading-relaxed font-handwritten text-lg">
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
              {lakeCountyCities.map((city) => (
                <Link 
                  key={city} 
                  href={`/camps?location=${encodeURIComponent(city)}`}
                  className="text-white/70 hover:text-gold text-sm transition-colors"
                  data-testid={`link-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
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
