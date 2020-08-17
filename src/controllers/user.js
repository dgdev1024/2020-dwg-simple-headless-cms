/**
 * @file controllers/user.js
 * Controller functions and middleware for our users.
 */

// Imports
const passport = require("passport");
const strcmp = require("tsscmp");
const userModel = require("../models/user");
const { route } = require("../lib/async-wrappers");
const { RequestError } = require("../lib/error-classes");
const { decryptText } = require("../lib/crypto");
const validation = require("../lib/validation-schemas");

/**
 * @function createUser
 * @brief Allows an administrator to create a new user account.
 * @param {Request} req
 * @param {Response} res
 */
const createUser = async (req, res) => {
  // Make sure an administrator account is logged in.
  const { user } = req;
  if (!user || !user.isAdmin) {
    throw new RequestError(403, "You must be logged in as an administrator.");
  }

  // Get and validate the submitted input.
  const { username, password, admin } = req.body;
  try {
    await validation.userCreation.validate(
      { username, password },
      { abortEarly: false }
    );
  } catch (err) {
    throw new RequestError(400, "There were issues validating your input.", {
      renderPage: "create-user",
      details: {
        validationErrors: err.errors,
      },
    });
  }

  // Make sure a user is not already using this username.
  const existingUser = await userModel.findOne({ username });
  if (existingUser) {
    throw new RequestError(409, "That username is taken. Try another one.", {
      renderPage: "create-user",
    });
  }

  // Create the user.
  const newUser = new userModel({ username, isAdmin: admin });
  newUser.setPassword(password);
  newUser.generateApiKeys();
  await newUser.save();

  // Redirect to the admin homepage.
  return res.render("create-user", {
    successMessage: "The new user has been created successfully.",
  });
};

/**
 * @function login
 * @brief Uses Passport's local login strategy to log a user in.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
const login = (req, res, next) => {
  // Authenticate using Passport's local login strategy
  // (see src/lib/passport-strategies.js).
  passport.authenticate("local", (err, user, info) => {
    // Make sure nothing unexpected happened.
    if (err) {
      return next(
        new RequestError(500, "Something went wrong. Try again later.", {
          renderPage: "login",
        })
      );
    }

    // Make sure a user was authenticated.
    if (!user) {
      return next(new RequestError(401, info.message, { renderPage: "login" }));
    }

    // Attempt to create a login session for the user.
    req.login(user, (err) => {
      // Again, make sure nothing went wrong.
      if (err) {
        return next(
          new RequestError(500, "Something went wrong. Try again later.", {
            renderPage: "login",
          })
        );
      }

      // Redirect the newly-logged-in user to the dashboard.
      return res.status(200).redirect("/");
    });
  })(req, res, next);
};

/**
 * @function logout
 * @brief Logs out the logged-in user.
 * @param {Request} req
 * @param {Response} res
 */
const logout = (req, res) => {
  // If a user is logged in, then log them out.
  if (req.user) {
    req.logout();
  }

  // Redirect the user back to the login page.
  return res.redirect("/");
};

/**
 * @function authenticateApiKey
 * @brief Middleware function to authenticate a user's API key.
 *
 * This middleware function is called whenever a JSON-returning API endpoint
 * is hit. It checks for the existance of an API key and secret in the request
 * body, and attempts to resolve those to a user in our database.
 *
 * @param {Request} req
 */
const authenticateApiKey = async (req) => {
  // Get and validate the API key and secret.
  const { apiKey, apiSecret } = req.body;
  try {
    await validation.apiCredentials.validate({ apiKey, apiSecret });
  } catch (err) {
    throw new RequestError(401, "Missing API credentials.");
  }

  // Resolve the public API key to a user in our database.
  const user = await userModel.findOne({ publicApiKey: apiKey });
  if (!user) {
    throw new RequestError(401, "Invalid API credentials.");
  }

  // Check to see if the API secret provided is correct.
  const decryptedSecret = decryptText(user.apiSecret, process.env.AUTH_SECRET);
  if (strcmp(decryptedSecret, apiSecret) === false) {
    throw new RequestError(401, "Invalid API credentials.");
  }

  // "Log in" the user and go to the next function.
  req.apiUser = user;
  return true;
};

/**
 * @function adminPageGuard
 * @brief Middleware function that checks for an administrator user.
 *
 * This middleware function checks to see if an account administrator is logged
 * in before attempting to access a certain route.
 *
 * @param {Request} req
 */
const adminPageGuard = async (req) => {
  console.log(req.user);
  req.isAdmin = req.user && req.user.isAdmin === "true";
  if (req.isAdmin === false) {
    throw new RequestError(403, "You must be logged in as an administrator.", {
      renderPage: "dashboard",
      username: req.user.username,
      isAdmin: req.user.isAdmin,
    });
  }

  return true;
};

/**
 * @function listUsers
 * @brief Returns a list of all registered users.
 * @param {Request} req
 * @param {Response} res
 */
const listUsers = async (req, res) => {
  // Get all users from the database and map them out.
  const users = (await userModel.find({})).map((user) => ({
    id: user.id,
    name: user.username,
    isAdmin: user.isAdmin,
  }));

  // Send that curated list to the 'List Users' page.
  return res.render("list-users", { users, isAdmin: req.user.isAdmin });
};

