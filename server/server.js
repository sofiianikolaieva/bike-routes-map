// ПР №14. Найпростіший сервер на Node.js + Express для застосунку «Карта веломаршрутів».
// Роздає JSON-дані маршрутів через власні ендпоінти /api/routes замість зовнішнього API.

const express = require('express');
const path = require('path');

// Локальні дані маршрутів (крок 4) — масив об'єктів у тій самій формі, що й у клієнті
const routes = require('./data/routes.json');

const app = express();
// ПР 15: на хостингу (Render) порт задає змінна середовища PORT, локально — 3000
const PORT = process.env.PORT || 3000;

// ---------- Крок 5. Ендпоінт списку маршрутів ----------
// GET /api/routes — повертає весь масив маршрутів у форматі JSON
// (res.json сам ставить заголовок Content-Type: application/json і статус 200)
app.get('/api/routes', (req, res) => {
  res.json(routes);
});

// ---------- Крок 6. Ендпоінт деталей маршруту ----------
// GET /api/routes/:id — повертає один маршрут або код 404, якщо такого id немає.
// req.params.id — це рядок, тому порівнюємо з String(route.id)
app.get('/api/routes/:id', (req, res) => {
  const route = routes.find(r => String(r.id) === req.params.id);
  if (!route) {
    return res.status(404).json({ error: `Маршрут з id ${req.params.id} не знайдено` });
  }
  res.json(route);
});

// Будь-який інший шлях /api/... — теж 404 з JSON-повідомленням
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ендпоінт ${req.originalUrl} не існує` });
});

// ---------- Крок 7. Роздача статичних файлів застосунку ----------
// Корінь проєкту (папка над server/): index.html, css/, script.js, assets/.
// Клієнт і API працюють на одному порту, тому немає проблем із CORS.
const clientDir = path.join(__dirname, '..');

// Серверний код через браузер не віддаємо
app.use('/server', (req, res) => res.status(404).send('Не знайдено'));

// express.static роздає файли з теки клієнта (приховані файли на кшталт .git — ні)
app.use(express.static(clientDir));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
