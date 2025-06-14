'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FAQSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Is PADD-R a security?",
      answer: "No, PADD-R is a utility token that provides access to real-world services and rewards. It does not represent equity, investment returns, or ownership in any company. The token's value comes from its utility in accessing exclusive services and benefits."
    },
    {
      question: "Why no fixed income or APY?",
      answer: "PADD-R focuses on utility and real-world benefits rather than financial returns. Rewards come in the form of NFTs, discounts, exclusive access, and service benefits. This approach ensures sustainable tokenomics and regulatory compliance."
    },
    {
      question: "Can I sell my NFT rewards?",
      answer: "Yes, Gold and Platinum tier NFTs are tradeable on OpenSea and other NFT marketplaces. Silver SBTs (Soulbound Tokens) are non-transferable and tied to your wallet. This allows you to monetize your loyalty status while maintaining tier exclusivity."
    },
    {
      question: "What happens if I unstake early?",
      answer: "Early unstaking is possible but you'll forfeit accumulated rewards and lose your tier status immediately. Your staked tokens will be returned, but any pending NFT rewards or tier benefits will be cancelled. Consider your commitment carefully before staking."
    },
    {
      question: "How do I use my tier benefits?",
      answer: "Once you achieve a tier, you'll receive instructions via email and dashboard notifications. For restaurants, you'll get QR codes or vouchers. For car rentals, you'll have priority booking access. Concierge services will contact you directly for Platinum tier members."
    },
    {
      question: "Are there any geographic restrictions?",
      answer: "Currently, physical services are primarily available in Dubai, UAE. However, token holding and NFT trading are available globally (subject to local regulations). We're expanding to other luxury destinations in 2026."
    },
    {
      question: "What's the difference between SBT and NFT rewards?",
      answer: "SBTs (Soulbound Tokens) are non-transferable and represent your personal tier status. NFTs are tradeable assets that can be sold on marketplaces. Both provide the same tier benefits, but NFTs offer additional liquidity and investment potential."
    },
    {
      question: "How is PADD-R different from other loyalty programs?",
      answer: "PADD-R combines blockchain transparency with real-world luxury services. Unlike traditional loyalty points, your tier status is verifiable on-chain, NFT rewards have market value, and benefits extend across multiple service categories in premium locations."
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center">
            <HelpCircle className="mr-3 text-emerald-400" size={32} />
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about PADD-R tokens and rewards
          </p>
        </div>
        
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover">
              <CardContent className="p-0">
                <button
                  className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors rounded-2xl"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-semibold text-white pr-4">{item.question}</span>
                  <ChevronDown 
                    className={`text-emerald-400 transition-transform duration-200 flex-shrink-0 ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`} 
                    size={20} 
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <Separator className="mb-4 bg-gray-700" />
                    <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              Join our Telegram
            </a>
            <span className="text-gray-600 hidden sm:block">•</span>
            <a 
              href="#" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              Read Documentation
            </a>
            <span className="text-gray-600 hidden sm:block">•</span>
            <a 
              href="#" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}