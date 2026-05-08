const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const { logPermissionDenied, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * Audit log routes — SuperAdmin only.
 * Static paths are registered before `/:id` so IDs like "export" never hijack real routes.
 */

router.use(authMiddleware);
router.use(requireAdminRole);

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SuperAdmin') {
    void logPermissionDenied({
      userId: req.user.id,
      description: 'Blocked: only the lead administrator can open the Activity Log',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      path: String(req.originalUrl || req.url || '').split('?')[0],
      method: req.method,
    });
    return res.status(403).json({ message: 'Access denied: Only SuperAdmins can access audit logs' });
  }
  next();
};

router.use(requireSuperAdmin);

router.get('/', auditLogController.getAllAuditLogs);
router.get('/stats/overview', auditLogController.getAuditStatistics);
router.post('/export/csv', auditLogController.exportAuditLogs);
router.get('/categories/list', auditLogController.getCategories);
router.get('/alerts/list', auditLogController.getAlerts);
router.put('/alerts/:id/acknowledge', auditLogController.acknowledgeAlert);
router.get('/:id', auditLogController.getAuditLogById);

module.exports = router;
