const Chat = require('../models/Chat');
const Course = require('../models/Course');
const User = require('../models/User');
const { createBulkNotifications } = require('../services/notificationService');

const normalizeId = (value) => String(value);

const participantRoleFor = (user, course) => {
  if (!user) return 'student';
  if (user.role === 'admin') return 'admin';
  if (normalizeId(course.instructor) === normalizeId(user._id)) return 'teacher';
  return 'student';
};

const canAccessCourseChat = (course, userId, userRole) => {
  if (!course) return false;
  if (userRole === 'admin') return true;
  if (normalizeId(course.instructor) === normalizeId(userId)) return true;

  return course.enrolledStudents.some(
    (entry) => normalizeId(entry.student) === normalizeId(userId) && entry.status === 'approved'
  );
};

const buildMessageDto = (message) => ({
  _id: message._id,
  sender: message.sender,
  text: message.text,
  priority: message.priority,
  attachments: message.attachments || [],
  createdAt: message.createdAt
});

const ensureCourseConversation = async (course) => {
  let conversation = await Chat.findOne({ courseId: course._id, type: 'course' });

  if (!conversation) {
    const approvedStudents = course.enrolledStudents
      .filter((entry) => entry.status === 'approved')
      .map((entry) => ({ user: entry.student, role: 'student' }));

    conversation = await Chat.create({
      courseId: course._id,
      type: 'course',
      title: `${course.title} - Course Room`,
      participants: [
        { user: course.instructor, role: 'teacher' },
        ...approvedStudents
      ],
      messages: []
    });
  }

  return conversation;
};

const unreadCountForUser = (chat, userId) => chat.messages.reduce((count, message) => {
  const fromOtherUser = normalizeId(message.sender) !== normalizeId(userId);
  const readByUser = (message.readBy || []).some((id) => normalizeId(id) === normalizeId(userId));
  return fromOtherUser && !readByUser ? count + 1 : count;
}, 0);

const toConversationDto = (chat, userId) => ({
  _id: chat._id,
  courseId: chat.courseId,
  type: chat.type,
  title: chat.title,
  participants: chat.participants,
  lastMessage: chat.lastMessage,
  lastActivityAt: chat.lastActivityAt,
  unreadCount: unreadCountForUser(chat, userId)
});

const findCourseAndAuthorize = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return null;
  }

  if (!canAccessCourseChat(course, req.user.id, req.user.role)) {
    res.status(403).json({ message: 'Access denied' });
    return null;
  }

  return course;
};

