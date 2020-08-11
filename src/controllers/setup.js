/**
 * @file controllers/setup.js
 * Controller functions and middleware for our setup process.
 */

// Imports
const { route } = require("../lib/async-wrappers");
const validation = require("../lib/validation-schemas");
const { RequestError } = require("../lib/error-classes");
const userModel = require("../models/user");

/**
 * @function adminAccountExists
 * @brief Middleware function for checking to see if an admin account exists.
 * @param {Request} req
 * @param {Response} res
 */
const adminAccountExists = async (req) => {
  const admin = await userModel.findOne({ isAdmin: true });
  req.adminAccountExists = !!admin;
  return true;
};

/**
 * @function createAdminUser
 * @brief Creates the administrator user account.
 * @param {Request} req
 * @param {Response} res
 */
const createAdminUser = async (req, res) => {
  // Get and validate the user's credentials.
  const { username, password } = req.body;
  try {
    await validation.userCreation.validate(
      { username, password },
      { abortEarly: false }
    );
  } catch (err) {
    throw new RequestError(400, "There were issues validating your input.", {
      renderPage: "setup",
      details: {
        validationErrors: err.errors,
      },
    });
  }

  // Create the admin user.
  const admin = new userModel({ username, isAdmin: true });
  admin.setPassword(password);
  admin.generateApiKeys();
  await admin.save();

  // Redirect to home.
  console.log("done");
  return res.status(200).redirect("/");
};

module.exports = {
  adminAccountExists: route(adminAccountExists, true),
  createAdminUser: route(createAdminUser),
};
