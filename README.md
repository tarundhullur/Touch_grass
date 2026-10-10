# Touch Grass: a field guide for your next outside minute

> A local-first outdoor mission generator for the DEV.to Touch Grass challenge. Pick a small mission, lock your screen, and take it outside. Your streak, notes, optional location, and photos stay in your browser.

**Tags:** `#opensource` `#privacy` `#offline` `#react` `#ollama`

## Why this exists

Our phones are useful outdoors right up until they become the reason we never look up. Touch Grass turns a screen into a short-lived field guide: generate one observation mission, put the phone away, and record what happened when you return.

Outdoor tools should work where connectivity does not. They should also avoid turning a walk, a location trail, or a photo of a plant into someone else's training data. Touch Grass keeps its core useful without an account, analytics, or a hosted AI API. Missions can be generated entirely in the browser, and all progress is stored locally in IndexedDB.

## What it does

- Creates short observation, movement, sound, and texture missions, even with no network.
- Offers an optional Ollama-compatible local model through a small Node service. If that model is absent or unavailable, the service uses the same local mission rules.
- Enters a low-distraction Zen Mode with one clear task and a prompt to put the phone away.
- Saves completed missions, streaks, optional coordinates, and optional camera captures in IndexedDB.
- Installs as a small PWA shell so a previously loaded app can reopen offline.

Camera and location are opt-in and requested only after the corresponding button is pressed. Photos are not sent to the AI endpoint. Coordinates and images are attached to a local mission log only when you choose to save it.

## Run it

Requirements: Node.js 20.19+, 22.12+, or newer and npm.

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The frontend proxies `/api` to the local Express service. The production build is served by Express:

```sh
npm run build
npm start
```

The app works without a model. To enable local generation, install and run [Ollama](https://ollama.com/), pull a model that supports chat, then start the service with:

```sh
OLLAMA_MODEL=llama3.2 npm start
```

For `npm run dev`, set `OLLAMA_MODEL` in the environment before starting the command. `OLLAMA_BASE_URL` defaults to `http://127.0.0.1:11434`; it can be changed for a compatible local endpoint. The server never forwards requests to a hosted provider by default. If Ollama is unreachable, mission generation falls back to local rules.

Check service status at `http://localhost:3000/api/health`. `aiMode` is `ollama` only when a local model is configured; otherwise it is `local-rules`.

## Privacy and zero-signal behavior

There is no account, telemetry, remote database, or cloud AI dependency. Mission requests sent to the optional service contain only category and difficulty. The Ollama request stays on the configured endpoint. Camera and location APIs require a secure context (localhost is treated as secure by browsers) and explicit user permission.

The app's first visit needs the local development server to load its files. After the service worker has installed and cached the app shell, the frontend can reopen without a network connection and generate missions in the browser. IndexedDB is origin-specific: clearing browser site data removes saved progress, and data does not sync to another device. Treat precise coordinates and captured images as sensitive even though they remain on this device.

## Project structure

```text
Touch_grass/
├── .gitignore
├── index.html
├── package-lock.json
├── package.json
├── vite.config.js
├── README.md
├── public/
│   ├── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── server/
│   ├── index.js
│   └── missions.js
├── shared/
│   └── missions.js
└── src/
	├── App.jsx
	├── db.js
	├── localMission.js
	├── main.jsx
	└── styles.css
```

## How the local AI path works

The shared mission catalog is the reliable baseline. The browser uses it directly when offline; Express uses it when no model is configured or a local model is unavailable. When `OLLAMA_MODEL` is set, the service sends a small structured prompt to Ollama's local `/api/chat` endpoint and validates the returned mission shape before showing it. There is no silent hosted fallback.

This is intentionally a small, inspectable AI integration rather than a requirement that users download a large model before they can go outside. The local model can add variety, while the rules-based generator preserves availability and privacy in airplane mode, on a trail, or on a device that cannot run a model.

## Build and verify

```sh
npm run build
npm start
```

The service exposes `GET /api/health` and `POST /api/mission`. The frontend keeps camera streams short-lived, stores captured image blobs only after mission completion, and calculates streaks from locally saved completion dates.

## A note on the challenge

Touch Grass is not a screen-time dashboard. The best outcome is that you generated a mission, put the phone in your pocket, and noticed something you would otherwise have missed. The app is here when you get back.