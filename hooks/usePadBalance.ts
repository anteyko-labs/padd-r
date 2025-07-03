import { useAccount, useReadContract } from 'wagmi';
import { PAD_TOKEN_ABI } from '@/lib/contracts/abis';
import { PAD_TOKEN_ADDRESS } from '@/lib/contracts/config';

export function usePadBalance() {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = useReadContract({
    address: PAD_TOKEN_ADDRESS as `0x${string}`,
    abi: PAD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });
  return { balance: data, isLoading, error, refetch };
} 