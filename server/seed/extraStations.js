// Extra stations (schematic sample layouts, not official station maps).
// Node: [key, name, name_hi, type, floor, x, y]
// Edge: [from, to] or [from, to, 'S'] where 'S' = stairs (not accessible).
// Edge distance is calculated automatically from node x/y.

const stations = [
  {
    name: 'Lucknow Charbagh', name_hi: 'लखनऊ चारबाग', city: 'Lucknow', code: 'LKO',
    nodes: [
      ['entrance', 'Main Entrance', 'मुख्य प्रवेश द्वार', 'entrance', 0, 0, 50],
      ['parking', 'Parking Entrance', 'पार्किंग प्रवेश', 'entrance', 0, 0, 105],
      ['ticket', 'Ticket Counter', 'टिकट काउंटर', 'ticket', 0, 30, 20],
      ['help', 'Help Desk', 'सहायता केंद्र', 'helpdesk', 0, 30, 85],
      ['wait', 'Waiting Hall', 'प्रतीक्षालय', 'waiting_room', 0, 60, 20],
      ['rest_a', 'Restroom (Main Hall)', 'शौचालय (मुख्य हॉल)', 'restroom', 0, 85, 20],
      ['food_a', 'Food Court', 'फूड कोर्ट', 'food', 0, 90, 85],
      ['ramp', 'Ramp to Platform 1', 'प्लेटफॉर्म 1 की रैंप', 'waypoint', 0, 100, 50],
      ['pf1', 'Platform 1', 'प्लेटफॉर्म 1', 'platform', 0, 135, 50],
      ['stairs_1', 'Stairs to FOB (PF1)', 'FOB की सीढ़ियाँ (PF1)', 'stairs', 0, 145, 35],
      ['lift_1', 'Lift to FOB (PF1)', 'FOB की लिफ्ट (PF1)', 'lift', 0, 150, 100],
      ['pf2', 'Platform 2', 'प्लेटफॉर्म 2', 'platform', 0, 210, 25],
      ['pf3', 'Platform 3', 'प्लेटफॉर्म 3', 'platform', 0, 210, 75],
      ['rest_b', 'Restroom (PF2/3)', 'शौचालय (PF2/3)', 'restroom', 0, 190, 50],
      ['stairs_2', 'Stairs to FOB (PF2/3)', 'FOB की सीढ़ियाँ (PF2/3)', 'stairs', 0, 230, 50],
      ['lift_2', 'Lift to FOB (PF2/3)', 'FOB की लिफ्ट (PF2/3)', 'lift', 0, 245, 105],
      ['pf4', 'Platform 4', 'प्लेटफॉर्म 4', 'platform', 0, 300, 25],
      ['pf5', 'Platform 5', 'प्लेटफॉर्म 5', 'platform', 0, 300, 75],
      ['food_b', 'Food Stall (PF4/5)', 'भोजन स्टॉल (PF4/5)', 'food', 0, 285, 50],
      ['stairs_3', 'Stairs to FOB (PF4/5)', 'FOB की सीढ़ियाँ (PF4/5)', 'stairs', 0, 320, 50],
      ['lift_3', 'Lift to FOB (PF4/5)', 'FOB की लिफ्ट (PF4/5)', 'lift', 0, 335, 105],
      ['rear', 'Rear Entrance (PF5 side)', 'पिछला प्रवेश द्वार (PF5)', 'entrance', 0, 380, 75],
      ['fob_1', 'FOB (Above PF1)', 'फुट ओवर ब्रिज (PF1)', 'waypoint', 1, 145, 65],
      ['fob_2', 'FOB (Above PF2/3)', 'फुट ओवर ब्रिज (PF2/3)', 'waypoint', 1, 230, 65],
      ['fob_3', 'FOB (Above PF4/5)', 'फुट ओवर ब्रिज (PF4/5)', 'waypoint', 1, 320, 65],
    ],
    edges: [
      ['entrance', 'parking'], ['entrance', 'ticket'], ['entrance', 'help'],
      ['ticket', 'wait'], ['wait', 'rest_a'], ['help', 'food_a'],
      ['entrance', 'ramp'], ['ramp', 'pf1'], ['food_a', 'pf1'],
      ['pf1', 'stairs_1'], ['pf1', 'lift_1'],
      ['stairs_1', 'fob_1', 'S'], ['lift_1', 'fob_1'],
      ['fob_1', 'fob_2'], ['fob_2', 'fob_3'],
      ['fob_2', 'stairs_2', 'S'], ['fob_2', 'lift_2'],
      ['stairs_2', 'pf2'], ['stairs_2', 'pf3'], ['lift_2', 'pf3'], ['pf2', 'pf3'],
      ['rest_b', 'pf2'], ['rest_b', 'pf3'],
      ['fob_3', 'stairs_3', 'S'], ['fob_3', 'lift_3'],
      ['stairs_3', 'pf4'], ['stairs_3', 'pf5'], ['lift_3', 'pf5'], ['pf4', 'pf5'],
      ['food_b', 'pf4'], ['food_b', 'pf5'], ['pf5', 'rear'],
    ],
  },

  {
    name: 'Prayagraj Junction', name_hi: 'प्रयागराज जंक्शन', city: 'Prayagraj', code: 'PRYJ',
    nodes: [
      ['entrance', 'Main Entrance', 'मुख्य प्रवेश द्वार', 'entrance', 0, 0, 60],
      ['parking', 'Parking Entrance', 'पार्किंग प्रवेश', 'entrance', 0, 0, 115],
      ['ticket_1', 'Ticket Counter', 'टिकट काउंटर', 'ticket', 0, 30, 25],
      ['ticket_2', 'Reservation Counter', 'आरक्षण काउंटर', 'ticket', 0, 30, 95],
      ['help', 'Help Desk', 'सहायता केंद्र', 'helpdesk', 0, 60, 60],
      ['wait', 'Waiting Room (AC)', 'प्रतीक्षालय (एसी)', 'waiting_room', 0, 60, 15],
      ['rest_a', 'Restroom (Main Hall)', 'शौचालय (मुख्य हॉल)', 'restroom', 0, 90, 15],
      ['food_a', 'Food Court', 'फूड कोर्ट', 'food', 0, 95, 100],
      ['pf1', 'Platform 1', 'प्लेटफॉर्म 1', 'platform', 0, 130, 60],
      ['stairs_1', 'Stairs to FOB (PF1)', 'FOB की सीढ़ियाँ (PF1)', 'stairs', 0, 140, 45],
      ['lift_1', 'Lift to FOB (PF1)', 'FOB की लिफ्ट (PF1)', 'lift', 0, 145, 115],
      ['pf2', 'Platform 2', 'प्लेटफॉर्म 2', 'platform', 0, 205, 30],
      ['pf3', 'Platform 3', 'प्लेटफॉर्म 3', 'platform', 0, 205, 90],
      ['rest_b', 'Restroom (PF2/3)', 'शौचालय (PF2/3)', 'restroom', 0, 190, 60],
      ['stairs_2', 'Stairs to FOB (PF2/3)', 'FOB की सीढ़ियाँ (PF2/3)', 'stairs', 0, 225, 60],
      ['ramp_2', 'Ramp to FOB (PF2/3)', 'FOB की रैंप (PF2/3)', 'waypoint', 0, 260, 130],
      ['pf4', 'Platform 4', 'प्लेटफॉर्म 4', 'platform', 0, 300, 30],
      ['pf5', 'Platform 5', 'प्लेटफॉर्म 5', 'platform', 0, 300, 90],
      ['food_b', 'Food Stall (PF4/5)', 'भोजन स्टॉल (PF4/5)', 'food', 0, 285, 60],
      ['stairs_3', 'Stairs to FOB (PF4/5)', 'FOB की सीढ़ियाँ (PF4/5)', 'stairs', 0, 320, 60],
      ['lift_3', 'Lift to FOB (PF4/5)', 'FOB की लिफ्ट (PF4/5)', 'lift', 0, 335, 115],
      ['pf6', 'Platform 6', 'प्लेटफॉर्म 6', 'platform', 0, 395, 30],
      ['pf7', 'Platform 7', 'प्लेटफॉर्म 7', 'platform', 0, 395, 90],
      ['rest_c', 'Restroom (PF6/7)', 'शौचालय (PF6/7)', 'restroom', 0, 380, 60],
      ['stairs_4', 'Stairs to FOB (PF6/7)', 'FOB की सीढ़ियाँ (PF6/7)', 'stairs', 0, 415, 60],
      ['lift_4', 'Lift to FOB (PF6/7)', 'FOB की लिफ्ट (PF6/7)', 'lift', 0, 430, 115],
      ['fob_1', 'FOB (Above PF1)', 'फुट ओवर ब्रिज (PF1)', 'waypoint', 1, 140, 70],
      ['fob_2', 'FOB (Above PF2/3)', 'फुट ओवर ब्रिज (PF2/3)', 'waypoint', 1, 225, 75],
      ['fob_3', 'FOB (Above PF4/5)', 'फुट ओवर ब्रिज (PF4/5)', 'waypoint', 1, 320, 75],
      ['fob_4', 'FOB (Above PF6/7)', 'फुट ओवर ब्रिज (PF6/7)', 'waypoint', 1, 415, 75],
    ],
    edges: [
      ['entrance', 'parking'], ['entrance', 'ticket_1'], ['entrance', 'ticket_2'],
      ['entrance', 'help'], ['help', 'wait'], ['wait', 'rest_a'],
      ['ticket_2', 'food_a'], ['help', 'pf1'], ['food_a', 'pf1'],
      ['pf1', 'stairs_1'], ['pf1', 'lift_1'],
      ['stairs_1', 'fob_1', 'S'], ['lift_1', 'fob_1'],
      ['fob_1', 'fob_2'], ['fob_2', 'fob_3'], ['fob_3', 'fob_4'],
      ['fob_2', 'stairs_2', 'S'], ['stairs_2', 'pf2'], ['stairs_2', 'pf3'],
      ['rest_b', 'pf2'], ['rest_b', 'pf3'],
      ['ramp_2', 'pf3'], ['ramp_2', 'fob_2'],
      ['fob_3', 'stairs_3', 'S'], ['fob_3', 'lift_3'],
      ['stairs_3', 'pf4'], ['stairs_3', 'pf5'], ['lift_3', 'pf5'],
      ['food_b', 'pf4'], ['food_b', 'pf5'],
      ['fob_4', 'stairs_4', 'S'], ['fob_4', 'lift_4'],
      ['stairs_4', 'pf6'], ['stairs_4', 'pf7'], ['lift_4', 'pf7'],
      ['rest_c', 'pf6'], ['rest_c', 'pf7'],
    ],
  },

  {
    name: 'Varanasi Junction', name_hi: 'वाराणसी जंक्शन', city: 'Varanasi', code: 'BSB',
    nodes: [
      ['entrance', 'Main Entrance', 'मुख्य प्रवेश द्वार', 'entrance', 0, 0, 60],
      ['parking', 'Parking Entrance', 'पार्किंग प्रवेश', 'entrance', 0, 0, 125],
      ['help', 'Help Desk', 'सहायता केंद्र', 'helpdesk', 0, 40, 100],
      ['food_a', 'Food Court', 'फूड कोर्ट', 'food', 0, 80, 105],
      ['rest_a', 'Restroom (Entrance)', 'शौचालय (प्रवेश)', 'restroom', 0, 80, 15],
      ['stairs_main', 'Stairs to Concourse', 'कॉनकोर्स की सीढ़ियाँ', 'stairs', 0, 40, 55],
      ['lift_main', 'Lift to Concourse', 'कॉनकोर्स की लिफ्ट', 'lift', 0, 25, 10],
      ['pf1', 'Platform 1', 'प्लेटफॉर्म 1', 'platform', 0, 140, 60],
      ['stairs_1', 'Stairs to FOB (PF1)', 'FOB की सीढ़ियाँ (PF1)', 'stairs', 0, 150, 48],
      ['lift_1', 'Lift to FOB (PF1)', 'FOB की लिफ्ट (PF1)', 'lift', 0, 155, 110],
      ['pf2', 'Platform 2', 'प्लेटफॉर्म 2', 'platform', 0, 230, 30],
      ['pf3', 'Platform 3', 'प्लेटफॉर्म 3', 'platform', 0, 230, 90],
      ['rest_b', 'Restroom (PF2/3)', 'शौचालय (PF2/3)', 'restroom', 0, 215, 60],
      ['stairs_2', 'Stairs to FOB (PF2/3)', 'FOB की सीढ़ियाँ (PF2/3)', 'stairs', 0, 250, 60],
      ['lift_2', 'Lift to FOB (PF2/3)', 'FOB की लिफ्ट (PF2/3)', 'lift', 0, 265, 115],
      ['pf4', 'Platform 4', 'प्लेटफॉर्म 4', 'platform', 0, 320, 30],
      ['pf5', 'Platform 5', 'प्लेटफॉर्म 5', 'platform', 0, 320, 90],
      ['food_b', 'Food Stall (PF4/5)', 'भोजन स्टॉल (PF4/5)', 'food', 0, 305, 60],
      ['stairs_3', 'Stairs to FOB (PF4/5)', 'FOB की सीढ़ियाँ (PF4/5)', 'stairs', 0, 340, 60],
      ['lift_3', 'Lift to FOB (PF4/5)', 'FOB की लिफ्ट (PF4/5)', 'lift', 0, 355, 115],
      ['pf6', 'Platform 6', 'प्लेटफॉर्म 6', 'platform', 0, 410, 30],
      ['pf7', 'Platform 7', 'प्लेटफॉर्म 7', 'platform', 0, 410, 90],
      ['stairs_4', 'Stairs to FOB (PF6/7)', 'FOB की सीढ़ियाँ (PF6/7)', 'stairs', 0, 430, 60],
      ['lift_4', 'Lift to FOB (PF6/7)', 'FOB की लिफ्ट (PF6/7)', 'lift', 0, 445, 115],
      ['pf8', 'Platform 8', 'प्लेटफॉर्म 8', 'platform', 0, 500, 30],
      ['pf9', 'Platform 9', 'प्लेटफॉर्म 9', 'platform', 0, 500, 90],
      ['stairs_5', 'Stairs to FOB (PF8/9)', 'FOB की सीढ़ियाँ (PF8/9)', 'stairs', 0, 520, 60],
      ['lift_5', 'Lift to FOB (PF8/9)', 'FOB की लिफ्ट (PF8/9)', 'lift', 0, 535, 115],
      ['concourse', 'Upper Concourse', 'ऊपरी कॉनकोर्स', 'waypoint', 1, 90, 70],
      ['ticket', 'Ticket Counter (Concourse)', 'टिकट काउंटर (कॉनकोर्स)', 'ticket', 1, 70, 35],
      ['wait', 'Waiting Hall (Concourse)', 'प्रतीक्षालय (कॉनकोर्स)', 'waiting_room', 1, 110, 35],
      ['fob_1', 'FOB (Above PF1)', 'फुट ओवर ब्रिज (PF1)', 'waypoint', 1, 150, 70],
      ['fob_2', 'FOB (Above PF2/3)', 'फुट ओवर ब्रिज (PF2/3)', 'waypoint', 1, 250, 75],
      ['fob_3', 'FOB (Above PF4/5)', 'फुट ओवर ब्रिज (PF4/5)', 'waypoint', 1, 340, 75],
      ['fob_4', 'FOB (Above PF6/7)', 'फुट ओवर ब्रिज (PF6/7)', 'waypoint', 1, 430, 75],
      ['fob_5', 'FOB (Above PF8/9)', 'फुट ओवर ब्रिज (PF8/9)', 'waypoint', 1, 520, 75],
    ],
    edges: [
      ['entrance', 'parking'], ['entrance', 'help'], ['entrance', 'rest_a'],
      ['help', 'food_a'], ['food_a', 'pf1'],
      ['entrance', 'stairs_main'], ['entrance', 'lift_main'],
      ['stairs_main', 'concourse', 'S'], ['lift_main', 'concourse'],
      ['concourse', 'ticket'], ['concourse', 'wait'], ['concourse', 'fob_1'],
      ['pf1', 'stairs_1'], ['pf1', 'lift_1'],
      ['stairs_1', 'fob_1', 'S'], ['lift_1', 'fob_1'],
      ['fob_1', 'fob_2'], ['fob_2', 'fob_3'], ['fob_3', 'fob_4'], ['fob_4', 'fob_5'],
      ['fob_2', 'stairs_2', 'S'], ['fob_2', 'lift_2'],
      ['stairs_2', 'pf2'], ['stairs_2', 'pf3'], ['lift_2', 'pf3'],
      ['rest_b', 'pf2'], ['rest_b', 'pf3'],
      ['fob_3', 'stairs_3', 'S'], ['fob_3', 'lift_3'],
      ['stairs_3', 'pf4'], ['stairs_3', 'pf5'], ['lift_3', 'pf5'],
      ['food_b', 'pf4'], ['food_b', 'pf5'],
      ['fob_4', 'stairs_4', 'S'], ['fob_4', 'lift_4'],
      ['stairs_4', 'pf6'], ['stairs_4', 'pf7'], ['lift_4', 'pf7'], ['pf6', 'pf7'],
      ['fob_5', 'stairs_5', 'S'], ['fob_5', 'lift_5'],
      ['stairs_5', 'pf8'], ['stairs_5', 'pf9'], ['lift_5', 'pf9'], ['pf8', 'pf9'],
    ],
  },
];

