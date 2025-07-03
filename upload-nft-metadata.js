require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { NFTStorage, File } = require('nft.storage');

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY;
if (!NFT_STORAGE_KEY) {
  console.error('NFT_STORAGE_KEY не найден в .env');
  process.exit(1);
}
const client = new NFTStorage({ token: NFT_STORAGE_KEY });

const tiers = ['tier1', 'tier2', 'tier3', 'tier4'];
const tierNames = {
  tier1: 'Bronze',
  tier2: 'Silver',
  tier3: 'Gold',
  tier4: 'Platinum',
};

async function main() {
  for (const tier of tiers) {
    const dir = path.join(__dirname, 'assets', tier);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f)).slice(0, 6); // только первые 6
    for (const file of files) {
      const imagePath = path.join(dir, file);
      let imageCid, imageUrl, metaCid, metaUrl;
      try {
        const imageData = fs.readFileSync(imagePath);
        const imageFile = new File([imageData], file, { type: 'image/png' });
        // 1. Загружаем картинку на IPFS
        imageCid = await client.storeBlob(imageFile);
        imageUrl = `https://ipfs.io/ipfs/${imageCid}`;
      } catch (err) {
        console.error(`Ошибка при загрузке картинки ${file}:`, err);
        continue;
      }
      // 2. Генерируем метаданные
      const tokenId = path.parse(file).name; // оригинальное имя файла без расширения
      const metadata = {
        name: `${tierNames[tier]} NFT (${tokenId})`,
        description: `Staking NFT for PADD-R (${tierNames[tier]})`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Tier', value: tierNames[tier] },
          { trait_type: 'File Name', value: file }
        ]
      };
      try {
        // 3. Загружаем метаданные на IPFS (без сохранения на диск)
        const metaDataFile = new File([Buffer.from(JSON.stringify(metadata))], `${tokenId}.json`, { type: 'application/json' });
        metaCid = await client.storeBlob(metaDataFile);
        metaUrl = `https://ipfs.io/ipfs/${metaCid}`;
      } catch (err) {
        console.error(`Ошибка при загрузке метаданных для ${file}:`, err);
        continue;
      }
      console.log(`NFT ${tokenId} (${tierNames[tier]}):`);
      console.log(`  image:    ${imageUrl}`);
      console.log(`  metadata: ${metaUrl}`);
      console.log('---');
    }
  }
  console.log('Готово! Все изображения и метаданные (до 6 на папку) загружены на IPFS.');
}

main().catch((err) => {
  console.error('Ошибка при выполнении скрипта:', err);
  if (err.response) {
    console.error('Ответ сервера:', err.response.data);
  }
}); 