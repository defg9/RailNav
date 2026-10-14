const { buildGraph, findShortestPath, findNearest, generateDirections } = require('../utils/dijkstra');

describe('Dijkstra Logic', () => {
  const nodes = [
    { id: 1, name: 'Entrance', name_hi: 'ए', type: 'entrance', floor: 0 },
    { id: 2, name: 'Platform', name_hi: 'बी', type: 'platform', floor: 0 },
    { id: 3, name: 'Stairs', name_hi: 'सीढ़ियाँ', type: 'stairs', floor: 0 },
    { id: 4, name: 'Lift', name_hi: 'लिफ्ट', type: 'lift', floor: 0 },
    { id: 5, name: 'FOB', name_hi: 'सी', type: 'restroom', floor: 1 }
  ];

  const edges = [
    { from_node: 1, to_node: 2, distance: 10, is_accessible: true, has_stairs: false },
    { from_node: 2, to_node: 1, distance: 10, is_accessible: true, has_stairs: false },
    
    // Shortcut via stairs
    { from_node: 2, to_node: 3, distance: 5, is_accessible: true, has_stairs: false },
    { from_node: 3, to_node: 2, distance: 5, is_accessible: true, has_stairs: false },
    { from_node: 3, to_node: 5, distance: 10, is_accessible: false, has_stairs: true },
    { from_node: 5, to_node: 3, distance: 10, is_accessible: false, has_stairs: true },
    
    // Longer via lift
    { from_node: 2, to_node: 4, distance: 20, is_accessible: true, has_stairs: false },
    { from_node: 4, to_node: 2, distance: 20, is_accessible: true, has_stairs: false },
    { from_node: 4, to_node: 5, distance: 10, is_accessible: true, has_stairs: false },
    { from_node: 5, to_node: 4, distance: 10, is_accessible: true, has_stairs: false },
  ];

  test('Normal route (accessible = false) uses shortest path', () => {
    const graph = buildGraph(nodes, edges, false);
    const result = findShortestPath(graph, 1, 5);
    expect(result.distance).toBe(25); // 1->2 (10) + 2->3 (5) + 3->5 (10)
    expect(result.path).toEqual([1, 2, 3, 5]);
  });

  test('Accessible route (accessible = true) uses longer path', () => {
    const graph = buildGraph(nodes, edges, true);
    const result = findShortestPath(graph, 1, 5);
    expect(result.distance).toBe(40); // 1->2 (10) + 2->4 (20) + 4->5 (10)
    expect(result.path).toEqual([1, 2, 4, 5]);
  });

  test('No route case returns null', () => {
    const isolatedNodes = [...nodes, { id: 99, name: 'Isolated', floor: 0 }];
    const graph = buildGraph(isolatedNodes, edges, false);
    const result = findShortestPath(graph, 1, 99);
    expect(result).toBeNull();
  });

  test('Find nearest node of type', () => {
    const graph = buildGraph(nodes, edges, false);
    const result = findNearest(graph, nodes, 1, 'restroom');
    expect(result.nodeId).toBe(5);
    expect(result.distance).toBe(25);
  });
  
  test('Same from and to', () => {
    const graph = buildGraph(nodes, edges, false);
    const result = findShortestPath(graph, 1, 1);
    expect(result.distance).toBe(0);
    expect(result.path).toEqual([1]);
  });
});
