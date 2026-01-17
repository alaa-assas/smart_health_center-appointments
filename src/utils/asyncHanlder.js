/**
 * @desc    Wrap async route handlers to automatically catch errors
 *
 * This utility function eliminates the need for repetitive try/catch
 * blocks in async Express controllers by forwarding rejected promises
 * to the global error-handling middleware.
 *
 * @param   {Function} fn - Async Express route handler
 * @returns {Function} Wrapped Express middleware
 *
 * @example
 * router.get(
 *   "/users",
 *   asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json(users);
 *   })
 * );
 */
const asyncHanlder = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHanlder;