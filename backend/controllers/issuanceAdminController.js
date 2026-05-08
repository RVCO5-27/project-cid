const db = require('../config/db');
const storageService = require('../services/storageService');
const securityService = require('../services/securityService');
const metadataService = require('../services/metadataService');
const { logCreate, logUpdate, logDelete, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * Issuance Admin Controller - Document and Record management
 */
class IssuanceAdminController {
  /**
   * List issuances with filters and pagination
   */
  async listIssuances(req, res, next) {
    try {
      const { 
        q, category_id, status, folder_id, 
        start_date, end_date, 
        limit = 50, cursor 
      } = req.query;

      let sql = `
        SELECT i.*, c.name as category_name, f.name as folder_name,
               fp.path as file_path, fp.mimetype as file_type, fp.size as file_size
        FROM issuances i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN folders f ON i.folder_id = f.id
        LEFT JOIN (
          SELECT issuance_id, MIN(file_id) AS file_id
          FROM issuance_files
          WHERE is_primary = 1
          GROUP BY issuance_id
        ) ifi ON i.id = ifi.issuance_id
        LEFT JOIN files fp ON ifi.file_id = fp.id
        WHERE i.deleted_at IS NULL
      `;
      const params = [];

      if (q) {
        sql += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.doc_number LIKE ?)`;
        const search = `%${q}%`;
        params.push(search, search, search);
      }

      if (category_id) {
        sql += ` AND i.category_id = ?`;
        params.push(category_id);
      }

      if (status) {
        sql += ` AND i.status = ?`;
        params.push(status);
      }

      if (folder_id) {
        sql += ` AND i.folder_id <=> ?`;
        params.push(folder_id === 'null' || folder_id === '' ? null : folder_id);
      }

      if (start_date && end_date) {
        sql += ` AND i.date_issued BETWEEN ? AND ?`;
        params.push(start_date, end_date);
      }

      // Cursor-based pagination (simple implementation using ID)
      if (cursor) {
        sql += ` AND i.id < ?`;
        params.push(cursor);
      }

      sql += ` ORDER BY i.id DESC LIMIT ?`;
      params.push(parseInt(limit));

      console.log('[listIssuances] Executing SQL:', sql);
      console.log('[listIssuances] With params:', params);
      const [rows] = await db.execute(sql, params);
      
      console.log('[listIssuances] Found rows:', rows.length, 'records');
      console.log('[listIssuances] First row sample:', rows.length > 0 ? JSON.stringify(rows[0]).substring(0, 200) : 'No rows');
      
      const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : null;

      res.json({
        data: rows,
        pagination: {
          limit: parseInt(limit),
          nextCursor
        }
      });
      console.log('[listIssuances] Response sent successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create issuance record and handle multi-file upload
   */
  async createIssuance(req, res, next) {
    console.log('[createIssuance] Starting...');
    console.log('[createIssuance] Body keys:', Object.keys(req.body || {}));
    console.log('[createIssuance] Files:', req.files ? req.files.length : 0);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      let { 
        title, description, doc_number, series_year, 
        date_issued, effective_date, expiry_date,
        category_id, folder_id, language, jurisdiction,
        status = 'published', signatory, tags
      } = req.body;

      console.log('[createIssuance] Parsed title:', title, 'doc_number:', doc_number, 'signatory:', signatory);

      // Default signatory to uploader's name if not provided
      if (!signatory || signatory.trim() === '') {
        signatory = req.user ? (req.user.full_name || req.user.name || req.user.username) : null;
      }

      // Deterministic doc_number generation if missing
      if (!doc_number || doc_number.trim() === '') {
        const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(100000 + Math.random() * 900000);
        doc_number = `ISS-${datePart}-${randomPart}`;
      }

      // Mandatory validation guard
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Issuance title is required' });
      }

      // 1. Insert Metadata
      const [result] = await connection.execute(
        `INSERT INTO issuances (
          title, description, doc_number, series_year, 
          date_issued, effective_date, expiry_date,
          category_id, folder_id, language, jurisdiction, status,
          signatory, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title || null, 
          description || null, 
          doc_number, 
          series_year || new Date().getFullYear(), 
          date_issued || new Date().toISOString().split('T')[0], 
          effective_date || null, 
          expiry_date || null,
          category_id || null, 
          folder_id === undefined ? null : (folder_id === 'null' ? null : folder_id), 
          language || 'en', 
          jurisdiction || 'Division', 
          status || 'published',
          signatory || null,
          tags || null
        ]
      );
      const issuanceId = result.insertId;

      // 2. Handle Files
      if (req.files && req.files.length > 0) {
        let fileIndex = 0;
        for (const file of req.files) {
          // Virus Scan
          const isClean = await securityService.scanForMalware(file.buffer);
          if (!isClean) throw new Error(`Security threat detected in file: ${file.originalname}`);

          // Validate MIME
          if (!securityService.validateMimeType(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}`);
          }

          // Store
          const stored = await storageService.storeFile(file.buffer, file.originalname, file.mimetype);

          // Extract PDF content if applicable
          let fullText = null;
          if (file.mimetype === 'application/pdf') {
            const extracted = await metadataService.extractPdfContent(file.buffer);
            fullText = extracted.text;
          }

          // Insert into files table
          const [fileResult] = await connection.execute(
            'INSERT INTO files (filename, originalname, path, uploaded_by) VALUES (?, ?, ?, ?)',
            [stored.filename, file.originalname, stored.publicUrl, req.user ? req.user.id : null]
          );
          const fileId = fileResult.insertId;

          // Junction table
          await connection.execute(
            'INSERT INTO issuance_files (issuance_id, file_id, is_primary) VALUES (?, ?, ?)',
            [issuanceId, fileId, fileIndex === 0 ? 1 : 0]
          );
          fileIndex += 1;

          // Update full_text_content if PDF
          if (fullText) {
            await connection.execute(
              'UPDATE issuances SET full_text_content = ? WHERE id = ?',
              [fullText, issuanceId]
            );
          }
        }
      }

      await connection.commit();

      // Log to audit system
      const newIssuanceData = { title, doc_number, status, category_id, folder_id, date_issued };
      if (req.user) {
        await logCreate(
          req.user.id,
          'issuances',
          newIssuanceData,
          issuanceId,
          'issuance',
          `Created issuance: ${title}`,
          getClientIp(req),
          getUserAgent(req)
        );
      }

      res.status(201).json({ id: issuanceId, message: 'Issuance created successfully' });
    } catch (err) {
      await connection.rollback();
      next(err);
    } finally {
      connection.release();
    }
  }

  /**
   * Update issuance record and handle multi-file upload
   */
  async updateIssuance(req, res, next) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const { id } = req.params;
      let { 
        title, description, doc_number, series_year, 
        date_issued, effective_date, expiry_date,
        category_id, folder_id, language, jurisdiction,
        status, signatory, tags
      } = req.body;

      // Get old issuance data before update for audit log
      const [[oldData]] = await connection.execute(
        'SELECT id, title, doc_number, status, category_id, folder_id, date_issued FROM issuances WHERE id = ?',
        [id]
      );

      // 1. Update Metadata
      await connection.execute(
        `UPDATE issuances SET 
          title = ?, description = ?, doc_number = ?, series_year = ?, 
          date_issued = ?, effective_date = ?, expiry_date = ?,
          category_id = ?, folder_id = ?, language = ?, jurisdiction = ?, status = ?,
          signatory = ?, tags = ?, updated_at = NOW()
        WHERE id = ?`,
        [
          title || null, 
          description || null, 
          doc_number, 
          series_year || new Date().getFullYear(), 
          date_issued || new Date().toISOString().split('T')[0], 
          effective_date || null, 
          expiry_date || null,
          category_id || null, 
          folder_id === undefined ? null : (folder_id === 'null' ? null : folder_id), 
          language || 'en', 
          jurisdiction || 'Division', 
          status || 'published',
          signatory || null,
          tags || null,
          id
        ]
      );

      // 2. Handle Files (if any)
      if (req.files && req.files.length > 0) {
        // When uploading new files on update, mark previous primary links as non-primary
        // so the issuance continues to have at most one primary file.
        await connection.execute(
          'UPDATE issuance_files SET is_primary = 0 WHERE issuance_id = ?',
          [id]
        );
        let fileIndex = 0;
        for (const file of req.files) {
          // Virus Scan
          const isClean = await securityService.scanForMalware(file.buffer);
          if (!isClean) throw new Error(`Security threat detected in file: ${file.originalname}`);

          // Validate MIME
          if (!securityService.validateMimeType(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}`);
          }

          // Store
          const stored = await storageService.storeFile(file.buffer, file.originalname, file.mimetype);

          // Extract PDF content if applicable
          let fullText = null;
          if (file.mimetype === 'application/pdf') {
            const extracted = await metadataService.extractPdfContent(file.buffer);
            fullText = extracted.text;
          }

          // Insert into files table
          const [fileResult] = await connection.execute(
            'INSERT INTO files (filename, originalname, path, uploaded_by) VALUES (?, ?, ?, ?)',
            [stored.filename, file.originalname, stored.publicUrl, req.user ? req.user.id : null]
          );
          const fileId = fileResult.insertId;

          // Junction table
          await connection.execute(
            'INSERT INTO issuance_files (issuance_id, file_id, is_primary) VALUES (?, ?, ?)',
            [id, fileId, fileIndex === 0 ? 1 : 0]
          );
          fileIndex += 1;

          // Update full_text_content if PDF
          if (fullText) {
            await connection.execute(
              'UPDATE issuances SET full_text_content = ? WHERE id = ?',
              [fullText, id]
            );
          }
        }
      }

      await connection.commit();

      // Log to audit system
      if (req.user && oldData) {
        const updatedData = { title, doc_number, status, category_id, folder_id, date_issued };
        const diff = calculateDiff(oldData, updatedData);
        await logUpdate(
          req.user.id,
          'issuances',
          oldData,
          updatedData,
          id,
          'issuance',
          diff,
          `Updated issuance: ${title}`,
          getClientIp(req),
          getUserAgent(req)
        );
      }

      res.json({ id, message: 'Issuance updated successfully' });
    } catch (err) {
      await connection.rollback();
      next(err);
    } finally {
      connection.release();
    }
  }

  /**
   * Soft-delete an issuance
   */
  async deleteIssuance(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      // Get issuance before deletion for audit log
      const [[issuanceData]] = await db.execute(
        'SELECT id, title, doc_number, status FROM issuances WHERE id = ?',
        [id]
      );

      await db.execute(
        'UPDATE issuances SET deleted_at = NOW(), status = "archived" WHERE id = ?',
        [id]
      );

      // Log to audit system
      if (req.user) {
        await logDelete(
          req.user.id,
          'issuances',
          issuanceData,
          id,
          'issuance',
          `Archived issuance: ${issuanceData?.title}`,
          getClientIp(req),
          getUserAgent(req)
        );
      }

      res.json({ message: 'Issuance archived successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk operations (publish, unpublish, delete)
   */
  async bulkUpdate(req, res, next) {
    try {
      const { ids, action, value } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDs are required' });

      if (action === 'status') {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(
          `UPDATE issuances SET status = ? WHERE id IN (${placeholders})`,
          [value, ...ids]
        );
      } else if (action === 'delete') {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(
          `UPDATE issuances SET deleted_at = NOW(), status = "archived" WHERE id IN (${placeholders})`,
          [...ids]
        );
      }

      res.json({ message: `Bulk ${action} completed successfully` });

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, old_value, new_value) VALUES (?, ?, ?, ?)',
          [req.user ? req.user.id : null, `BULK_${action.toUpperCase()}_ISSUANCE`, JSON.stringify({ ids }), JSON.stringify({ value })]
        );
      } catch (logErr) {
        console.error('[IssuanceAdminController] Failed to log bulk action:', logErr.message);
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IssuanceAdminController();
