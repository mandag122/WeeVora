import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import weeVoraLogo from "../assets/weevora-logo.png";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/camps", label: "Summer Camps" },
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <img 
              src={weeVoraLogo} 
              alt="WeeVora" 
              className="h-28 md:h-32 -my-8 cursor-pointer hover:opacity-90 transition-opacity"
              data-testid="img-logo"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-eggplant bg-eggplant/5"
                      : "text-foreground/70 hover:text-eggplant"
                  }`}
                  data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/camps">
              <Button 
                className="bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full px-6 shadow-paper hover:shadow-paper-hover transition-all"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/40 pt-4" data-testid="nav-mobile">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-base font-medium ${
                      isActive(link.href)
                        ? "text-eggplant bg-eggplant/5"
                        : "text-foreground/70"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link href="/camps">
                <Button 
                  className="w-full mt-2 bg-gold hover:bg-gold-dark text-eggplant-dark font-semibold rounded-full shadow-paper"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="button-mobile-get-started"
                >
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
