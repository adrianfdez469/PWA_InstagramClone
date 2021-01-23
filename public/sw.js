importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var dirHostBackEnd = 'http://localhost:3000';
//var dirHostBackEnd = 'http://192.168.42.5:3000';

var CACHE_STATIC_VERSION = 'static-v3';
var CACHE_DYNAMIC_VERSION = 'dynamic-v6';

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_VERSION)
            .then(function (cache) {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll([
                    '/',
                    '/index.html',
                    '/offline.html',
                    '/src/js/app.js',
                    '/src/js/feed.js',
                    '/src/js/idb.js',
                    '/src/js/utility.js',
                    '/src/js/material.min.js',
                    // -------
                    // Los Polifills se necesitan en navegadores viejos que no soporten ciertas caracteristicas, estos navegadores viejos tampoco soportan 
                    // los service workers, por lo tanto, no tiene sentido cachear los polifills ya que los navegadores actuales que soporten service workers
                    // si soportan las promises y fetch api. Los que se puede hacer es cargar estos bajo demanda en dependencia de la version del navegador, etc.
                    // Sin embargo se agregan para acelerar la carga inicial de la aplicacion ya que en el curso no se van a cargar dinamicamente. 
                    '/src/js/promise.js',
                    '/src/js/fetch.js',
                    // -------

                    '/src/css/app.css',
                    '/src/css/feed.css',

                    '/src/images/main-image.jpg',

                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
                ])
            })
    )
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activating Service Worker ...', event);
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.map(function (key) {
                    if (key !== CACHE_STATIC_VERSION && key !== CACHE_DYNAMIC_VERSION) {
                        console.log('[Service Worker] Removing old cahce.', key);
                        return caches.delete(key)
                    }
                }))
            })
    )
    return self.clients.claim();
});

// ----------- Strategies ----------

self.addEventListener('fetch', event => {
    //var url = 'https://pwagram-b7fe6.firebaseio.com/posts.json';
    var url = `${dirHostBackEnd}/posts`;
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            fetch(event.request)
                .then(resp => {
                    var clonedResponse = resp.clone();
                    clearAllData('posts')
                        .then(() => {
                            return clonedResponse.json()
                        })
                        .then(data => {
                            for (const key in data) {
                                writeData('posts', data[key]);
                            }
                        })
                    return resp;
                })
                .catch(err => { })
        )
    } else if(event.request.method === 'GET'){
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(resp => {
                                    return caches.open(CACHE_DYNAMIC_VERSION)
                                        .then(cache => {
                                            cache.put(event.request, resp.clone());
                                            return resp;
                                        });
                                
                            })
                            .catch(err => {
                                if (event.request.headers.get('accept').includes('text/html')) {
                                    return caches.match('/offline.html');
                                }
                            })
                    }
                })
        )
    }
});

/*self.addEventListener('fetch', function(event){
    //console.log('[Service Worker] Fecthing something ...', event);
    event.respondWith(
        caches.match(event.request)
            .then(function(response){
                if(response){
                    return response;
                }else{
                    return fetch(event.request)
                        .then(function(resp){
                            return caches.open(CACHE_DYNAMIC_VERSION)
                                .then(function(cache){
                                    cache.put(event.request.url, resp.clone());
                                    return resp;
                                })
                        })
                        .catch(function(err){
                            return caches.open(CACHE_STATIC_VERSION)
                                        .then(cache => {
                                            return cache.match('/offline.html');
                                        })
                        })
                }
            })
    );
});*/

// Cache, then Network
/*self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.open(CACHE_DYNAMIC_VERSION)
            .then(cache => {
                return fetch(event.request)
                    .then(res => {
                        cache.put(event.request, res.clone());
                        return res;
                    })
            })
    );
});*/

// Cache-only
/*self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
    )
});*/

// Network-only
/*self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
    )
});*/

// Network with Cache Fallback
/*self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                caches.open(CACHE_DYNAMIC_VERSION)
                    .then(cache => {
                        cache.put(event.request.url, response.clone());
                        return response;
                    })
            })
            .catch(err => {
                return caches.match(event.request);
            })
    );
})*/

// Cache then network
//self.addEventListener('fetch', )

self.addEventListener('sync', event => {
    console.log('[Service Worker] Background syncing', event);
    if(event.tag === 'sync-new-posts'){
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntil(
            readAllData('sync-posts')
                .then(data => {
                    console.log('Data to sync');
                    console.log(data);


                    
                    for (const dt of data) {

                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.latitude);
                        postData.append('rawLocationLong', dt.rawLocation.longitud);
                        postData.append('rawLocationAlt', dt.rawLocation.altitude);
                        postData.append('file', dt.picture, dt.id + '.png');

                        fetch(`${dirHostBackEnd}/posts`, {
                            method: 'POST',
                            body: postData
                        })
                        .then(res => {
                            console.log('Sent data', res);
                            if(res.ok){
                                deleteItemFromData('sync-posts', dt.id); //Itn's working correctly!
                            }
                        })
                        .catch(err => {
                            console.log('Error while sending data', err);
                        })
                    }
                })
        )
    }
})



self.addEventListener('notificationclick', event => {
    var notification = event.notification;
    var action = event.action;

    console.log(notification);
    if(action === "confirm"){
        console.log('Confirm was chosen');
        notification.close();
    }else{
        console.log(action);
        event.waitUntil(
            clients.matchAll()
                .then(clis => {
                    var client = clis.find(c => c.visibilityState === 'visible');
                    if(client !== undefined){
                        client.navigate(notification.data.url)
                    }else{
                        clients.openWindow(notification.data.url);
                    }
                    notification.close();
                })
        )
    }
})

self.addEventListener('notificationclose', event => {
    console.log('Notification was close', event);
    
})

self.addEventListener('push', event => {
    
    let data = {title: 'New!', content: "Wohooo"};
    if(event.data){
        data = JSON.parse(event.data.text()); 
    }

    const options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        vibrate: [100],
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
})