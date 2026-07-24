const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'mefamdev.json');
const samplePath = path.join(__dirname, 'tmp_sample_apps.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sampleApps = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

if (!Array.isArray(data.applications)) {
  data.applications = [];
}

const existingFixedIds = new Set(sampleApps.map(a => a.id));
const preservedApps = data.applications.filter(app => !existingFixedIds.has(app.id));

// Keep app id 1 if present, and remove any conflicting sample IDs
const merged = [...preservedApps.filter(app => app.id === 1), ...sampleApps];

data.applications = merged.sort((a, b) => a.id - b.id);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${sampleApps.length} sample applications into ${dataPath}`);
