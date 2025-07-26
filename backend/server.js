import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { config } from './config/index.js';

// -------------------------------------------------------------------
// APP SETUP
// -------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------
app.use('/api', apiRoutes);

// -------------------------------------------------------------------
// FRONTEND (static React assets)
// -------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, '../dist');

// Serve JS/CSS/images first
app.use(express.static(DIST_PATH));

// SPA fallback – return index.html on any unmatched route
app.get('*', (_, res) =>
  res.sendFile(path.join(DIST_PATH, 'index.html'))
);

// -------------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------------
app.listen(config.PORT, config.HOST, () =>
  console.log(`App listening on http://${config.HOST}:${config.PORT}`)
);