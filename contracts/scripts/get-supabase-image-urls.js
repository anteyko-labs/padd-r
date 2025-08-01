const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase
const SUPABASE_URL = 'https://xmnvjrtznshxsbrkohhv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_apRzUAQdlIuDCVfuzEsO9A_mNAkC63Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("🔗 Getting Supabase image URLs...");

  const images = [
    'tier1_01.png',
    'tier2_01.png', 
    'tier3_01.png',
    'tier4_01.png'
  ];

  console.log("\n📋 Image URLs:");
  console.log("=".repeat(50));

  for (const imageName of images) {
    try {
      // Получаем signed URL для каждого изображения (из корня bucket)
      const { data, error } = await supabase.storage
        .from('assets')
        .createSignedUrl(imageName, 3600 * 24 * 365); // URL действителен 1 год
      
      if (error) {
        console.error(`❌ Error getting URL for ${imageName}:`, error);
      } else {
        console.log(`\n🎨 ${imageName}:`);
        console.log(`   ${data.signedUrl}`);
      }
    } catch (e) {
      console.error(`❌ Exception for ${imageName}:`, e);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ All URLs generated!");
  
  // Также показываем как использовать в коде
  console.log("\n💻 Usage in code:");
  console.log(`
// В компоненте:
const tierImages = {
  'Bronze': '${images[0]}',
  'Silver': '${images[1]}', 
  'Gold': '${images[2]}',
  'Platinum': '${images[3]}'
};

// Получить URL:
const imageUrl = await getNFTImage('', 'tier1_01.png');
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 