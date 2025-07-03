require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Настройки из .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = 'nft-images'; // замените на ваш bucket

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIERS = [1, 2, 3, 4];

async function uploadImages() {
  for (const tier of TIERS) {
    const dir = path.join(__dirname, 'assets', `tier${tier}`);
    const files = fs.readdirSync(dir).filter(f => /^tier\d+_\d+\.png$/i.test(f));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const uploadPath = `tier${tier}/${file}`;
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(uploadPath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      if (error) {
        console.error(`Ошибка загрузки ${file}:`, error.message);
      } else {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${uploadPath}`;
        console.log(`Загружено: ${file} → ${publicUrl}`);
      }
    }
  }
}

uploadImages().then(() => {
  console.log('Загрузка завершена!');
});