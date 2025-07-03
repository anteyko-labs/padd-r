require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Настройки из .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = 'nft-images'; // замените на ваш bucket

const IMAGES_DIR = 'C:/Users/LENOVO/Pictures/Screenshots';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Новый скрипт для рандомного распределения изображений по тировым папкам
const destDirs = [
  path.join(__dirname, 'assets', 'tier1'),
  path.join(__dirname, 'assets', 'tier2'),
  path.join(__dirname, 'assets', 'tier3'),
  path.join(__dirname, 'assets', 'tier4'),
];

// Получаем все png и jpg файлы
const files = fs.readdirSync(IMAGES_DIR).filter(file =>
  file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')
);

// Перемешиваем файлы
for (let i = files.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [files[i], files[j]] = [files[j], files[i]];
}

// Распределяем по папкам
files.forEach((file, idx) => {
  const destDir = destDirs[idx % destDirs.length];
  const srcPath = path.join(IMAGES_DIR, file);
  const destPath = path.join(destDir, file);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${file} to ${destDir}`);
});

async function uploadImages() {
  const files = fs.readdirSync(IMAGES_DIR);

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile()) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        console.log(`Пропущен не-изображение: ${file}`);
        continue;
      }

      const uploadPath = `${Date.now()}_${file}`; // уникальное имя

      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(uploadPath, fileBuffer, {
          contentType: getContentType(ext),
          upsert: false
        });

      if (error) {
        console.error(`Ошибка загрузки ${file}:`, error.message);
      } else {
        console.log(`Загружено: ${file} → ${uploadPath}`);
      }
    }
  }
}

function getContentType(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

uploadImages().then(() => {
  console.log('Загрузка завершена!');
});