const { db } = require('../config/firebase');
const historicalCollection = db.collection('Challenge_Historical');

// GET: List of users who joined a challenge
const getParticipants = async (req, res) => {
  try {
    const challengeId = req.params.id;

    const snapshot = await historicalCollection
      .where('ChallengeID', '==', challengeId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No participants found', participants: [] });
    }

    const participants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        UserID: data.UserID,
        JoinedAt: data.Created_at?.toDate?.() || null
      };
    });

    res.status(200).json({ challengeId, participants });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch participants', error: error.message });
  }
};

// GET: Retrieve all challenge historical data
const getAllChallengeHistorical = async (req, res) => {
  try {
    const snapshot = await historicalCollection.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No historical data found', data: [] });
    }

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch historical data', error: error.message });
  }
};

// POST: User joins a challenge
const joinChallenge = async (req, res) => {
  try {
    const { ChallengeID, UserID } = req.body;

    if (!ChallengeID || !UserID) {
      return res.status(400).json({ message: 'ChallengeID and UserID are required' });
    }

    const existing = await historicalCollection
      .where('ChallengeID', '==', ChallengeID)
      .where('UserID', '==', UserID)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ message: 'User already joined this challenge' });
    }

    await historicalCollection.add({
      ChallengeID,
      UserID,
      Created_at: new Date()
    });

    res.status(201).json({ message: 'User successfully joined the challenge' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join challenge', error: error.message });
  }
};

module.exports = { getParticipants, joinChallenge, getAllChallengeHistorical };
