const prisma = require('../config/db');

exports.createEdge = async (req, res) => {
  try {
    const { station_id, from_node, to_node, distance, is_accessible, has_stairs } = req.body || {};

    if (from_node === undefined || from_node === null || from_node === '') {
      return res.status(400).json({ error: 'from_node is required' });
    }
    if (to_node === undefined || to_node === null || to_node === '') {
      return res.status(400).json({ error: 'to_node is required' });
    }

    const fromId = Number(from_node);
    const toId = Number(to_node);

    if (isNaN(fromId) || !Number.isInteger(fromId) || isNaN(toId) || !Number.isInteger(toId)) {
      return res.status(400).json({ error: 'from_node and to_node must be valid integers' });
    }

    if (fromId === toId) {
      return res.status(400).json({ error: 'from_node and to_node cannot be the same' });
    }

    // Verify nodes exist
    const fromNode = await prisma.node.findUnique({ where: { id: fromId } });
    if (!fromNode) {
      return res.status(404).json({ error: 'From node not found' });
    }

    const toNode = await prisma.node.findUnique({ where: { id: toId } });
    if (!toNode) {
      return res.status(404).json({ error: 'To node not found' });
    }

    // Verify both nodes belong to the same station
    if (fromNode.station_id !== toNode.station_id) {
      return res.status(400).json({ error: 'from_node and to_node must belong to the same station' });
    }

    // If station_id is provided, verify match
    if (station_id !== undefined && station_id !== null && station_id !== '') {
      const sId = Number(station_id);
      if (isNaN(sId) || sId !== fromNode.station_id) {
        return res.status(400).json({ error: 'station_id does not match node station' });
      }
    }

    let edgeDistance;
    if (distance !== undefined && distance !== null && distance !== '') {
      const distNum = Number(distance);
      if (isNaN(distNum) || distNum <= 0) {
        return res.status(400).json({ error: 'distance must be a positive number' });
      }
      edgeDistance = distNum;
    } else {
      edgeDistance = Math.max(1, Math.round(Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y)));
    }

    const stairs = has_stairs !== undefined ? Boolean(has_stairs) : false;
    const accessible = is_accessible !== undefined ? Boolean(is_accessible) : !stairs;

    const edgeForward = {
      station_id: fromNode.station_id,
      from_node: fromId,
      to_node: toId,
      distance: edgeDistance,
      is_accessible: accessible,
      has_stairs: stairs
    };

    const edgeBackward = {
      station_id: fromNode.station_id,
      from_node: toId,
      to_node: fromId,
      distance: edgeDistance,
      is_accessible: accessible,
      has_stairs: stairs
    };

    // Create edge in both directions
    const [createdForward, createdBackward] = await prisma.$transaction([
      prisma.edge.create({ data: edgeForward }),
      prisma.edge.create({ data: edgeBackward })
    ]);

    res.status(201).json({ edges: [createdForward, createdBackward] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEdge = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid edge ID' });
    }

    const existingEdge = await prisma.edge.findUnique({ where: { id } });
    if (!existingEdge) {
      return res.status(404).json({ error: 'Edge not found' });
    }

    const { distance, is_accessible, has_stairs, from_node, to_node } = req.body || {};
    const updateData = {};

    if (distance !== undefined) {
      const distNum = Number(distance);
      if (isNaN(distNum) || distNum <= 0) {
        return res.status(400).json({ error: 'distance must be a positive number' });
      }
      updateData.distance = distNum;
    }

    if (has_stairs !== undefined) {
      updateData.has_stairs = Boolean(has_stairs);
    }

    if (is_accessible !== undefined) {
      updateData.is_accessible = Boolean(is_accessible);
    }

    let targetFrom = existingEdge.from_node;
    let targetTo = existingEdge.to_node;

    if (from_node !== undefined) {
      const fId = Number(from_node);
      if (isNaN(fId)) return res.status(400).json({ error: 'from_node must be a valid number' });
      const fNode = await prisma.node.findUnique({ where: { id: fId } });
      if (!fNode) return res.status(404).json({ error: 'From node not found' });
      if (fNode.station_id !== existingEdge.station_id) {
        return res.status(400).json({ error: 'from_node must belong to the same station' });
      }
      targetFrom = fId;
      updateData.from_node = fId;
    }

    if (to_node !== undefined) {
      const tId = Number(to_node);
      if (isNaN(tId)) return res.status(400).json({ error: 'to_node must be a valid number' });
      const tNode = await prisma.node.findUnique({ where: { id: tId } });
      if (!tNode) return res.status(404).json({ error: 'To node not found' });
      if (tNode.station_id !== existingEdge.station_id) {
        return res.status(400).json({ error: 'to_node must belong to the same station' });
      }
      targetTo = tId;
      updateData.to_node = tId;
    }

    if (targetFrom === targetTo) {
      return res.status(400).json({ error: 'from_node and to_node cannot be the same' });
    }

    // Also sync the reverse edge properties (distance, accessibility, stairs)
    const reverseData = {};
    if (updateData.distance !== undefined) reverseData.distance = updateData.distance;
    if (updateData.is_accessible !== undefined) reverseData.is_accessible = updateData.is_accessible;
    if (updateData.has_stairs !== undefined) reverseData.has_stairs = updateData.has_stairs;

    if (Object.keys(reverseData).length > 0) {
      await prisma.edge.updateMany({
        where: {
          station_id: existingEdge.station_id,
          from_node: existingEdge.to_node,
          to_node: existingEdge.from_node
        },
        data: reverseData
      });
    }

    const updated = await prisma.edge.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEdge = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid edge ID' });
    }

    const existingEdge = await prisma.edge.findUnique({ where: { id } });
    if (!existingEdge) {
      return res.status(404).json({ error: 'Edge not found' });
    }

    // Delete edge and its reverse edge
    await prisma.$transaction([
      prisma.edge.deleteMany({
        where: {
          station_id: existingEdge.station_id,
          from_node: existingEdge.to_node,
          to_node: existingEdge.from_node
        }
      }),
      prisma.edge.delete({ where: { id } })
    ]);

    res.json({ message: 'Edge deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
