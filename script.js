// Практична робота №10. Обрано фреймворк Vue 3: він підключається одним CDN-скриптом
// без Babel і збірки, а його шаблони (v-for, @click, {{ }}) найближчі до звичайного HTML,
// який уже використовується в проєкті

console.log('script.js підключено');

// Середня швидкість велосипедиста для розрахунку часу в дорозі (км/год)
const AVERAGE_SPEED_KMH = 15;

// Компонент картки маршруту RouteCard: отримує всі дані лише через props
const RouteCard = {
  props: {
    name: { type: String, required: true },
    lengthKm: { type: Number, required: true },
    difficulty: { type: String, required: true },
    city: { type: String, default: '' },
    isSelected: { type: Boolean, default: false }
  },
  emits: ['select', 'delete'],
  computed: {
    // Похідне значення варіанта 14: приблизний час у дорозі = lengthKm / 15 км/год
    travelTime() {
      const totalMinutes = Math.round((this.lengthKm / AVERAGE_SPEED_KMH) * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return hours > 0 ? `${hours} год ${minutes} хв` : `${minutes} хв`;
    },
    // CSS-клас кольорової смужки за складністю (easy / medium / hard)
    difficultyClass() {
      const classes = { 'легкий': 'easy', 'середній': 'medium', 'важкий': 'hard' };
      return classes[this.difficulty] || '';
    }
  },
  template: `
    <article class="route-card" :class="[difficultyClass, { selected: isSelected }]"
             @click="$emit('select')">
      <h3>{{ name }}</h3>
      <p>{{ city ? 'Місто: ' + city + ' | ' : '' }}{{ lengthKm }} км, {{ difficulty }}</p>
      <p class="route-time">Час у дорозі: ~{{ travelTime }}</p>
      <button type="button" class="delete-btn" @click.stop="$emit('delete')">Видалити</button>
    </article>`
};

/*
  ПР №11. Модель даних запису веломаршруту (варіант 14):
  {
    id: number | string,  // унікальний ідентифікатор запису (буде keyPath у IndexedDB)
    name: string,         // назва маршруту
    distanceKm: number,   // довжина маршруту в кілометрах
    difficulty: string,   // складність: 'легкий' | 'середній' | 'важкий'
    city?: string         // місто (є лише в маршрутів, отриманих з API)
  }
  id задається так: 1, 2, 3 — для початкових маршрутів,
  Date.now() — для доданих через форму, 'api-N' — для маршрутів з API.
*/

// Ключ, під яким маршрути зберігаються в localStorage
const STORAGE_KEY = 'bikeRoutes';

// Зберігає масив маршрутів у localStorage у вигляді JSON-рядка
function saveToLocalStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  console.log('Маршрути збережено в localStorage:', items.length);
}

// Читає масив маршрутів із localStorage; при пошкоджених даних повертає порожній масив
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

// =====================================================================
// ПР №11. Робота з IndexedDB: маршрути зберігаються в локальній базі
// браузера й відновлюються після перезавантаження сторінки.
// Доступ асинхронний — кожна операція виконується в транзакції
// (readonly для читання, readwrite для запису й видалення) і повертає Promise.
// =====================================================================

/*
  Схема IndexedDB:
  база BikeRoutesDB, версія 1,
  одне об'єктне сховище "routes" з ключем keyPath "id"
  (той самий унікальний id, що й у моделі даних маршруту).
*/
const DB_NAME = 'BikeRoutesDB';
const DB_VERSION = 1;
const STORE_NAME = 'routes';

