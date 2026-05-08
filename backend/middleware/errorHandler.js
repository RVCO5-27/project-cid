const { logCriticalError, getClientIp, getUserAgent } = require('../services/auditService');

module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}`);
  console.error(`[ERROR] Message: ${err.message}`);
  console.error(`[ERROR] Stack: ${err.stack}`);
  
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage =
    isProd && status >= 500 ? 'Internal server error' : err.message || 'Internal server error';
  
  // Log critical errors (500+) to audit system
  if (status >= 500) {
    logCriticalError(
      req.user?.id || null,
      status.toString(),
      err.message || 'Unknown error',
      req.path,
      err.stack || 'No stack trace',
      getClientIp(req),
      getUserAgent(req)
    ).catch(auditErr => console.error('[errorHandler] Failed to log error to audit:', auditErr.message));
  }
  
  res.status(status).json({ 
    message: safeMessage, 
    error: safeMessage,
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
};
