const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing API endpoints...');
  
  try {
    // Тест API endpoint для NFT metadata
    const response = await fetch('http://localhost:3000/api/nft/0');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint working');
      console.log('  - Name:', data.name);
      console.log('  - Image:', data.image);
      console.log('  - Description:', data.description);
    } else {
      console.log(`❌ API endpoint failed: ${response.status}`);
    }
  } catch (e) {
    console.log(`❌ API endpoint error: ${e.message}`);
    console.log('💡 Make sure Next.js server is running: npm run dev');
  }
}

testAPI(); 