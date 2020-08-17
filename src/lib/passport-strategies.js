/**
 * @file lib/passport-strategies.js
 * Contains our passport strategies.
 */

// Imports
const passportLocal = require("passport-local").Strategy;
const userModel = require("../models/user");
const validation = require("./validation-schemas");

// Local Login Strategy
const local = new passportLocal((username = "", password = "", done) =>
  (async () => {
    try {
      await validation.userCreation.validate({ username, password });
    } catch {
      return done(null, false, {
        message: "Username or password is invalid.",
      });
    }

    const user = await userModel.findOne({ username });
    if (!user) {
      return done(null, false, {
        message: "Username or password is incorrect.",
      });
    }

    if ((await user.tooManyLogins()) === true) {
      return done(null, false, {
        message: "Too many logins. Try again later.",
      });
    }

    if ((await user.checkPassword(password)) === false) {
      return done(null, false, {
        message: "Username or password is incorrect",
      });
    }

    return done(null, user);
  })()
);

module.exports = {
  local,
};
