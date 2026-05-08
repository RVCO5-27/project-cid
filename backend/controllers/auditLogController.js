const db = require('../config/db');
const { logAuditEvent, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * Get all audit logs with filtering, search, and pagination
 */
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const { 
      actionType, 
      userId, 
      category, 
      status, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      sortBy = 'timestamp',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT al.*, a.username, a.full_name 
      FROM audit_logs al 
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE 1=1
    `;
    let params = [];

    // Filters
    if (actionType) {
      sql += ' AND al.action_type = ?';
      params.push(actionType);
    }

    if (category) {
      sql += ' AND al.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }

    if (userId) {
      sql += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (startDate && endDate) {
      sql += ' AND al.timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ' AND DATE(al.timestamp) >= DATE(?)';
      params.push(startDate);
    }

    // Search across multiple fields
    if (search) {
      sql += ` AND (al.old_value LIKE ? OR al.new_value LIKE ? 
               OR a.username LIKE ? OR a.full_name LIKE ? 
               OR al.description LIKE ? OR al.record_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    // Get total count before pagination
    const countSql = sql.replace(/SELECT al\.\*, a\.username, a\.full_name/, 'SELECT COUNT(*) as total');
    const [[{ total }]] = await db.execute(countSql, params);

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Validate sortBy to prevent SQL injection
    const validSortBy = ['timestamp', 'id', 'action_type', 'status', 'user_id'];
    const sortField = validSortBy.includes(sortBy) ? sortBy : 'timestamp';
    const validSort = ['ASC', 'DESC'];
    const sortDir = validSort.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    sql += ` ORDER BY al.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [rows] = await db.execute(sql, params);

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit log by ID with full details
 */
exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT al.*, a.username, a.full_name 
       FROM audit_logs al 
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    const log = rows[0];
    if (log.diff_snapshot) {
      try {
        log.diff_snapshot = JSON.parse(log.diff_snapshot);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    if (log.details) {
      try {
        log.details = JSON.parse(log.details);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit statistics and summary
 */
exports.getAuditStatistics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // Total logs in period
    const [[{ totalLogs }]] = await db.execute(
      `SELECT COUNT(*) as totalLogs FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Logs by action type
    const [byActionType] = await db.execute(
      `SELECT action_type, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY action_type`,
      [days]
    );

    // Logs by category
    const [byCategory] = await db.execute(
      `SELECT category, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY category`,
      [days]
    );

    // Logs by status
    const [byStatus] = await db.execute(
      `SELECT status, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY status`,
      [days]
    );

    // Top users
    const [topUsers] = await db.execute(
      `SELECT al.user_id, a.username, a.full_name, COUNT(*) as count 
       FROM audit_logs al
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY al.user_id
       ORDER BY count DESC
       LIMIT 10`,
      [days]
    );

    // Recent logs
    const [recentLogs] = await db.execute(
      `SELECT al.*, a.username, a.full_name 
       FROM audit_logs al
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY al.timestamp DESC
       LIMIT 10`,
      [days]
    );

    res.json({
      summary: {
        totalLogs,
        period: `${days} days`,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      },
      breakdown: {
        byActionType,
        byCategory,
        byStatus,
        topUsers,
        recentLogs
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export audit logs as CSV (POST + confirm body — no public GET download).
 */
exports.exportAuditLogs = async (req, res, next) => {
  try {
    if (!req.body || req.body.confirm !== true) {
      return res.status(400).json({
        message: 'Please confirm the download on the Activity Log screen first.',
      });
    }

    const { startDate, endDate, actionType, category, status } = req.query;

    let sql = `
      SELECT al.id, al.user_id, a.username, al.action_type, 
             al.module, al.record_id, al.status, al.ip_address, al.timestamp,
             al.description, al.old_value, al.new_value
      FROM audit_logs al 
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate && endDate) {
      sql += ' AND al.timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (actionType) {
      sql += ' AND al.action_type = ?';
      params.push(actionType);
    }

    if (category) {
      sql += ' AND al.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY al.timestamp DESC';

    const [logs] = await db.execute(sql, params);

    await logAuditEvent({
      userId: req.user.id,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      module: 'audit',
      description: `Downloaded activity log (spreadsheet, ${logs.length} rows)`,
      recordId: 'excel_export',
      resourceType: 'audit_export',
      newValue: { rowCount: logs.length, filters: { startDate, endDate, actionType, status } },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // Export to Excel with professional formatting
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    // Set column widths
    worksheet.columns = [
      { width: 10 },  // ID
      { width: 12 },  // User ID
      { width: 18 },  // Username
      { width: 16 },  // Action Type
      { width: 14 },  // Module
      { width: 12 },  // Record ID
      { width: 12 },  // Status
      { width: 16 },  // IP Address
      { width: 20 },  // Timestamp
      { width: 30 }   // Description
    ];

    let currentRow = 1;

    // Row 1: Title
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = 'AUDIT LOG EXPORT';
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FF1F4E78' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 24;
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    currentRow++;

    // Row 2: Export date/time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell(1).value = `Exported: ${dateStr} | ${timeStr}`;
    dateRow.getCell(1).font = { size: 10 };
    dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    currentRow++;

    // Blank row
    currentRow++;

    // Row: Filter info if applicable
    if (startDate || endDate || actionType || category || status) {
      const filterRow = worksheet.getRow(currentRow);
      filterRow.getCell(1).value = 'Filters Applied:';
      filterRow.getCell(1).font = { bold: true, size: 10 };
      filterRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
      currentRow++;

      // Add filter details
      if (startDate && endDate) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Date Range: ${startDate} to ${endDate}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
        currentRow++;
      }
      if (actionType) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Action Type: ${actionType}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
        currentRow++;
      }
      if (category) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Category: ${category}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
        currentRow++;
      }
      if (status) {
        const filterDetail = worksheet.getRow(currentRow);
        filterDetail.getCell(1).value = `• Status: ${status}`;
        filterDetail.getCell(1).font = { size: 9 };
        filterDetail.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
        currentRow++;
      }

      // Blank row
      currentRow++;
    }

    // Header row with column names
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['ID', 'User ID', 'Username', 'Action Type', 'Module', 'Record ID', 'Status', 'IP Address', 'Timestamp', 'Description'];
    
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.alignment = { 
        horizontal: 'center', 
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
    logs.forEach((log, index) => {
      const row = worksheet.getRow(currentRow);
      
      // Set values
      row.getCell(1).value = log.id;
      row.getCell(2).value = log.user_id;
      row.getCell(3).value = log.username || 'N/A';
      row.getCell(4).value = log.action_type;
      row.getCell(5).value = log.module;
      row.getCell(6).value = log.record_id;
      row.getCell(7).value = log.status;
      row.getCell(8).value = log.ip_address;
      row.getCell(9).value = log.timestamp;
      row.getCell(10).value = log.description || 'N/A';

      // Alternate row background colors
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2';
      for (let i = 1; i <= 10; i++) {
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
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // ID
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }; // User ID
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };   // Username
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }; // Action Type
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }; // Module
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }; // Record ID
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }; // Status
      row.getCell(8).alignment = { horizontal: 'left', vertical: 'middle' };   // IP Address
      row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }; // Timestamp
      row.getCell(10).alignment = { horizontal: 'left', vertical: 'middle' };  // Description

      row.height = 18;
      currentRow++;
    });

    // Blank row
    currentRow++;

    // Footer with record count
    const footerRow = worksheet.getRow(currentRow);
    footerRow.getCell(1).value = `Total Records: ${logs.length} | Page 1`;
    footerRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF808080' } };
    footerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="AuditLog_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    await workbook.xlsx.write(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit log categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM audit_log_categories ORDER BY label ASC'
    );
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

/**
 * Get alerts for security events
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const { severity, acknowledged, page = 1, limit = 20 } = req.query;

    let sql = 'SELECT * FROM audit_log_alerts WHERE 1=1';
    let params = [];

    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    if (acknowledged !== undefined) {
      sql += ' AND is_acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Get total
    const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as total');
    const [[{ total }]] = await db.execute(countSql, params);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [alerts] = await db.execute(sql, params);

    res.json({
      data: alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Acknowledge an alert
 */
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.execute(
      `UPDATE audit_log_alerts 
       SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = NOW()
       WHERE id = ?`,
      [userId, id]
    );

    res.json({ message: 'Alert acknowledged' });
  } catch (err) {
    next(err);
  }
};
