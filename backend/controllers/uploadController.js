const InputSanitizer = require('../utils/inputSanitizer');

const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  try {
    // Sanitize filename one more time before returning
    const sanitizedFileName = InputSanitizer.sanitizeFileName(req.file.filename);
    
    res.json({
      message: 'File uploaded successfully',
      filePath: `/uploads/${sanitizedFileName}`,
      fileName: sanitizedFileName,
      size: req.file.size,
    });
  } catch (err) {
    return res.status(400).json({
      message: 'Invalid file',
      details: err.message,
    });
  }
};

module.exports = {
  uploadFile,
};

