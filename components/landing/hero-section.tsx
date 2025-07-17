'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Play, User, Wallet, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/use-wallet';
import { ConnectWalletButton } from '@/components/ui/connect-wallet-button';
import { motion } from 'framer-motion';

export function HeroSection() {
  const { isConnected } = useWallet();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Яркий встречающий фон только для hero */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2 -z-10"
        style={{
          width: '120vw',
          height: '120vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00ffb2 0%, #0077ff 60%, #ff00e0 90%, transparent 100%)',
          filter: 'blur(90px)',
          opacity: 0.85,
        }}
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1.15, opacity: 1 }}
        transition={{ duration: 2.5, type: 'spring' }}
      />
      <div className="relative z-10 container mx-auto text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Drive, Dine, Stay</span>
            <br />
            <span className="text-white">powered by </span>
            <span className="text-emerald-400">PADD-R Token</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your key to real-world rewards in Dubai and beyond. Experience luxury services with exclusive token-gated benefits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a 
              href="https://pancakeswap.finance/swap?outputCurrency=0x742d35Cc6Bf8fE5a02B5c4B4c8b4cB2" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-4 rounded-2xl font-semibold pulse-emerald"
              >
                Get Token <ExternalLink className="ml-2" size={20} />
              </Button>
            </a>
            {!isConnected ? (
              <ConnectWalletButton className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 text-lg px-8 py-4 rounded-2xl font-semibold" />
            ) : (
              <Link href="/dashboard">
                <Button 
                  variant="outline"
                  size="lg" 
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 text-lg px-8 py-4 rounded-2xl font-semibold"
                >
                  <User className="mr-2" size={20} />
                  Go to Dashboard
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 text-lg px-8 py-4 rounded-2xl font-semibold"
            >
              <Play className="mr-2" size={20} />
              Watch Demo
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '40K+', label: 'Token Holders' },
              { value: '15M+', label: 'Tokens Staked' },
              { value: '500+', label: 'NFTs Minted' },
              { value: '99%', label: 'Uptime' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}