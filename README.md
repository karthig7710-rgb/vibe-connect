# VibeConnect

Social chat + music app. React (Vite) · Node/Express · MongoDB · Socket.IO · Tailwind CSS.

## Features
- Sign up / log in / log out (bcrypt + JWT in an httpOnly cookie), profile pictures and bio
- Search users, friend requests (send, accept, decline, cancel), unfriend
- Real-time private chat, photos (5 MB, magic-byte verified), emoji picker, read receipts
- **Edit your own text messages** (pencil icon next to your message; shows an "edited" label and updates live for your friend)
- Online/offline status, last seen, typing indicators
- Unread badges, in-app toasts, browser notifications, unread count in tab title
- Music: song search (iTunes Search API), play/pause/seek/volume/next/prev, favourites
- Share songs with friends as playable cards (with link to Apple Music)
- Dark, responsive UI (desktop rail + mobile bottom tabs)

### v2 additions
- **Listen Together**: private rooms (invite-only), shared queue, play/pause/seek/next/prev synced for everyone
  (server-authoritative playback + clock-offset sync + drift correction), host-only or everyone-controls mode
- **Games**: Tic Tac Toe, Connect Four, Rock Paper Scissors (best of 3); invite online friends, server-validated moves,
  live head-to-head series score, forfeit handling, rematches
- **10 free themes** that re-skin the whole app (click your avatar -> Theme): Violet Night, Deep Ocean, Sunset Drive,
  Midnight Forest, Neon Arcade, Rose Quartz, Aurora, Mocha, Graphite, Candy Pop. Your choice is saved to your account.
- Live games and rooms are held in server memory (finished game results are stored in MongoDB)
- No points, rewards, badges or leaderboard (removed)

## Prerequisites
- Node.js 18+ (20 recommended)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas URI

## Setup
```bash
cd vibeconnect
npm run install:all
cp server/.env.example server/.env
# edit server/.env: set JWT_SECRET (and MONGO_URI if using Atlas)
```
Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Run (development)
```bash
npm run dev
```
Open http://localhost:5173 (API on :5000). Open a second browser/incognito window, create another
account, add each other as friends and start chatting.

## Run (production)
```bash
npm start      # builds the client, then Express serves it on http://localhost:5000
```
Set `NODE_ENV=production` (done by `npm start` in server) and serve over HTTPS so the auth cookie is `Secure`.
For a split deployment, set `CLIENT_URL` to the client origin; same-origin hosting is simplest.

## Security notes
- Passwords hashed with bcrypt (cost 12); JWT lives in an httpOnly, SameSite=Lax cookie
- Helmet + CSP, CORS locked to `CLIENT_URL`, rate limits (stricter on login/signup)
- Input validated with zod; Mongo queries are parameterised and regex input is escaped
- Uploads: 5 MB limit, file type checked from the actual bytes, random filenames
- Socket.IO authenticates with the same cookie; typing events only reach friends
- Only friends can message each other

## Music API note
Songs come from Apple's official iTunes Search API (no key needed). It returns 30-second previews,
not full tracks; full-length streaming needs a licensed SDK such as Spotify (Premium users only).

## Structure
```
vibeconnect/
├─ package.json            root scripts (dev, build, start)
├─ server/
│  ├─ .env.example
│  └─ src/ index.js · config.js · socket.js
│     ├─ models/      User · Message · FriendRequest · GameResult
│     ├─ routes/      auth · users · friends · messages · music · rooms
│     ├─ games/       tictactoe · connect4 · rps · manager (real-time engine)
│     ├─ rooms/       manager (Listen Together)
│     ├─ middleware/  auth
│     └─ utils/       upload · presence · errors · song
└─ client/
   └─ src/ main.jsx · App.jsx · api.js · index.css
      ├─ context/     Auth · Chat (socket, messages, presence) · Music (player, favourites)
      ├─ pages/       AuthPage · Home
      └─ components/  ChatList · ChatWindow · FriendsPanel · MusicPanel · PlayerBar ·
                      SongCard · TrackRow · ShareSongModal · ProfileModal · Avatar · Toasts · Modal
```
