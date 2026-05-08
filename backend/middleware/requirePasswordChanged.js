/**
 * Blocks dashboard/API use until password change when JWT carries mustChangePassword.
 * Allow only POST /api/auth/change-password (handled by route order / bypass).
 */
exports.requirePasswordChanged = (req, res, next) => {
  if (req.user && req.user.mustChangePassword === true) {
    return res.status(403).json({
      code: 'MUST_CHANGE_PASSWORD',
      message: 'You must set a new password before continuing.',
    });
  }
  next();
};
