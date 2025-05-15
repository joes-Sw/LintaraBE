const express = require("express");
const router = express.Router();
const {
    createComment,
    getCommentsByPost
} = require("../controllers/commentController");

router.post("/create", createComment);
router.get("/byPost/:postId", getCommentsByPost);

module.exports = router;
