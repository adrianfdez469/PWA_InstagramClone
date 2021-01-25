import {RequestHandler} from 'express';
import webpush from 'web-push';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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


let posts: PostsTypes = {}
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
                const privateKey = process.env.WEB_PUSH_PRIVATE_KEY as string;
                const publicKey = process.env.WEB_PUSH_PUBLIC_KEY as string;

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
}

export const createSubscription: RequestHandler = (request, resp, next) => {
    const subscription = request.body as ISubscription;

    subscriptions.push(subscription);
    resp.status(201).json({});
}