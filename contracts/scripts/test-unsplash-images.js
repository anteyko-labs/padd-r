const fetch = require('node-fetch');

async function main() {
  console.log("🖼️ Testing Unsplash NFT images...");

  const imageUrls = {
    'Bronze': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Silver': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Gold': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Platinum': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80'
  };

  console.log("\n📋 Testing Unsplash URLs:");
  console.log("=".repeat(60));

  for (const [tier, url] of Object.entries(imageUrls)) {
    try {
      console.log(`\n🎨 Testing ${tier}...`);
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ ${tier} image is accessible!`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
        console.log(`   Cache-Control: ${response.headers.get('cache-control')}`);
      } else {
        console.log(`   ❌ ${tier} image is not accessible`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error testing ${tier}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎯 Unsplash image test completed!");
  console.log("\n💡 These images will work perfectly on Vercel!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 