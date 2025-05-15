const { db } = require('../config/firebase');

const commentCollection = db.collection("Comment_post");

// CREATE Comment
const createComment = async (req, res) => {
    try {
        const { PostID, UserID, Comment } = req.body;

        if (!PostID || !UserID || !Comment) {
            return res.status(400).json({ success: false, message: "PostID, UserID, and Comment are required" });
        }

        const newComment = {
            PostID,
            UserID,
            Comment,
            Created_at: new Date(),
            Deleted_at: null
        };

        const docRef = await commentCollection.add(newComment);

        res.status(201).json({ success: true, id: docRef.id, message: "Comment created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create comment", error: error.message });
    }
};

// READ Comments by PostID
const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const snapshot = await commentCollection
            .where("PostID", "==", postId)
            .where("Deleted_at", "==", null)
            .orderBy("Created_at", "asc")
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to retrieve comments", error: error.message });
    }
};

module.exports = {
    createComment,
    getCommentsByPost
};
