const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase
const SUPABASE_URL = 'https://xmnvjrtznshxsbrkohhv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_apRzUAQdlIuDCVfuzEsO9A_mNAkC63Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("🖼️ Testing Supabase Storage images...");

  try {
    // Проверяем bucket assets
    console.log("\n📦 Checking assets bucket...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }
    
    console.log("Available buckets:", buckets.map(b => b.name));

    // Проверяем содержимое bucket assets
    console.log("\n📁 Checking assets bucket contents...");
    const { data: assets, error: assetsError } = await supabase.storage
      .from('assets')
      .list('', { limit: 100 });
    
    if (assetsError) {
      console.error("❌ Error listing assets:", assetsError);
      return;
    }
    
    console.log("Assets folder contents:", assets);

    // Проверяем каждый тир
    const tiers = ['tier1', 'tier2', 'tier3', 'tier4'];
    
    for (const tier of tiers) {
      console.log(`\n🎨 Checking ${tier}...`);
      
      const { data: tierFiles, error: tierError } = await supabase.storage
        .from('assets')
        .list(tier);
      
      if (tierError) {
        console.error(`❌ Error listing ${tier}:`, tierError);
        continue;
      }
      
      console.log(`${tier} files:`, tierFiles);
      
      if (tierFiles && tierFiles.length > 0) {
        // Пробуем получить signed URL для первого файла
        const firstFile = tierFiles[0];
        console.log(`Testing signed URL for ${tier}/${firstFile.name}...`);
        
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('assets')
          .createSignedUrl(`${tier}/${firstFile.name}`, 3600);
        
        if (urlError) {
          console.error(`❌ Error getting signed URL for ${firstFile.name}:`, urlError);
        } else {
          console.log(`✅ Signed URL for ${firstFile.name}:`, signedUrl.signedUrl);
        }
      }
    }

    // Тестируем функцию getTierImages
    console.log("\n🧪 Testing getTierImages function...");
    for (const tier of tiers) {
      try {
        const { data, error } = await supabase.storage
          .from('assets')
          .list(tier);
        
        if (error) {
          console.error(`❌ Error in getTierImages for ${tier}:`, error);
        } else {
          const images = data?.map(file => file.name).filter(name => name.endsWith('.png') || name.endsWith('.jpg')) || [];
          console.log(`${tier} images:`, images);
        }
      } catch (e) {
        console.error(`❌ Exception in getTierImages for ${tier}:`, e);
      }
    }

    console.log("\n🎯 Supabase Storage test completed!");
    
  } catch (error) {
    console.error("❌ General error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 