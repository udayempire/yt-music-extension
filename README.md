# 🎵 YT Music Now Playing

A lightweight, real-time **"Now Playing" tracker** for YouTube Music. A Chrome extension scrapes the currently playing track and pushes it to a self-hosted backend, which exposes a REST API so any website or widget can display what you're listening to live.

---

## How It Works

```
┌─────────────────────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
│  Chrome Extension           │  POST  │  Backend (Express)       │  GET   │  Widget / Site   │
│  ─────────────────────────  │ ─────► │  ──────────────────────  │ ◄───── │  ────────────── │
│  content.ts  → scrapes DOM  │        │  /api/now-playing/update │        │  /api/now-       │
│  background.ts → sends API  │        │  in-memory store         │        │  playing/:id     │
└─────────────────────────────┘        └──────────────────────────┘        └──────────────────┘
```

1. **Extension** : A Manifest V3 Chrome extension that injects a content script into `music.youtube.com`. It watches the DOM via `MutationObserver` and polls every 3 seconds to detect track changes (title, artist, cover, playback position, duration, play/pause state).
2. **Background Worker** : Receives messages from the content script and POSTs a signed request to the backend API.
3. **Backend** : A minimal Express server that stores the latest "now playing" state in memory, keyed by `channelId`. Exposes endpoints to update and query state.
4. **Widget** : A thin embeddable script (WIP) that can be dropped into any webpage to display your current track.

---

## Project Structure

```
yt-music-extension/
├── extension/          # Chrome Extension (Manifest V3)
│   ├── src/
│   │   ├── content.ts      # DOM scraping & change detection
│   │   ├── background.ts   # Service worker, API push
│   │   └── types.ts        # Extension-internal message types
│   └── manifest.json
│
├── backend/            # Express REST API
│   ├── src/
│   │   ├── server.ts           # Express app setup & CORS
│   │   ├── routes/
│   │   │   └── now-playing.ts  # POST /update, GET /:channelId
│   │   ├── services/
│   │   │   └── store.ts        # In-memory state store
│   │   └── middleware/
│   │       └── auth.ts         # Bearer token auth
│
├── shared/             # Shared TypeScript types
│   └── types/
│       └── now-playing.ts  # NowPlayingState, NowPlayingUpdateRequest
│
└── widget/             # Embeddable web widget (WIP)
    └── src/
        ├── widget.ts
        └── embed.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Google Chrome** (or any Chromium-based browser)

---

### 1. Backend

```bash
cd backend
npm install

# Development (tsx hot-reload)
npm run dev

# Production build & start
npm run build
npm start
```

The server listens on **port 4000** by default.

---

### 2. Chrome Extension

```bash
cd extension
npm install

# One-time build
npm run build

# Watch mode (auto-rebuilds on save)
npm run dev
```

Then load the unpacked extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder

---

## API Reference

Base URL: `https://api.ytmusic-extension.udayempire.me` (or `http://localhost:4000` locally)

### `GET /health`

Returns `{ ok: true }` useful for uptime monitoring.

---

### `POST /api/now-playing/update`

Receives a now-playing update from the extension.

**Headers**

| Header          | Value                        |
|-----------------|------------------------------|
| `Content-Type`  | `application/json`           |
| `Authorization` | `Bearer <API_TOKEN>`         |

**Request Body**

```json
{
  "source": "ytmusic-extension",
  "data": {
    "channelId": "yt-music",
    "title": "Blinding Lights",
    "artists": "The Weeknd",
    "coverUrl": "https://...",
    "songUrl": "https://music.youtube.com/watch?v=...",
    "isPlaying": true,
    "positionSec": 42,
    "durationSec": 200,
    "playedAt": 1700000000000
  }
}
```

**Response**

```json
{ "message": "Now playing update received" }
```

---

### `GET /api/now-playing/:channelId`

Fetches the current now-playing state for a given channel.

| Parameter   | Description                                   |
|-------------|-----------------------------------------------|
| `channelId` | The channel identifier (e.g. `"yt-music"`)    |

**Response (200)**

```json
{
  "channelId": "yt-music",
  "title": "Blinding Lights",
  "artists": "The Weeknd",
  "coverUrl": "https://...",
  "songUrl": "https://music.youtube.com/watch?v=...",
  "isPlaying": true,
  "positionSec": 42,
  "durationSec": 200,
  "playedAt": 1700000000000
}
```

