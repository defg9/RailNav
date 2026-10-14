class PriorityQueue {
  constructor() { this.values = []; }
  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }
  dequeue() { return this.values.shift(); }
  sort() { this.values.sort((a, b) => a.priority - b.priority); }
  isEmpty() { return this.values.length === 0; }
}

function buildGraph(nodes, edges, accessibleOnly) {
  const adjacencyList = {};
  nodes.forEach(node => { adjacencyList[node.id] = []; });
  
  edges.forEach(edge => {
    if (accessibleOnly && (!edge.is_accessible || edge.has_stairs)) return;
    if (adjacencyList[edge.from_node]) {
      adjacencyList[edge.from_node].push({ node: edge.to_node, weight: edge.distance });
    }
  });
  return adjacencyList;
}

function findShortestPath(adjacencyList, startId, endId) {
  if (startId === endId) return { path: [startId], distance: 0 };
  
  const nodes = new PriorityQueue();
  const distances = {};
  const previous = {};
  let path = []; 
  
  for (let vertex in adjacencyList) {
    const vId = Number(vertex);
    if (vId === startId) {
      distances[vId] = 0;
      nodes.enqueue(vId, 0);
    } else {
      distances[vId] = Infinity;
      nodes.enqueue(vId, Infinity);
    }
    previous[vId] = null;
  }
  
  while (!nodes.isEmpty()) {
    let smallest = nodes.dequeue().val;
    if (smallest === endId) {
      while (previous[smallest]) {
        path.push(smallest);
        smallest = previous[smallest];
      }
      break;
    }
    
    if (smallest || distances[smallest] !== Infinity) {
      for (let neighbor of adjacencyList[smallest]) {
        let candidate = distances[smallest] + neighbor.weight;
        let nextNeighbor = neighbor.node;
        if (candidate < distances[nextNeighbor]) {
          distances[nextNeighbor] = candidate;
          previous[nextNeighbor] = smallest;
          nodes.enqueue(nextNeighbor, candidate);
        }
      }
    }
  }
  
  if (path.length === 0) return null; // No route found
  path = path.concat(startId).reverse();
  return { path, distance: distances[endId] };
}

function findNearest(adjacencyList, nodes, startId, targetType) {
  const queue = new PriorityQueue();
  const distances = {};
  
  for (let vertex in adjacencyList) {
    distances[vertex] = Infinity;
  }
  
  distances[startId] = 0;
  queue.enqueue(startId, 0);
  
  let closestNodeId = null;
  let minDistance = Infinity;

  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);
  
  while (!queue.isEmpty()) {
    let current = queue.dequeue().val;
    
    if (nodeMap[current] && nodeMap[current].type === targetType) {
      closestNodeId = current;
      minDistance = distances[current];
      break;
    }
    
    if (distances[current] !== Infinity) {
      for (let neighbor of adjacencyList[current]) {
        let candidate = distances[current] + neighbor.weight;
        let nextNeighbor = neighbor.node;
        if (candidate < distances[nextNeighbor]) {
          distances[nextNeighbor] = candidate;
          queue.enqueue(nextNeighbor, candidate);
        }
      }
    }
  }
  
  if (!closestNodeId) return null;
  return { nodeId: closestNodeId, distance: minDistance };
}

function generateDirections(pathNodes, adjacencyList) {
  const directionsEn = [];
  const directionsHi = [];
  
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const current = pathNodes[i];
    const next = pathNodes[i+1];
    
    const edge = adjacencyList[current.id]?.find(e => e.node === next.id);
    const dist = edge ? edge.weight : 0;
    
    if (current.floor !== next.floor) {
      const toolEn = next.type === 'lift' ? 'lift' : 'stairs';
      const toolHi = next.type === 'lift' ? 'लिफ्ट' : 'सीढ़ियों';
      directionsEn.push(`Take the ${toolEn} to floor ${next.floor}`);
      directionsHi.push(`${toolHi} लेकर फ़्लोर ${next.floor} पर जाएं`);
    } else if (dist > 0) {
      directionsEn.push(`Walk ${dist}m towards ${next.name}`);
      directionsHi.push(`${next.name_hi || next.name} की ओर ${dist} मीटर चलें`);
    } else {
      directionsEn.push(`Go to ${next.name}`);
      directionsHi.push(`${next.name_hi || next.name} पर जाएं`);
    }
  }
  
  directionsEn.push(`You have arrived at ${pathNodes[pathNodes.length-1].name}`);
  directionsHi.push(`आप ${pathNodes[pathNodes.length-1].name_hi || pathNodes[pathNodes.length-1].name} पर पहुंच गए हैं`);
  
  return { en: directionsEn, hi: directionsHi };
}

module.exports = { buildGraph, findShortestPath, findNearest, generateDirections };
