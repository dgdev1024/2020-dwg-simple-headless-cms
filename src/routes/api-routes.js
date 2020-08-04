/**
 * @file routes/api-routes.js
 * Route handlers for our API functionality.
 */

// Imports and Express Router
const { Router } = require("express");
const { RequestError } = require("../lib/error-classes");
const setup = require("../controllers/setup");
const user = require("../controllers/user");
const router = Router();

router.use(setup.adminAccountExists, (req, res, next) => {
  if (req.adminAccountExists === false) {
    return next(
      new RequestError(
        404,
        "No admin account found. The CMS likely has not been set up, yet."
      )
    );
  } else {
    return next();
  }
});

router.use(user.authenticateApiKey);

module.exports = router;
