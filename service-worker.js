// Название кэша. Измените его, если хотите принудительно обновить кэш у пользователей.
const CACHE_NAME = 'p2p-calc-v1.1';

// Файлы, которые нужно закэшировать при установке
const FILES_TO_CACHE = [
  '/',
  'index.html', // Если ваш главный файл называется по-другому, измените здесь
  // Добавьте сюда другие файлы, если они есть (например, 'style.css')
  // Иконки тоже стоит добавить:
  'icon-192.png'
  // 'icon-512.png' // Можете добавить и большую иконку
];

// 1. Установка Service Worker (Кэшируем файлы)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Кэширование основных файлов');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// 2. Активация Service Worker (Чистим старый кэш)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Если имя кэша не совпадает с текущим, удаляем его
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Удаление старого кэша', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// 3. Перехват запросов (Fetch)
// Стратегия: "Network Falling Back to Cache" (Сначала сеть, потом кэш)
// Это хорошо для динамичных приложений, но для простого калькулятора
// лучше "Cache First" (Сначала кэш, потом сеть)

// Используем "Cache First" - идеально для приложения-калькулятора.
// Он будет загружаться мгновенно из кэша.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если файл есть в кэше, отдаем его
        if (response) {
          return response;
        }
        
        // Если файла нет в кэше, идем в сеть
        return fetch(event.request).then(
          (response) => {
            // Если запрос неудачный, просто возвращаем ошибку
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // (Опционально) Если мы получили что-то новое, кэшируем это
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
