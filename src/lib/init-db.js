/**
 * @file lib/init-db.js
 * Connects to our MongoDB database.
 */

const { connect } = require("mongoose");

// Use an async IIFE for access to the 'await' keyword.
(async () => {
  await connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
})();
