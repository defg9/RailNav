# RailNav

RailNav is a production-ready railway station navigation web application. It provides interactive station maps with multi-floor layouts, route finding between facilities, and accessibility-aware path calculation.

## Features

- **Interactive SVG Maps** - Pan, zoom, and switch floors on detailed station layouts
- **Route Finding** - Find step-by-step directions between any two points (ticket counters, platforms, restrooms, food stalls, etc.)
- **Accessibility Mode** - Toggle to avoid stairs and use lifts/ramps only
- **Nearest Facility** - Quick buttons to find the closest restroom, food, help desk, ticket counter, lift, entrance, or waiting room from your location
- **Bilingual UI** - English and Hindi (हिन्दी) with persistent language preference
- **Multi-floor Support** - Foot-over-bridges, concourses, and platform levels
- **Admin Dashboard** - Secure CRUD management for stations, nodes, and walking edges

## Tech Stack

- **Frontend**: React 18 + Vite, React Router, Vanilla CSS (production railway design system)
- **Backend**: Node.js + Express, Prisma ORM, SQLite
- **Routing Algorithm**: Dijkstra's algorithm with accessibility constraints

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/railnav.git
cd railnav

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Configuration

Create `.env` in both `server/` and `client/` directories based on the provided `.env.example` templates:

```bash
# Server (.env)
cp server/.env.example server/.env

# Client (.env)
cp client/.env.example client/.env
```

### Database Setup

```bash
cd server
npx prisma db push
npm run seed
```

### Development

```bash
# Terminal 1 - Start backend (port 5000)
cd server
npm run dev

# Terminal 2 - Start frontend (port 5173)
cd client
npm run dev
```

## Project Structure

```
RailNav/
├── .gitignore              # Root gitignore excluding secrets & build outputs
├── client/                 # React frontend
│   ├── .env.example        # Client environment template
│   ├── .gitignore          # Client-specific gitignore
│   ├── src/
│   │   ├── components/     # Navbar, RoutePanel, MapViewer, etc.
│   │   ├── pages/          # Home, StationPage, AdminLogin, AdminDashboard
│   │   ├── context/        # Language, Auth contexts
│   │   ├── locales/        # en.json, hi.json
│   │   └── api/            # Axios API client
│   └── index.html
└── server/                 # Express backend
    ├── .env.example        # Server environment template
    ├── .gitignore          # Server-specific gitignore
    ├── controllers/        # Route, station, auth controllers
    ├── middleware/         # JWT authentication
    ├── utils/              # Dijkstra implementation
    ├── seed/               # Station data seed scripts
    └── prisma/             # Schema & migrations
```

## License

MIT
