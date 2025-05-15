const { auth, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, birthDate, gender, role, user_image } = req.body;

    const [day, month, year] = birthDate.split('/');
    const parsedDate = new Date(`${year}-${month}-${day}`); // Format: yyyy-mm-dd

    if (isNaN(parsedDate)) {
        return res.status(400).json({ success: false, error: 'Invalid birthDate format' });
    }

    try {
        const userRecord = await auth.createUser({
            email,
            password,
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('User').doc(userRecord.uid).set({
            UserID: userRecord.uid,
            First_name: firstName,
            Last_name: lastName,
            Email: email,
            Password: hashedPassword,
            Birthdate: parsedDate,
            Created_at: new Date(),
            user_image: user_image || '',
            Gender: gender,
            Role: role || 'User',
        });

        // Generate JWT
        const token = jwt.sign({ uid: userRecord.uid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ success: true, uid: userRecord.uid, token });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRecord = await auth.getUserByEmail(email);

        const userDoc = await db.collection('User').doc(userRecord.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userData = userDoc.data();
        const isPasswordValid = await bcrypt.compare(password, userData.Password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ uid: userRecord.uid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ success: true, uid: userRecord.uid, token, userData });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        await auth.generatePasswordResetLink(email);
        res.status(200).json({ success: true, message: 'Password reset link sent to email' });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { registerUser, loginUser, forgotPassword};