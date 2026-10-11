
const fs = require('fs');
const path = require('path');

const names = [
  'Priya Sharma',
  'Ananya Patel',
  'Neha Deshmukh',
  'Sneha Kulkarni',
  'Pooja Shah',
  'Riya Mehta',
  'Kavya Joshi',
  'Aditi Verma',
  'Isha Nair',
  'Simran Singh',
];

const cities = [
  { state: 'Maharashtra', district: 'Mumbai' },
  { state: 'Maharashtra', district: 'Thane' },
  { state: 'Gujarat', district: 'Ahmedabad' },
  { state: 'Karnataka', district: 'Bengaluru' },
  { state: 'Delhi', district: 'New Delhi' },
];

const databasePath = path.join(__dirname, 'abhaProfiles.json');

function generateABHAId(index) {
  const first = String(10 + (index % 90));
  const second = String(1000 + index).slice(-4);
  const third = String(2000 + index * 7).slice(-4);
  const fourth = String(3000 + index * 11).slice(-4);

  return `${first}${second}${third}${fourth}`;
}

function generateInitialProfiles() {
  const profiles = [];

  for (let i = 0; i < 100; i++) {
    const location = cities[i % cities.length];

    profiles.push({
      abhaId: generateABHAId(i),
      name: names[i % names.length],
      yearOfBirth: 1988 + (i % 12),
      gender: 'Female',
      state: location.state,
      district: location.district,
      mobile: `98${String(10000000 + i).slice(-8)}`,
      email: `testuser${i + 1}@example.com`,
    });
  }

  return profiles;
}

function loadDatabase() {
  if (!fs.existsSync(databasePath)) {
    const initialProfiles = generateInitialProfiles();
    saveDatabase(initialProfiles);
    return initialProfiles;
  }

  try {
    const data = fs.readFileSync(databasePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Unable to load ABHA database:', error);
    return [];
  }
}

function saveDatabase(profiles) {
  fs.writeFileSync(
    databasePath,
    JSON.stringify(profiles, null, 2),
    'utf8'
  );
}

let abhaDatabase = loadDatabase();

function find(callback) {
  return abhaDatabase.find(callback);
}

function push(profile) {
  abhaDatabase.push(profile);
  saveDatabase(abhaDatabase);
  return abhaDatabase.length;
}

function filter(callback) {
  return abhaDatabase.filter(callback);
}

function getAll() {
  return [...abhaDatabase];
}

function addProfile(profile) {
  const existing = find(
    item => item.abhaId === profile.abhaId
  );

  if (existing) {
    return false;
  }

  push(profile);
  return true;
}

module.exports = {
  find,
  push,
  filter,
  getAll,
  addProfile,
};