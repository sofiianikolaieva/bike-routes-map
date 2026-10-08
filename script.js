console.log('script.js підключено');

// Масив об'єктів веломаршрутів міста з назвою, кілометражем та рівнем складності
const routes = [
  { name: 'Дніпровська набережна', km: 12, difficulty: 'легкий' },
  { name: 'Голосіївський ліс', km: 18, difficulty: 'середній' },
  { name: 'Труханів острів', km: 10, difficulty: 'важкий' }
];

console.log('Дані маршрутів:', routes);

// Обчислює сумарну дистанцію всіх маршрутів циклом for та виводить результат
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


// Класифікує кожен маршрут за складністю за допомогою if/else та формує рекомендацію
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


// Стрілкова функція для розрахунку орієнтовного часу поїздки за середньої швидкості 15 км/год
const estimateMinutes = km => Math.round((km / 15) * 60);

// Виклик стрілкової функції для маршрутів з виведенням у консоль
console.log('--- Оцінка часу поїздки ---');
for (const route of routes) {
  const estimatedTime = estimateMinutes(route.km);
  console.log(`Орієнтовний час для «${route.name}» (${route.km} км): ~${estimatedTime} хв`);
}

//Динамічне видалення статичного прикладу картки через DOM API
const staticCard = document.querySelector('#routes-list .route-card');
if (staticCard) {
  staticCard.remove();
  console.log('Статичний приклад картки успішно видалено з DOM');
}

//Вибір контейнера для списку маршрутів
const routesContainer = document.querySelector('#routes-list');
console.log('Контейнер списку маршрутів:', routesContainer);

//Функція для динамічного відображення списку маршрутів
function renderRoutes(routesList) {
  routesContainer.innerHTML = '';

  routesList.forEach(route => {
    const card = document.createElement('article');
    card.classList.add('route-card');

    card.dataset.km = route.km;

    if (route.difficulty === 'легкий') {
      card.classList.add('easy');
    } else if (route.difficulty === 'середній') {
      card.classList.add('medium');
    } else if (route.difficulty === 'важкий') {
      card.classList.add('hard');
    }

    const title = document.createElement('h3');
    title.textContent = route.name;

    const details = document.createElement('p');
    details.textContent = `${route.km} км, ${route.difficulty}`;

    card.append(title, details);

    // Додавання готової картки у контейнер списку
    routesContainer.append(card);
  });
}

renderRoutes(routes);

const totalKmElement = document.querySelector('#total-km');
if (totalKmElement) {
  const totalKm = calculateTotalDistance(routes);
  totalKmElement.textContent = `Загальна протяжність усіх маршрутів: ${totalKm} км`;
}

