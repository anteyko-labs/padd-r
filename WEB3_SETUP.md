# Web3 Setup Guide (Wagmi v2)

## Быстрый старт

1. **Запустите приложение:**
   ```bash
   npm run dev
   ```

2. **Откройте тестовую страницу:**
   http://localhost:3000/test-wallet

3. **Подключите кошелек** - нажмите "Connect Wallet" и выберите ваш кошелек

## Настройка переменных окружения (опционально)

Для продакшена создайте файл `.env.local`:

```env
# Web3 Configuration
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# Contract Addresses (Sepolia)
NEXT_PUBLIC_PAD_TOKEN_ADDRESS=your_pad_token_address_here
NEXT_PUBLIC_STAKE_MANAGER_ADDRESS=your_stake_manager_address_here
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=your_nft_factory_address_here
NEXT_PUBLIC_TIER_CALCULATOR_ADDRESS=your_tier_calculator_address_here