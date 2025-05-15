const express = require("express");
const router = express.Router();
const {
  createLike,
  getLikedByUsers,
  unlikePost
} = require("../controllers/likePostController");

router.post("/createLike", createLike);
router.get("/likedBy/:postId", getLikedByUsers);
router.delete("/unlike", unlikePost);

module.exports = router;
