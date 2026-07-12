const documentsRouter = require('./routes/documents');
const db = require('./db');

db.prepare('DELETE FROM document_status WHERE app_id = ?').run(999);
const checklist = documentsRouter.__test.saveDocumentUpload(999, 'reportCard', {
  status: 'Received',
  note: 'Uploaded from phone',
  fileName: 'report-card.jpg',
  fileType: 'image/jpeg',
  fileData: 'data:image/jpeg;base64,abc123',
  uploadMethod: 'camera'
});
const item = checklist.find(x => x.key === 'reportCard');
console.log(JSON.stringify({
  status: item.status,
  fileName: item.fileName,
  fileType: item.fileType,
  fileData: item.fileData,
  uploadMethod: item.uploadMethod
}, null, 2));
