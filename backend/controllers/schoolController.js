const db = require('../config/db');
const { clientIp } = require('../services/authAudit');
const { logCreate, logUpdate, logDelete, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

function isSixDigitSchoolId(value) {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

let logoColumnAvailable = true;
let displayOrderColumnAvailable = true;

async function probeLogoColumn() {
  try {
    const [rows] = await db.execute("SHOW COLUMNS FROM schools LIKE 'logo_url'");
    logoColumnAvailable = rows.length > 0;
    if (!logoColumnAvailable) {
      // Try to self-heal in dev/single-db deployments where the app user has ALTER privileges.
      // This avoids breaking logo upload routes with a 500 when the column is missing.
      try {
        await db.query("ALTER TABLE `schools` ADD COLUMN `logo_url` varchar(255) DEFAULT NULL AFTER `school_name`");
        logoColumnAvailable = true;
        console.log('[schools] Added missing schools.logo_url column automatically');
      } catch (alterErr) {
        console.warn('[schools] logo_url column missing — run migration 005_add_school_logo_url.sql');
        console.warn('[schools] Auto-migration failed:', alterErr.code || alterErr.message);
      }
    }
  } catch (e) {
    logoColumnAvailable = false;
    console.warn('[schools] Could not probe schools.logo_url:', e.code || e.message);
  }
}
probeLogoColumn();

async function probeDisplayOrderColumn() {
  try {
    const [rows] = await db.execute("SHOW COLUMNS FROM schools LIKE 'display_order'");
    displayOrderColumnAvailable = rows.length > 0;
    if (!displayOrderColumnAvailable) {
      try {
        // Legacy column kept for backward compatibility; app ordering is alphabetical by school_name.
        await db.query("ALTER TABLE `schools` ADD COLUMN `display_order` int(11) DEFAULT NULL AFTER `school_name`");

        displayOrderColumnAvailable = true;
        console.log('[schools] Added missing schools.display_order column automatically');
      } catch (alterErr) {
        console.warn('[schools] display_order column missing — run migration 006_add_school_display_order.sql');
        console.warn('[schools] Auto-migration failed:', alterErr.code || alterErr.message);
      }
    }
  } catch (e) {
    displayOrderColumnAvailable = false;
    console.warn('[schools] Could not probe schools.display_order:', e.code || e.message);
  }
}
probeDisplayOrderColumn();

function requireLogoColumn(res) {
  if (logoColumnAvailable) return true;
  res.status(500).json({
    message:
      'School logos are not enabled in the database yet. Please run migration: backend/database/migrations/005_add_school_logo_url.sql',
  });
  return false;
}

/**
 * Get all schools with optional search and filtering
 */
exports.getAllSchools = async (req, res, next) => {
  try {
    const { search, type, sortBy = 'school_name', order = 'ASC', page, limit } = req.query;
    let sql = 'SELECT * FROM schools';
    let countSql = 'SELECT COUNT(*) as total FROM schools';
    let params = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push('(school_id LIKE ? OR school_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      whereClauses.push('school_type = ?');
      params.push(type);
    }

    if (whereClauses.length > 0) {
      const wherePart = ' WHERE ' + whereClauses.join(' AND ');
      sql += wherePart;
      countSql += wherePart;
    }

    // Get total count for pagination
    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0].total;

    // Basic sanitization for sort columns
    const allowedSort = ['display_order', 'school_id', 'school_name', 'principal_name', 'year_started'];
    const requestedSort = allowedSort.includes(sortBy) ? sortBy : 'school_name';
    const sort =
      requestedSort === 'display_order' && !displayOrderColumnAvailable ? 'school_name' : requestedSort;
    const direction = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Secondary sort keeps ordering stable for identical primary sort values.
    const secondarySort = sort === 'school_name' ? 'id ASC' : 'school_name ASC';
    sql += ` ORDER BY ${sort} ${direction}, ${secondarySort}`;

    // Apply pagination if page and limit are provided
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
    }

    const [rows] = await db.execute(sql, params);
    
    if (page && limit) {
      res.json({
        data: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      res.json(rows);
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single school by ID
 */
exports.getSchoolById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'School not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new school record
 */
exports.createSchool = async (req, res, next) => {
  try {
    const { school_id, school_name, principal_name, designation, year_started, school_type } = req.body;
    const userId = req.user.id;

    if (!school_id || !school_name || !principal_name || !designation || !year_started) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const normalizedSchoolId = String(school_id).trim();
    if (!isSixDigitSchoolId(normalizedSchoolId)) {
      return res.status(422).json({ message: 'School ID must be exactly 6 digits.' });
    }

    // Check for unique school_id
    const [existing] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [normalizedSchoolId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'School ID already exists' });
    }

    const nextType = (school_type || 'Public').trim();

    const [result] = await db.execute(
      logoColumnAvailable
        ? displayOrderColumnAvailable
          ? 'INSERT INTO schools (school_id, school_name, display_order, logo_url, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          : 'INSERT INTO schools (school_id, school_name, logo_url, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        : displayOrderColumnAvailable
          ? 'INSERT INTO schools (school_id, school_name, display_order, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          : 'INSERT INTO schools (school_id, school_name, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      logoColumnAvailable
        ? displayOrderColumnAvailable
          ? [normalizedSchoolId, school_name, null, null, principal_name, designation, year_started, nextType, userId]
          : [normalizedSchoolId, school_name, null, principal_name, designation, year_started, nextType, userId]
        : displayOrderColumnAvailable
          ? [normalizedSchoolId, school_name, null, principal_name, designation, year_started, nextType, userId]
          : [normalizedSchoolId, school_name, principal_name, designation, year_started, nextType, userId]
    );

    const newId = result.insertId;
    const newRecord = {
      id: newId,
      school_id: normalizedSchoolId,
      school_name,
      ...(displayOrderColumnAvailable ? { display_order: null } : {}),
      principal_name,
      designation,
      year_started,
      school_type: nextType,
      ...(logoColumnAvailable ? { logo_url: null } : {}),
    };
    
    await logCreate(
      userId,
      'schools',
      newRecord,
      newId,
      'school',
      `Created school: ${school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.status(201).json({ message: 'School record created successfully', id: newId });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a school record
 */
exports.updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { school_id, school_name, principal_name, designation, year_started, school_type, logo_url } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    
    const oldRecord = existingRows[0];

    // Access control: Sub admins can only edit their own entries
    if (userRole !== 'SuperAdmin' && oldRecord.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own entries' });
    }

    // Check school_id uniqueness if changed
    const normalizedSchoolId = school_id != null ? String(school_id).trim() : null;
    if (normalizedSchoolId && normalizedSchoolId !== oldRecord.school_id) {
      if (!isSixDigitSchoolId(normalizedSchoolId)) {
        return res.status(422).json({ message: 'School ID must be exactly 6 digits.' });
      }
      const [dup] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [normalizedSchoolId]);
      if (dup.length > 0) return res.status(409).json({ message: 'School ID already exists' });
    }

    const nextType = school_type != null ? String(school_type).trim() : oldRecord.school_type;

    await db.execute(
      logoColumnAvailable
        ? 'UPDATE schools SET school_id = ?, school_name = ?, principal_name = ?, designation = ?, year_started = ?, school_type = ?, logo_url = ? WHERE id = ?'
        : 'UPDATE schools SET school_id = ?, school_name = ?, principal_name = ?, designation = ?, year_started = ?, school_type = ? WHERE id = ?',
      logoColumnAvailable
        ? [
            normalizedSchoolId || oldRecord.school_id,
            school_name || oldRecord.school_name,
            principal_name || oldRecord.principal_name,
            designation || oldRecord.designation,
            year_started || oldRecord.year_started,
            nextType,
            logo_url !== undefined ? logo_url : oldRecord.logo_url,
            id,
          ]
        : [
            normalizedSchoolId || oldRecord.school_id,
            school_name || oldRecord.school_name,
            principal_name || oldRecord.principal_name,
            designation || oldRecord.designation,
            year_started || oldRecord.year_started,
            nextType,
            id,
          ]
    );

    const updatedRecord = { ...oldRecord, ...req.body };
    const diff = calculateDiff(oldRecord, req.body);
    
    await logUpdate(
      userId,
      'schools',
      oldRecord,
      updatedRecord,
      id,
      'school',
      diff,
      `Updated school: ${school_name || oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: 'School record updated successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a school record
 */
exports.deleteSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Access denied: Only main admins can delete records' });
    }

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    
    const oldRecord = existingRows[0];

    await db.execute('DELETE FROM schools WHERE id = ?', [id]);
    
    await logDelete(
      userId,
      'schools',
      oldRecord,
      id,
      'school',
      `Deleted school: ${oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: 'School record deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Export schools to Excel format
 */
exports.exportExcel = async (req, res, next) => {
  try {
    const { search, type, yearFrom, yearTo } = req.query;
    let sql = 'SELECT * FROM schools';
    let params = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push('(school_id LIKE ? OR school_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      whereClauses.push('school_type = ?');
      params.push(type);
    }

    if (yearFrom) {
      whereClauses.push('year_started >= ?');
      params.push(parseInt(yearFrom));
    }

    if (yearTo) {
      whereClauses.push('year_started <= ?');
      params.push(parseInt(yearTo));
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY school_name ASC';
    const [schools] = await db.execute(sql, params);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schools');

    // Set column widths
    worksheet.columns = [
      { width: 14 },  // School ID
      { width: 40 },  // School Name
      { width: 14 },  // School Type
      { width: 28 },  // Principal Name
      { width: 18 },  // Designation
      { width: 16 }   // Year Established
    ];

    let currentRow = 1;

    // Row 1: Title
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = 'SCHOOL DIRECTORY';
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FF1F4E78' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 24;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    currentRow++;

    // Row 2: Export date/time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell(1).value = `Exported: ${dateStr} | ${timeStr}`;
    dateRow.getCell(1).font = { size: 10 };
    dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    currentRow++;

    // Blank row
    currentRow++;

    // Row: Filter info if applicable
    if (search || type || yearFrom || yearTo) {
      const filterRow = worksheet.getRow(currentRow);
      filterRow.getCell(1).value = 'Filters Applied:';
      filterRow.getCell(1).font = { bold: true, size: 10 };
      filterRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      // Add filter details
      if (search) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Search: ${search}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;
      }
      if (type) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• School Type: ${type}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;
      }
      if (yearFrom || yearTo) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Year Range: ${yearFrom || 'N/A'} - ${yearTo || 'N/A'}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;
      }

      // Blank row
      currentRow++;
    }

    // Header row with column names
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['School ID', 'School Name', 'School Type', 'Principal Name', 'Designation', 'Year Established'];
    
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.alignment = { 
        horizontal: (idx === 0 || idx === 2 || idx === 3 || idx === 4 || idx === 5) ? 'center' : 'left', 
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    headerRow.height = 20;
    currentRow++;

    // Add data rows with alternating colors
    schools.forEach((school, index) => {
      const row = worksheet.getRow(currentRow);
      
      // Set values in correct order: School ID, School Name, School Type, Principal Name, Designation, Year Established
      row.getCell(1).value = school.school_id;
      row.getCell(2).value = school.school_name;
      row.getCell(3).value = school.school_type;
      row.getCell(4).value = school.principal_name;
      row.getCell(5).value = school.designation;
      row.getCell(6).value = school.year_started;

      // Alternate row background colors
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2';
      for (let i = 1; i <= 6; i++) {
        const cell = row.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFC0C0C0' } },
          left: { style: 'thin', color: { argb: 'FFC0C0C0' } },
          bottom: { style: 'thin', color: { argb: 'FFC0C0C0' } },
          right: { style: 'thin', color: { argb: 'FFC0C0C0' } }
        };
      }

      // Column-specific alignment
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // School ID
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };   // School Name
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // School Type
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };   // Principal Name
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }; // Designation
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }; // Year Established

      row.height = 18;
      currentRow++;
    });

    // Blank row
    currentRow++;

    // Footer with record count
    const footerRow = worksheet.getRow(currentRow);
    footerRow.getCell(1).value = `Total Records: ${schools.length} | Page 1`;
    footerRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF808080' } };
    footerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Schools_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    await workbook.xlsx.write(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Export schools to PDF format
 */
exports.exportPDF = async (req, res, next) => {
  try {
    const { search, type, yearFrom, yearTo } = req.query;
    let sql = 'SELECT * FROM schools';
    let params = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push('(school_id LIKE ? OR school_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      whereClauses.push('school_type = ?');
      params.push(type);
    }

    if (yearFrom) {
      whereClauses.push('year_started >= ?');
      params.push(parseInt(yearFrom));
    }

    if (yearTo) {
      whereClauses.push('year_started <= ?');
      params.push(parseInt(yearTo));
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY school_name ASC';
    const [schools] = await db.execute(sql, params);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Schools_${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(22).font('Helvetica-Bold').text('SCHOOL DIRECTORY', { align: 'center' });
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    doc.fontSize(10).font('Helvetica').text(`Exported: ${dateStr} | ${timeStr}`, { align: 'center' });
    doc.moveDown(0.5);

    // Add filter info if applicable
    if (search || type || yearFrom || yearTo) {
      doc.fontSize(9).font('Helvetica-Oblique').text('Filters Applied:', { underline: true });
      if (search) doc.text(`• Search: ${search}`);
      if (type) doc.text(`• School Type: ${type}`);
      if (yearFrom || yearTo) doc.text(`• Year Range: ${yearFrom || 'N/A'} - ${yearTo || 'N/A'}`);
      doc.moveDown(0.5);
    }

    // Table header - optimized for portrait
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 100;
    const col3 = 220;
    const col4 = 300;
    const col5 = 400;
    const col6 = 480;
    const rowHeight = 22;

    // Header background
    doc.rect(col1 - 5, tableTop, 490, rowHeight).fill('#1F4E78');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8.5);
    doc.text('School ID', col1, tableTop + 4, { width: 45 });
    doc.text('School Name', col2, tableTop + 4, { width: 115 });
    doc.text('Type', col3, tableTop + 4, { width: 75 });
    doc.text('Principal', col4, tableTop + 4, { width: 95 });
    doc.text('Designation', col5, tableTop + 4, { width: 75 });
    doc.text('Year Est.', col6, tableTop + 4, { width: 50 });

    doc.fillColor('black').font('Helvetica').fontSize(8);
    let yPos = tableTop + rowHeight + 3;

    // Table rows
    schools.forEach((school, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(col1 - 5, yPos - 3, 490, rowHeight).fill('#F5F5F5');
      }

      doc.fillColor('black');
      doc.text(school.school_id, col1, yPos, { width: 45 });
      doc.text(school.school_name, col2, yPos, { width: 115, ellipsis: true });
      doc.text(school.school_type, col3, yPos, { width: 75 });
      doc.text(school.principal_name, col4, yPos, { width: 95, ellipsis: true });
      doc.text(school.designation, col5, yPos, { width: 75, ellipsis: true });
      doc.text(school.year_started || 'N/A', col6, yPos, { width: 50 });

      yPos += rowHeight;

      // Add new page if needed
      if (yPos > doc.page.height - 60) {
        doc.addPage();
        yPos = 50;
      }
    });

    // Add bottom border to table
    doc.strokeColor('#1F4E78').lineWidth(2);
    doc.moveTo(col1 - 5, yPos).lineTo(col1 - 5 + 490, yPos).stroke();

    // Add spacing before footer
    doc.moveDown(2);

    // Footer - right aligned with precise positioning
    const footerText = `Total Records: ${schools.length} | Page 1`;
    const footerWidth = doc.widthOfString(footerText);
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('gray');
    doc.text(footerText, doc.page.width - footerWidth - 50, doc.y, { 
      width: footerWidth,
      align: 'right'
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * Upload a school logo (staff-only).
 * Expects `req.file` from multer.
 */
exports.uploadSchoolLogo = async (req, res, next) => {
  try {
    if (!requireLogoColumn(res)) return;
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    const oldRecord = existingRows[0];

    // Access control: Sub admins can only edit their own entries
    if (userRole !== 'SuperAdmin' && oldRecord.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own entries' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const logoUrl = `/uploads/schools/${req.file.filename}`;
    await db.execute('UPDATE schools SET logo_url = ? WHERE id = ?', [logoUrl, id]);

    const updated = { ...oldRecord, logo_url: logoUrl };
    const diff = calculateDiff(oldRecord, { logo_url: logoUrl });
    await logUpdate(
      userId,
      'schools',
      oldRecord,
      updated,
      id,
      'school',
      diff,
      `Updated school logo: ${oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: 'School logo updated', logoUrl });
  } catch (err) {
    next(err);
  }
};
