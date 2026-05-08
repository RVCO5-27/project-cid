const pdfParse = require('pdf-parse');

/**
 * Metadata Service - Extracts content and properties from documents
 */
class MetadataService {
  /**
   * Extracts text and metadata from PDF
   */
  async extractPdfContent(fileBuffer) {
    try {
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        info: data.info,
        metadata: data.metadata,
        version: data.version,
        numPages: data.numpages
      };
    } catch (err) {
      console.error('PDF extraction failed:', err);
      return { text: '', info: {}, metadata: null, version: null, numPages: 0 };
    }
  }

  /**
   * Generates a thumbnail for the first page of a PDF or an image
   * (Placeholder logic - requires heavy libs like gm or sharp)
   */
  async generateThumbnail(filename, mimeType) {
    // In production, use sharp for images and pdf-poppler for PDFs
    return `/uploads/public/thumbnails/placeholder.png`;
  }
}

module.exports = new MetadataService();
