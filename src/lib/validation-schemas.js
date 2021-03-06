/**
 * @file lib/validation-schemas.js
 * Object validation schemas powered by Yup.
 */

const yup = require("yup");

// Validation schema for user creation.
const userCreation = yup.object().shape({
  username: yup
    .string()
    .required("Please provide a username")
    .min(5, "Your username must contain at least 5 characters.")
    .max(30, "Your username must contain at most 30 characters.")
    .matches(/^[^\W_]+$/, "Your username cannot contain symbols or spaces."),
  password: yup
    .string()
    .required("Please provide a password.")
    .min(8, "Your password must contain at least 8 characters.")
    .max(24, "Your password must contain at most 24 characters.")
    .matches(
      /[a-z]/,
      "Your password must contain at least one lowercase letter."
    )
    .matches(/[A-Z]/, "Your password must contain at least one capital letter.")
    .matches(/[0-9]/, "Your password must contain at least one number.")
    .matches(
      /[$-/:-?{-~!"^_`\[\]]/,
      "Your password must contain at least one symbol."
    ),
});

// Validation for user update.
const userUpdate = yup.object().shape({
  username: yup
    .string()
    .notRequired()
    .min(5, "Your username must contain at least 5 characters.")
    .max(30, "Your username must contain at most 30 characters.")
    .matches(/^[^\W_]+$/, "Your username cannot contain symbols or spaces."),
  password: yup
    .string()
    .notRequired()
    .min(8, "Your password must contain at least 8 characters.")
    .max(24, "Your password must contain at most 24 characters.")
    .matches(
      /[a-z]/,
      "Your password must contain at least one lowercase letter."
    )
    .matches(/[A-Z]/, "Your password must contain at least one capital letter.")
    .matches(/[0-9]/, "Your password must contain at least one number.")
    .matches(
      /[$-/:-?{-~!"^_`\[\]]/,
      "Your password must contain at least one symbol."
    ),
});

// Validate API key and secret
const apiCredentials = yup.object().shape({
  apiKey: yup.string().required("Missing API key."),
  apiSecret: yup.string().required("Missing API secret."),
});

// Validate a blog post submission
const blogPost = yup.object().shape({
  title: yup
    .string()
    .required("Please provide a title.")
    .min(5, "Your post title must contain at least 5 characters.")
    .max(100, "Your post title must contain at most 100 characters."),
  body: yup
    .string()
    .required("Please post something!")
    .min(20, "Your post must contain at least 20 characters.")
    .max(10000, "Your post must contain at most 10,000 characters."),
});

module.exports = {
  userCreation,
  userUpdate,
  apiCredentials,
  blogPost,
};