const distance = (a, b) => Math.max(5, Math.round(Math.hypot(a.x - b.x, a.y - b.y)));

async function seedExtraStations(prisma) {
  for (const s of stations) {
    const station = await prisma.station.create({
      data: { name: s.name, name_hi: s.name_hi, city: s.city, code: s.code },
    });

    const byKey = {};
    for (const [key, name, name_hi, type, floor, x, y] of s.nodes) {
      const n = await prisma.node.create({
        data: { station_id: station.id, name, name_hi, type, floor, x, y, accessible: true },
      });
      byKey[key] = { id: n.id, x, y };
    }

    const rows = [];
    for (const [a, b, flag] of s.edges) {
      if (!byKey[a] || !byKey[b]) throw new Error(`${s.code}: unknown node in edge ${a} - ${b}`);
      const stairs = flag === 'S';
      const base = {
        station_id: station.id,
        distance: distance(byKey[a], byKey[b]),
        is_accessible: !stairs,
        has_stairs: stairs,
      };
      rows.push({ ...base, from_node: byKey[a].id, to_node: byKey[b].id });
      rows.push({ ...base, from_node: byKey[b].id, to_node: byKey[a].id });
    }
    await prisma.edge.createMany({ data: rows });

    console.log(`Seeded ${s.name}: ${s.nodes.length} nodes, ${s.edges.length} paths`);
  }
}

module.exports = { seedExtraStations };