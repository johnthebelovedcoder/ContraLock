// apps/api/src/middleware/asyncHandler.js
/**
 * Async handler wrapper to catch errors from async route handlers
 * This prevents the need for try-catch blocks in every route
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;