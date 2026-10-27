// Permite usar la app sin conexión: la página se pide primero a la red y el resto de archivos sale de la caché
const CACHE = 'lobo-narrador-v5'
const CARDS = [
  'actor', 'albino_wolf', 'angel', 'bear_tamer', 'cupid', 'devoted_servant', 'elder', 'fierce_wolf', 'flutist', 'fox',
  'hunter', 'infect_father', 'little_girl', 'protector', 'pyromaniac', 'raven', 'rusty_knight', 'scapegoat', 'sectarian',
  'seer', 'stuttering_judge', 'thief', 'three_brothers', 'two_sisters', 'village_fool', 'villager', 'werewolf', 'wild_child',
  'witch', 'wolf_hound',
]
const STATIC_FILES = ['./', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', ...CARDS.map((card) => `cards/${card}.webp?v=5`)]

// Los archivos de la app llevan un código en el nombre que cambia en cada versión: se leen de la página y de su CSS
async function appFiles() {
  const html = await (await fetch('./', { cache: 'no-cache' })).text()
  const files = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((url) => !url.startsWith('data:') && !url.startsWith('http'))
  const fonts = []
  for (const css of files.filter((url) => url.endsWith('.css'))) {
    const text = await (await fetch(new URL(css, self.registration.scope))).text()
    fonts.push(...[...text.matchAll(/url\(([^)]*-latin-[^)]*\.woff2)\)/g)].map((match) => new URL(match[1].replace(/["']/g, ''), new URL(css, self.registration.scope)).href))
  }
  return [...files, ...fonts]
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(STATIC_FILES)
    await cache.addAll(await appFiles())
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        const cache = await caches.open(CACHE)
        cache.put('./', response.clone())
        return response
      } catch {
        return (await caches.match('./', { ignoreVary: true })) ?? Response.error()
      }
    })())
    return
  }
  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreVary: true })
    if (cached) return cached
    const response = await fetch(request)
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
    return response
  })())
})
