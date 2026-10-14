# RailNav

RailNav is a railway station navigation web application for Indian Railways. It provides interactive station maps with multi-floor layouts, route finding between facilities, and accessibility-aware path calculation.

## Features

- **Interactive SVG Maps** - Pan, zoom, and switch floors on detailed station layouts
- **Route Finding** - Find step-by-step directions between any two points (ticket counters, platforms, restrooms, food stalls, etc.)
- **Accessibility Mode** - Toggle to avoid stairs and use lifts/ramps only
- **Nearest Facility** - Quick buttons to find the closest restroom, food, help desk, ticket counter, lift, entrance, or waiting room from your location
- **Bilingual UI** - English and Hindi (हिन्दी) with persistent language preference
- **Multi-floor Support** - Foot-over-bridges, concourses, and platform levels

## Tech Stack

- **Frontend**: React 18 + Vite, React Router, vanilla CSS (glassmorphism design)
- **Backend**: Node.js + Express, Prisma ORM, SQLite
- **Routing Algorithm**: Dijkstra's algorithm with accessibility constraints

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Development

```bash
# Terminal 1 - Start backend (port 5000)
cd server && npm run dev

# Terminal 2 - Start frontend (port 5173)
cd client && npm run dev
```

### Database Setup

```bash
cd server
npx prisma migrate dev
npm run seed
```

## Project Structure

```
RailNav/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Navbar, RoutePanel, MapViewer, etc.
│   │   ├── pages/          # Home, StationPage, AdminLogin, AdminDashboard
│   │   ├── context/        # Language, Auth contexts
│   │   ├── locales/        # en.json, hi.json
│   │   └── api/            # Axios API client
│   └── index.html
└── server/                 # Express backend
    ├── controllers/        # Route, station, auth controllers
    ├── utils/              # Dijkstra implementation
    ├── seed/               # Station data seed scripts
    └── prisma/             # Schema & migrations
```

## License

MIT