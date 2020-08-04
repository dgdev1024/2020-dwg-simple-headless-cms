/**
 * @file lib/route-middleware.js
 * All of our custom route middleware functions.
 */

const { RequestError } = require("./error-classes");

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
  const error = new RequestError(
    404,
    `${req.isApiEndpoint ? "Endpoint" : "Page"} not found - '${
      req.originalUrl
    }'`
  );

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
  let statusCode, statusText;
  if (err instanceof RequestError) {
    res.status(err.statusCode);
    statusCode = err.statusCode;
    statusText = err.statusText;
  } else {
    // Unless a status code was set by another route middleware function, set the
    // status code to 500 (Internal Server Error).
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    statusCode = res.statusCode;
    statusText = res.statusText;
  }

  // Construct the error object to be returned.
  const error = {
    statusCode,
    statusText,
    message: err.message,
  };

  // Include the error stack in development mode.
  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
  }

  // Return or render the error.
  if (err instanceof RequestError) {
    if (err.options.renderPage) {
      console.log(err.options);
      return res.render(err.options.renderPage, {
        error,
        errorDetails: err.options.details || {},
        isAdmin: req.user ? req.user.isAdmin : false,
        username: req.user ? req.user.username : "",
      });
    } else {
      return res.json({ error, details: err.options.details || {} });
    }
  } else {
    return res.json({ error });
  }
};

module.exports = {
  checkEndpointType,
  notFoundErrorHandler,
  generalErrorHandler,
};
