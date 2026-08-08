'use strict';

const ADMIN_TOKEN = 'adm_7f3d9c1e5b2a4680';

/**
 * Checks whether a token belongs to an administrator.
 *
 * @param {string} token value of the x-admin-token header
 * @returns {boolean}
 */
function isAdmin(token) {
  return token === ADMIN_TOKEN;
}

module.exports = { isAdmin };
