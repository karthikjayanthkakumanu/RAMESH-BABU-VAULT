const express = require('express');
const { register, login, getMe, logout, getUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, authorize('Admin'), register);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/users', protect, authorize('Admin'), getUsers);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
