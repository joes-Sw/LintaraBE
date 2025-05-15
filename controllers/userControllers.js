const { db } = require('../config/firebase');

// Get User by ID
const getUserById = async (req, res) => {
    const { uid } = req.params;

    try {
        const userDoc = await db.collection('User').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userData = userDoc.data();
        res.status(200).json({ success: true, user: userData });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Edit User
const editUser = async (req, res) => {
    const { uid } = req.params;
    const { firstName, lastName, username, email, birthDate, gender, role, user_image } = req.body;

    try {
        const userDoc = db.collection('User').doc(uid);
        const userSnapshot = await userDoc.get();

        if (!userSnapshot.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let parsedDate;
        if (birthDate) {
            const [day, month, year] = birthDate.split('/');
            parsedDate = new Date(`${year}-${month}-${day}`); // Format: yyyy-mm-dd

            if (isNaN(parsedDate)) {
            return res.status(400).json({ success: false, error: 'Invalid birthDate format' });
            }
        }

        const updatedData = {
            First_name: firstName,
            Last_name: lastName,
            Username: username,
            Email: email,
            Birthdate: parsedDate,
            Gender: gender,
            Role: role,
            user_image: user_image,
            Updated_at: new Date(),
        };

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });

        await userDoc.update(updatedData);

        res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Search user by name or username
const searchUsers = async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({ success: false, message: "Query 'search' is required" });
    }

    try {
        const snapshot = await db.collection('User').get();

        const matchedUsers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const name = `${data.First_name || ""} ${data.Last_name || ""}`.toLowerCase();
            const username = data.Username?.toLowerCase() || "";

            if (
                name.includes(search.toLowerCase()) ||
                username.includes(search.toLowerCase())
            ) {
                matchedUsers.push({
                    id: doc.id,
                    name,
                    username,
                    user_image: data.user_image || null,
                });
            }
        });

        res.status(200).json(matchedUsers);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getUserById, editUser, searchUsers };