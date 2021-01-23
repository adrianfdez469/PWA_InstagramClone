var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation = {latitude: 0, longitud: 0, altitude: 0};

var dirHostBackEnd = 'http://localhost:3000';
//var dirHostBackEnd = 'http://192.168.42.5:3000';


locationBtn.addEventListener('click', event => {
    if(!('geolocation' in navigator)){
        return;
    }

    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition(
        position => {
            locationBtn.style.display = 'inline';
            locationLoader.style.display = 'none';
            fetchedLocation = {latitude: position.coords.latitude, longitud: position.coords.longitude, altitude: position.coords.altitude};
            locationInput.value = `Latitud: ${fetchedLocation.latitude} Longitud: ${fetchedLocation.longitud} Altura: ${fetchedLocation.altitude}`;
            document.querySelector('#manual-location').classList.add('is-focused');
        }, 
        error => {
            console.log(error);
            locationBtn.style.display = 'inline';
            locationLoader.style.display = 'none';
            alert('Couldn\'t  fetch location, please enter manually!');
            fetchedLocation = {latitude: 0, longitud: 0, altitude: 0};
        },
        {
            timeout: 1000*20
        })
})

function initializeLocation() {
    if(!('geolocation' in navigator)){
        locationBtn.style.display = 'none';
    }
}

function initializeMedia() {

    if(!('mediaDevices' in navigator)){
        navigator.mediaDevices = {};
    }

    if(!('getUserMedia' in navigator.mediaDevices)){
        navigator.mediaDevices.getUserMedia = function(constraints) {
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if(!getUserMedia){
                return Promise.reject(new Error('getUserMedia is not implemented!'));
            }

            return new Promise(function(resolve, reject){
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }

    navigator.mediaDevices.getUserMedia({video: true})
        .then(stream => {
            videoPlayer.srcObject = stream;
            videoPlayer.style.display = 'block';
        })
        .catch(err => {
            imagePickerArea.style.display = 'block';
        });
}

captureButton.addEventListener('click', event => {
    
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';
    var context = canvasElement.getContext('2d');
    context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
        track.stop();
    });
    picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', event => {
    picture = event.target.files[0];
})

function openCreatePostModal() {
    createPostArea.style.transform = 'translateY(0)';
    initializeMedia();
    initializeLocation();
    if (deferredPrompt) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice
            .then(function (choiceResult) {

                console.log(choiceResult);
                if (choiceResult.outcome === 'dismissed') {
                    console.log('User cancelled installation');
                } else {
                    console.log('User added to home screen')
                }
            })
        deferredPrompt = null;
    }
}

function closeCreatePostModal() {
    //createPostArea.style.display = 'none';
    /*createPostArea.style.transform = 'translateY(100vh)';*/
    videoPlayer.style.display = 'none';
    imagePickerArea.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    captureButton.style.display = 'inline';

    const closeVideoPromise = new Promise((resolve, reject) => {
        if(videoPlayer.srcObject){
            videoPlayer.srcObject.getVideoTracks().forEach(function(track, index, arr) {
                track.stop();
                if(index+1 === arr.length){
                    resolve();
                }
            });
        }
    });

    closeVideoPromise.then(() => {
        createPostArea.style.transform = 'translateY(100vh)';
    })

}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// No se usa. Permite salvar contenido en cache bajo demanda
function onSaveButtonClicked(event) {
    console.log('click');
    if ('caches' in window) {
        caches.open('user-requested')
            .then(cache => {
                return Promise.all(
                    [cache.add('https://httpbin.org/get'),
                    cache.add('/src/images/sf-boat.jpg')]
                )
            })
            .then(promise => {
                console.log('Element cached');
            })
    }
}

function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}



function createCard(data) {

    var cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    var cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url(' + dirHostBackEnd + data.image + ')';
    cardTitle.style.backgroundSize = 'cover';
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';

    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    //var cardSaveButton = document.createElement('button');
    //cardSaveButton.textContent = 'Save';
    //cardSaveButton.addEventListener('click', onSaveButtonClicked);
    //cardSupportingText.appendChild(cardSaveButton)
    cardSupportingText.style.textAlign = 'center';
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(dataArray) {
    clearCards();
    dataArray.forEach(data => {
        createCard(data);
    })
}

//var url = 'https://pwagram-b7fe6.firebaseio.com/posts.json';
var url = `${dirHostBackEnd}/posts`;
var fetcheFromNetwork = false;

fetch(url)
    .then(function (resp) {
        if(resp.ok){
            return resp.json();
        }
    })
    .then(function (data) {
        fetcheFromNetwork = true;
        var dataArray = [];
        for (const key in data) {
            dataArray.push(data[key]);
        }
        updateUI(dataArray);
    })
    .catch(err => { })

if ('caches' in window) {

    if ('indexedDB' in window) {
        readAllData('posts')
            .then(data => {
                if (!fetcheFromNetwork) {
                    updateUI(data);
                }
            })
    }
}

function sendData(data){

    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('title', data.title);
    formData.append('location', data.location);
    formData.append('rawLocation', data.rawLocation);
    formData.append('rawLocationLat', data.rawLocation.latitude);
    formData.append('rawLocationLong', data.rawLocation.longitud);
    formData.append('rawLocationAlt', data.rawLocation.altitude);
    formData.append('file', data.picture, data.id + '.png');


    fetch(url, {
        method: 'POST',
        body: formData,
        /*headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }*/
    })
    .then(response => {
        console.log("Send data", response);
    })
    .catch(err => {
        console.log(err);
    })
}

form.addEventListener('submit', event => {
    event.preventDefault();
    if(titleInput.value.trim() === '' || locationInput.value.trim() === ''){
        alert('Please enter valid data');
        return;
    }

    var post = {
        id: new Date().getTime(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
    };

    closeCreatePostModal();

    if('serviceWorker' in navigator && 'SyncManager' in window){
        navigator.serviceWorker.ready
            .then(sw => {
                writeData('sync-posts', post)
                    .then(() => {
                        return sw.sync.register('sync-new-posts');
                    })
                    .then(() => {
                        var snackbarContainer = document.querySelector('#confirmation-toast');
                        var data = {message: 'Your Post was saved for syncing!'};
                        snackbarContainer.MaterialSnackbar.showSnackbar(data);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            })
    } else{
        sendData(post)
    }
});