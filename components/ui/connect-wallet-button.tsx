'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

function isInWalletBrowser() {
  if (typeof window === 'undefined') return false;
  return window.ethereum && (
    window.ethereum.isMetaMask ||
    window.ethereum.isTrust ||
    window.ethereum.isCoinbaseWallet ||
    window.ethereum.isBraveWallet
  );
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
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const triedConnectors = useRef<Set<string>>(new Set());

  const isMobileDevice = isMobile();
  const isWalletBrowser = isInWalletBrowser();

  const tryConnectorsSequentially = async () => {
    setErrorMsg(null);
    triedConnectors.current.clear();
    const ordered = [
      connectors.find((c) => c.id === 'injected'),
      ...connectors.filter((c) => c.id !== 'injected')
    ].filter(Boolean);
    for (const connector of ordered) {
      if (!connector) continue;
      if (triedConnectors.current.has(connector.id)) continue;
      triedConnectors.current.add(connector.id);
      try {
        await connect({ connector });
        setErrorMsg(null);
        return;
      } catch (err: any) {
        setErrorMsg(`Ошибка при подключении через ${connector.name}: ${err?.message || err}`);
      }
    }
    setErrorMsg('Не удалось подключиться ни через один из доступных кошельков.');
  };

  const handleConnect = () => {
    setErrorMsg(null);
    if (isConnected) {
      disconnect();
      return;
    }

    if (isMobileDevice && isWalletBrowser) {
      tryConnectorsSequentially();
      return;
    }

    if (isMobileDevice) {
      setShowMobileMenu(true);
      return;
    }

    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleWalletSelect = (deepLink: string) => {
    window.open(deepLink, '_blank');
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
      {isMobileDevice && isWalletBrowser && (
        <div className="mb-2 text-xs text-gray-400 text-center">
          Нажмите <b>Connect Wallet</b> для подключения через мобильный кошелек<br/>
          <span className="text-emerald-400">window.ethereum: {typeof window !== 'undefined' && window.ethereum ? 'есть' : 'нет'}</span>
        </div>
      )}
      <Button
        onClick={handleConnect}
        className={className}
        variant="outline"
        size="lg"
        disabled={isPending}
      >
        <Wallet className="mr-2" size={20} />
        Connect Wallet
      </Button>
      {errorMsg && (
        <div className="mt-2 text-xs text-red-400 text-center whitespace-pre-line">{errorMsg}</div>
      )}
      {showMobileMenu && isMobileDevice && !isWalletBrowser && (
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