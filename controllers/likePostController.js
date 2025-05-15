const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const likePostCollection = db.collection("Like_post");

// CREATE Like
const createLike = async (req, res) => {
  try {
    const { PostID, UserID } = req.body;

    const existingLikes = await likePostCollection
      .where("PostID", "==", PostID)
      .where("UserID", "==", UserID)
      .where("Deleted_at", "==", null)
      .get();

    if (!existingLikes.empty) {
      return res.status(400).json({ message: "Post already liked by this user" });
    }

    const newLike = {
      PostID,
      UserID,
      Created_at: new Date(),
      Deleted_at: null
    };

    const docRef = await likePostCollection.add(newLike);

    const postRef = db.collection("Post").doc(PostID);
    await postRef.update({
      Liked_by: admin.firestore.FieldValue.arrayUnion(UserID)
    });

    res.status(201).json({ id: docRef.id, message: "Like added and Liked_by updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to like post", error: error.message });
  }
};

// GET daftar user yang me-like suatu post
const getLikedByUsers = async (req, res) => {
  try {
    const postId = req.params.postId;
    const postDoc = await db.collection("Post").doc(postId).get();

    if (!postDoc.exists) {
      return res.status(404).json({ message: "Post not found" });
    }

    const postData = postDoc.data();
    const likedBy = postData.Liked_by || [];

    res.status(200).json({ likedBy });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch liked users", error: error.message });
  }
};

// UNLIKE Post (soft delete + hapus dari Liked_by)
const unlikePost = async (req, res) => {
  try {
    const { PostID, UserID } = req.body;

    const snapshot = await likePostCollection
      .where("PostID", "==", PostID)
      .where("UserID", "==", UserID)
      .where("Deleted_at", "==", null)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Like not found or already removed" });
    }

    const likeDoc = snapshot.docs[0];
    await likeDoc.ref.update({
      Deleted_at: new Date()
    });

    const postRef = db.collection("Post").doc(PostID);
    await postRef.update({
      Liked_by: admin.firestore.FieldValue.arrayRemove(UserID)
    });

    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to unlike post", error: error.message });
  }
};

module.exports = {
  createLike,
  getLikedByUsers,
  unlikePost
};
