const db = require('../config/db');

/**
 * Get all public issuances with their category names.
 * GET /api/issuances
 */
const getPublicIssuances = async (req, res, next) => {
  try {
    const { q, category_id, series_year, folder_id, start_date, end_date } = req.query;
    
    console.log('[getPublicIssuances] Query params:', { q, category_id, series_year, folder_id, start_date, end_date });
    
    let sql = `
      SELECT 
        i.id, 
        i.title, 
        i.doc_number, 
        i.series_year, 
        i.date_issued, 
        i.signatory, 
        i.tags, 
        i.created_at,
        c.name as category_name,
        c.prefix as category_prefix,
        f.path as file_path,
        f.filename as file_filename,
        f.originalname as file_originalname,
        f.mimetype as file_mime_type,
        f.size as file_size
      FROM issuances i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN (
        SELECT issuance_id, MIN(file_id) AS file_id
        FROM issuance_files
        WHERE is_primary = 1
        GROUP BY issuance_id
      ) \`if\` ON i.id = \`if\`.issuance_id
      LEFT JOIN files f ON \`if\`.file_id = f.id
      WHERE i.status = 'published' AND i.is_archived = FALSE AND i.deleted_at IS NULL
    `;
    
    const params = [];
    
    if (q) {
      sql += ` AND (i.title LIKE ? OR i.tags LIKE ? OR i.doc_number LIKE ?)`;
      const query = `%${q}%`;
      params.push(query, query, query);
    }
    
    if (category_id) {
      sql += ` AND i.category_id = ?`;
      params.push(category_id);
    }
    
    if (series_year) {
      sql += ` AND i.series_year = ?`;
      params.push(series_year);
    }

    if (folder_id) {
      sql += ` AND i.folder_id = ?`;
      params.push(folder_id === 'null' ? null : folder_id);
    }

    if (start_date) {
      sql += ` AND i.date_issued >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND i.date_issued <= ?`;
      params.push(end_date);
    }
    
    sql += ` ORDER BY i.date_issued DESC, i.created_at DESC`;
    
    console.log('[getPublicIssuances] SQL:', sql);
    console.log('[getPublicIssuances] Params:', params);
    
    const [rows] = await db.execute(sql, params);
    console.log('[getPublicIssuances] Found', rows.length, 'rows');
    if (rows.length > 0) {
      console.log('[getPublicIssuances] First row:', JSON.stringify(rows[0]).substring(0, 300));
    }
    res.json(rows);
  } catch (error) {
    console.error('[getPublicIssuances] Error:', error.message);
    console.error('[getPublicIssuances] Stack:', error.stack);
    next(error);
  }
};

/**
 * Get categories for filtering.
 * GET /api/issuances/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id, name, prefix FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unique series years for filtering.
 * GET /api/issuances/years
 */
const getYears = async (req, res, next) => {
  try {
    console.log('[getYears] Fetching distinct series years...');
    const [rows] = await db.execute('SELECT DISTINCT series_year FROM issuances WHERE status = "published" AND is_archived = FALSE AND deleted_at IS NULL ORDER BY series_year DESC');
    const years = rows.map(r => r.series_year);
    console.log('[getYears] Found years:', years);
    res.json(years);
  } catch (error) {
    console.error('[getYears] Error:', error.message);
    next(error);
  }
};

/**
 * Get public folders for browsing.
 * GET /api/issuances/folders
 */
const getPublicFolders = async (req, res, next) => {
  try {
    console.log('[getPublicFolders] Fetching public folders...');
    // Return folders that have published issuances OR are parents of folders with published issuances
    const [rows] = await db.execute(`
      SELECT DISTINCT f.id, f.name, f.parent_id 
      FROM folders f
      WHERE f.id IN (
        -- Folders with direct published issuances
        SELECT DISTINCT i.folder_id 
        FROM issuances i
        WHERE i.status = 'published' AND i.deleted_at IS NULL AND i.folder_id IS NOT NULL
        UNION
        -- Parent folders of folders with published issuances
        SELECT DISTINCT f2.parent_id
        FROM folders f2
        INNER JOIN issuances i ON f2.id = i.folder_id
        WHERE i.status = 'published' AND i.deleted_at IS NULL AND f2.parent_id IS NOT NULL
      )
      ORDER BY f.name ASC
    `);
    console.log('[getPublicFolders] Found', rows.length, 'folders:', rows);
    res.json(rows);
  } catch (error) {
    console.error('[getPublicFolders] Error:', error.message);
    next(error);
  }
};

module.exports = {
  getPublicIssuances,
  getCategories,
  getYears,
  getPublicFolders
};
