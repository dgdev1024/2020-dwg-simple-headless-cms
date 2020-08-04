/**
 * @file lib/init-server.js
 * Initializes and runs the Express server.
 */

// Imports
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);
const mongoose = require("mongoose");
const passport = require("passport");
const middleware = require("./route-middleware");

// Initialize Express and Middleware.
const app = express();
app.use(cookieParser());
app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "..", "public")));
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "pug");
app.use(middleware.checkEndpointType);

// Routes
app.use("/api", require("../routes/api-routes"));
app.use("/setup", require("../routes/setup-routes"));
app.use("/", require("../routes/page-routes"));

// Handle Route Errors
app.use(middleware.notFoundErrorHandler);
app.use(middleware.generalErrorHandler);

// Listen for Requests
const port = parseInt(process.env.PORT);
const server = app.listen(port, (err) => {
  if (err) throw err;

  console.log(`Listening for requests on port #${port}...`);
});

// Helper function to close the server gracefully on an uncaught exception
// or a SIGTERM signal.
const onProcessCrash = (err) => {
  console.error(err);
  server.close();
  process.exit(1);
};

process.on("uncaughtException", onProcessCrash);
process.on("SIGTERM", onProcessCrash);
