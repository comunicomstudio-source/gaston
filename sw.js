// Service worker de Gastón.
// Su trabajo: guardar la "cáscara" de la app para que abra al instante
// y funcione aunque no haya conexión.

// Sube este número cuando cambies los archivos cacheados (fuerza actualización).
const VERSION = "gaston-v18";

// Archivos que forman la cáscara de la app.
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
];

// 1) Al instalar: guardamos la cáscara en caché.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS))
  );
  // Activar la versión nueva sin esperar a cerrar todas las pestañas.
  self.skipWaiting();
});

// 2) Al activar: borramos cachés de versiones antiguas.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))
      )
    )
  );
  self.clients.claim();
});

// 3) Al pedir algo:
//    - Páginas (navegación / HTML): primero la red, así siempre ves la
//      versión más nueva; si no hay internet, tiramos de la caché.
//    - El resto (iconos, manifest): primero caché, que es rápido y estable.
self.addEventListener("fetch", (evento) => {
  // Solo gestionamos peticiones GET (no fotos enviadas, etc.).
  if (evento.request.method !== "GET") return;

  const esPagina =
    evento.request.mode === "navigate" ||
    evento.request.destination === "document";

  if (esPagina) {
    evento.respondWith(
      fetch(evento.request)
        .then((red) => {
          // Guardamos una copia fresca para poder abrir sin conexión.
          const copia = red.clone();
          caches.open(VERSION).then((cache) => cache.put(evento.request, copia));
          return red;
        })
        .catch(() => caches.match(evento.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((enCache) => enCache || fetch(evento.request))
  );
});
