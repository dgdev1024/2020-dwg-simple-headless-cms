/**
 * @file routes/setup-routes.js
 * Route handlers for the CMS setup process.
 */

// Imports and Express Router
const { Router } = require("express");
const setup = require("../controllers/setup");
const router = Router();

// Check for the presence of an admin user account before proceeding.
router.use(setup.adminAccountExists, (req, res, next) => {
  if (req.adminAccountExists === true) {
    return res.redirect("/");
  } else {
    return next();
  }
});

router
  .route("/")
  .post(setup.createAdminUser)
  .get((_, res) => res.render("setup"));

module.exports = router;
