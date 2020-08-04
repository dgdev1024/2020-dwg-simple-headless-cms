/**
 * @file lib/async-wrappers.js
 * Functions for wrapping around async functions.
 */

/**
 * @function route
 * @brief Provides a wrapper around an async route handler function.
 * @param {Function} callable A function which returns a promise.
 * @param {Boolean} middleware Is this function a middleware function?
 * @return {Function} The wrapped route handler function.
 */
const route = (callable, middleware = false) => (req, res, next) =>
  callable(req, res)
    .then((proceed) => {
      if (middleware && proceed === true) {
        return next();
      }
    })
    .catch(next);

module.exports = {
  route,
};
