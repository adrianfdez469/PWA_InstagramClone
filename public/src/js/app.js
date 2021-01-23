var dirHostBackEnd = 'http://localhost:3000';
//var dirHostBackEnd = 'http://192.168.42.5:3000';

var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if(!window.Promise){
    window.Promise = Promise;
}


// Comprobando que el navegador soporte los service workers
if('serviceWorker' in navigator){
    // Registrando el service worker
    navigator.serviceWorker
    //.register('/sw.js', {scope: '/help/'})   -> Para ajustar el scope del service worker
    .register('/sw.js')
        .then(() => {
            console.log('Service Worker Registered ☺');
        });
} 

window.addEventListener('beforeinstallprompt', function(event){
    console.log('beforeinstallprompt');
    event.preventDefault();
    deferredPrompt = event;
    return false;
});

function displayConfirmNotification() {
    if('serviceWorker' in navigator){

        var options = {
            body: 'You successfully subscribe to our Notification Service',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification', // Para solapar las notificaciones con el mismo tag
            renotify: true, // Para notificaciones con un mismo tag, con cada nueva notificacion el dispositvo vibra y notifica, en caso de false no hace nada, se queda en silencio
            actions: [
                {action: 'confirm', title: 'Ok', icon: '/src/images/icons/app-icon-96x96.png'},
                {action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png'}
            ]
        }

        navigator.serviceWorker.ready
            .then(swRegister => {
                swRegister.showNotification('Successfully subscribed!', options)
            })
    }
}

function configurePushSubscription(){
    if('serviceWorker' in navigator){
        var swRegistration;
        navigator.serviceWorker.ready
            .then(swReg => {
                swRegistration = swReg;
                return swReg.pushManager.getSubscription();
            })
            .then(sub => {
                if(sub === null){
                    // Create subscription
                    var vapidPublicKey = "BCDAQIG9x9__Pw6TxPEkA0b0XLXJwFh2Y7MDHgAjDb5-kRDKEJTk6lAMxHEXBUAhQEJ4d2w9BxvMNFrxTorQ7v8";
                    var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                    console.log('Antes de subscribirse al servidor push');
                    return swRegistration.pushManager.subscribe({
                        userVisibleOnly: true,
                        //applicationServerKey: vapidPublicKey
                        applicationServerKey: convertedVapidPublicKey
                    })
                }else{
                    // We have a subscription
                    console.log('We have a subscription');
                }
            })
            .then(subs => {
                console.log('Despues de subscribirse al servidor push');
                console.log(subs);
                
                return fetch(`${dirHostBackEnd}/subscription`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(subs)
                })
            })
            .then(resp => {
                displayConfirmNotification();
            })
            .catch(err => {
                console.log('OCURRIO UN ERROR AL REALIZAR LA SUBSCRIPCION');
                console.log(err);
                
            })
    }
      
}

function askForNotificationPermision(event) {
    Notification.requestPermission(result => {
        console.log('User choice', result);
        if(result !== 'granted'){
            console.log('No notification permission granted!');
        }else{
            //displayConfirmNotification();
            configurePushSubscription();
        }
    })
}

if('Notification' in window && 'serviceWorker' in navigator) {

    enableNotificationsButtons.forEach(notificationButton => {
        notificationButton.style.display = 'inline-block';
        notificationButton.addEventListener('click', askForNotificationPermision)
    })

}