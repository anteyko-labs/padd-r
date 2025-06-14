'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Wallet, LogOut, Menu, X, Home, TrendingUp, Gift, History, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/wallet-provider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect } = useWallet();
  const router = useRouter();

  const navigationItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/dashboard/stake', label: 'Stake', icon: TrendingUp },
    { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    // If wallet is not connected, redirect to home
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
              <Wallet size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Connect Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access the PADD-R dashboard and manage your tokens
            </p>
            <Button 
              onClick={connect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              size="lg"
            >
              <Wallet className="mr-2" size={20} />
              Connect MetaMask
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="cursor-pointer">
                <Logo />
              </Link>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-400">Welcome back!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-800 rounded-2xl px-4 py-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-glow" />
                <span className="text-sm text-gray-300">{formatAddress(address!)}</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hidden md:flex"
              >
                <LogOut size={16} className="mr-2" />
                Disconnect
              </Button>
              
              <button 
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
            <div className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 text-gray-300 hover:text-emerald-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <LogOut size={16} className="mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-gray-950 border-r border-gray-800 min-h-screen">
          <nav className="p-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-200 group"
              >
                <item.icon size={20} className="group-hover:text-emerald-400" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}