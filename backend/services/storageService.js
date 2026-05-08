const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Storage Service - Manages file persistence
 * Currently uses local filesystem, but can be swapped for S3/MinIO
 */
class StorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.privateDir = path.join(__dirname, '../uploads/private');
    this.publicDir = path.join(__dirname, '../uploads/public');
    this._init();
  }

  async _init() {
    try {
      await fs.mkdir(this.privateDir, { recursive: true });
      await fs.mkdir(this.publicDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create upload directories:', err);
    }
  }

  /**
   * Generates a unique, unguessable filename
   */
  generateFilename(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${hash}${ext}`;
  }

  /**
   * Stores a file in the private bucket and creates a public copy
   */
  async storeFile(fileBuffer, originalName, mimeType) {
    const filename = this.generateFilename(originalName);
    const privatePath = path.join(this.privateDir, filename);
    const publicPath = path.join(this.publicDir, filename);

    // Store in private "bucket"
    await fs.writeFile(privatePath, fileBuffer);

    // Create public read-only copy (simulating a public CDN/bucket)
    // In a real S3 setup, this would be a copy command or ACL update
    await fs.writeFile(publicPath, fileBuffer);

    return {
      filename,
      privatePath,
      publicUrl: `/uploads/public/${filename}`, // This would be a signed URL in production
      mimeType,
      size: fileBuffer.length
    };
  }

  async deleteFile(filename) {
    try {
      await fs.unlink(path.join(this.privateDir, filename));
      await fs.unlink(path.join(this.publicDir, filename));
    } catch (err) {
      console.warn(`Failed to delete file ${filename}:`, err.message);
    }
  }
}

module.exports = new StorageService();
