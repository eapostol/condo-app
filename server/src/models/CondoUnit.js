import mongoose from 'mongoose';

const condoUnitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    floor: { type: Number },
    bedroomCount: { type: Number },
    isRented: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('CondoUnit', condoUnitSchema);
