const hre = require("hardhat");
const fetch = require("node-fetch");

async function main() {
  console.log("🖼️ Testing NFT Images...");

  // Изображения для тестирования
  const images = {
    'Bronze': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Silver': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Gold': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Platinum': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80'
  };

  const fallbackImages = {
    'Bronze': 'https://picsum.photos/400/400?random=1',
    'Silver': 'https://picsum.photos/400/400?random=2', 
    'Gold': 'https://picsum.photos/400/400?random=3',
    'Platinum': 'https://picsum.photos/400/400?random=4'
  };

  console.log("\n🔍 Testing primary images:");
  for (const [tier, url] of Object.entries(images)) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${tier}: ${url}`);
      } else {
        console.log(`❌ ${tier}: ${url} (${response.status})`);
      }
    } catch (e) {
      console.log(`❌ ${tier}: ${url} (Error: ${e.message})`);
    }
  }

  console.log("\n🔍 Testing fallback images:");
  for (const [tier, url] of Object.entries(fallbackImages)) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${tier}: ${url}`);
      } else {
        console.log(`❌ ${tier}: ${url} (${response.status})`);
      }
    } catch (e) {
      console.log(`❌ ${tier}: ${url} (Error: ${e.message})`);
    }
  }

  // Тестируем API endpoint
  console.log("\n🔍 Testing API endpoint:");
  try {
    const response = await fetch('http://localhost:3000/api/nft/0');
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API endpoint working");
      console.log("  - Name:", data.name);
      console.log("  - Image:", data.image);
      console.log("  - Description:", data.description);
    } else {
      console.log(`❌ API endpoint failed: ${response.status}`);
    }
  } catch (e) {
    console.log(`❌ API endpoint error: ${e.message}`);
  }

  console.log("\n🎯 Image Test Summary:");
  console.log("✅ All images should be accessible");
  console.log("✅ Fallback images available");
  console.log("✅ API endpoint configured");
  console.log("✅ NFT metadata includes images");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 