// Відкриває (або створює) базу IndexedDB і повертає Promise з об'єктом бази.
// onupgradeneeded спрацьовує лише при першому створенні бази або підвищенні версії —
// саме тут створюється об'єктне сховище routes з ключем id.
function openDB() {
  return new Promise((resolve, reject) => {
    // Деякі браузери чи режими приватного перегляду не надають IndexedDB
    if (!window.indexedDB) {
      reject(new Error('IndexedDB не підтримується в цьому браузері'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Створено об'єктне сховище "${STORE_NAME}"`);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------- CRUD-операції з IndexedDB ----------

// Додає новий маршрут у сховище (put створює запис, якщо такого id ще немає)
async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Оновлює наявний маршрут (put з тим самим id перезаписує запис без дублювання)
async function updateItem(item) {
  return addItem(item);
}

// Повертає всі маршрути зі сховища (транзакція лише для читання)
async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Видаляє маршрут зі сховища за його id
async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Одноразова міграція з localStorage в IndexedDB ----------

// Прапорець у localStorage, який показує, що міграцію вже виконано
const MIGRATION_FLAG = 'routesMigrated';

// Переносить маршрути з localStorage в IndexedDB лише один раз:
// якщо сховище routes порожнє, а в localStorage є збережені дані
async function migrateFromLocalStorage() {
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    console.log('Міграцію вже виконано раніше — пропускаємо');
    return;
  }

  const itemsInDb = await getAllItems();
  const savedRoutes = loadFromLocalStorage();

  if (itemsInDb.length === 0 && savedRoutes.length > 0) {
    for (const route of savedRoutes) {
      await addItem(route);
    }
    console.log(`Перенесено маршрутів з localStorage в IndexedDB: ${savedRoutes.length}`);
  }

  // Позначаємо, що міграцію виконано, щоб не повторювати її при наступних запусках
  localStorage.setItem(MIGRATION_FLAG, 'true');
}

// Початкові маршрути, які записуються в IndexedDB, якщо база порожня (перший запуск)
const DEFAULT_ROUTES = [
  { id: 1, name: 'Дніпровська набережна', distanceKm: 12, difficulty: 'легкий' },
  { id: 2, name: 'Голосіївський ліс', distanceKm: 18, difficulty: 'середній' },
  { id: 3, name: 'Труханів острів', distanceKm: 10, difficulty: 'важкий' }
];

// Кореневий застосунок Vue: зберігає масив маршрутів у реактивному стані data()
const app = Vue.createApp({
  components: { RouteCard },
  data() {
    return {
      routes: [],              // заповнюється даними з IndexedDB через getAllItems()
      difficultyFilter: 'all', // значення фільтра складності
      selectedId: null         // id обраного маршруту
    };
  },
    computed: {
    // Список, відфільтрований за складністю (перераховується автоматично)
    filteredRoutes() {
      if (this.difficultyFilter === 'all') {
        return this.routes;
      }
      return this.routes.filter(route => route.difficulty === this.difficultyFilter);
    },
    // Загальна протяжність усіх маршрутів
    totalKm() {
      return this.routes.reduce((sum, route) => sum + route.distanceKm, 0);
    },
    // Об'єкт обраного маршруту
    selectedRoute() {
      return this.routes.find(route => route.id === this.selectedId) || null;
    }
  },
    methods: {
    // Обробник події select від RouteCard: повторний клік знімає вибір
    selectRoute(id) {
      this.selectedId = this.selectedId === id ? null : id;
    },
    // Видаляє маршрут з IndexedDB і перемальовує список з бази
    async deleteRoute(id) {
      try {
        await deleteItem(id);
        if (this.selectedId === id) {
          this.selectedId = null;
        }
        await refreshRoutesFromDb();
      } catch (error) {
        showDbError(error);
      }
    }
  },
  template: `
    <div class="cards" id="routes-list">
      <route-card
        v-for="route in filteredRoutes"
        :key="route.id"
        :name="route.name"
        :length-km="route.distanceKm"
        :difficulty="route.difficulty"
        :city="route.city"
        :is-selected="route.id === selectedId"
        @select="selectRoute(route.id)"
        @delete="deleteRoute(route.id)"
      ></route-card>
    </div>
    <p id="total-km">Загальна протяжність усіх маршрутів: {{ totalKm }} км</p>
    <p v-if="selectedRoute" class="selected-info">
      Обрано маршрут «{{ selectedRoute.name }}» — {{ selectedRoute.distanceKm }} км
    </p>`
});

// Монтування застосунку в контейнер #app
const vm = app.mount('#app');

// Посилання на реактивний масив маршрутів зі стану Vue (зміни через нього перемальовують список)
const routes = vm.routes;

console.log('Дані маршрутів:', routes);

// Обчислює сумарну дистанцію всіх маршрутів циклом for та виводить результат
function calculateTotalDistance(routesList) {
  let totalKm = 0;

  for (let i = 0; i < routesList.length; i++) {
    totalKm += routesList[i].distanceKm;
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

    console.log(`Маршрут "${route.name}" (${route.distanceKm} км, ${route.difficulty}): ${recommendation}`);
  }
}
// Виклик функції
classifyRoutes(routes);


// Стрілкова функція для розрахунку орієнтовного часу поїздки за середньої швидкості 15 км/год
const estimateMinutes = km => Math.round((km / 15) * 60);

// Виклик стрілкової функції для маршрутів з виведенням у консоль
console.log('--- Оцінка часу поїздки ---');
for (const route of routes) {
  const estimatedTime = estimateMinutes(route.distanceKm);
  console.log(`Орієнтовний час для «${route.name}» (${route.distanceKm} км): ~${estimatedTime} хв`);
}

/*
  ПР №10: ручний DOM-рендер списку з практикуму 7 більше не використовується.
  Його замінено компонентом Vue RouteCard (v-for з :key) у кореневому застосунку,
  тому Vue сам перемальовує картки при кожній зміні масиву routes.

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

    card.dataset.distanceKm = route.distanceKm;

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
    details.textContent = `${cityText}${route.distanceKm} км, ${route.difficulty}`;

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
*/

// Вибір форми та підписка на подію submit
const routeForm = document.querySelector('#add-route-form');
const nameInput = document.querySelector('#route-name');
const lengthInput = document.querySelector('#route-length');
const difficultySelect = document.querySelector('#route-difficulty');

routeForm.addEventListener('submit', async event => {
  //Скасування стандартного перезавантаження сторінки
  event.preventDefault();

  //Зчитування значень полів форми
  const name = nameInput.value.trim();
  const distanceKm = Number(lengthInput.value);
  const difficulty = difficultySelect.value;

  //Створення нового об'єкта маршруту з унікальним id
  const newRoute = { id: Date.now(), name, distanceKm, difficulty };
  try {
    await addItem(newRoute);       // Записуємо маршрут в IndexedDB
    await refreshRoutesFromDb();   // Перемальовуємо список з даних бази
  } catch (error) {
    showDbError(error);
    return;
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
  // Передаємо значення фільтра в реактивний стан Vue — computed filteredRoutes оновиться сам
  vm.difficultyFilter = difficultyFilter.value;
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
        id: `api-${user.id}`,            // Унікальний id для :key у v-for
        name: user.name,                 // Беремо назву чистою
        city: user.address.city,         // Зберігаємо місто в окреме поле
        distanceKm: user.id * 5,                 // Обчислюємо км з поля id (з API)
        difficulty: difficulties[user.id % 3] // Обчислюємо складність з поля id
      }));

      // Дедуплікація: записуємо в IndexedDB лише ті маршрути, яких ще немає
      for (const apiRoute of apiRoutes) {
        const exists = routes.some(r => r.name === apiRoute.name);
        if (!exists) {
          await addItem(apiRoute);
        }
      }
      await refreshRoutesFromDb(); // Перемальовуємо список з даних бази

    } catch (error) {
      //Обробка помилки: виведення повідомлення користувачу та логування в консоль
      showError('Не вдалося завантажити маршрути з сервера. Перевірте з’єднання та спробуйте пізніше.');
      console.error('Помилка запиту:', error);
    } finally {
    // Крок 7. Приховування стану завантаження незалежно від результату
    showLoading(false);
  }
}
// Читає всі маршрути з IndexedDB і передає їх у реактивний масив Vue для рендеру
async function refreshRoutesFromDb() {
  const items = await getAllItems();
  routes.splice(0, routes.length, ...items); // замінюємо вміст того самого масиву
  console.log('Список оновлено з IndexedDB:', items.length);
}

// Запуск застосунку: міграція → початкові дані (якщо база порожня) → рендер з IndexedDB → API
async function initApp() {
  await migrateFromLocalStorage();

  const items = await getAllItems();
  if (items.length === 0) {
    for (const route of DEFAULT_ROUTES) {
      await addItem(route);
    }
  }

  await refreshRoutesFromDb();
  await loadRoutesFromApi();
}

// Показує користувачу зрозуміле повідомлення, якщо IndexedDB недоступна,
// а технічні деталі помилки виводить у консоль
function showDbError(error) {
  console.error('Помилка IndexedDB:', error);
  const dbError = document.querySelector('#db-error');
  if (dbError) {
    dbError.textContent = 'Локальне сховище недоступне (можливо, увімкнено приватний режим перегляду). ' +
      'Маршрути відображаються, але зміни не збережуться після перезавантаження сторінки.';
    dbError.hidden = false;
  }
}

// Запуск застосунку з обробкою помилки відкриття бази
initApp().catch(error => {
  showDbError(error);
  // Резервний варіант: показуємо маршрути з localStorage або початкові
  const savedRoutes = loadFromLocalStorage();
  routes.splice(0, routes.length, ...(savedRoutes.length > 0 ? savedRoutes : DEFAULT_ROUTES));
});

// Прив'язка повторного виклику loadRoutesFromApi() до кнопки «Оновити»
if (reloadBtn) {
  reloadBtn.addEventListener('click', () => {
    loadRoutesFromApi();
  });
}

// =====================================================================
// ПР №12. Анімація та Canvas (варіант 14): профіль висоти маршруту.
// Обрано Canvas API, а не CSS-анімацію: лінійний графік із довільною кількістю
// точок висоти неможливо зібрати з готових DOM-елементів, тому його малюємо
// на растровій поверхні <canvas> і анімуємо через requestAnimationFrame.
// Графік будується за даними обраного маршруту (distanceKm, difficulty, id).
// =====================================================================

// Полотно профілю висоти та його 2D-контекст для малювання
const elevationCanvas = document.querySelector('#elevation-chart');
const ctx = elevationCanvas.getContext('2d');

// Перевірка кроку 3: тестове малювання (далі полотно перемальовує drawPlaceholder())
ctx.fillStyle = '#d8e6c8';
ctx.fillRect(0, 0, elevationCanvas.width, elevationCanvas.height);
ctx.fillStyle = '#1b4332';
ctx.font = '16px sans-serif';
ctx.fillText('Canvas готовий до малювання', 20, 30);

// ---------- Крок 4. Дані та малювання профілю висоти ----------

const BASE_ELEVATION_M = 100;   // умовна висота старту маршруту, м
// Перепад висот залежить від складності маршруту
const AMPLITUDE_BY_DIFFICULTY = { 'легкий': 15, 'середній': 40, 'важкий': 80 };

// Перетворює id маршруту на число-«зерно», щоб профіль одного маршруту завжди був однаковим
function idToSeed(id) {
  return String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

// Простий генератор псевдовипадкових чисел 0..1 з фіксованим зерном
function createRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Формує умовні точки висоти вздовж маршруту з його полів distanceKm, difficulty та id
function generateElevationPoints(route) {
  const count = Math.min(Math.max(Math.round(route.distanceKm) + 1, 6), 40);
  const amplitude = AMPLITUDE_BY_DIFFICULTY[route.difficulty] || 30;
  const random = createRandom(idToSeed(route.id));

  const points = [];
  let elevation = BASE_ELEVATION_M;
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      elevation += (random() - 0.5) * amplitude;  // підйом або спуск на ділянці
      elevation = Math.min(Math.max(elevation, BASE_ELEVATION_M - amplitude / 2), BASE_ELEVATION_M + amplitude);
    }
    points.push({
      distanceKm: (route.distanceKm * i) / (count - 1),
      elevation: Math.round(elevation)
    });
  }
  return points;
}

// Відступи області графіка всередині полотна
const CHART_PADDING = { top: 40, right: 20, bottom: 35, left: 50 };

// Малює профіль висоти маршруту; progress (0..1) — яку частину лінії вже намальовано
function drawElevationProfile(route, progress = 1) {
  const points = generateElevationPoints(route);
  const width = elevationCanvas.width;
  const height = elevationCanvas.height;
  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const elevations = points.map(p => p.elevation);
  const minElevation = Math.min(...elevations) - 5;
  const maxElevation = Math.max(...elevations) + 5;

  // Перетворення «км / метри» у пікселі полотна
  const toX = km => CHART_PADDING.left + (km / route.distanceKm) * chartWidth;
  const toY = m => CHART_PADDING.top + (1 - (m - minElevation) / (maxElevation - minElevation)) * chartHeight;

  ctx.clearRect(0, 0, width, height);

  // Заголовок графіка
  ctx.fillStyle = '#1b4332';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Профіль висоти: ${route.name}`, CHART_PADDING.left, 22);
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`перепад ${Math.max(...elevations) - Math.min(...elevations)} м`, width - CHART_PADDING.right, 22);

  // Горизонтальні лінії сітки з підписами висоти
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillStyle = '#555';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const m = minElevation + ((maxElevation - minElevation) * i) / 4;
    const y = toY(m);
    ctx.beginPath();
    ctx.moveTo(CHART_PADDING.left, y);
    ctx.lineTo(width - CHART_PADDING.right, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(m)} м`, CHART_PADDING.left - 6, y + 4);
  }

  // Підписи відстані під графіком
  ctx.textAlign = 'center';
  [0, route.distanceKm / 2, route.distanceKm].forEach(km => {
    ctx.fillText(`${Math.round(km * 10) / 10} км`, toX(km), height - 12);
  });

  // Ламана лінія профілю до поточного progress (остання ділянка — частково)
  const lastIndex = (points.length - 1) * progress;
  const fullSegments = Math.floor(lastIndex);
  const visible = points.slice(0, fullSegments + 1).map(p => ({ x: toX(p.distanceKm), y: toY(p.elevation) }));
  if (fullSegments < points.length - 1) {
    const a = points[fullSegments];
    const b = points[fullSegments + 1];
    const t = lastIndex - fullSegments;
    visible.push({
      x: toX(a.distanceKm + (b.distanceKm - a.distanceKm) * t),
      y: toY(a.elevation + (b.elevation - a.elevation) * t)
    });
  }

  // Заливка під лінією
  ctx.beginPath();
  ctx.moveTo(visible[0].x, CHART_PADDING.top + chartHeight);
  visible.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(visible[visible.length - 1].x, CHART_PADDING.top + chartHeight);
  ctx.closePath();
  ctx.fillStyle = 'rgba(45, 106, 79, 0.2)';
  ctx.fill();

  // Сама лінія профілю
  ctx.beginPath();
  visible.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = 3;
  ctx.stroke();

  // «Велосипедист» — точка на кінці намальованої частини лінії
  const tip = visible[visible.length - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();
}

// ---------- Крок 5. Цикл анімації через requestAnimationFrame ----------

const ANIMATION_DURATION_MS = 2000;  // тривалість промальовування графіка
let animationId = null;              // id поточного кадру (для cancelAnimationFrame)
let animationStart = null;           // час початку анімації
let animatedRoute = null;            // маршрут, профіль якого анімується

// Один кадр анімації: оновлює progress, очищує полотно й перемальовує графік
function drawFrame(timestamp) {
  if (animationStart === null) {
    animationStart = timestamp;
  }
  const progress = Math.min((timestamp - animationStart) / ANIMATION_DURATION_MS, 1);

  drawElevationProfile(animatedRoute, progress);  // всередині викликається clearRect

  if (progress < 1) {
    animationId = requestAnimationFrame(drawFrame);  // наступний кадр
  } else {
    animationId = null;                               // анімацію завершено
  }
}

// Запускає анімацію профілю для маршруту з початку
function startElevationAnimation(route) {
  stopElevationAnimation();
  animatedRoute = route;
  animationStart = null;
  animationId = requestAnimationFrame(drawFrame);
}

// Зупиняє анімацію, якщо вона ще триває
function stopElevationAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}


