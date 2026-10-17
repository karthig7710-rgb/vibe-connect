import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Message } from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, saveImage } from '../utils/upload.js';
import { HttpError, ah } from '../utils/errors.js';
import { songInput } from '../utils/song.js';

const router = Router();
router.use(requireAuth);

const emit = (req, userId, event, payload) => req.app.get('io').to(`user:${userId}`).emit(event, payload);

function assertFriend(req, friendId) {
  if (!mongoose.isValidObjectId(friendId)) throw new HttpError(400, 'Invalid user.');
  if (!req.user.friends.some((f) => String(f) === friendId)) throw new HttpError(403, 'You can only message friends.');
}

// Last message + unread count per conversation
router.get('/conversations', ah(async (req, res) => {
  const me = req.user._id;
  const rows = await Message.aggregate([
    { $match: { $or: [{ from: me }, { to: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] },
        last: { $first: '$$ROOT' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$read', false] }] }, 1, 0] } },
      },
    },
  ]);
  res.json({ conversations: rows.map((r) => ({ friendId: r._id, last: r.last, unread: r.unread })) });
}));

router.get('/:friendId', ah(async (req, res) => {
  const { friendId } = req.params;
  assertFriend(req, friendId);
  const limit = Math.min(Number(req.query.limit) || 40, 100);
  const query = {
    $or: [
      { from: req.user._id, to: friendId },
      { from: friendId, to: req.user._id },
    ],
  };
  if (req.query.before) {
    const d = new Date(String(req.query.before));
    if (!isNaN(d)) query.createdAt = { $lt: d };
  }
  const msgs = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ messages: msgs.reverse(), hasMore: msgs.length === limit });
}));

router.post('/:friendId', upload.single('image'), ah(async (req, res) => {
  const { friendId } = req.params;
  assertFriend(req, friendId);
  const doc = { from: req.user._id, to: friendId };
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (text.length > 2000) throw new HttpError(400, 'Message is too long (max 2000 characters).');

  if (req.file) {
    doc.type = 'image';
    doc.image = await saveImage(req.file, 'chat');
    doc.text = text;
  } else if (req.body.song) {
    let raw;
    try {
      raw = typeof req.body.song === 'string' ? JSON.parse(req.body.song) : req.body.song;
    } catch {
      throw new HttpError(400, 'Invalid song.');
    }
    const parsed = songInput.safeParse(raw);
    if (!parsed.success) throw new HttpError(400, 'Invalid song.');
    doc.type = 'song';
    doc.song = parsed.data;
    doc.text = text;
  } else {
    if (!text) throw new HttpError(400, 'Message cannot be empty.');
    doc.type = 'text';
    doc.text = text;
  }

  const msg = await Message.create(doc);
  emit(req, friendId, 'message:new', msg.toJSON());
  emit(req, req.user.id, 'message:new', msg.toJSON()); // other tabs/devices of the sender
  res.status(201).json({ message: msg });
}));

// Edit your own text message. Only the sender can edit, and only while the two of you are still friends.
router.patch('/:id', ah(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid message.');
  const parsed = z.object({ text: z.string().trim().min(1, 'Message cannot be empty.').max(2000, 'Message is too long (max 2000 characters).') }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const msg = await Message.findOne({ _id: id, from: req.user._id });
  if (!msg) throw new HttpError(404, 'Message not found.');
  if (msg.type !== 'text') throw new HttpError(400, 'Only text messages can be edited.');
  assertFriend(req, String(msg.to));

  if (msg.text !== parsed.data.text) {
    msg.text = parsed.data.text;
    msg.editedAt = new Date();
    await msg.save();
    emit(req, msg.to, 'message:edited', msg.toJSON());
    emit(req, req.user.id, 'message:edited', msg.toJSON()); // sender's other tabs/devices
  }
  res.json({ message: msg });
}));

router.post('/:friendId/read', ah(async (req, res) => {
  const { friendId } = req.params;
  assertFriend(req, friendId);
  const r = await Message.updateMany({ from: friendId, to: req.user._id, read: false }, { read: true });
  if (r.modifiedCount) emit(req, friendId, 'messages:read', { by: req.user.id });
  emit(req, req.user.id, 'messages:read-self', { friendId });
  res.json({ ok: true });
}));

export default router;
