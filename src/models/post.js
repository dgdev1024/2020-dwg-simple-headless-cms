/**
 * @file models/post.js
 * The database model for our blog posts.
 */

// Imports
const mongoose = require("mongoose");
const userModel = require("./user");
const { Schema, model, Types } = mongoose;

// Schema
const schema = new Schema({
  author: { type: Types.ObjectId, required: true, ref: "user" },
  authorName: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  postedOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: null },
  lastUpdatedBy: { type: String, default: "" },
});

// Export
module.exports = model("post", schema);
