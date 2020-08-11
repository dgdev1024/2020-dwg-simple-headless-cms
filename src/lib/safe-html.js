/**
 * @file lib/safe-html.js
 * Configurations for HTML sanitiazation.
 */

const sanitizeHtml = require("sanitize-html");
const { allowedTags } = sanitizeHtml.defaults;

const safeHtmlConfig = {
  allowedTags: allowedTags.concat(["img"]),
  allowedIframeHostnames: ["www.youtube.com"],
};

const noHtmlConfig = {
  allowedTags: [],
  allowedAttributes: [],
};

module.exports = {
  cleanHtml: (html) => sanitizeHtml(html, safeHtmlConfig),
  stripHtml: (html) => sanitizeHtml(html, noHtmlConfig),
};
