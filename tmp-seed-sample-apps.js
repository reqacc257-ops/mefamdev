const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataPath = path.join(__dirname, 'data', 'mefamdev.json');
const samplePath = path.join(__dirname, 'tmp_sample_apps.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sampleApps = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
const adminHash = crypto.createHash('sha256').update('admin').digest('hex');
const statuses = ['Pending Review', 'Interviewing', 'Accepted'];
const schools = ['Angat National High School', 'Bulacan Science School', 'San Miguel High School', 'Pandi National High School', 'Plaridel National High School'];
const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const barangays = ['Poblacion', 'San Vicente', 'Munting Ilog', 'Maunlad', 'San Juan'];
const livingWithOptions = ['Parents', 'Grandparents', 'Aunt and uncle', 'Siblings', 'Single mother'];
const religionOptions = ['Roman Catholic', 'Iglesia Ni Cristo', 'Born again Christian', 'Evangelical', 'None'];
const whyScholarOptions = [
  'Continue studies despite hardship',
  'Help my family through education',
  'Become a teacher and give back to the community',
  'Finish senior high school with honors',
  'Prepare for college and future work'
];
const assistOptions = ['School supplies', 'Transportation', 'Medical support', 'Tuition subsidy', 'Uniforms'];
const provideOptions = ['Stationery', 'Mentorship', 'Food allowance', 'Books', 'School bag'];
const talents = ['Science club', 'Basketball', 'Art & Design', 'Volleyball', 'Drama', 'Debate'];
const baseRefTime = Date.UTC(2026, 6, 24, 19, 50, 10);

const normalizedSampleApps = sampleApps.map((app, index) => {
  const status = statuses[index % statuses.length];
  const refDate = new Date(baseRefTime + index * 60 * 1000);
  const statusUpdatedAt = new Date(refDate.getTime() + ((status === 'Accepted' ? 36 : status === 'Interviewing' ? 18 : 2) * 60 * 1000)).toISOString();
  const school = schools[index % schools.length];
  const grade = grades[index % grades.length];
  const barangay = barangays[index % barangays.length];
  const livingWith = livingWithOptions[index % livingWithOptions.length];
  const religion = religionOptions[index % religionOptions.length];
  const whyScholar = whyScholarOptions[index % whyScholarOptions.length];
  const contact = `0917${String(1000000 + index).slice(-7)}`;
  const bornYear = 2026 - (13 + (index % 6));
  const dob = `${bornYear}-${String((index % 12) + 1).padStart(2, '0')}-${String(((index * 3) % 27) + 1).padStart(2, '0')}`;
  const age = String(13 + (index % 6));
  const gender = index % 2 === 0 ? 'Female' : 'Male';
  const properties = assistOptions.slice(0, 1 + (index % 3));
  const canProvide = provideOptions.slice(0, 1 + (index % 2));

  return {
    ...app,
    portal_username: 'user',
    username: 'user',
    password: 'admin',
    password_hash: adminHash,
    status,
    date_label: 'Jul 24, 2026',
    submitted_at: refDate.toISOString(),
    status_updated_at: statusUpdatedAt,
    submitted_data: '{}',
    status_history: JSON.stringify([
      { status: 'Pending Review', changedAt: refDate.toISOString(), note: 'Application submitted' },
      ...(status !== 'Pending Review' ? [{ status, changedAt: statusUpdatedAt, note: `Application moved to ${status}` }] : [])
    ]),
    family_members: JSON.stringify([
      { name: 'Liza Lopez', relation: 'Mother', age: 42 },
      { name: 'Marco Lopez', relation: 'Brother', age: 14 }
    ]),
    properties: JSON.stringify(properties),
    can_provide: JSON.stringify(canProvide),
    school,
    grade,
    barangay,
    sy: '2026-2027',
    contact,
    address: `${100 + index} Sample St, Brgy. ${barangay}`,
    why_scholar: whyScholar,
    total_income: String(2500 + ((index % 5) * 1000)),
    total_expense: String(1800 + ((index % 4) * 800)),
    dob,
    age,
    gender,
    living_with: livingWith,
    religion,
    birthplace: `${barangay}, Bulacan`,
    talents: app.talents || talents[index % talents.length],
    clubs: app.clubs || 'Student Council',
    ambition: whyScholar
  };
});

if (!Array.isArray(data.applications)) {
  data.applications = [];
}

const existingFixedIds = new Set(normalizedSampleApps.map(a => a.id));
const preservedApps = data.applications.filter(app => !existingFixedIds.has(app.id));

// Keep app id 1 if present, and remove any conflicting sample IDs
const merged = [...preservedApps.filter(app => app.id === 1), ...normalizedSampleApps];

data.applications = merged.sort((a, b) => a.id - b.id);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${normalizedSampleApps.length} sample applications into ${dataPath}`);