// ---------- Крок 6. Прив'язка анімації до дій користувача ----------

const detailsText = document.querySelector('#details-text');
const DETAILS_HINT = 'Оберіть маршрут зі списку, щоб переглянути його профіль висоти.';

// Порожній стан полотна, коли жоден маршрут не обрано
function drawPlaceholder() {
  ctx.clearRect(0, 0, elevationCanvas.width, elevationCanvas.height);
  ctx.fillStyle = '#6b7280';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Оберіть маршрут у списку, щоб побачити профіль висоти',
    elevationCanvas.width / 2, elevationCanvas.height / 2);
}

// Показує профіль обраного маршруту (з анімацією) або порожній стан
function showRouteProfile(route) {
  if (!route) {
    stopElevationAnimation();
    animatedRoute = null;
    detailsText.textContent = DETAILS_HINT;
    drawPlaceholder();
  } else {
    detailsText.textContent =
      `Маршрут «${route.name}»: ${route.distanceKm} км, ${route.difficulty}. Нижче — умовний профіль висоти.`;
    startElevationAnimation(route);
  }
  updateAnimationControls();
}

// Реакція на вибір маршруту кліком по картці (або на видалення обраного маршруту)
vm.$watch(
  () => (vm.selectedRoute ? vm.selectedRoute.id : null),
  () => showRouteProfile(vm.selectedRoute)
);

