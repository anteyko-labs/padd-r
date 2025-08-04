// Расчет точных порогов для tier

function calculateTierScore(months, amount) {
  // Новая формула: k_score = (duration/max_duration(12))*0.6 + (amount/53333)*0.4
  const timeScore = (months / 12) * 0.6; // duration/max_duration * 0.6
  const amountScore = (amount / 53333) * 0.4; // amount/53333 * 0.4
  
  const tierScore = timeScore + amountScore;
  
  return tierScore;
}

function testTierCalculation(months, amount) {
  console.log(`\n=== Тест расчета tier ===`);
  console.log(`Месяцы: ${months}`);
  console.log(`Сумма: ${amount} PAD`);
  
  const timeScore = (months / 12) * 0.6;
  const amountScore = (amount / 53333) * 0.4;
  const tierScore = calculateTierScore(months, amount);
  
  console.log(`timeScore: ${timeScore.toFixed(3)} (${months} месяцев)`);
  console.log(`amountScore: ${amountScore.toFixed(3)} (${amount} PAD)`);
  console.log(`tierScore: ${tierScore.toFixed(6)}`);
  
  return tierScore;
}

// Тестируем новую формулу
console.log('Тестирование новой формулы tier:');
testTierCalculation(12, 30000); // Должен быть Platinum
testTierCalculation(12, 20000); // Platinum
testTierCalculation(12, 19999); // Gold
testTierCalculation(12, 10000); // Gold
testTierCalculation(12, 5000);  // Gold

console.log('\nПороги:');
console.log(`Bronze: до 0.25`);
console.log(`Silver: до 0.5`);
console.log(`Gold: до 0.75`);
console.log(`Platinum: от 0.75`); 