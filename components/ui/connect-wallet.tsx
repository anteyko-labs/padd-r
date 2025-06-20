'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

export function ConnectWallet() {
  const { isConnected, isSepoliaNetwork, address, switchToSepolia } = useWallet();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connection
        </CardTitle>
        <CardDescription>
          Connect your wallet to start using PADD-R Platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <ConnectButton />
            <div className="text-sm text-muted-foreground text-center">
              Supported wallets: MetaMask, WalletConnect, Coinbase Wallet, and more
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Wallet Connected
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
            </div>

            {!isSepoliaNetwork ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Please switch to Sepolia network</span>
                    <Button 
                      size="sm" 
                      onClick={switchToSepolia}
                      variant="outline"
                    >
                      Switch to Sepolia
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Connected to Sepolia Network
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>Network: {isSepoliaNetwork ? 'Sepolia Testnet' : 'Unknown'}</p>
              <p>Address: {address}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 