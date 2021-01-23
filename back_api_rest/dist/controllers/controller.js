"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = exports.addPost = exports.getPosts = void 0;
//import admin from 'firebase-admin';
const web_push_1 = __importDefault(require("web-push"));
const formidable_1 = __importDefault(require("formidable"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const serviceAccount = require("../pwagram-fb-key.json");
const gcconfig = {
    projectId: 'pwagram-b7fe6',
    keyFilename: '../pwagram-fb-key.json'
};
let posts = {
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
};
const addInPost = (fields, files) => {
    posts[fields.id] = {
        id: fields.id,
        location: fields.location,
        image: `/public/${files.file.name}`,
        rawLocationLat: Number.parseFloat(fields.rawLocationLat),
        rawLocationLong: Number.parseFloat(fields.rawLocationLong),
        rawLocationAlt: Number.parseFloat(fields.rawLocationAlt),
        title: fields.title
    };
    return posts[fields.id];
};
const subscriptions = [];
exports.getPosts = (req, resp, next) => {
    resp.status(200).json(posts);
    /*
    admin.database().ref('posts').once('value')
        .then(posts => {
            resp.status(200).json(posts.val());
        })
        .catch(err => {
            resp.status(500).json({error: err});
        });*/
};
exports.addPost = (req, resp, next) => {
    const formData = new formidable_1.default.IncomingForm();
    formData.parse(req, (err, fields, files) => {
        const newPath = path_1.default.join(__dirname, '..', 'public', files.file.name);
        let post;
        fs_1.default.promises.copyFile(files.file.path, newPath)
            .then(() => {
            post = addInPost(fields, files);
        })
            // Enviar web push notification
            .then(() => {
            const privateKey = 'W-WDJSk-uMYGg-tle8q5kx3zMw7HBbaH4kXew_P-nhs';
            const publicKey = 'BCDAQIG9x9__Pw6TxPEkA0b0XLXJwFh2Y7MDHgAjDb5-kRDKEJTk6lAMxHEXBUAhQEJ4d2w9BxvMNFrxTorQ7v8';
            web_push_1.default.setVapidDetails('https://github.com/adrianfdez469', publicKey, privateKey);
            //return admin.database().ref('subscriptions').once('value')
            return subscriptions;
        })
            .then(subs => {
            subs.forEach(sub => {
                const pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.keys.auth,
                        p256dh: sub.keys.p256dh
                    }
                };
                web_push_1.default.sendNotification(pushConfig, JSON.stringify({ title: 'New Post', content: post.title, openUrl: '/help' }))
                    .catch(err => {
                    console.log(err);
                });
            });
            console.log(post);
            resp.status(201).json({ message: 'Data stored', id: post.id });
        })
            .catch(err => {
            console.log(err);
        });
    });
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
};
exports.createSubscription = (request, resp, next) => {
    const subscription = request.body;
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
};
