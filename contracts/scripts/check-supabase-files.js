const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase
const SUPABASE_URL = 'https://xmnvjrtznshxsbrkohhv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_apRzUAQdlIuDCVfuzEsO9A_mNAkC63Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("🔍 Detailed Supabase Storage check...");

  try {
    // 1. Проверяем все buckets
    console.log("\n📦 All buckets:");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // 2. Проверяем содержимое bucket assets
    console.log("\n📁 Assets bucket contents:");
    const { data: assets, error: assetsError } = await supabase.storage
      .from('assets')
      .list('', { limit: 100, offset: 0 });
    
    if (assetsError) {
      console.error("❌ Error listing assets:", assetsError);
    } else {
      console.log("Files in assets bucket:");
      if (assets && assets.length > 0) {
        assets.forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      } else {
        console.log("  No files found");
      }
    }

    // 3. Пробуем получить public URL (если bucket публичный)
    console.log("\n🔗 Trying public URLs:");
    const testFiles = ['tier1_01.png', 'tier2_01.png', 'tier3_01.png', 'tier4_01.png'];
    
    for (const fileName of testFiles) {
      try {
        const { data: publicUrl } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName);
        
        console.log(`\n🎨 ${fileName}:`);
        console.log(`   Public URL: ${publicUrl.publicUrl}`);
        
        // Проверяем, доступен ли файл
        const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' });
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
      } catch (e) {
        console.error(`❌ Error with ${fileName}:`, e.message);
      }
    }

    // 4. Пробуем signed URL с разными параметрами
    console.log("\n🔐 Trying signed URLs:");
    for (const fileName of testFiles) {
      try {
        const { data, error } = await supabase.storage
          .from('assets')
          .createSignedUrl(fileName, 3600);
        
        if (error) {
          console.error(`❌ Signed URL error for ${fileName}:`, error);
        } else {
          console.log(`\n✅ ${fileName}:`);
          console.log(`   Signed URL: ${data.signedUrl}`);
        }
      } catch (e) {
        console.error(`❌ Exception for ${fileName}:`, e.message);
      }
    }

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