const listConversations = async (req, res) => {
  try {
    const course = await findCourseAndAuthorize(req, res);
    if (!course) return;

    await ensureCourseConversation(course);

    const chats = await Chat.find({
      courseId: course._id,
      'participants.user': req.user.id
    })
      .sort({ type: 1, lastActivityAt: -1 })
      .populate('participants.user', 'name email role profile.avatar')
      .populate('lastMessage.sender', 'name role');

    res.json(chats.map((chat) => toConversationDto(chat, req.user.id)));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const listConversationOptions = async (req, res) => {
  try {
    const course = await findCourseAndAuthorize(req, res);
    if (!course) return;

    const users = await User.find({
      _id: {
        $in: [
          course.instructor,
          ...course.enrolledStudents
            .filter((entry) => entry.status === 'approved')
            .map((entry) => entry.student)
        ]
      }
    }).select('name email role profile.avatar');

    res.json(users.filter((u) => normalizeId(u._id) !== normalizeId(req.user.id)));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createDirectConversation = async (req, res) => {
  try {
    const course = await findCourseAndAuthorize(req, res);
    if (!course) return;

    const participantId = req.body.participantId;
    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }

    if (normalizeId(participantId) === normalizeId(req.user.id)) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    const allowedParticipantIds = [
      normalizeId(course.instructor),
      ...course.enrolledStudents
        .filter((entry) => entry.status === 'approved')
        .map((entry) => normalizeId(entry.student))
    ];

    if (!allowedParticipantIds.includes(normalizeId(participantId))) {
      return res.status(403).json({ message: 'Participant is not in this course community' });
    }

    const requester = await User.findById(req.user.id).select('name role');
    const participant = await User.findById(participantId).select('name role');
    if (!requester || !participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    let conversation = await Chat.findOne({
      courseId: course._id,
      type: 'direct',
      $and: [
        { participants: { $elemMatch: { user: req.user.id } } },
        { participants: { $elemMatch: { user: participantId } } }
      ]
    })
      .populate('participants.user', 'name email role profile.avatar')
      .populate('lastMessage.sender', 'name role');

    if (!conversation) {
      conversation = await Chat.create({
        courseId: course._id,
        type: 'direct',
        title: `${requester.name} & ${participant.name}`,
        participants: [
          {
            user: req.user.id,
            role: participantRoleFor(requester, course)
          },
          {
            user: participantId,
            role: participantRoleFor(participant, course)
          }
        ]
      });

      conversation = await Chat.findById(conversation._id)
        .populate('participants.user', 'name email role profile.avatar')
        .populate('lastMessage.sender', 'name role');
    }

    res.status(201).json(toConversationDto(conversation, req.user.id));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants.user', 'name email role profile.avatar')
      .populate('messages.sender', 'name role profile.avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = chat.participants.some(
      (entry) => normalizeId(entry.user._id || entry.user) === normalizeId(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Chat.updateOne(
      { _id: chat._id },
      {
        $addToSet: {
          'messages.$[msg].readBy': req.user.id
        }
      },
      {
        arrayFilters: [
          {
            'msg.sender': { $ne: req.user.id },
            'msg.readBy': { $ne: req.user.id }
          }
        ]
      }
    );

    const refreshed = await Chat.findById(chat._id)
      .populate('messages.sender', 'name role profile.avatar');

    res.json({
      chat: toConversationDto(chat, req.user.id),
      messages: refreshed.messages.map(buildMessageDto)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, priority = 'normal', attachments = [] } = req.body;

    if (!String(text || '').trim() && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = chat.participants.some(
      (entry) => normalizeId(entry.user) === normalizeId(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = {
      sender: req.user.id,
      text: String(text || '').trim(),
      priority,
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [req.user.id],
      createdAt: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = {
      text: message.text || (message.attachments.length ? `${message.attachments.length} attachment(s)` : ''),
      sender: req.user.id,
      priority,
      createdAt: message.createdAt
    };
    chat.lastActivityAt = new Date();
    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name role profile.avatar')
      .populate('participants.user', 'name role profile.avatar');

    const savedMessage = populatedChat.messages[populatedChat.messages.length - 1];
    const messageDto = buildMessageDto(savedMessage);

    const recipientParticipants = (populatedChat.participants || []).filter((entry) => {
      const participantUserId = entry.user?._id || entry.user;
      return normalizeId(participantUserId) !== normalizeId(req.user.id);
    });

    const notificationPayload = recipientParticipants.map((entry) => {
      const participantUserId = entry.user?._id || entry.user;
      return {
        user: participantUserId,
        sender: req.user.id,
        type: 'chat_message',
        title: populatedChat.title || (populatedChat.type === 'course' ? 'Course Room' : 'Direct Chat'),
        body: messageDto.text || `${messageDto.attachments?.length || 0} attachment(s)`,
        priority: messageDto.priority,
        chatId: populatedChat._id,
        courseId: populatedChat.courseId
      };
    });

    const payloadWithTargetTab = notificationPayload.map((item) => ({
      ...item,
      targetTab: 4
    }));

    await createBulkNotifications(req, payloadWithTargetTab);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${chat._id}`).emit('chat:message', {
        chatId: normalizeId(chat._id),
        message: messageDto
      });
      io.to(`chat-${chat._id}`).emit('chat:activity', {
        chatId: normalizeId(chat._id),
        lastMessage: populatedChat.lastMessage,
        lastActivityAt: populatedChat.lastActivityAt
      });

    }

    res.status(201).json(messageDto);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listConversations,
  listConversationOptions,
  createDirectConversation,
  getConversationMessages,
  sendMessage
};