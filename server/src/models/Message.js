import mongoose from 'mongoose';
import { songSchema } from './User.js';

const schema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'song'], default: 'text' },
    text: { type: String, default: '', maxlength: 2000 },
    image: { type: String, default: '' },
    song: { type: songSchema, default: undefined },
    read: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
schema.index({ from: 1, to: 1, createdAt: -1 });
schema.index({ to: 1, read: 1 });

export const Message = mongoose.model('Message', schema);
