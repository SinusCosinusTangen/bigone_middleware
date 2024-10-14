import { createClient } from 'redis';

const redisClient = createClient({
    url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function connect() {
    await redisClient.connect();
}

export { redisClient, connect };
