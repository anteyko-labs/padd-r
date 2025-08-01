'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ConnectWalletButton({ className }: { className?: string }) {
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
      return;
    }

    try {
      if (openConnectModal) {
        openConnectModal();
      }
    } catch (error) {
      // Silent error handling
    }
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
    <Button
      onClick={handleConnect}
      className={className}
      variant="outline"
      size="lg"
    >
      <Wallet className="mr-2" size={20} />
      Connect Wallet
    </Button>
  );
} 