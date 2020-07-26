/**
 * @file lib/init-server.js
 * Initializes and runs the Express server.
 */

// Imports
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const middleware = require("./route-middleware");

// Initialize Express and Middleware.
const app = express();
app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, "..", "public")));
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "pug");
app.use(middleware.checkEndpointType);

// Handle Route Errors
app.use(middleware.notFoundErrorHandler);
app.use(middleware.generalErrorHandler);

// Listen for Requests
const port = parseInt(process.env.PORT);
app.listen(port, (err) => {
  if (err) throw err;

  console.log(`Listening for requests on port #${port}...`);
});
