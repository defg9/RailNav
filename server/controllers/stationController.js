const prisma = require('../config/db');

// Public GET routes
exports.getStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid station ID' });

    const station = await prisma.station.findUnique({ where: { id } });
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNodes = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid station ID' });

    const { type, q } = req.query;
    const whereClause = { station_id: id };
    if (type) whereClause.type = type;
    if (q) {
      whereClause.OR = [
        { name: { contains: q } },
        { name_hi: { contains: q } }
      ];
    }
    const nodes = await prisma.node.findMany({ where: whereClause });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEdges = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid station ID' });

    const edges = await prisma.edge.findMany({ where: { station_id: id } });
    res.json(edges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Protected Admin routes
exports.createStation = async (req, res) => {
  try {
    const { name, name_hi, city, code } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Station name is required' });
    }

    const station = await prisma.station.create({
      data: {
        name: name.trim(),
        name_hi: name_hi && typeof name_hi === 'string' ? name_hi.trim() : null,
        city: city && typeof city === 'string' ? city.trim() : null,
        code: code && typeof code === 'string' ? code.trim().toUpperCase() : null
      }
    });

    res.status(201).json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid station ID' });
    }

    const station = await prisma.station.findUnique({ where: { id } });
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const { name, name_hi, city, code } = req.body || {};
    const updateData = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Station name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (name_hi !== undefined) {
      updateData.name_hi = name_hi && typeof name_hi === 'string' ? name_hi.trim() : null;
    }
    if (city !== undefined) {
      updateData.city = city && typeof city === 'string' ? city.trim() : null;
    }
    if (code !== undefined) {
      updateData.code = code && typeof code === 'string' ? code.trim().toUpperCase() : null;
    }

    const updated = await prisma.station.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid station ID' });
    }

    const station = await prisma.station.findUnique({ where: { id } });
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Cascade delete: delete station's edges, nodes, then the station
    await prisma.$transaction([
      prisma.edge.deleteMany({ where: { station_id: id } }),
      prisma.node.deleteMany({ where: { station_id: id } }),
      prisma.station.delete({ where: { id } })
    ]);

    res.json({ message: 'Station deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
