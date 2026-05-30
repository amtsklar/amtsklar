// AmtsKlar Service Worker — Offline Support
// Copyright © 2025-2026 STAR:HORIZON LTD

const CACHE = 'amtsklar-v1'
const OFFLINE_PAGE = '/offline.html'

// Assets die gecacht werden
const PRECACHE = [
  '/',
  '/analyse',
  '/offline.html',
  '/favicon.svg',
  '/manifest.json',
]

// Installation — Kern-Assets cachen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// Aktivierung — alte Caches löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Fetch — Cache First für Assets, Network First für API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // API-Calls: immer live (kein Cache)
  if (url.pathname.startsWith('/api/')) return

  // Assets (JS/CSS/Fonts): Cache First
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request)
          .then(res => {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(e.request, clone))
            return res
          })
        )
    )
    return
  }

  // HTML-Seiten: Network First, Offline-Fallback
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request)
        .then(cached => cached || caches.match(OFFLINE_PAGE))
      )
  )
})
