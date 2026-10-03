console.log('script.js підключено');

// Оголошення масиву даних 
const routes = [
  { name: 'Дніпровська набережна', km: 12, difficulty: 'легкий' },
  { name: 'Голосіївський ліс', km: 18, difficulty: 'середній' },
  { name: 'Труханів острів', km: 10, difficulty: 'важкий' }
];

console.log('Дані маршрутів:', routes);

// Обробка даних циклом (підсумовування довжини всіх маршрутів)
function calculateTotalDistance(routesList) {
  let totalKm = 0;

  for (let i = 0; i < routesList.length; i++) {
    totalKm += routesList[i].km;
  }

  console.log(`Загальна довжина всіх маршрутів: ${totalKm} км`);
  return totalKm;
}
// Виклик функції
calculateTotalDistance(routes);


// Умовна класифікація маршрутів за складністю
function classifyRoutes(routesList) {
  console.log('--- Класифікація маршрутів ---');
  for (const route of routesList) {
    let recommendation = '';

    if (route.difficulty === 'легкий') {
      recommendation = 'Підходить для початківців і спокійних прогулянок.';
    } else if (route.difficulty === 'середній') {
      recommendation = 'Потрібна базова фізична підготовка.';
    } else if (route.difficulty === 'важкий') {
      recommendation = 'Рекомендовано лише для досвідчених велосипедистів.';
    } else {
      recommendation = 'Рівень складності уточнюється.';
    }

    console.log(`Маршрут "${route.name}" (${route.km} км, ${route.difficulty}): ${recommendation}`);
  }
}
// Виклик функції
classifyRoutes(routes);


// Стрілкова функція розрахунку орієнтовного часу поїздки 
const estimateMinutes = km => Math.round((km / 15) * 60);

// Виклик стрілкової функції для маршрутів з виведенням у консоль
console.log('--- Оцінка часу поїздки ---');
for (const route of routes) {
  const estimatedTime = estimateMinutes(route.km);
  console.log(`Орієнтовний час для «${route.name}» (${route.km} км): ~${estimatedTime} хв`);
}