/**
 * @function updateUser
 * @brief Updates a user's information.
 * @param {Request} req
 * @param {Response} res
 */
const updateUser = async (req, res) => {
  // Get the current, logged-in user.
  let thisUser = req.user;
  let thisUserIsAdmin = req.user.isAdmin;

  // Keep a flag to indicate whether we are updating the above user, or an
  // administrator is updating a different user.
  let differentUser = false;

  /*
    Get the following information from the request body.
    * The old username of a different user (administrators only)
    * The new username to change to.
    * A new password, if one is desired.
    * A flag to reset the user's API keys
    * A flag to set the user's administrator status (administrators only)
  */
  const { oldUsername, newUsername, newPassword, newKeys, admin } = req.body;

  // Validate the submitted new username and password.
  try {
    await validation.userUpdate.validate(
      {
        username: newUsername || "apple",
        password: newPassword || "De5aul!!",
      },
      { abortEarly: false }
    );
  } catch (err) {
    throw new RequestError(400, "There were issues validating your input.", {
      renderPage: "update-user",
      details: {
        validationErrors: err.errors,
      },
    });
  }

  // First, check to see if the calling user is an administrator. If so, then
  // check to see if that admin is attempting to update a different user.
  if (
    req.user.isAdmin === "true" &&
    typeof oldUsername === "string" &&
    oldUsername !== ""
  ) {
    // Make sure that other user exists.
    const otherUser = await userModel.findOne({ username: oldUsername });
    if (!otherUser) {
      throw new RequestError(404, "User not found.", {
        renderPage: "update-user",
      });
    }

    // If so, then assign 'thisUser' to that other user, and set the flag
    // indicating that we are updating a different user.
    thisUser = otherUser;
    differentUser = true;
  }
  console.log(thisUser);

  // Administrator users can set the administrator status of other users.
  if (req.user.isAdmin === "true" && typeof admin === "boolean") {
    // Check to see if the admin is attempting to remove their own admin status.
    if (differentUser === false && admin === false) {
      // Do not allow this if this is the only administrator registered.
      const admins = await userModel.find({ isAdmin: true });
      if (admins.length === 1) {
        throw new RequestError(
          409,
          "There must be at least one administrator account.",
          {
            renderPage: "update-user",
          }
        );
      }

      thisUserIsAdmin = false;
    }

    // Set the admin status.
    thisUser.isAdmin = admin;
  }

  // If a new username is provided, then make sure another user is not using that
  // same username before updating.
  if (typeof newUsername === "string" && newUsername !== "") {
    const existingUser = await userModel.findOne({ username: newUsername });
    if (existingUser) {
      throw new RequestError(409, "This username is taken.", {
        renderPage: "update-user",
      });
    }

    thisUser.username = newUsername;
  }

  // If a new password is provided, then set the new password.
  if (typeof newPassword === "string" && newPassword !== "") {
    thisUser.setPassword(newPassword);
  }

  // If new API keys are requested, then generate them.
  if (typeof newKeys === "string" && newKeys === "on") {
    thisUser.generateApiKeys();
  }

  // Update the user.
  await thisUser.save();
  return res.render("dashboard", {
    successMessage: "The user has been updated.",
    username: req.user.username,
    isAdmin: thisUserIsAdmin,
  });
};

/**
 * @function deleteUser
 * @brief Attempts to delete a user account.
 * @param {Request} req
 * @param {Response} res
 */
const deleteUser = async (req, res) => {
  // Get the logged in user.
  let thisUser = req.user;

  // Check to see if we are deleting a different user than the one
  // that is logged in.
  let differentUser = false;

  // Check to see if this user is an administrator.
  if (thisUser.isAdmin === "true") {
    // If the user is an administrator, then check to see if another
    // username - other than their own - was provided.
    const { username } = req.body;
    if (username && username !== thisUser.username) {
      // Make sure that user exists, and that user is not an administrator.
      const otherUser = await userModel.findOne({ username, isAdmin: false });
      if (!otherUser) {
        // More than likely, the admin is accessing this function from a
        // special admin-only 'Delete User' page. Redirect the admin to that
        // page when we throw.
        throw new RequestError(404, "Non-admin user not found.", {
          renderPage: "delete-user",
        });
      }

      // Set 'thisUser' to the user we found here.
      thisUser = otherUser;
      differentUser = true;
    } else {
      // The admin user is intent on deleting their own account. Disallow
      // this.
      //
      // If an account administrator wishes to delete their account, they
      // must first remove their administrator status from the 'Update User'
      // page.
      throw new RequestError(409, "Admin accounts cannot be deleted.", {
        renderPage: "delete-user",
      });
    }
  }

  // Delete the user.
  await thisUser.remove();

  // If a different user was deleted, redirect the administrator back to
  // the 'Delete User' page. Otherwise, log the user out and return them
  // to the login page.
  if (differentUser === true) {
    return res.render("delete-user", {
      successMessage: "The user has been deleted",
      isAdmin: req.user.isAdmin,
    });
  } else {
    req.logout();
    return res.redirect("/");
  }
};

module.exports = {
  createUser: route(createUser),
  login,
  logout,
  authenticateApiKey: route(authenticateApiKey, true),
  adminPageGuard: route(adminPageGuard, true),
  listUsers: route(listUsers),
  updateUser: route(updateUser),
  deleteUser: route(deleteUser),
};
