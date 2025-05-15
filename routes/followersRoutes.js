const express = require('express');
const router = express.Router();
const {
  createFollower,
  getFollowers,
  getFollowing,
  unfollowUser,
} = require('../controllers/followersController');

router.post('/createFollowers', createFollower);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.post('/unfollow', unfollowUser);

module.exports = router;
