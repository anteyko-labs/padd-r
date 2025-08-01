import { NextRequest, NextResponse } from 'next/server';
import { NFT_FACTORY_ADDRESS, NFT_IMAGES, TIER_LEVELS } from '@/lib/contracts/config';
import { ethers } from 'ethers';

// ABI для получения метаданных NFT
const NFT_ABI = [
  'function nftMetadata(uint256 tokenId) external view returns (tuple(uint256,uint256,uint256,uint256,uint8,uint256,uint256,bool))',
  'function ownerOf(uint256 tokenId) external view returns (address)'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = parseInt(params.tokenId);
    
    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    // Подключаемся к Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/9c259df705904ba5b2cbd4a10d00e7df');
    const nftContract = new ethers.Contract(NFT_FACTORY_ADDRESS, NFT_ABI, provider);

    // Получаем метаданные из блокчейна
    const metadata = await nftContract.nftMetadata(tokenId);
    const [positionId, amountStaked, lockDurationMonths, startTimestamp, tierLevel, monthIndex, nextMintOn, isInitialStakingNFT] = metadata;

    // Определяем тир
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const tierName = tierNames[Number(tierLevel)] || 'Bronze';
    const imageUrl = NFT_IMAGES[tierName as keyof typeof NFT_IMAGES];

    // Форматируем данные
    const formattedAmount = ethers.formatEther(amountStaked);
    const startDate = new Date(Number(startTimestamp) * 1000).toLocaleDateString();
    const nextMintDate = new Date(Number(nextMintOn) * 1000).toLocaleDateString();

    const nftMetadata = {
      name: `PAD ${tierName} NFT #${tokenId}`,
      description: `PAD NFT from ${tierName} tier. This NFT represents your staking position with ${formattedAmount} PAD staked. ${isInitialStakingNFT ? 'Initial staking reward.' : 'Monthly staking reward.'}`,
      image: imageUrl,
      external_url: "https://padd-r.com",
      attributes: [
        {
          trait_type: "Tier",
          value: tierName
        },
        {
          trait_type: "Token ID",
          value: tokenId.toString()
        },
        {
          trait_type: "Amount Staked",
          value: `${formattedAmount} PAD`
        },
        {
          trait_type: "Position ID",
          value: positionId.toString()
        },
        {
          trait_type: "Start Date",
          value: startDate
        },
        {
          trait_type: "Next Mint Date",
          value: nextMintDate
        },
        {
          trait_type: "Type",
          value: isInitialStakingNFT ? "Initial Staking" : "Monthly Reward"
        },
        {
          trait_type: "Collection",
          value: "PAD Staking NFTs"
        }
      ],
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageUrl
          }
        ],
        category: "image"
      }
    };

    return NextResponse.json(nftMetadata);
  } catch (error) {
    console.error('Error generating NFT metadata:', error);
    
    // Fallback на статические данные если блокчейн недоступен
    const tokenId = parseInt(params.tokenId);
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const tierIndex = tokenId % 4;
    const tierName = tierNames[tierIndex];
    const imageUrl = NFT_IMAGES[tierName as keyof typeof NFT_IMAGES];

    const fallbackMetadata = {
      name: `PAD ${tierName} NFT #${tokenId}`,
      description: `PAD NFT from ${tierName} tier. This NFT represents your staking position and rewards.`,
      image: imageUrl,
      external_url: "https://padd-r.com",
      attributes: [
        {
          trait_type: "Tier",
          value: tierName
        },
        {
          trait_type: "Token ID",
          value: tokenId.toString()
        },
        {
          trait_type: "Collection",
          value: "PAD Staking NFTs"
        }
      ],
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageUrl
          }
        ],
        category: "image"
      }
    };

    return NextResponse.json(fallbackMetadata);
  }
} 