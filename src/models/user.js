/**
 * @file models/user.js
 * The database model for our users.
 */

// Imports
const { Schema, model } = require("mongoose");
const csprng = require("csprng");
const strcmp = require("tsscmp");
const { encryptText, decryptText } = require("../lib/crypto");

// Schema
const schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  apiSecret: { type: String, required: true, unique: true },
  isAdmin: { type: String, default: false },
  createdOn: { type: Date, default: Date.now },
  loginAttempts: { type: Number, default: 0 },
  loginAttemptsExpiry: { type: Date, default: Date.now },
});

// Methods
schema.methods.tooManyLogins = async function () {
  if (Date.now() >= this.loginAttemptsExpiry) {
    this.loginAttempts = 0;
    await this.save();
    return false;
  }

  return this.loginAttempts >= 5;
};

schema.methods.setPassword = function (password) {
  this.password = encryptText(password, process.env.AUTH_SECRET);
};

schema.methods.generateApiKeys = function () {
  const privateKey = csprng();
  this.apiKey = csprng();
  this.apiSecret = encryptText(privateKey, process.env.AUTH_SECRET);
};

schema.methods.checkPassword = async function (password) {
  const decryptedPass = decryptText(this.password, process.env.AUTH_SECRET);
  const result = strcmp(password, decryptedPass);

  this.loginAttempts += 1;
  this.loginAttemptsExpiry = Date.now() + 1000 * 60 * 5;
  await this.save();

  return result;
};

// Export
module.exports = model("user", schema);
