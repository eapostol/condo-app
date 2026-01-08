import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import condoRoutes from './src/routes/condoRoutes.js';
// import swaggerDoc from './src/docs/swagger.json' assert { type: 'json' };

dotenv.config({ path: fileURLToPath(new URL('./server/.env', import.meta.url)) });

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
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

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
