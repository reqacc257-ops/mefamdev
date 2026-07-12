const db = require('./db');
const { submitPublicApplication } = require('./routes/applications');

const req = {
  body: {
    name: 'Inspect Applicant',
    sy: '2026-2027',
    username: 'inspect',
    password: 'pass',
    contact: '09170000002',
    submittedData: { fullName: 'Inspect Applicant', barangay: 'Narra' },
    statusHistory: [{ status: 'Pending Review', changedAt: '2026-07-12T00:00:00.000Z', note: 'Application submitted' }],
    submittedAt: '2026-07-12T00:00:00.000Z',
    status: 'Pending Review'
  }
};
const res = {
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
};

submitPublicApplication(req, res);
const rows = db.prepare('SELECT * FROM applications ORDER BY id DESC LIMIT 3').all();
console.log(JSON.stringify(rows, null, 2));
