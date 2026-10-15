const express = require('express');
const cors = require('cors');
require('dotenv').config();

const stationController = require('./controllers/stationController');
const routeController = require('./controllers/routeController');
const authController = require('./controllers/authController');
const nodeController = require('./controllers/nodeController');
const edgeController = require('./controllers/edgeController');
const authenticateToken = require('./middleware/auth');

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',  // vite preview
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'https://fantastic-bonbon-2faafd.netlify.app',
  /^https:\/\/.*--fantastic-bonbon-2faafd\.netlify\.app$/,
];

if (process.env.CLIENT_URL) {
  const envUrls = process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean);
  for (const url of envUrls) {
    if (!allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  }
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 204,
};

const app = express();

// Register CORS middleware before all routes and handle preflight OPTIONS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth APIs
app.post('/api/auth/login', authController.login);

// Stations APIs (Public)
app.get('/api/stations', stationController.getStations);
app.get('/api/stations/:id', stationController.getStationById);
app.get('/api/stations/:id/nodes', stationController.getNodes);
app.get('/api/stations/:id/edges', stationController.getEdges);

// Stations APIs (Protected Admin)
app.post('/api/stations', authenticateToken, stationController.createStation);
app.put('/api/stations/:id', authenticateToken, stationController.updateStation);
app.patch('/api/stations/:id', authenticateToken, stationController.updateStation);
app.delete('/api/stations/:id', authenticateToken, stationController.deleteStation);

// Nodes APIs (Protected Admin)
app.post('/api/nodes', authenticateToken, nodeController.createNode);
app.put('/api/nodes/:id', authenticateToken, nodeController.updateNode);
app.patch('/api/nodes/:id', authenticateToken, nodeController.updateNode);
app.delete('/api/nodes/:id', authenticateToken, nodeController.deleteNode);

// Edges APIs (Protected Admin)
app.post('/api/edges', authenticateToken, edgeController.createEdge);
app.put('/api/edges/:id', authenticateToken, edgeController.updateEdge);
app.patch('/api/edges/:id', authenticateToken, edgeController.updateEdge);
app.delete('/api/edges/:id', authenticateToken, edgeController.deleteEdge);

// Route APIs (Public)
app.get('/api/route', routeController.getRoute);
app.get('/api/nearest', routeController.getNearest);

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
