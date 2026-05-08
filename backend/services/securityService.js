/**
 * Security Service - Virus scanning and security validations
 */
class SecurityService {
  constructor() {
    this.mimeWhitelist = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
  }

  /**
   * Scans a file buffer for malware
   * (Mock implementation - would connect to ClamAV in production)
   */
  async scanForMalware(fileBuffer) {
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple heuristic: check for some "suspicious" strings in text (very basic mock)
    // const content = fileBuffer.toString('utf8');
    // if (content.includes('EVIL_VIRUS')) return false;

    return true; // Assume clean
  }

  /**
   * Validates if the MIME type is in the whitelist
   */
  validateMimeType(mimeType) {
    return this.mimeWhitelist.includes(mimeType);
  }
}

module.exports = new SecurityService();