// Реакція на додавання маршруту: новий маршрут одразу обирається й анімується його профіль
vm.$watch(
  () => routes.map(route => route.id),
  (newIds, oldIds) => {
    const addedIds = newIds.filter(id => !oldIds.includes(id));
    if (oldIds.length > 0 && addedIds.length === 1) {
      vm.selectedId = addedIds[0];
    }
  }
);

// ---------- Крок 7. Кнопки керування анімацією ----------

const replayAnimationBtn = document.querySelector('#replay-animation-btn');
const stopAnimationBtn = document.querySelector('#stop-animation-btn');

// Кнопки активні лише тоді, коли обрано маршрут
function updateAnimationControls() {
  const hasRoute = animatedRoute !== null;
  replayAnimationBtn.disabled = !hasRoute;
  stopAnimationBtn.disabled = !hasRoute;
}

// «Повторити анімацію» — промальовує профіль обраного маршруту з початку
replayAnimationBtn.addEventListener('click', () => {
  if (animatedRoute) {
    startElevationAnimation(animatedRoute);
  }
});

// «Зупинити» — зупиняє анімацію на поточному кадрі
stopAnimationBtn.addEventListener('click', () => {
  stopElevationAnimation();
});

// Початковий стан полотна до вибору маршруту
detailsText.textContent = DETAILS_HINT;
drawPlaceholder();

