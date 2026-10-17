import mongoose from 'mongoose';
import { THEME_IDS, DEFAULT_THEME } from '../utils/themes.js';

export const songSchema = new mongoose.Schema(
  {
    trackId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 300 },
    artist: { type: String, default: '', maxlength: 300 },
    album: { type: String, default: '', maxlength: 300 },
    artwork: { type: String, default: '' },
    previewUrl: { type: String, required: true },
    trackUrl: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 160 },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    favorites: [songSchema],
    lastSeen: { type: Date, default: Date.now },

    // Free app theme (see utils/themes.js). Unknown/legacy values fall back to the default on the client.
    theme: { type: String, enum: THEME_IDS, default: DEFAULT_THEME },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const PUBLIC_FIELDS = 'username avatar bio lastSeen';
export const User = mongoose.model('User', userSchema);
