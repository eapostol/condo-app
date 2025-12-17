import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['manager', 'board', 'resident', 'admin'],
      default: 'resident'
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'microsoft'],
      default: 'local'
    },
    providerId: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
