import { loadEnvFile } from 'node:process';
try {
    loadEnvFile();
} catch (e) {
    // .env might not exist in some environments, ignore
}

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocket } from './src/lib/socket-io';
import { logger } from './src/lib/logger';
import { getEnv } from './src/lib/env';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port, webpack: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Next's own env loader (@next/env) populates process.env from .env.local
    // as part of app.prepare(), so validation must happen after that.
    try {
        getEnv();
    } catch (err) {
        logger.error('Invalid environment configuration', err);
        process.exit(1);
    }


    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            logger.error('Error occurred handling', err, { url: req.url });
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.io on the same HTTP server
    initSocket(httpServer);

    httpServer
        .once('error', (err) => {
            logger.error('Server startup error', err);
            process.exit(1);
        })
        .listen(port, () => {
            logger.info(`> Ready on http://${hostname}:${port}`);
        });
});
