/**
 * @file lib/error-classes.js
 * Custom error classes.
 */

const { getStatusText } = require("http-status-codes");

class RequestError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.statusCode = status;
    this.statusText = getStatusText(status);
    this.options = options;
    console.error(this);
  }
}

module.exports = {
  RequestError,
};
