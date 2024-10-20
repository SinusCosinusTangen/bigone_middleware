import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import router from './routes/Router';
import sequelize from './config/Database';
import { json, urlencoded } from 'body-parser';
import { connect as connectRedis } from './config/Redis';
import projectRouter from './routes/ProjectRouter';

const fs = require('fs');
const https = require('https')

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

var cors = require('cors')

// const options = {
//   key: fs.readFileSync(process.env.SSL_KEY_FILE),
//   cert: fs.readFileSync(process.env.SSL_CRT_FILE),
// };

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors())

app.use('/api/auth', router);
app.use('/api/project', projectRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running!');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred!', error: err.message });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  try {
    await connectRedis();
    console.log('Connected to Redis');

    await sequelize.sync();
    console.log('Connected to the database');

    https.createServer(app).listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or Redis:', error);
    process.exit(1);
  }
};

startServer();

export default app;
