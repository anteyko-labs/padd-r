# Foundry тесты и покрытие

## Запуск тестов

1. Установите Foundry (если не установлен):
   ```sh
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
2. Запустите тесты:
   ```sh
   forge test -vv
   ```

## Проверка покрытия кода

1. Запустите покрытие:
   ```sh
   forge coverage --report lcov --report summary
   ```
2. Откройте подробный html-отчет (если нужен):
   ```sh
   forge coverage --report html
   ```

## Примечания
- Все тесты лежат в папке `test/` с расширением `.t.sol`.
- Покрытие >90% считается хорошим стандартом для DeFi/блокчейн проектов.
- Для сложных edge-case используйте fuzz/invariant тесты. 