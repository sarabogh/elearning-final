const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateProfileUpdate, updateProfile);

module.exports = router;