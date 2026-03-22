import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import condoRoutes from './src/routes/condoRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
// import swaggerDoc from './src/docs/swagger.json' assert { type: 'json' };



dotenv.config();

// ---- Docker Desktop / Windows note ----
// Some Docker networks have no IPv6 route, but DNS can return IPv6 (AAAA) first.
// Microsoft OAuth token exchange may fail with ENETUNREACH when Node tries IPv6.
// We prefer IPv4-first always, and (optionally) force IPv4 when FORCE_IPV4=true.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {
  // Node < 17 may not support this; safe to ignore.
}

if (process.env.FORCE_IPV4 === 'true') {
  const lookupIpv4 = (hostname, options, callback) => {
    // Support both (hostname, cb) and (hostname, options, cb)
    if (typeof options === 'function') {
      return dns.lookup(hostname, { family: 4 }, options);
    }
    return dns.lookup(hostname, { ...(options || {}), family: 4 }, callback);
  };

  // Force IPv4 for outbound HTTP(S) requests (includes Passport OAuth token exchange)
  http.globalAgent.options.family = 4;
  https.globalAgent.options.family = 4;
  http.globalAgent.options.lookup = lookupIpv4;
  https.globalAgent.options.lookup = lookupIpv4;
}


const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Swagger doc (avoids JSON import assertion issues)
const swaggerDoc = JSON.parse(
  fs.readFileSync(new URL('./src/docs/swagger.json', import.meta.url), 'utf-8')
)

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/condo', condoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// TODO: ensure that vite build in production is served
// const clientBuildPath = path.join(__dirname, "..", "client", "dist");
// app.use(express.static(clientBuildPath));


// Serve built React app (static files)
const clientBuildPath = path.join(__dirname, 'public');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
