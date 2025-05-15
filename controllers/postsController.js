const { db } = require('../config/firebase');
const postCollection = db.collection("Post");

// CREATE Post
const createPost = async (req, res) => {
  try {
    const { UserID, Caption, allowedComment, ImageURL, Location } = req.body;

    const newPost = {
      UserID,
      Caption,
      allowedComment,
      ImageURL,
      Location,
      Created_at: new Date(),
      Update_At: new Date()
    };

    const docRef = await postCollection.add(newPost);
    res.status(201).json({ id: docRef.id, message: "Post created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
};

// READ All Posts
const getAllPosts = async (req, res) => {
  try {
    const snapshot = await postCollection.get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
};

// READ Posts by UserID
const getAllPostsUser = async (req, res) => {
  try {
    console.log("Request params:", req.params);

    const userId = req.params.id; // Adjusted to match the logged key 'id'
    const snapshot = await postCollection.where("UserID", "==", userId).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    res.status(500).json({ message: "Failed to fetch posts by user ID", error: error.message });
  }
};

// UPDATE Post
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { UserID, Caption, ImageURL, Location } = req.body;

    const postDoc = await postCollection.doc(postId).get();

    if (!postDoc.exists) {
      return res.status(404).json({ message: "Post not found" });
    }

    const postData = postDoc.data();
    if (postData.UserID !== UserID) {
      return res.status(403).json({ message: "You are not allowed to update this post" });
    }

    const updatedPost = {
      Caption,
      ImageURL,
      Location,
      Update_At: new Date()
    };

    await postCollection.doc(postId).update(updatedPost);
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update post", error: error.message });
  }
};

// DELETE Post
const deletePost = async (req, res) => {
  try {
    await postCollection.doc(req.params.id).delete();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  getAllPostsUser
};
