const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../server');
const prisma = require('../config/db');

describe('Auth & Protected Admin Routes', () => {
  let server;
  let baseUrl;
  let adminToken;
  let testStationId;
  let testNode1Id;
  let testNode2Id;
  let otherStationId;
  let otherNodeId;

  beforeAll(async () => {
    // Start server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });

    // Ensure admin user exists
    const passwordHash = await bcrypt.hash('securepassword123', 10);
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password_hash: passwordHash },
      create: { username: 'admin', password_hash: passwordHash }
    });
  });

  afterAll(async () => {
    // Cleanup any test data if remaining
    if (testStationId) {
      await prisma.edge.deleteMany({ where: { station_id: testStationId } }).catch(() => {});
      await prisma.node.deleteMany({ where: { station_id: testStationId } }).catch(() => {});
      await prisma.station.delete({ where: { id: testStationId } }).catch(() => {});
    }
    if (otherStationId) {
      await prisma.edge.deleteMany({ where: { station_id: otherStationId } }).catch(() => {});
      await prisma.node.deleteMany({ where: { station_id: otherStationId } }).catch(() => {});
      await prisma.station.delete({ where: { id: otherStationId } }).catch(() => {});
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  });

  describe('1. POST /api/auth/login', () => {
    test('Fails with 400 when missing username or password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' })
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('Fails with 401 when username does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent_user_999', password: 'password' })
      });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toMatch(/Invalid username or password/i);
    });

    test('Fails with 401 when password is wrong', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong_password_xyz' })
      });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toMatch(/Invalid username or password/i);
    });

    test('Succeeds with correct credentials and returns JWT valid for 8 hours', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'securepassword123' })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.token).toBeDefined();

      adminToken = data.token;

      // Verify token payload and expiry
      const secret = process.env.JWT_SECRET || 'supersecretjwtkey_replace_me';
      const decoded = jwt.verify(adminToken, secret);
      expect(decoded.username).toBe('admin');
      // 8 hours = 28800 seconds (allow small margin)
      const diffSecs = decoded.exp - decoded.iat;
      expect(diffSecs).toBe(8 * 3600);
    });
  });

  describe('2. Authentication Middleware Protection', () => {
    test('Protected route without token returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Station' })
      });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('Protected route with invalid token returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bad_token_12345'
        },
        body: JSON.stringify({ name: 'Test Station' })
      });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toMatch(/Invalid or expired token/i);
    });
  });

  describe('3. Protected Station Routes & Validation', () => {
    test('POST /api/stations validates required name field', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: '' })
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/name is required/i);
    });

    test('POST /api/stations creates a new station', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Agra Cantt',
          name_hi: 'आगरा कैंट',
          city: 'Agra',
          code: 'AGC'
        })
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Agra Cantt');
      expect(data.code).toBe('AGC');
      testStationId = data.id;
    });

    test('PUT /api/stations/:id updates station details', async () => {
      const res = await fetch(`${baseUrl}/api/stations/${testStationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Agra Cantt Junction'
        })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Agra Cantt Junction');
    });

    test('PUT /api/stations/:id returns 404 for non-existent station', async () => {
      const res = await fetch(`${baseUrl}/api/stations/999999`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: 'Ghost Station' })
      });
      expect(res.status).toBe(404);
    });
  });

  describe('4. Protected Node Routes & Validation', () => {
    test('POST /api/nodes validates required fields and types', async () => {
      const res = await fetch(`${baseUrl}/api/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          station_id: testStationId,
          name: 'Gate 1'
          // missing type, floor, x, y
        })
      });
      expect(res.status).toBe(400);
    });

    test('POST /api/nodes returns 404 when station does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          station_id: 999999,
          name: 'Gate 1',
          type: 'entrance',
          floor: 0,
          x: 10,
          y: 20
        })
      });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toMatch(/Station not found/i);
    });

    test('POST /api/nodes creates nodes successfully', async () => {
      const res1 = await fetch(`${baseUrl}/api/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          station_id: testStationId,
          name: 'Main Gate',
          type: 'entrance',
          floor: 0,
          x: 10,
          y: 20,
          accessible: true
        })
      });
      const data1 = await res1.json();
      expect(res1.status).toBe(201);
      testNode1Id = data1.id;

      const res2 = await fetch(`${baseUrl}/api/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          station_id: testStationId,
          name: 'Platform 1',
          type: 'platform',
          floor: 0,
          x: 50,
          y: 20,
          accessible: true
        })
      });
      const data2 = await res2.json();
      expect(res2.status).toBe(201);
      testNode2Id = data2.id;
    });

    test('PUT /api/nodes/:id updates node successfully', async () => {
      const res = await fetch(`${baseUrl}/api/nodes/${testNode1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Main Gate East'
        })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Main Gate East');
    });

    test('PUT /api/nodes/:id returns 404 for non-existent node', async () => {
      const res = await fetch(`${baseUrl}/api/nodes/999999`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: 'Unknown' })
      });
      expect(res.status).toBe(404);
    });
  });

  describe('5. Protected Edge Routes & Validation', () => {
    beforeAll(async () => {
      // Create a second station with a node to test cross-station validation
      const s = await prisma.station.create({
        data: { name: 'Mathura Junction', code: 'MTJ' }
      });
      otherStationId = s.id;
      const n = await prisma.node.create({
        data: {
          station_id: otherStationId,
          name: 'MTJ Entrance',
          type: 'entrance',
          floor: 0,
          x: 0,
          y: 0
        }
      });
      otherNodeId = n.id;
    });

    test('POST /api/edges fails when from_node and to_node are the same', async () => {
      const res = await fetch(`${baseUrl}/api/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          from_node: testNode1Id,
          to_node: testNode1Id
        })
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/cannot be the same/i);
    });

    test('POST /api/edges fails 404 when node does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          from_node: testNode1Id,
          to_node: 999999
        })
      });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    test('POST /api/edges fails 400 when from and to nodes belong to different stations', async () => {
      const res = await fetch(`${baseUrl}/api/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          from_node: testNode1Id,
          to_node: otherNodeId
        })
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/same station/i);
    });

    test('POST /api/edges creates edge in both directions', async () => {
      const res = await fetch(`${baseUrl}/api/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          from_node: testNode1Id,
          to_node: testNode2Id,
          distance: 40,
          is_accessible: true
        })
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.edges).toHaveLength(2);

      const fwd = data.edges.find(e => e.from_node === testNode1Id && e.to_node === testNode2Id);
      const bwd = data.edges.find(e => e.from_node === testNode2Id && e.to_node === testNode1Id);
      expect(fwd).toBeDefined();
      expect(bwd).toBeDefined();
      expect(fwd.distance).toBe(40);
      expect(bwd.distance).toBe(40);
    });

    test('PUT /api/edges/:id updates edge and reverse edge', async () => {
      const edge = await prisma.edge.findFirst({
        where: { station_id: testStationId, from_node: testNode1Id, to_node: testNode2Id }
      });
      expect(edge).toBeDefined();

      const res = await fetch(`${baseUrl}/api/edges/${edge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ distance: 45 })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.distance).toBe(45);

      // Verify reverse edge was also updated
      const reverseEdge = await prisma.edge.findFirst({
        where: { station_id: testStationId, from_node: testNode2Id, to_node: testNode1Id }
      });
      expect(reverseEdge.distance).toBe(45);
    });
  });

  describe('6. Cascade Deletion (Node and Station)', () => {
    test('Deleting a node also deletes its edges', async () => {
      // First verify edges exist connected to testNode2Id
      const countBefore = await prisma.edge.count({
        where: {
          OR: [{ from_node: testNode2Id }, { to_node: testNode2Id }]
        }
      });
      expect(countBefore).toBeGreaterThan(0);

      const res = await fetch(`${baseUrl}/api/nodes/${testNode2Id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);

      // Verify node is deleted
      const nodeCheck = await prisma.node.findUnique({ where: { id: testNode2Id } });
      expect(nodeCheck).toBeNull();

      // Verify connected edges are deleted
      const countAfter = await prisma.edge.count({
        where: {
          OR: [{ from_node: testNode2Id }, { to_node: testNode2Id }]
        }
      });
      expect(countAfter).toBe(0);
    });

    test('Deleting a station deletes its nodes and edges', async () => {
      // Create a dummy node in testStationId
      const dummyNode = await prisma.node.create({
        data: {
          station_id: testStationId,
          name: 'Temp Node',
          type: 'waypoint',
          floor: 0,
          x: 0,
          y: 0
        }
      });

      const res = await fetch(`${baseUrl}/api/stations/${testStationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);

      // Verify station deleted
      const stationCheck = await prisma.station.findUnique({ where: { id: testStationId } });
      expect(stationCheck).toBeNull();

      // Verify all nodes and edges deleted
      const nodesRemaining = await prisma.node.count({ where: { station_id: testStationId } });
      expect(nodesRemaining).toBe(0);
      const edgesRemaining = await prisma.edge.count({ where: { station_id: testStationId } });
      expect(edgesRemaining).toBe(0);

      testStationId = null; // Mark cleaned up
    });
  });
});
