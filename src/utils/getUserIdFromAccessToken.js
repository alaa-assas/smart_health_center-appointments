/**
 * @desc Extract user ID from access token stored in cookies
 *
 * This helper function retrieves the access token from the request cookies,
 * verifies its validity, and returns the authenticated user's ID.
 *
 * @param   {Object} req - Express request object
 * @returns {String} userId - Authenticated user's ID extracted from the token
 *
 * @throws  {Error} If access token is missing or invalid
 */
const getUserIdFromAccessToken = (req) => {
    const accessToken = cookieService.getAccessToken(req);
    if (!accessToken) {
        throw new Error("No access token found");
    }
    const decoded = tokenService.verifyAccessToken(accessToken);
    return decoded.id;
};

module.exports = getUserIdFromAccessToken;