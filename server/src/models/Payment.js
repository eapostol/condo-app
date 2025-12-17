import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'CondoUnit' },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['maintenance', 'special'], required: true },
    paidAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
