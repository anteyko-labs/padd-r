import { ConnectWallet } from '@/components/ui/connect-wallet';

export default function TestWalletPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">PADD-R Wallet Test</h1>
          <p className="text-gray-300">Test your wallet connection</p>
        </div>
        <ConnectWallet />
      </div>
    </div>
  );
} 