const fetch = require('node-fetch');

async function main() {
  console.log("🔗 Testing direct image URLs...");

  const imageUrls = {
    'Bronze': 'https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/public/assets/tier1_01.png',
    'Silver': 'https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/public/assets/tier2_01.png',
    'Gold': 'https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/public/assets/tier3_01.png',
    'Platinum': 'https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/public/assets/tier4_01.png'
  };

  console.log("\n📋 Testing URLs:");
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
      } else {
        console.log(`   ❌ ${tier} image is not accessible`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error testing ${tier}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎯 Direct URL test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 