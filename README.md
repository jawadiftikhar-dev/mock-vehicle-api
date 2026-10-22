# Fleet Live — Mock Vehicle API + Virtualized React Dashboard

A mock fleet tracker: a Node API serving **400 vehicles** over REST and a
Server-Sent Events position stream, plus a React dashboard that renders them
through `react-window` with live updates, filtering, sorting, a detail panel,
and an offline action queue.

Generates **400 realistic vehicles** and serves them over REST + a Server-Sent
Events stream that emits a position change for a random vehicle every **5 s**.

Ships with a clean **light-mode live dashboard** (vanilla HTML/CSS/JS — no
frameworks, no CDN) that shows the fleet, highlights rows as they move, and
streams position updates in real time.

**Live demo:** [{Live demo}](https://mock-vehicle-api.netlify.app/)
**API:** {RENDER_URL}
**Performance report:** [PERFORMANCE.md](./PERFORMANCE.md)
**API reference:** [docs/API.md](./docs/API.md)

## Quick start (one command)

```bash
npm install
npm start
```

`npm start` auto-generates `vehicles.json` if it doesn't exist, then boots the
server on **http://localhost:3000**.

To regenerate the dataset manually:

```bash
npm run generate
```

## Endpoints

| Method | Path             | Description |
|-------:|------------------|-------------|
| GET    | `/`              | Live dashboard |
| GET    | `/vehicles`      | Full list of 400 vehicles. Supports `json-server` query params (`?_page=1&_limit=10`, `?status=active`, `?q=Smith`). |
| GET    | `/vehicles/:id`  | A single vehicle by id |
| GET    | `/positions`     | **SSE stream.** Emits a `position` event every 5 s for a random vehicle |

### Vehicle shape

```json
{ "id": 1, "plate": "AB-1234-CD", "driver": "James Smith",
  "status": "active", "lat": 38.123456, "lng": -97.654321 }
```

### SSE payload (`position` event)

```json
{ "id": 42, "plate": "XY-9876-ZW", "driver": "Mary Johnson",
  "status": "idle", "lat": 38.124789, "lng": -97.653012,
  "timestamp": "2024-01-01T12:00:05.000Z" }
```

## Dashboard features

- Live fleet table with sortable columns and column flashes on update
- Search by plate / driver / status / id
- Status filter chips (All / Active / Idle / Offline / Maintenance)
- Page size selector (25 / 50 / 100 / All) with pager
- Click a row → slide-in detail drawer with map pin visual
- "Locate in table" jumps to and flashes the vehicle
- Pause / resume live feed, clear feed
- Toast notifications for actions
- Connection status pill (Live / Reconnecting)

## Testing from PowerShell

`curl` is aliased to `Invoke-WebRequest` in PowerShell. Use `curl.exe`:

```powershell
curl.exe http://localhost:3000/vehicles | Select-Object -First 1
curl.exe "http://localhost:3000/vehicles?_limit=3"
curl.exe http://localhost:3000/vehicles/1
curl.exe -N http://localhost:3000/positions
```

Or open **http://localhost:3000/** in the browser to see the dashboard.

## Project layout

```
mock-vehicle-api/
├── package.json
├── server.js
├── README.md
├── scripts/
│   └── generate-vehicles.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── vehicles.json        (generated on first run)
```