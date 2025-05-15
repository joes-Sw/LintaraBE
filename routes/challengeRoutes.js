// routes/challengeRoutes.js
const express = require('express');
const {
  createChallenge,
  getAllChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge
} = require('../controllers/challengeController');

const router = express.Router();

router.post('/createChallenge', createChallenge);
router.get('/getChallenge', getAllChallenges);
router.put('/updateChallenge/:id', updateChallenge);
router.delete('/deleteChallenge/:id', deleteChallenge);
router.get('/getChallenge/:id', getChallengeById);

module.exports = router;
