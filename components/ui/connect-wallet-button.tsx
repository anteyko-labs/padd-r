'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

const mobileWallets = [
  {
    name: 'MetaMask',
    icon: '🦊',
    deepLink: 'https://metamask.app.link/dapp/padd-r.io'
  },
  {
    name: 'Trust Wallet',
    icon: '🛡️',
    deepLink: 'https://link.trustwallet.com/open_url?coin_id=60&url=https://padd-r.io'
  },
  {
    name: 'Coinbase Wallet',
    icon: '🪙',
    deepLink: 'https://wallet.coinbase.com/dapp/padd-r.io'
  },
  {
    name: 'Brave Wallet',
    icon: '🦁',
    deepLink: 'https://metamask.app.link/dapp/padd-r.io'
  }
];

export function ConnectWalletButton({ className }: { className?: string }) {
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleConnect = () => {
    console.log('Connect button clicked');
    
    if (isConnected) {
      disconnect();
      return;
    }

    // На мобильном - показываем меню выбора кошельков
    if (isMobile()) {
      console.log('Mobile device detected, showing wallet menu...');
      setShowMobileMenu(true);
      return;
    }

    // На ПК - используем RainbowKit modal
    try {
      if (openConnectModal) {
        console.log('Opening RainbowKit modal...');
        openConnectModal();
      } else {
        console.error('RainbowKit modal not available');
      }
    } catch (error) {
      console.error('Error opening connect modal:', error);
    }
  };

  const handleWalletSelect = (deepLink: string) => {
    console.log('Opening wallet deep-link:', deepLink);
    window.location.href = deepLink;
    setShowMobileMenu(false);
  };

  if (isConnected) {
    return (
      <Button
        onClick={handleConnect}
        className={className}
        variant="outline"
        size="lg"
      >
        <Wallet className="mr-2" size={20} />
        Disconnect: {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={handleConnect}
        className={className}
        variant="outline"
        size="lg"
      >
        <Wallet className="mr-2" size={20} />
        Connect Wallet
      </Button>

      {/* Мобильное меню выбора кошельков */}
      {showMobileMenu && isMobile() && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Выберите кошелек
            </h3>
            
            <div className="space-y-4">
              {mobileWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.deepLink)}
                  className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="text-white font-semibold text-lg">{wallet.name}</span>
                  </div>
                  <span className="text-emerald-400 text-xl">→</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMobileMenu(false)}
              className="w-full mt-6 p-4 text-gray-400 hover:text-white text-center font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 