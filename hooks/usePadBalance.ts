import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { PAD_TOKEN_ABI } from '@/lib/contracts/abis';
import { PAD_TOKEN_ADDRESS } from '@/lib/contracts/config';

export function usePadBalance() {
  const { address, chainId } = useAccount();
  const contractAddress = PAD_TOKEN_ADDRESS;
  if (typeof window !== 'undefined') {
    console.log('PAD_TOKEN_ADDRESS:', contractAddress);
    console.log('User address:', address);
  }
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PAD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });
  if (typeof window !== 'undefined' && error) {
    console.error('PAD balance error:', error);
  }
  return { balance: data, isLoading, error, refetch };
} 