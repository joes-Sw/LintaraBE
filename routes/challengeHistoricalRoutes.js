const express = require('express');
const { getParticipants, joinChallenge, getAllChallengeHistorical } = require('../controllers/challengeHistoricalController');

const router = express.Router();

// Route: GET list of participants
router.get('/:id/participants', getParticipants);

// Route: POST user joins challenge
router.post('/join', joinChallenge);

// Route: GET all challenge historical data
router.get('/', getAllChallengeHistorical);

module.exports = router;
