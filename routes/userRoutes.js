const express = require('express');
const { editUser, getUserById, searchUsers } = require('../controllers/userControllers');

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:uid', getUserById);
router.put('/:uid', editUser);

module.exports = router;