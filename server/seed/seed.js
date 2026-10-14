const prisma = require('../config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { seedExtraStations } = require('./extraStations');

const seed = async () => {
  console.log("Starting seed process...");

  // 1. Admin User
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'password123';
  const passwordHash = await bcrypt.hash(adminPass, 10);

  await prisma.user.upsert({
    where: { username: adminUser },
    update: { password_hash: passwordHash },
    create: { username: adminUser, password_hash: passwordHash }
  });
  console.log("Admin user seeded.");

  // Clear existing data
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.station.deleteMany();

  // 2. Stations
  const cnb = await prisma.station.create({
    data: { name: 'Kanpur Central', name_hi: 'कानपुर सेंट्रल', city: 'Kanpur', code: 'CNB' }
  });
  const ndls = await prisma.station.create({
    data: { name: 'New Delhi', name_hi: 'नई दिल्ली', city: 'New Delhi', code: 'NDLS' }
  });

  // 3. Helper
  const generateStationGraph = async (stationId, offsetX, offsetY) => {
    const nodesMap = {};

    const addNode = async (key, name, name_hi, type, floor, x, y, accessible = true) => {
      const n = await prisma.node.create({
        data: { station_id: stationId, name, name_hi, type, floor, x: x + offsetX, y: y + offsetY, accessible }
      });
      nodesMap[key] = n.id;
    };

    const addEdge = async (key1, key2, distance, is_accessible = true, has_stairs = false) => {
      await prisma.edge.createMany({
        data: [
          { station_id: stationId, from_node: nodesMap[key1], to_node: nodesMap[key2], distance, is_accessible, has_stairs },
          { station_id: stationId, from_node: nodesMap[key2], to_node: nodesMap[key1], distance, is_accessible, has_stairs }
        ]
      });
    };

    // Ground Floor (F0)
    await addNode('entrance', 'Main Entrance', 'मुख्य प्रवेश द्वार', 'entrance', 0, 0, 50);
    await addNode('ticket', 'Ticketing', 'टिकट घर', 'ticket', 0, 20, 20);
    await addNode('help', 'Help Desk', 'सहायता केंद्र', 'helpdesk', 0, 20, 80);
    await addNode('wait', 'Waiting Room', 'प्रतीक्षालय', 'waiting_room', 0, 40, 20);
    await addNode('restroom_a', 'Restroom (Entrance)', 'शौचालय', 'restroom', 0, 60, 20);

    await addNode('pf1_c', 'Platform 1 Center', 'प्लेटफॉर्म 1 मध्य', 'platform', 0, 100, 50);
    await addNode('pf1_n', 'Platform 1 North', 'प्लेटफॉर्म 1 उत्तर', 'platform', 0, 100, 10);
    await addNode('pf1_s', 'Platform 1 South', 'प्लेटफॉर्म 1 दक्षिण', 'platform', 0, 100, 90);
    await addNode('food_a', 'Food Stall 1', 'भोजन स्टॉल 1', 'food', 0, 90, 30);

    await addNode('stairs_pf1', 'Stairs UP (PF1)', 'सीढ़ियाँ (PF1)', 'stairs', 0, 110, 40);
    await addNode('lift_pf1', 'Lift UP (PF1)', 'लिफ्ट (PF1)', 'lift', 0, 110, 70);

    await addNode('pf2_c', 'Platform 2/3 Center', 'प्लेटफॉर्म 2/3 मध्य', 'platform', 0, 200, 50);
    await addNode('pf2_n', 'Platform 2/3 North', 'प्लेटफॉर्म 2/3 उत्तर', 'platform', 0, 200, 10);
    await addNode('pf2_s', 'Platform 2/3 South', 'प्लेटफॉर्म 2/3 दक्षिण', 'platform', 0, 200, 90);
    await addNode('restroom_b', 'Restroom (PF2/3)', 'शौचालय (PF2/3)', 'restroom', 0, 190, 80);

    await addNode('stairs_pf2', 'Stairs UP (PF2/3)', 'सीढ़ियाँ (PF2/3)', 'stairs', 0, 210, 40);
    await addNode('lift_pf2', 'Lift UP (PF2/3)', 'लिफ्ट (PF2/3)', 'lift', 0, 210, 70);

    await addNode('pf4_c', 'Platform 4/5 Center', 'प्लेटफॉर्म 4/5 मध्य', 'platform', 0, 300, 50);
    await addNode('pf4_n', 'Platform 4/5 North', 'प्लेटफॉर्म 4/5 उत्तर', 'platform', 0, 300, 10);
    await addNode('pf4_s', 'Platform 4/5 South', 'प्लेटफॉर्म 4/5 दक्षिण', 'platform', 0, 300, 90);
    await addNode('food_b', 'Food Stall 2', 'भोजन स्टॉल 2', 'food', 0, 290, 20);

    await addNode('stairs_pf4', 'Stairs UP (PF4/5)', 'सीढ़ियाँ (PF4/5)', 'stairs', 0, 310, 40);
    await addNode('lift_pf4', 'Lift UP (PF4/5)', 'लिफ्ट (PF4/5)', 'lift', 0, 310, 70);

    // Floor 1 (FOB)
    await addNode('fob_1', 'FOB (Above PF1)', 'फुट ओवर ब्रिज (PF1)', 'waypoint', 1, 110, 55);
    await addNode('fob_2', 'FOB (Above PF2/3)', 'फुट ओवर ब्रिज (PF2/3)', 'waypoint', 1, 210, 55);
    await addNode('fob_4', 'FOB (Above PF4/5)', 'फुट ओवर ब्रिज (PF4/5)', 'waypoint', 1, 310, 55);

    // Edges
    await addEdge('entrance', 'ticket', 30);
    await addEdge('entrance', 'help', 30);
    await addEdge('entrance', 'pf1_c', 100);
    await addEdge('ticket', 'wait', 20);
    await addEdge('wait', 'restroom_a', 20);

    await addEdge('pf1_c', 'pf1_n', 40);
    await addEdge('pf1_c', 'pf1_s', 40);
    await addEdge('pf1_c', 'food_a', 25);

    await addEdge('pf1_c', 'stairs_pf1', 10);
    await addEdge('pf1_c', 'lift_pf1', 40);

    await addEdge('stairs_pf1', 'fob_1', 15, false, true);
    await addEdge('lift_pf1', 'fob_1', 15, true, false);

    await addEdge('fob_1', 'fob_2', 100);
    await addEdge('fob_2', 'fob_4', 100);

    await addEdge('fob_2', 'stairs_pf2', 15, false, true);
    await addEdge('fob_2', 'lift_pf2', 15, true, false);

    await addEdge('stairs_pf2', 'pf2_c', 10);
    await addEdge('lift_pf2', 'pf2_c', 40);

    await addEdge('pf2_c', 'pf2_n', 40);
    await addEdge('pf2_c', 'pf2_s', 40);
    await addEdge('pf2_c', 'restroom_b', 35);

    await addEdge('fob_4', 'stairs_pf4', 15, false, true);
    await addEdge('fob_4', 'lift_pf4', 15, true, false);

    await addEdge('stairs_pf4', 'pf4_c', 10);
    await addEdge('lift_pf4', 'pf4_c', 40);

    await addEdge('pf4_c', 'pf4_n', 40);
    await addEdge('pf4_c', 'pf4_s', 40);
    await addEdge('pf4_c', 'food_b', 35);
  };

  await generateStationGraph(cnb.id, 0, 0);
  await generateStationGraph(ndls.id, 1000, 1000);
  await seedExtraStations(prisma);

  console.log("Seed data inserted successfully.");
};

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
