import {RequestHandler} from 'express';
//import admin from 'firebase-admin';
import webpush from 'web-push';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';


const serviceAccount = require("../pwagram-fb-key.json");
const gcconfig = {
    projectId: 'pwagram-b7fe6',
    keyFilename: '../pwagram-fb-key.json'
};

//const gcs = require('@google-cloud/storage')(gcconfig);

/*admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-b7fe6.firebaseio.com"
});*/

interface IPost {
    id: string,
    title: string,
    location: string,
    rawLocationLat: number,
    rawLocationLong: number,
    rawLocationAlt: number,
    image: string
}
type PostsTypes = {
    [prop: string]: IPost
}
interface ISubscription {
    endpoint: string;
    keys: {
        auth: string;
        p256dh: string;
    }
}


let posts: PostsTypes = {
    /*'first-post': {
        id: "first-post",
        image: "/public/sf-boat.jpg",
        location: "In San Francisco",
        title: "Awesome trip to SF"

    },
    'second-post': {
        id: "second-post",
        image:"/public/capitolio.jpg",
        location:"In Havana",
        title: "Capitolio"
    }*/
}
const addInPost = (fields: formidable.Fields, files: formidable.Files): IPost => {
    posts[fields.id as string] = {
        id: <string>fields.id , 
        location: <string>fields.location,
        image: `/public/${files.file.name}`,
        rawLocationLat: Number.parseFloat(fields.rawLocationLat as string),
        rawLocationLong: Number.parseFloat(fields.rawLocationLong as string),
        rawLocationAlt: Number.parseFloat(fields.rawLocationAlt as string),
        title: <string>fields.title
    };
    return posts[fields.id as string];
}

const subscriptions: ISubscription[] = [];

export const getPosts: RequestHandler = (req, resp, next) => {
    
    resp.status(200).json(posts);
    /*
    admin.database().ref('posts').once('value')
        .then(posts => {
            resp.status(200).json(posts.val());
        })
        .catch(err => {
            resp.status(500).json({error: err});
        });*/
}

export const addPost: RequestHandler = (req, resp, next) => {

    const formData = new formidable.IncomingForm();
    formData.parse(req, (err, fields: formidable.Fields, files: formidable.Files) => {

        const newPath: string = path.join(__dirname, '..', 'public', files.file.name);
        let post:IPost;
        fs.promises.copyFile(files.file.path, newPath)
            .then(() => {
                post = addInPost(fields, files);
            })
            // Enviar web push notification
            .then(() => {
                const privateKey = 'W-WDJSk-uMYGg-tle8q5kx3zMw7HBbaH4kXew_P-nhs';
                const publicKey = 'BCDAQIG9x9__Pw6TxPEkA0b0XLXJwFh2Y7MDHgAjDb5-kRDKEJTk6lAMxHEXBUAhQEJ4d2w9BxvMNFrxTorQ7v8';
                webpush.setVapidDetails('https://github.com/adrianfdez469', publicKey, privateKey);
                //return admin.database().ref('subscriptions').once('value')
                return subscriptions;
            })
            .then(subs => {
                subs.forEach(sub => {
                    const pushConfig: webpush.PushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.keys.auth,
                            p256dh: sub.keys.p256dh
                        }
                    }
                    webpush.sendNotification(pushConfig, JSON.stringify({title: 'New Post', content: post.title, openUrl: '/help'}))
                    .catch(err => {
                        console.log(err);
                    })
                });
                console.log(post);
                resp.status(201).json({message: 'Data stored', id: post.id});
            })
            .catch(err => {
                console.log(err);
            })
    })

/*
    const postObj = request.body as IPost;
    admin.database().ref('posts').push(postObj)
        .then(() => {
            const privateKey = 'faI7Tgjw6otEKTueVSt_DRdjuM6mDEWASmncThvltxI';
            const publicKey = 'BBOvFTdXoAeIXFUyS_EOWeGIgdYZywAtxb3ul5CUIqu1DcbBSW4pOHJ3-Yx3B34tk4j-MSVKdoy6qPqsAH099wQ';
            webpush.setVapidDetails('https://github.com/adrianfdez469', publicKey, privateKey);
            
            return admin.database().ref('subscriptions').once('value')
        })
        .then(subs => {
            subs.forEach(sub => {
                const pushConfig: webpush.PushSubscription = {
                    endpoint: sub.val().endpoint,
                    keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh
                    }
                }
                webpush.sendNotification(pushConfig, JSON.stringify({title: 'New Post', content: 'New Post added!', openUrl: '/help'}))
                    .catch(err => {
                        console.log(err);
                    })
            });
            resp.status(201).json({message: 'Data stored', id: request.body.id});
        })
        .catch(err => {
            resp.status(500).json({error: err});
        })*/
}

export const createSubscription: RequestHandler = (request, resp, next) => {
    const subscription = request.body as ISubscription;

    subscriptions.push(subscription);
    console.log(subscriptions);
    resp.status(201).json({});
    
    /*admin.database().ref('subscriptions').push(subscription)
        .then(() => {
            resp.status(201).json({});
        })
        .catch(err => {
            resp.status(500).json({error: err});
        })*/
}