// ---------- Крок 8. Зупинка анімації, коли полотно поза екраном ----------

let isCanvasVisible = false;     // чи видно полотно у вікні браузера
let replayWhenVisible = false;   // чи треба програти анімацію, коли полотно з'явиться

// IntersectionObserver повідомляє, коли полотно з'являється на екрані або зникає з нього
const canvasObserver = new IntersectionObserver(entries => {
  isCanvasVisible = entries[0].isIntersecting;

  if (!isCanvasVisible && animationId !== null) {
    // Полотно прокрутили за межі екрана — немає сенсу малювати кадри, яких ніхто не бачить
    stopElevationAnimation();
    replayWhenVisible = true;
    console.log('Полотно поза екраном — анімацію зупинено (cancelAnimationFrame)');
  } else if (isCanvasVisible && replayWhenVisible && animatedRoute) {
    // Полотно знову видно — програємо профіль з початку
    replayWhenVisible = false;
    startElevationAnimation(animatedRoute);
    console.log('Полотно знову на екрані — анімацію запущено');
  }
});
canvasObserver.observe(elevationCanvas);

// Якщо маршрут обрали, коли полотна не видно, анімацію відкладаємо до його появи на екрані
vm.$watch(
  () => (vm.selectedRoute ? vm.selectedRoute.id : null),
  () => {
    if (!isCanvasVisible && animationId !== null) {
      stopElevationAnimation();
      replayWhenVisible = true;
      console.log('Полотно поза екраном — анімацію відкладено');
    }
  }
);
