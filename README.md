# 🎵 Music Player — Netlify + Supabase

A Spotify-inspired static music streaming web app hosted on Netlify with Supabase as the backend for song storage and metadata. Admins can upload, edit, and delete songs directly from the browser — no code changes or redeployments needed.

---

## Live Demo

> Replace with your Netlify URL after deployment
> `https://your-site.netlify.app`

---

## Overview

This is a full-featured music streaming app built for personal or portfolio use. It allows an admin to upload MP3 files and cover art through a protected browser-based admin panel. Songs are stored on Supabase Storage and served via CDN. Users can browse, search, filter by category, and stream music directly in the browser with a persistent bottom player bar.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 4 |
| Routing | React Router v6 |
| State Management | React Context API |
| Backend / Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Hosting | Netlify (free tier) |
| Styling | Pure CSS (Spotify dark theme) |
| Audio Playback | HTML5 Audio API |

---

## Features

### User Features
- Browse all songs in a Spotify-style dark UI
- Search songs by title, artist, album, or category
- Filter by genre/category (Pop, Chill, Electronic, Jazz, etc.)
- Play / Pause / Next / Previous controls
- Shuffle and Repeat (off / all / one)
- Volume slider
- Progress bar with seek
- Persistent bottom player bar
- Mobile responsive layout

### Admin Features
- Password-protected admin panel at `/admin`
- Upload MP3 files directly from the browser
- Upload cover images (JPG/PNG)
- Fill in song metadata (title, artist, album, duration, category, year)
- Edit any song's details or replace its file
- Delete songs
- Real-time library management — changes appear instantly

---

## Project Structure

```
music-player/
├── public/
│   ├── favicon.svg
│   ├── music/          # (legacy) local MP3 placeholder folder
│   └── covers/         # (legacy) local cover placeholder folder
├── src/
│   ├── lib/
│   │   └── supabase.js         # Supabase client + storage helpers
│   ├── context/
│   │   └── PlayerContext.jsx   # Global player state (current song, playback)
│   ├── components/
│   │   ├── Sidebar.jsx         # Left navigation
│   │   ├── PlayerBar.jsx       # Bottom playback controls
│   │   ├── SongCard.jsx        # Individual song row
│   │   ├── SongList.jsx        # Song list container
│   │   └── SearchBar.jsx       # Search input
│   ├── pages/
│   │   ├── Home.jsx            # Main library page with search
│   │   ├── Categories.jsx      # Browse by genre
│   │   └── Admin.jsx           # Upload + manage songs
│   ├── App.jsx                 # Routes + layout
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles (dark theme)
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml                # Netlify build config + redirects
├── .env.example                # Environment variable template
└── SUPABASE_SETUP.md           # Supabase setup instructions
```

---

## How It Works — End to End

### Architecture Diagram

```
User's Browser
      │
      ▼
 Netlify CDN  ──────────────────────────────────────────┐
 (React App)                                            │
      │                                                 │
      ├── GET /songs ──────────────────► Supabase DB    │
      │                                 (PostgreSQL)    │
      │                                                 │
      ├── Stream audio ────────────────► Supabase       │
      │                                 Storage CDN     │
      │                                                 │
      └── Admin upload ────────────────► Supabase       │
           (MP3 + cover + metadata)      Storage + DB   │
                                                        │
────────────────────────────────────────────────────────┘
```

### User Flow

1. User opens the Netlify URL
2. React app loads in the browser
3. `PlayerContext` fetches the song list from Supabase (`songs` table)
4. Songs are displayed in the Home page
5. User clicks a song → `HTML5 Audio` element plays the `file_url` (Supabase CDN link)
6. Playback controls (play/pause/next/prev/shuffle/repeat/volume) are handled entirely in the browser via `PlayerContext`
7. Supabase realtime subscription keeps the song list up to date without page refresh

### Admin Upload Flow

1. Admin navigates to `/admin` and enters the password
2. Admin selects an MP3 file and (optionally) a cover image
3. Admin fills in metadata (title, artist, album, duration, category, year)
4. On submit:
   - MP3 is uploaded to Supabase Storage bucket `music`
   - Cover image is uploaded to Supabase Storage bucket `covers`
   - Public CDN URLs are generated for both files
   - A new row is inserted into the Supabase `songs` table with the metadata + URLs
5. The song list updates in real time across all open browser tabs

### Deployment Flow

```
Local Code Change
      │
      ▼
git push → GitHub
      │
      ▼ (automatic webhook)
Netlify detects push
      │
      ▼
npm run build (Vite bundles React app)
      │
      ▼
Netlify deploys /dist to CDN
      │
      ▼
Live in ~60 seconds
```

---

## Database Schema

### `songs` table (Supabase / PostgreSQL)

| Column | Type | Description |
|---|---|---|
| `id` | bigint (auto) | Primary key |
| `title` | text | Song title |
| `artist` | text | Artist name |
| `album` | text | Album name |
| `duration` | text | Duration string e.g. `3:42` |
| `file_url` | text | Public URL of the MP3 in Supabase Storage |
| `cover_url` | text | Public URL of the cover image |
| `category` | text | Genre: pop, chill, electronic, jazz, etc. |
| `year` | int | Release year |
| `created_at` | timestamptz | Auto-set on insert |

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |
| `VITE_ADMIN_PASSWORD` | Password to access the `/admin` panel |

Set these in Netlify → Site configuration → Environment variables before deploying.

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/your-username/music-player.git
cd music-player

# 2. Install dependencies
npm install

# 3. Create a .env file
cp .env.example .env
# Fill in your Supabase URL, anon key, and admin password

# 4. Start dev server
npm run dev

# 5. Open http://localhost:5173
```

---

## Deployment

### Netlify (recommended)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Select your GitHub repository
4. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variables (Settings → Environment variables)
6. Click **Deploy site**

### Netlify `netlify.toml` config

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The `[[redirects]]` rule ensures React Router client-side navigation works correctly (all routes serve `index.html`).

---

## Supabase Setup

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the full step-by-step guide including SQL, storage bucket creation, and RLS policies.

---

## Limitations

| Limitation | Reason |
|---|---|
| No real user authentication | Static site — no server to validate sessions |
| Admin password is a simple env var check | Suitable for personal/portfolio use only |
| Supabase free tier: 500MB DB, 1GB storage | Upgrade Supabase for larger libraries |
| Netlify free tier: 100GB bandwidth/month | Suitable for ~500–1000 song libraries |

---

## License

MIT — free to use, modify, and deploy for personal or commercial projects.
