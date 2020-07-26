/**
 * @file lib/init-env.js
 * Loads and checks for environment variables.
 */

// Imports
const strcmp = require("tsscmp");

/**
 * @function loadDefaultEnv
 * @brief Loads default values for the given environment variables.
 *
 * This helper function checks for environment variables by the keys given and,
 * loads the given default values for any variables that are not found. This
 * function accepts an array of pairs. The first element in the pair is the
 * environment variable's key, and the second element is the value to be loaded
 * by default if that environment variable should not be found.
 *
 * @param {String[][]} defaults The array of pairs containing our default variables.
 */
const loadDefaultEnv = (defaults) => {
  // Iterate over all pairs. Destructure the key and value from each pair.
  //
  // If the environment variable with that key is not found, assign the
  // given value to that variable.
  defaults.forEach(([key, value]) => {
    process.env[key] = process.env[key] || value.toString();
  });
};

/**
 * @function checkForRequiredEnv
 * @brief Checks for any environment variables which are required by the app.
 *
 * In order for our application to run properly, certain environment variables
 * may be required, and certain variables may be required to fit a certain
 * criteria. This function checks for the presence of environment variables with
 * the given keys, and that those variables match the given criteria, if one is
 * provided. An exception will be thrown if any one of the given variables
 * fails these checks.
 *
 * This function takes as an argument an array of objects with the following
 * properties:
 *
 * - 'key' is the name of the environment variable's key. This is required.
 * - 'criteria' is optional, and can be one of the following:
 * -- A string, which the variable's value needs to be equal to.
 * -- A regular expression, which the value needs to match.
 * -- A function, which takes the value as an argument, and must return true.
 * - 'message' is an optional string which is emitted in the exception thrown
 *   if the above criteria is not met. Not used if the criteria is a string.
 *
 * @param {Object[]} variables The array of objects representing variable tests.
 * @param {String} variables.key The key of the required environment variable.
 * @param {String|RegExp|Function} variables.criteria The test to be ran on the variable.
 * @param {String} variables.message An optional error message if the test fails. Not used if 'criteria' is a string.
 * @throws Error if one of the variables' criteria fails.
 */
const checkForRequiredEnv = (variables) => {
  variables.forEach(({ key, criteria, message }) => {
    // If no key is present, the skip this one.
    if (typeof key !== "string" || key === "") {
      return;
    }

    // Check for the presence of the environment variable.
    const value = process.env[key];
    if (typeof value !== "string" || value === "") {
      throw new Error(
        `A required environment variable, '${key}', was not found.`
      );
    }

    // Check the variable's value against our criteria.
    //
    // If the criteria provided is a string, then check to see if that string
    // and our value are equal.
    if (typeof criteria === "string" && strcmp(value, criteria) === false) {
      throw new Error(
        message ||
          `The required environment variable, '${key}', does not match the required value '${criteria}'.`
      );
    }

    // If the criteria is a regular expression, then test it against our vaule.
    else if (criteria instanceof RegExp && criteria.test(value) === false) {
      throw new Error(
        message ||
          `The required environment variable, '${key}', does not match the required pattern.`
      );
    }

    // If the criteria is a function, then call that function with the value
    // as a parameter. It must return true in order to pass.
    else if (typeof criteria === "function" && criteria(value) === false) {
      throw new Error(
        message ||
          `The required environment variable, '${key}', does not pass the given criteria.`
      );
    }

    // Before we finish, an important notice - if you are using a regular expression
    // or a function for a required variable's criteria, I strongly recommend you specify
    // a custom, specific error message.
  });
};

/*
  In development mode, load environment variables from a local file.
*/
if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

/*
  Load your default environment variable values here.
*/
loadDefaultEnv([["PORT", 3000]]);

/*
  Check for required environment variables here.
*/
checkForRequiredEnv([
  {
    key: "MONGODB_URI",
    criteria: /^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)(\w+?)(:(\d+))?\/(\w+?)$/,
    message: "'MONGODB_URI' must be a MongoDB database URL.",
  },
]);
