require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
console.log('Private key length:', privateKey.length);
console.log('Private key format:', privateKey.startsWith('0x') ? 'with 0x prefix' : 'without 0x prefix');
console.log('Private key:', privateKey); 