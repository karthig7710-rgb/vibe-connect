import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { HttpError, ah } from '../utils/errors.js';
import { songInput } from '../utils/song.js';

const router = Router();
router.use(requireAuth);

// Music data comes from Apple's official iTunes Search API (free, no key, 30-second previews).
router.get('/search', ah(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) return res.json({ tracks: [] });
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: q, media: 'music', entity: 'song', limit: '30' })}`;
  let data;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    data = await r.json();
  } catch {
    throw new HttpError(502, 'Music service is unavailable right now. Try again shortly.');
  }
  const tracks = (data.results || [])
    .filter((t) => t.previewUrl && t.trackId)
    .map((t) => ({
      trackId: String(t.trackId),
      title: t.trackName,
      artist: t.artistName || '',
      album: t.collectionName || '',
      artwork: (t.artworkUrl100 || '').replace('100x100', '300x300'),
      previewUrl: t.previewUrl,
      trackUrl: t.trackViewUrl || '',
      durationMs: t.trackTimeMillis || 0,
    }));
  res.json({ tracks });
}));

router.get('/favorites', (req, res) => res.json({ favorites: req.user.favorites }));

router.post('/favorites', ah(async (req, res) => {
  const parsed = songInput.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Invalid song.');
  const song = parsed.data;
  if (!req.user.favorites.some((f) => f.trackId === song.trackId)) {
    req.user.favorites.unshift(song);
    await req.user.save();
  }
  res.status(201).json({ favorites: req.user.favorites });
}));

router.delete('/favorites/:trackId', ah(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { favorites: { trackId: req.params.trackId } } });
  const fresh = await User.findById(req.user._id).select('favorites');
  res.json({ favorites: fresh.favorites });
}));

export default router;
