'use client';

import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { UtilityHighlights } from '@/components/landing/utility-highlights';
import { LoyaltyTiers } from '@/components/landing/loyalty-tiers';
import { NFTMarketplace } from '@/components/landing/nft-marketplace';
import { Roadmap } from '@/components/landing/roadmap';
import { Tokenomics } from '@/components/landing/tokenomics';
import { FAQSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black/70 relative overflow-x-hidden">
      {/* Глобальный фон-гифка */}
      <div className="fixed inset-0 w-full h-full -z-50 pointer-events-none">
        <iframe
          src="https://gifer.com/embed/RRr2"
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          allowFullScreen
          title="Animated Global Background"
        />
      </div>
      <Navbar />
      <main className="relative z-10 flex flex-col gap-0">
        <HeroSection />
        <HowItWorks />
        <UtilityHighlights />
        <LoyaltyTiers />
        <div className="py-8 md:py-16" />
        <NFTMarketplace />
        <Roadmap />
        <Tokenomics />
        <FAQSection />
        <div className="mb-16" />
      </main>
      <Footer />
    </div>
  );
}