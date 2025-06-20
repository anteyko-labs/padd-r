'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useCallback } from 'react';

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const connectWallet = useCallback(async (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (connector) {
      try {
        await connect({ connector });
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const switchToSepolia = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: 11155111 }); // Sepolia chain ID
    }
  }, [switchChain]);

  const isSepoliaNetwork = chainId === 11155111;

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    isSepoliaNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    connectors,
  };
} 