/**
 * Unified response formatter
 * @param {boolean} success
 * @param {string} message
 * @param {object|array|any} data
 * @param {string} code - e.g., "SUCCESS", "NOT_FOUND", "VALIDATION_ERROR"
 * @returns {object}
 */
const collection = (success, message, data = null, code = "UNKNOWN") => {
  const response = { success, message, code };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return response;
};

module.exports = collection;