const express = require('express');
const router = express.Router();
const multer = require('multer');
const folderAdminController = require('../controllers/folderAdminController');
const issuanceAdminController = require('../controllers/issuanceAdminController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024,
    files: 10
  }
});

router.get('/folders', folderAdminController.getFolderTree);
router.get('/folders/check-name', folderAdminController.checkFolderName);
router.get('/categories', folderAdminController.getCategories);
router.post('/folders', folderAdminController.createFolder);
router.put('/folders/bulk-move', folderAdminController.bulkMoveFolders);
router.put('/folders/:id', folderAdminController.updateFolder);
router.delete('/folders/:id', folderAdminController.deleteFolder);

router.get('/issuances', issuanceAdminController.listIssuances);

router.post('/issuances', upload.array('files', 10), async (req, res, next) => {
  console.log('[DEBUG] After multer - files:', req.files?.length);
  console.log('[DEBUG] After multer - body:', req.body);
  console.log('[DEBUG] After multer - content-type:', req.headers['content-type']);
  
  if (!req.files || req.files.length === 0) {
    console.log('[DEBUG] No files in req.files');
  }
  
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log('[DEBUG] req.body is empty!');
  }
  
  try {
    await issuanceAdminController.createIssuance(req, res, next);
  } catch (err) {
    console.error('[DEBUG] Controller error:', err.message, err.stack);
    next(err);
  }
});

router.put('/issuances/:id', upload.array('files', 10), issuanceAdminController.updateIssuance);
router.delete('/issuances/:id', issuanceAdminController.deleteIssuance);
router.post('/issuances/bulk', issuanceAdminController.bulkUpdate);

module.exports = router;

