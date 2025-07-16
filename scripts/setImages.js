require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Укажите адрес уже задеплоенного контракта PADNFTFactory:
  const PADNFTFactory_ADDRESS = "ВСТАВЬТЕ_АДРЕС_КОНТРАКТА_ЗДЕСЬ";

  // Ссылки на изображения для каждого тира:
  const tierImages = [
    "https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/sign/assets/tier1_01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZmVlZmUwOC05ODZiLTQ2ZTgtOWM1NC1iZmYyNDkxOTcwNDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvdGllcjFfMDEucG5nIiwiaWF0IjoxNzUyNjUyMTcyLCJleHAiOjM2NDQ4MTIxNzJ9.WPwvvh-wdIlJmTL9tWS8CgO1bk6Sp4PCDLQ1h5eW07o",
    "https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/sign/assets/tier2_01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZmVlZmUwOC05ODZiLTQ2ZTgtOWM1NC1iZmYyNDkxOTcwNDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvdGllcjJfMDEucG5nIiwiaWF0IjoxNzUyNjUyMjA3LCJleHAiOjM2NDQ4MTIyMDd9.YU_MLiwZqOh1OAtEUx2y2UPo7RPmKv7x3oSh9bWJSTQ",
    "https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/sign/assets/tier3_01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZmVlZmUwOC05ODZiLTQ2ZTgtOWM1NC1iZmYyNDkxOTcwNDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvdGllcjNfMDEucG5nIiwiaWF0IjoxNzUyNjUyMjIzLCJleHAiOjM2NDQ4MTIyMjN9.Dy8vyatoWzHJwC8jnesMjmBOfYGEKHhbE2TqYfK3LuU",
    "https://xmnvjrtznshxsbrkohhv.supabase.co/storage/v1/object/sign/assets/tier4_01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZmVlZmUwOC05ODZiLTQ2ZTgtOWM1NC1iZmYyNDkxOTcwNDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvdGllcjRfMDEucG5nIiwiaWF0IjoxNzUyNjUyMjM1LCJleHAiOjM2NDQ4MTIyMzV9._rgHdAis0xB5l-7MNeJGOa8pl1r2tuvEw4fV56-UE-0"
  ];

  const [admin] = await ethers.getSigners();
  const PADNFTFactory = await ethers.getContractAt("PADNFTFactory", PADNFTFactory_ADDRESS, admin);

  for (let i = 0; i < tierImages.length; i++) {
    const tx = await PADNFTFactory.setTierImage(i, tierImages[i]);
    await tx.wait();
    console.log(`Tier ${i} image set: ${tierImages[i]}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 