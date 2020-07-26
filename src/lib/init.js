/**
 * @file lib/init.js
 * Runs all application initialization logic.
 */

// 0. Treat all unhandled promise rejections as fatal errors.
process.on("unhandledRejection", (err) => {
  throw err;
});

// 1. Load Environment Variables
require("./init-env");

// 2. Connect to a Database
require("./init-db");

// 3. Initialize and run the server.
require("./init-server");
