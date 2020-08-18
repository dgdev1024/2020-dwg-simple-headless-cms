/**
 * @file controllers/post.js
 * Controller functions for our blog posts.
 */

// Imports
const marked = require("marked");
const moment = require("moment");
const postModel = require("../models/post");
const { route } = require("../lib/async-wrappers");
const validation = require("../lib/validation-schemas");
const safeHtml = require("../lib/safe-html");
const { RequestError } = require("../lib/error-classes");

const createPost = async (req, res) => {
  // Get and validate the blog post.
  const { body, title } = req.body;
  try {
    await validation.blogPost.validate({ body, title }, { abortEarly: false });
  } catch (err) {
    throw new RequestError(
      400,
      "There were issues validating your submission",
      {
        renderPage: "post-editor",
        details: { validationErrors: err.errors },
        post: { body, title },
      }
    );
  }

  // Create the post.
  const newPost = await postModel.create({
    author: req.user.id,
    authorName: req.user.username,
    title,
    body,
  });

  // Redirect the user to the post page.
  return res.redirect(`/`);
};

const listPosts = async (req, res) => {
  let { page, username } = req.query;
  if (typeof page !== "number" || page < 1) {
    page = 1;
  }

  if (
    (req.isApiEndpoint && req.apiUser.isAdmin === "false") ||
    (req.isPageEndpoint && req.user.isAdmin === "false") ||
    !username
  ) {
    username = req.isApiEndpoint ? req.apiUser.username : req.user.username;
  }

  let posts = await postModel
    .find({ authorName: username })
    .skip(20 * (page - 1))
    .limit(21)
    .exec();

  posts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    author: post.authorName,
    postedOn: moment(post.postedOn).format("MMMM Do YYYY [at] h:mm:ss a"),
    updatedOn: post.updatedOn
      ? moment(post.updatedOn).format("MMMM Do YYYY [at] h:mm:ss a")
      : "",
    updatedBy: post.lastUpdatedBy,
  }));

  if (req.isApiEndpoint) {
    return res.json({ posts });
  } else {
    return res.render("list-posts", {
      page,
      firstPage: page === 1,
      lastPage: posts.length !== 21,
      posts: posts.slice(0, 20),
      username: req.user.username,
      isAdmin: req.user.isAdmin,
    });
  }
};

const fetchPost = async (req, res) => {
  const user = req.isApiEndpoint ? req.apiUser : req.user;
  const { id } = req.params;
  let post = null;

  if (req.isPageEndpoint && user.isAdmin === "true") {
    post = await postModel.findById(id);
  } else {
    post = await postModel.findOne({
      _id: id,
      author: user.id,
    });
  }

  if (!post) {
    throw new RequestError(404, "Post Not Found", {
      renderPage: "dashboard",
    });
  }

  post = {
    id: id,
    title: req.isApiEndpoint ? safeHtml.stripHtml(post.title) : post.title,
    author: post.authorName,
    lastUpdatedBy: post.lastUpdatedBy,
    postedOn: moment(post.postedOn).format("MMMM Do YYYY [at] h:mm:ss a"),
    updatedOn: moment(post.updatedOn).format("MMMM Do YYYY [at] h:mm:ss a"),
    body: req.isApiEndpoint ? safeHtml.cleanHtml(marked(post.body)) : post.body,
  };

  if (req.isApiEndpoint) {
    return res.json({ post });
  } else {
    return res.render("post-editor", { post, editing: "true" });
  }
};

const editPost = async (req, res) => {
  const { body, title } = req.body;
  try {
    await validation.blogPost.validate({ body, title }, { abortEarly: false });
  } catch (err) {
    throw new RequestError(400, "There were issues validating your edits", {
      renderPage: "post-editor",
      details: { validationErrors: err.errors },
      post: { body, title },
      editing: "true",
    });
  }

  const { id } = req.params;
  let post = null;

  if (req.user.isAdmin === "true") {
    post = await postModel.findById(id);
  } else {
    post = await postModel.findOne({ _id: id, author: req.user.id });
  }

  if (!post) {
    throw new RequestError(404, "Post not found.", {
      renderPage: "post-editor",
      post: { title, body },
      editing: "true",
    });
  }

  post.title = title;
  post.body = body;
  post.updatedOn = new Date();
  post.lastUpdatedBy = req.user.username;
  await post.save();

  return res.redirect(`/`);
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  let post = null;

  if (req.user.isAdmin === "true") {
    post = await postModel.findByIdAndRemove(id);
  } else {
    post = await postModel.findOneAndRemove({ _id: id, author: req.user.id });
  }

  if (!post) {
    throw new RequestError(404, "Post not found.", { renderPage: "dashboard" });
  }

  return res.status(200).redirect(`/list-posts?username=${post.authorName}`);
};

// Exports
module.exports = {
  createPost: route(createPost),
  listPosts: route(listPosts),
  fetchPost: route(fetchPost),
  editPost: route(editPost),
  deletePost: route(deletePost),
};
