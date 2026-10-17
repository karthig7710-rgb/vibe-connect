import { z } from 'zod';

const httpsUrl = z.string().url().max(600).refine((u) => u.startsWith('https://'), 'Must be https');

export const songInput = z.object({
  trackId: z.union([z.string(), z.number()]).transform(String),
  title: z.string().min(1).max(300),
  artist: z.string().max(300).default(''),
  album: z.string().max(300).default(''),
  artwork: z.union([httpsUrl, z.literal('')]).default(''),
  previewUrl: httpsUrl,
  trackUrl: z.union([httpsUrl, z.literal('')]).default(''),
  durationMs: z.number().int().min(0).max(36000000).default(0),
});
