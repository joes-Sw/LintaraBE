const { db } = require('../config/firebase');

// Create a new follower relationship
const createFollower = async (req, res) => {
    const { followed_user, following_user } = req.body;

    if (!followed_user || !following_user) {
        return res.status(400).json({ success: false, message: 'followed_user dan following_user wajib diisi' });
    }

    if (followed_user === following_user) {
        return res.status(400).json({ success: false, message: 'Kamu tidak bisa mengikuti dirimu sendiri' });
    }

    try {
        const existing = await db.collection('Followers')
            .where('followed_user', '==', followed_user)
            .where('following_user', '==', following_user)
            .get();

        if (!existing.empty) {
            return res.status(409).json({ success: false, message: 'Sudah mengikuti user ini sebelumnya' });
        }

        let targetName = '';
        const userDoc = await db.collection('users').doc(followed_user).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            targetName = userData.first_name || '';
        }

        const started_following_in = new Date().toISOString().split('T')[0];

        await db.collection('Followers').add({
            followed_user,
            following_user,
            started_following_in
        });

        res.status(201).json({ success: true, message: `Berhasil mengikuti user ${targetName}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengikuti user', error: error.message });
    }
};

// Get followers of a user
const getFollowers = async (req, res) => {
    const userId = req.params.userId;

    try {
        const snapshot = await db.collection('Followers')
            .where('following_user', '==', userId)
            .get();

        const followers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            followers.push({
                user_id: data.followed_user,
                started_following_in: data.started_following_in || null
            });
        });

        res.status(200).json({ success: true, followers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar followers', error: error.message });
    }
};

// Get users followed by a user
const getFollowing = async (req, res) => {
    const userId = req.params.userId;

    try {
        const snapshot = await db.collection('Followers')
            .where('following_user', '==', userId)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ success: true, message: 'Belum mengikuti siapa pun', following: [] });
        }

        const following = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            following.push({
                followed_user: data.followed_user,
                started_following_in: data.started_following_in
            });
        });

        res.status(200).json({ success: true, userId, following });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar following', error: error.message });
    }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
    const { followed_user, following_user } = req.body;

    if (!followed_user || !following_user) {
        return res.status(400).json({ success: false, message: 'followed_user dan following_user wajib diisi' });
    }

    try {
        const snapshot = await db.collection('Followers')
            .where('followed_user', '==', followed_user)
            .where('following_user', '==', following_user)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Tidak ditemukan hubungan follow antara user ini' });
        }

        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.status(200).json({ success: true, message: 'Berhasil berhenti mengikuti user' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal unfollow', error: error.message });
    }
};

module.exports = {
    createFollower,
    getFollowers,
    getFollowing,
    unfollowUser
};
