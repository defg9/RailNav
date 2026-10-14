const prisma = require('../config/db');
const { buildGraph, findShortestPath, findNearest, generateDirections } = require('../utils/dijkstra');

exports.getRoute = async (req, res) => {
  try {
    const stationId = Number(req.query.station_id);
    const fromId = Number(req.query.from);
    const toId = Number(req.query.to);
    const accessible = req.query.accessible === 'true';

    if (!stationId || !fromId || !toId) {
      return res.status(400).json({ error: 'Missing station_id, from, or to parameters' });
    }

    if (fromId === toId) {
      return res.json({
        path: [], 
        distance: 0, 
        eta_minutes: 0, 
        directions: { en: ['You are already there'], hi: ['आप पहले से ही वहां हैं'] }
      });
    }

    const nodes = await prisma.node.findMany({ where: { station_id: stationId } });
    const edges = await prisma.edge.findMany({ where: { station_id: stationId } });
    
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);
    
    if (!nodeMap[fromId] || !nodeMap[toId]) {
      return res.status(404).json({ error: 'Start or end node not found in this station' });
    }

    const graph = buildGraph(nodes, edges, accessible);
    const result = findShortestPath(graph, fromId, toId);

    if (!result) {
      return res.status(200).json({ 
        error: accessible ? 'No accessible route found between these locations.' : 'No route found between these locations.' 
      });
    }

    const pathNodes = result.path.map(id => nodeMap[id]);
    const directions = generateDirections(pathNodes, graph);
    const eta_minutes = Math.round((result.distance / 1.2) / 60);

    res.json({
      path: pathNodes.map(n => ({ id: n.id, name: n.name, name_hi: n.name_hi, type: n.type, floor: n.floor, x: n.x, y: n.y })),
      distance: result.distance,
      eta_minutes,
      directions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNearest = async (req, res) => {
  try {
    const stationId = Number(req.query.station_id);
    const fromId = Number(req.query.from);
    const type = req.query.type;
    const accessible = req.query.accessible === 'true';

    if (!stationId || !fromId || !type) {
      return res.status(400).json({ error: 'Missing station_id, from, or type parameters' });
    }

    const nodes = await prisma.node.findMany({ where: { station_id: stationId } });
    const edges = await prisma.edge.findMany({ where: { station_id: stationId } });

    const graph = buildGraph(nodes, edges, accessible);
    const result = findNearest(graph, nodes, fromId, type);

    if (!result) {
      return res.status(200).json({ error: 'No reachable facility of that type found.' });
    }

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const routeRes = findShortestPath(graph, fromId, result.nodeId);
    const pathNodes = routeRes.path.map(id => nodeMap[id]);
    const directions = generateDirections(pathNodes, graph);
    const eta_minutes = Math.round((result.distance / 1.2) / 60);

    res.json({
      target: { id: nodeMap[result.nodeId].id, name: nodeMap[result.nodeId].name, name_hi: nodeMap[result.nodeId].name_hi, type: nodeMap[result.nodeId].type },
      path: pathNodes.map(n => ({ id: n.id, name: n.name, name_hi: n.name_hi, type: n.type, floor: n.floor, x: n.x, y: n.y })),
      distance: result.distance,
      eta_minutes,
      directions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