> If no data exists for the given `channelId`, the most recently updated channel is returned with `"fallback": true` appended.

---

## Shared Types

Defined in `shared/types/now-playing.ts` and imported by both the extension and backend for a single source of truth.

```ts
type NowPlayingState = {
  channelId: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  songUrl: string | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  playedAt: number; // Unix timestamp (ms)
};
```

---

## Configuration

### Extension (`background.ts`)

| Constant        | Description                              |
|-----------------|------------------------------------------|
| `API_BASE_URL`  | Backend base URL                         |
| `API_TOKEN`     | Bearer token for authenticating requests |

### Extension (`content.ts`)

| Constant            | Description                                      |
|---------------------|--------------------------------------------------|
| `CHANNEL_ID`        | Identifier sent with every update (`"yt-music"`) |
| `PUSH_INTERVAL_MS`  | Polling interval in milliseconds (default: 3000) |

### Backend (`server.ts`)

CORS is configured to allow:
- The specific Chrome extension origin
- `http://localhost:3000` / `http://localhost:5173` (local dev)
- `https://udayempire.me` (production site)

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Extension  | TypeScript, Manifest V3, esbuild        |
| Backend    | Node.js, Express 5, TypeScript, tsx     |
| Widget     | TypeScript *(WIP)*                      |
| Shared     | TypeScript                              |

---

## Development Notes

- The backend store is **in-memory** state is lost on server restart. This is intentional for a lightweight, stateless deployment.
- The content script uses a `MutationObserver` + interval hybrid: the observer reacts to DOM changes immediately, while the interval acts as a heartbeat to catch edge cases (e.g. play/pause without a DOM mutation).
- Graceful cleanup handles the `"Extension context invalidated"` error that occurs when the extension is reloaded while the content script is still running.

---

## Contributing

Contributions are welcome! Here's how to get started.

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/yt-music-extension.git
cd yt-music-extension
```

### 2. Install Dependencies

Each package manages its own dependencies install them separately:

```bash
cd extension && npm install
cd ../backend && npm install
```

### 3. Run in Dev Mode

Open two terminals:

```bash
# Terminal 1 backend
cd backend && npm run dev

# Terminal 2 extension (watch mode)
cd extension && npm run dev
```

Then load the unpacked extension from `extension/` in `chrome://extensions`.

### 4. Branch Naming

Use descriptive branch names scoped to the area of change:

| Prefix      | When to use                             | Example                          |
|-------------|-----------------------------------------|----------------------------------|
| `feat/`     | New feature                             | `feat/widget-embed`              |
| `fix/`      | Bug fix                                 | `fix/song-url-fallback`          |
| `chore/`    | Tooling, deps, config                   | `chore/update-esbuild`           |
| `docs/`     | Documentation only                      | `docs/api-reference`             |
| `refactor/` | Code change with no functional effect   | `refactor/store-service`         |

### 5. Pull Request Guidelines

- **Keep PRs focused** one logical change per PR.
- **Describe the "why"** not just what changed, but why.
- **Type-check before pushing** run `npm run typecheck` in any package you touched.
- **No breaking changes to the API** without a discussion in an issue first.

### 6. Package-Specific Notes

#### `extension/`
- DOM selectors live in the `SELECTORS` constant in `content.ts` update there if YouTube Music changes its markup.
- The `CHANNEL_ID` and `API_TOKEN` are hardcoded constants. For local dev, point `API_BASE_URL` at `http://localhost:4000`.

#### `backend/`
- The in-memory store (`store.ts`) is intentionally simple. If you need persistence, a drop-in Redis or SQLite adapter would be the right approach open an issue to discuss first.
- Auth middleware lives in `middleware/auth.ts`. Any new protected routes should use it.

#### `shared/`
- `shared/types/` is the **single source of truth** for data shapes used across packages. Update types here first, then fix any downstream type errors in `extension/` and `backend/`.

#### `widget/` *(WIP)*
- The widget package is a work in progress. Contributions here are especially welcome.

### 7. Reporting Issues

Please include:
- Browser & extension version
- Backend version / environment (local vs. deployed)
- Steps to reproduce
- Expected vs. actual behaviour

---

## License

[MIT](./LICENSE)
