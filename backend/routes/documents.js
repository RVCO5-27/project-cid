const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const { logCreate, logDelete, getClientIp, getUserAgent } = require('../services/auditService');
const router = express.Router();

// Upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-\_\s]/gi, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// In-memory document store (replace with database in production)
let documents = [
  { id: 'd1', name: 'Division_Memo_001.pdf', size: '1.2MB', schoolYear: '2023', uploadedAt: '2023-09-15' },
  { id: 'd2', name: 'Guidelines_Annex.pdf', size: '800KB', schoolYear: '2023', uploadedAt: '2023-10-20' },
  { id: 'd3', name: 'Regional_Report.pdf', size: '2.0MB', schoolYear: '2024', uploadedAt: '2024-01-10' },
  { id: 'd4', name: 'Policy_Update.pdf', size: '1.1MB', schoolYear: '2024', uploadedAt: '2024-03-25' },
  { id: 'd5', name: 'SHS_Resource_Package.pdf', size: '4.5MB', schoolYear: '2025', uploadedAt: '2025-02-14' },
  { id: 'd6', name: 'QA_Summary_2026.pdf', size: '3.2MB', schoolYear: '2026', uploadedAt: '2026-01-05' },
  { id: 'd7', name: 'NAT_Admin_Guide.pdf', size: '2.4MB', schoolYear: '2026', uploadedAt: '2026-02-01' },
  { id: 'd8', name: 'Regional_Festival_Guide.pdf', size: '900KB', schoolYear: '2026', uploadedAt: '2026-02-20' }
];

// Get folders (school years)
router.get('/folders', (req, res) => {
  const folders = [...new Set(documents.map(d => d.schoolYear))].sort().reverse();
  res.json(folders.map(year => ({ id: year, label: year })));
});

// Get files by folder (school year)
router.get('/folder/:year', (req, res) => {
  const { year } = req.params;
  const files = documents.filter(d => d.schoolYear === year);
  res.json(files);
});

// Search documents
router.get('/search', (req, res) => {
  const { q, schoolYear, gradeLevel, strand, documentType } = req.query;
  
  let results = [...documents];
  
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(d => d.name.toLowerCase().includes(query));
  }
  
  if (schoolYear) {
    results = results.filter(d => d.schoolYear === schoolYear);
  }
  
  if (gradeLevel) {
    results = results.filter(d => d.gradeLevel === gradeLevel);
  }
  
  if (strand) {
    results = results.filter(d => d.strand === strand);
  }
  
  if (documentType) {
    results = results.filter(d => d.documentType === documentType);
  }
  
  res.json(results);
});

// Get all documents
router.get('/', (req, res) => {
  res.json(documents);
});

// Get single document
router.get('/:id', (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// Upload document (staff only — prevents anonymous tampering)
router.post(
  '/upload',
  authMiddleware,
  requireAdminRole,
  upload.single('file'),
  async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const newDoc = {
    id: `d${Date.now()}`,
    name: req.file.originalname,
    size: formatFileSize(req.file.size),
    schoolYear: req.body.schoolYear || '2026',
    gradeLevel: req.body.gradeLevel,
    strand: req.body.strand,
    documentType: req.body.documentType,
    subject: req.body.subject,
    uploadedAt: new Date().toISOString().split('T')[0],
    filename: req.file.filename
  };
  
  documents.push(newDoc);
  
  // Log document upload
  try {
    await logCreate(
      req.user?.id || null,
      'documents',
      { name: newDoc.name, size: newDoc.size, schoolYear: newDoc.schoolYear, documentType: newDoc.documentType },
      newDoc.id,
      'document',
      `Uploaded document: ${newDoc.name}`,
      getClientIp(req),
      getUserAgent(req)
    );
  } catch (auditErr) {
    console.error('Audit logging error:', auditErr);
    // Continue anyway - don't break the upload
  }
  
  res.json(newDoc);
  }
);

// Download document
router.get('/:id/download', async (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  
  const filePath = path.join(uploadDir, doc.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Log document download before sending
  try {
    await logCreate(
      req.user?.id || null,
      'documents',
      { name: doc.name, size: doc.size, schoolYear: doc.schoolYear },
      doc.id,
      'download',
      `Downloaded document: ${doc.name}`,
      getClientIp(req),
      getUserAgent(req)
    );
  } catch (auditErr) {
    console.error('Audit logging error:', auditErr);
    // Continue anyway - don't break the download
  }
  
  res.download(filePath, doc.name);
});

// Delete document (staff only)
router.delete('/:id', authMiddleware, requireAdminRole, async (req, res) => {
  const index = documents.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Document not found' });
  
  const doc = documents[index];
  
  // Delete file from disk
  if (doc.filename) {
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  documents.splice(index, 1);
  
  // Log document deletion
  try {
    await logDelete(
      req.user?.id || null,
      'documents',
      { name: doc.name, size: doc.size, schoolYear: doc.schoolYear, documentType: doc.documentType },
      doc.id,
      'document',
      `Deleted document: ${doc.name}`,
      getClientIp(req),
      getUserAgent(req)
    );
  } catch (auditErr) {
    console.error('Audit logging error:', auditErr);
    // Continue anyway - deletion already done
  }
  
  res.json({ message: 'Document deleted successfully' });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;

