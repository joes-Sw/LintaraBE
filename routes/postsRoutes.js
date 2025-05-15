const express = require("express");
const router = express.Router();

const {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  getAllPostsUser
} = require("../controllers/postsController");

router.post("/createPosts", createPost);
router.get("/", getAllPosts);
router.get("/:id",getAllPostsUser)
router.put("/updatePost/:id", updatePost);
router.delete("/delete/:id", deletePost);

module.exports = router;
