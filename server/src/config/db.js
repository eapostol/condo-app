import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is not set in environment');
}

mongoose
  .connect(uri, {
    dbName: 'condo_app'
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });
