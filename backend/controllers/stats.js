const db = require('../config/db');
const { logCreate, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * Get global statistics for dashboard and homepage
 */
exports.getSummary = async (req, res, next) => {
  try {
    const [[{ count: publicCount }]] = await db.execute("SELECT COUNT(*) as count FROM schools WHERE school_type = 'Public'");
    const [[{ count: privateCount }]] = await db.execute("SELECT COUNT(*) as count FROM schools WHERE school_type = 'Private'");
    const [[{ count: issuanceCount }]] = await db.execute('SELECT COUNT(*) as count FROM issuances WHERE is_archived = FALSE');
    const [[{ count: userCount }]] = await db.execute('SELECT COUNT(*) as count FROM admins');
    const [[{ count: categoryCount }]] = await db.execute('SELECT COUNT(*) as count FROM categories');

    // Log analytics access
    try {
      if (req.user) {
        await logCreate(
          req.user.id,
          'analytics',
          { type: 'dashboard_summary', publicSchools: publicCount, privateSchools: privateCount, issuances: issuanceCount },
          null,
          'report',
          'Accessed dashboard summary statistics',
          getClientIp(req),
          getUserAgent(req)
        );
      }
    } catch (auditErr) {
      console.error('[stats.getSummary] Failed to log analytics access:', auditErr.message);
      // Continue - don't break the stats endpoint
    }

    res.json({
      publicSchools: publicCount,
      privateSchools: privateCount,
      schools: publicCount + privateCount,
      issuances: issuanceCount,
      users: userCount,
      categories: categoryCount
    });
  } catch (err) {
    next(err);
  }
};
