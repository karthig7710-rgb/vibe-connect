import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api.js';

const MusicCtx = createContext(null);
export const useMusic = () => useContext(MusicCtx);

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.volume = 0.8;
    audioRef.current = a;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => next();
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnd);
    const onRoomPlay = () => a.pause();
    window.addEventListener('vc:room-play', onRoomPlay);
    api.get('/music/favorites').then((r) => setFavorites(r.data.favorites)).catch(() => {});
    return () => {
      a.pause();
      a.src = '';
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnd);
      window.removeEventListener('vc:room-play', onRoomPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((t, queue) => {
    const a = audioRef.current;
    if (queue) queueRef.current = queue;
    if (!queueRef.current.some((q) => q.trackId === t.trackId)) queueRef.current = [t];
    if (a.src !== t.previewUrl) {
      a.src = t.previewUrl;
      setProgress(0);
      setDuration(0);
    }
    setTrack(t);
    window.dispatchEvent(new Event('vc:personal-play'));
    a.play().catch(() => setPlaying(false));
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a?.src) return;
    a.paused ? a.play().catch(() => {}) : a.pause();
  }, []);

  const step = useCallback((dir) => {
    const q = queueRef.current;
    const cur = audioRef.current?.src;
    const i = q.findIndex((t) => t.previewUrl === cur);
    if (i === -1 || q.length === 0) return;
    const n = q[(i + dir + q.length) % q.length];
    play(n);
  }, [play]);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const seek = (t) => { audioRef.current.currentTime = t; setProgress(t); };
  const setVolume = (v) => { audioRef.current.volume = v; setVolumeState(v); };

  const isFav = (id) => favorites.some((f) => f.trackId === id);
  const toggleFavorite = async (t) => {
    if (isFav(t.trackId)) {
      const r = await api.delete(`/music/favorites/${encodeURIComponent(t.trackId)}`);
      setFavorites(r.data.favorites);
    } else {
      const r = await api.post('/music/favorites', t);
      setFavorites(r.data.favorites);
    }
  };

  return (
    <MusicCtx.Provider value={{ track, playing, progress, duration, volume, favorites, play, toggle, next, prev, seek, setVolume, isFav, toggleFavorite }}>
      {children}
    </MusicCtx.Provider>
  );
}
