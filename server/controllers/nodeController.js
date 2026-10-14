const prisma = require('../config/db');

exports.createNode = async (req, res) => {
  try {
    const { station_id, name, name_hi, type, floor, x, y, accessible } = req.body || {};

    if (station_id === undefined || station_id === null || station_id === '') {
      return res.status(400).json({ error: 'station_id is required' });
    }
    const stationIdNum = Number(station_id);
    if (isNaN(stationIdNum) || !Number.isInteger(stationIdNum)) {
      return res.status(400).json({ error: 'station_id must be a valid integer' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Node name is required' });
    }
    if (!type || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({ error: 'Node type is required' });
    }

    if (floor === undefined || floor === null || floor === '' || isNaN(Number(floor))) {
      return res.status(400).json({ error: 'floor must be a valid number' });
    }
    if (x === undefined || x === null || x === '' || isNaN(Number(x))) {
      return res.status(400).json({ error: 'x must be a valid number' });
    }
    if (y === undefined || y === null || y === '' || isNaN(Number(y))) {
      return res.status(400).json({ error: 'y must be a valid number' });
    }

    // Verify station exists
    const station = await prisma.station.findUnique({ where: { id: stationIdNum } });
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const node = await prisma.node.create({
      data: {
        station_id: stationIdNum,
        name: name.trim(),
        name_hi: name_hi && typeof name_hi === 'string' ? name_hi.trim() : null,
        type: type.trim(),
        floor: Number(floor),
        x: Number(x),
        y: Number(y),
        accessible: accessible !== undefined ? Boolean(accessible) : true
      }
    });

    res.status(201).json(node);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNode = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const existingNode = await prisma.node.findUnique({ where: { id } });
    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const { station_id, name, name_hi, type, floor, x, y, accessible } = req.body || {};
    const updateData = {};

    if (station_id !== undefined) {
      const sId = Number(station_id);
      if (isNaN(sId) || !Number.isInteger(sId)) {
        return res.status(400).json({ error: 'station_id must be a valid integer' });
      }
      const station = await prisma.station.findUnique({ where: { id: sId } });
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      updateData.station_id = sId;
    }

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Node name cannot be empty' });
      }
      updateData.name = name.trim();
    }

    if (name_hi !== undefined) {
      updateData.name_hi = name_hi && typeof name_hi === 'string' ? name_hi.trim() : null;
    }

    if (type !== undefined) {
      if (!type || typeof type !== 'string' || !type.trim()) {
        return res.status(400).json({ error: 'Node type cannot be empty' });
      }
      updateData.type = type.trim();
    }

    if (floor !== undefined) {
      if (isNaN(Number(floor))) {
        return res.status(400).json({ error: 'floor must be a valid number' });
      }
      updateData.floor = Number(floor);
    }

    if (x !== undefined) {
      if (isNaN(Number(x))) {
        return res.status(400).json({ error: 'x must be a valid number' });
      }
      updateData.x = Number(x);
    }

    if (y !== undefined) {
      if (isNaN(Number(y))) {
        return res.status(400).json({ error: 'y must be a valid number' });
      }
      updateData.y = Number(y);
    }

    if (accessible !== undefined) {
      updateData.accessible = Boolean(accessible);
    }

    const updated = await prisma.node.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNode = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const existingNode = await prisma.node.findUnique({ where: { id } });
    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Cascade delete: delete node's edges, then the node
    await prisma.$transaction([
      prisma.edge.deleteMany({
        where: {
          OR: [
            { from_node: id },
            { to_node: id }
          ]
        }
      }),
      prisma.node.delete({ where: { id } })
    ]);

    res.json({ message: 'Node deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
