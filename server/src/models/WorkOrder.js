import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'CondoUnit' },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    reportedBy: { type: String },
    category: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('WorkOrder', workOrderSchema);
