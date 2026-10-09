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
    // Якщо у маршруту є поле city (з API), виводимо його
    const cityText = route.city ? `Місто: ${route.city} | ` : '';
    details.textContent = `${cityText}${route.km} км, ${route.difficulty}`;

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

// Вибір форми та підписка на подію submit
const routeForm = document.querySelector('#add-route-form');
const nameInput = document.querySelector('#route-name');
const lengthInput = document.querySelector('#route-length');
const difficultySelect = document.querySelector('#route-difficulty');

routeForm.addEventListener('submit', event => {
  //Скасування стандартного перезавантаження сторінки
  event.preventDefault();

  //Зчитування значень полів форми
  const name = nameInput.value.trim();
  const km = Number(lengthInput.value);
  const difficulty = difficultySelect.value;

  //Створення нового об'єкта та додавання в масив routes
  const newRoute = { name, km, difficulty };
  routes.push(newRoute);

  //Перемальовування списку маршрутів та оновлення підсумку
  renderRoutes(routes);
  if (totalKmElement) {
    const totalKm = calculateTotalDistance(routes);
    totalKmElement.textContent = `Загальна протяжність усіх маршрутів: ${totalKm} км`;
  }

  //Очищення полів форми після успішного додавання
  routeForm.reset();
});

//Додаткова клієнтська валідація поля довжини маршруту (lengthKm)
lengthInput.addEventListener('input', () => {
  const value = Number(lengthInput.value);

  if (lengthInput.value !== '' && value > 300) {
    lengthInput.setCustomValidity('Довжина міського веломаршруту не може перевищувати 300 км');
  } else {
    lengthInput.setCustomValidity(''); // Повернення поля у валідний стан
  }
});


// Фільтрація списку маршрутів за обраною складністю (подія change)
const difficultyFilter = document.querySelector('#difficulty-filter');

difficultyFilter.addEventListener('change', () => {
  const selectedDifficulty = difficultyFilter.value;

  if (selectedDifficulty === 'all') {
    renderRoutes(routes);
  } else {
    const filteredRoutes = routes.filter(route => route.difficulty === selectedDifficulty);
    renderRoutes(filteredRoutes);
  }
});

// Ендпоінт варіанта 14: JSONPlaceholder Users
const API_URL = 'https://jsonplaceholder.typicode.com/users';

const loadingStatus = document.querySelector('#loading-status');
const reloadBtn = document.querySelector('#reload-api-btn');

// Функція для показу/приховування стану завантаження
function showLoading(isLoading) {
  if (loadingStatus) {
    loadingStatus.hidden = !isLoading;
  }
  if (reloadBtn) {
    reloadBtn.disabled = isLoading;
  }
}

const errorMessage = document.querySelector('#error-message');

// Функція для показу або приховування повідомлення про помилку на сторінці
function showError(message) {
  if (!errorMessage) return;
  if (message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  } else {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }
}

// Асинхронна функція для завантаження маршрутів із зовнішнього API,
// https://jsonplaceholder.typicode.com/users
async function loadRoutesFromApi() {
  //Показ стану завантаження перед запитом
  showLoading(true);
  showError('');

  try {
      //Виконання HTTP-запиту через Fetch API та очікування відповіді
      const response = await fetch(API_URL);

      //Перевірка HTTP-статусу відповіді сервера
      if (!response.ok) {
        throw new Error(`Сервер відповів кодом ${response.status}`);
      }

      //Розбір тіла відповіді як JSON
      const data = await response.json();
      console.log('Отримані дані з API:', data);

      //Адаптація даних API під структуру маршруту та виведення в DOM
      const difficulties = ['легкий', 'середній', 'важкий'];
      const apiRoutes = data.slice(0, 5).map(user => ({
        name: user.name,                 // Беремо назву чистою
        city: user.address.city,         // Зберігаємо місто в окреме поле
        km: user.id * 5,                 // Обчислюємо км з поля id (з API)
        difficulty: difficulties[user.id % 3] // Обчислюємо складність з поля id
      }));

      // Дедуплікація: додаємо лише тих, кого ще немає
      apiRoutes.forEach(apiRoute => {
        const exists = routes.some(r => r.name === apiRoute.name);
        if (!exists) {
          routes.push(apiRoute);
        }
      });

      renderRoutes(routes);

      if (totalKmElement) {
        const totalKm = calculateTotalDistance(routes);
        totalKmElement.textContent = `Загальна протяжність усіх маршрутів: ${totalKm} км`;
      }

    } catch (error) {
      //Обробка помилки: виведення повідомлення користувачу та логування в консоль
      showError('Не вдалося завантажити маршрути з сервера. Перевірте з’єднання та спробуйте пізніше.');
      console.error('Помилка запиту:', error);
    } finally {
    // Крок 7. Приховування стану завантаження незалежно від результату
    showLoading(false);
  }
}
// Виклик функції для завантаження даних
loadRoutesFromApi();

// Прив'язка повторного виклику loadRoutesFromApi() до кнопки «Оновити»
if (reloadBtn) {
  reloadBtn.addEventListener('click', () => {
    loadRoutesFromApi();
  });
}