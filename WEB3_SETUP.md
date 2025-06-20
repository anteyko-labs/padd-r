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
```

## Получение API ключей

### 1. Infura API Key (опционально)
1. Зарегистрируйтесь на [Infura](https://infura.io/)
2. Создайте новый проект
3. Скопируйте Project ID
4. Добавьте в `NEXT_PUBLIC_INFURA_API_KEY`

### 2. WalletConnect Project ID (опционально)
1. Зарегистрируйтесь на [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Создайте новый проект
3. Скопируйте Project ID
4. Добавьте в `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

## Деплой контрактов на Sepolia

1. Получите тестовые ETH для Sepolia:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. Деплойте контракты:
   ```bash
   cd contracts
   npm run deploy:all --network sepolia
   ```

3. Скопируйте адреса деплоенных контрактов в `.env.local`

## Тестирование

1. **Базовое тестирование:**
   - Откройте http://localhost:3000/test-wallet
   - Подключите кошелек
   - Проверьте переключение на Sepolia

2. **Поддерживаемые кошельки:**
   - MetaMask
   - WalletConnect
   - Coinbase Wallet
   - Rainbow
   - Trust Wallet
   - И многие другие

3. **Поддерживаемые сети:**
   - Sepolia (основная тестовая сеть)
   - Ethereum Mainnet

## Структура файлов

```
components/
├── providers/
│   └── rainbow-provider.tsx    # RainbowKit провайдер
├── ui/
│   └── connect-wallet.tsx      # Компонент подключения кошелька
hooks/
└── use-wallet.ts               # Хук для работы с кошельком
app/
├── test-wallet/
│   └── page.tsx                # Тестовая страница
└── wallet/
    └── page.tsx                # Основная страница кошелька
```

## Возможные проблемы

1. **Ошибка "Module not found"** - убедитесь, что все зависимости установлены
2. **Кошелек не подключается** - проверьте, что MetaMask установлен и разблокирован
3. **Не переключается на Sepolia** - добавьте сеть Sepolia в MetaMask вручную

## Следующие шаги

После успешного подключения кошелька можно:
1. Интегрировать смарт-контракты
2. Создать формы для стейкинга
3. Добавить отображение NFT
4. Создать dashboard с реальными данными 