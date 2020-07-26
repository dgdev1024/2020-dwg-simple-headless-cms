/**
 * @file lib/route-middleware.js
 * All of our custom route middleware functions.
 */

/**
 * @function checkEndpointType
 * @brief Middleware for checking if the route endpoint is an API or page endpoint.
 * @param {Request} req The HTTP request.
 * @param {Response} res The HTTP response.
 * @param {Function} next The next middleware function.
 */
const checkEndpointType = (req, res, next) => {
  const { originalUrl } = req;
  req.isApiEndpoint = originalUrl.startsWith("/api");
  req.isPageEndpoint = !req.isApiEndpoint;
  req.isAdminEndpoint = originalUrl.startsWith("/admin");
  next();
};

/**
 * @function notFoundErrorHandler
 * @brief Middleware for handling the '404 Not Found' error.
 * @param {Request} req The HTTP request.
 * @param {Response} res The HTTP response.
 * @param {Function} next The next middleware function.
 */
const notFoundErrorHandler = (req, res, next) => {
  const error = new Error(
    `${req.isApiEndpoint ? "Endpoint" : "Page"} not found - '${
      req.originalUrl
    }'`
  );

  res.status(404);
  next(error);
};

/**
 * @function generalErrorHandler
 * @brief Middleware for handling route errors.
 * @param {Error} err The error to handle.
 * @param {Request} req The HTTP request.
 * @param {Response} res The HTTP response.
 * @param {Function} next The next middleware function.
 */
const generalErrorHandler = (err, req, res, next) => {
  // Unless a status code was set by another route middleware function, set the
  // status code to 500 (Internal Server Error).
  res.status(res.statusCode === 200 ? 500 : res.statusCode);

  // Construct the error object to be returned.
  const error = {
    statusCode: res.statusCode,
    statusText: res.statusText,
    message: err.message,
  };

  // Include the error stack in development mode.
  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
  }

  // Return the error.
  res.json({ error });
};

module.exports = {
  checkEndpointType,
  notFoundErrorHandler,
  generalErrorHandler,
};
