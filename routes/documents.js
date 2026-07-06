/**
 * routes/documents.js — Per-applicant document checklist
 *
 * GET  /api/documents/:appId            — get checklist (staff, or the applicant themself)
 * PUT  /api/documents/:appId/:docKey    — set a document's status + optional note (staff only)
 *
 * Mount in server.js alongside the other routes, e.g.:
 *   app.use('/api/documents', requireAuth, require('./routes/documents'));
 */
const router = require('express').Router();
const db = require('../db');

// Self-contained: creates its own table if it doesn't exist yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS document_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    doc_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Required',
    note TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(app_id, doc_key)
  )
`);

// The fixed list of documents every applicant needs. Add/remove entries here
// and both the admin dashboard and applicant portal will pick it up automatically.
const REQUIRED_DOCS = [
  { key: 'reportCard',     label: 'Report Card / Grade Slip' },
  { key: 'certEnrollment', label: 'Certificate of Enrollment' },
  { key: 'idPhoto',        label: '1 pc. 2x2 ID Photo' },
  { key: 'barangayCert',   label: 'Barangay Certificate of Indigency' },
  { key: 'guardianId',     label: 'Parent/Guardian Valid ID' },
];

function buildChecklist(appId) {
  const rows = db.prepare(
    'SELECT doc_key, status, note, updated_at FROM document_status WHERE app_id = ?'
  ).all(appId);
  const map = {};
  rows.forEach(r => { map[r.doc_key] = r; });

  return REQUIRED_DOCS.map(d => ({
    key: d.key,
    label: d.label,
    status: map[d.key]?.status || 'Required',   // Required | Received | Missing
    note: map[d.key]?.note || '',
    updatedAt: map[d.key]?.updated_at || null,
  }));
}

// ── GET checklist ─────────────────────────────────────────────────────────
router.get('/:appId', (req, res) => {
  const appId = parseInt(req.params.appId);
  if (req.user.type === 'applicant' && req.user.appId !== appId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(buildChecklist(appId));
});

// ── PUT update one document ───────────────────────────────────────────────
router.put('/:appId/:docKey', (req, res) => {
  if (req.user.type === 'applicant') return res.status(403).json({ error: 'Forbidden' });

  const { appId, docKey } = req.params;
  if (!REQUIRED_DOCS.some(d => d.key === docKey)) {
    return res.status(400).json({ error: 'Unknown document type' });
  }

  const status = req.body.status;
  if (!['Required', 'Received', 'Missing'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const note = req.body.note || '';

  db.prepare(`
    INSERT INTO document_status (app_id, doc_key, status, note, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(app_id, doc_key) DO UPDATE SET
      status = excluded.status,
      note = excluded.note,
      updated_at = excluded.updated_at
  `).run(appId, docKey, status, note);

  res.json({ ok: true, checklist: buildChecklist(appId) });
});

module.exports = router;
