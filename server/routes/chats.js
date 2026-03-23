const express = require('express');
const { auth } = require('../middleware/auth');
const {
  listConversations,
  listConversationOptions,
  createDirectConversation,
  getConversationMessages,
  sendMessage
} = require('../controllers/chatController');

const router = express.Router();

router.get('/course/:courseId', auth, listConversations);
router.get('/course/:courseId/options', auth, listConversationOptions);
router.post('/course/:courseId/direct', auth, createDirectConversation);
router.get('/:chatId/messages', auth, getConversationMessages);
router.post('/:chatId/messages', auth, sendMessage);

module.exports = router;