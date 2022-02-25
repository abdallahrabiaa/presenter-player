const dependencies = ["/index.html", "dist/reset.css", "dist/reveal.css", "dist/theme/sky.css",
    "https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css", "style.css", "/appIcon.png",
    "node_modules/axios/dist/axios.min.js",
    "plugin/highlight/monokai.css",
    "node_modules/reveal.js-menu/menu.js",
    "node_modules/qrcodejs/qrcode.min.js",
    "sw.register.js",
    "js/handle.js"
    , "dist/reveal.js",
    "plugin/notes/notes.js",
    "plugin/markdown/markdown.js",
    "plugin/highlight/highlight.js"


];
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open("assets").then(cache => {
            cache.addAll(dependencies);
        })
    );
});

// State while revalidate strategy
self.addEventListener('fetch', event => {
    if (event.request.url.startsWith('http')) {
        console.log(event.request)
        event.waitUntil(
            event.respondWith(
                caches.match(event.request)
                    .then(cachedResponse => {
                        // Even if the response is in the cache, we fetch it
                        // and update the cache for future usage
                        const fetchPromise = fetch(event.request).then(
                            networkResponse => {
                                caches.open("assets").then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                            }).catch(e => caches.match(event.request).then(res => res))
                        // We use the currently cached version if it's there
                        return cachedResponse || fetchPromise; // cached or a network fetch
                    })
            )

        )

    }

}); 