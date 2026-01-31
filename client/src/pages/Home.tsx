import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Stats } from "@/components/Stats";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" data-testid="page-home">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Stats />
      </main>
      <Footer />
    </div>
  );
}
