import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { PAD_TOKEN_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';

export function usePadBalance() {
  const { address, chainId } = useAccount();
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.PAD_TOKEN;
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PAD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });
  return { balance: data, isLoading, error };
} 