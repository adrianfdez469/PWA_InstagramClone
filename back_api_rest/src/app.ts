import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import routes from './routes/routes';
import path from 'path';

const app = express();


app.use(cors());

app.use('/public',express.static(path.join(__dirname, 'public')));
app.use(express.json());



app.use('/', routes);

app.use((err: Error, req: Request, resp: Response, next: NextFunction) => {
    resp.status(500).json({message: err.message});
})



app.listen(3000, () => {
    console.log('Server up in port 3000!!!');
});

