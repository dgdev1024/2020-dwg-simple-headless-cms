/**
 * @file routes/page-routes.js
 * Route handlers for our pages functionality.
 */

// Imports and Express Router
const { Router } = require("express");
const passport = require("passport");
const passportLocal = require("../lib/passport-strategies").local;
const setup = require("../controllers/setup");
const user = require("../controllers/user");
const blogPost = require("../controllers/post");
const userModel = require("../models/user");
const { decryptText } = require("../lib/crypto");
const router = Router();

router.use(setup.adminAccountExists, (req, res, next) => {
  if (req.adminAccountExists === false) {
    return res.redirect("/setup");
  } else {
    return next();
  }
});

passport.use(passportLocal);
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  userModel
    .findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

router.use((req, res, next) => {
  const url = req.originalUrl;
  if (!req.user) {
    if (url !== "/login") {
      return res.redirect("/login");
    } else {
      return next();
    }
  } else {
    if (url === "/login") {
      return res.redirect("/");
    } else {
      return next();
    }
  }
});

router
  .route("/login")
  .post(user.login)
  .get((req, res) => res.render("login"));

router.route("/logout").get(user.logout);

router.route("/").get((req, res) =>
  res.render("dashboard", {
    username: req.user.username,
    isAdmin: req.user.isAdmin,
  })
);

router.route("/api-key").get((req, res) => {
  const { apiKey, apiSecret } = req.user;

  return res.render("api-key", {
    key: apiKey,
    secret: decryptText(apiSecret, process.env.AUTH_SECRET),
  });
});

router
  .route("/create-user")
  .get(user.adminPageGuard, (_, res) => res.render("create-user"))
  .post(user.createUser);

router.route("/list-users").get(user.adminPageGuard, user.listUsers);

router
  .route("/update-user")
  .get((req, res) =>
    res.render("update-user", {
      isAdmin: req.user.isAdmin,
    })
  )
  .post(user.updateUser);

router
  .route("/delete-user")
  .get((req, res) =>
    res.render("delete-user", {
      isAdmin: req.user.isAdmin,
    })
  )
  .post(user.deleteUser);

router
  .route("/create-post")
  .get((req, res) => res.render("post-editor", { editing: "false" }))
  .post(blogPost.createPost);

router.route("/list-posts").get(blogPost.listPosts);

router.route("/post/:id").get(blogPost.fetchPost);

router.route("/edit-post/:id").post(blogPost.editPost);

router.route("/delete-post/:id").post(blogPost.deletePost);

module.exports = router;
