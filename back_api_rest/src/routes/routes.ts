import express from 'express';
import {getPosts, addPost, createSubscription} from '../controllers/controller';
const router = express.Router();

router.get('/posts', getPosts);

router.post('/posts', addPost);

router.post('/subscription', createSubscription);



export default router;