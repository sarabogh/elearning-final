import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CourseChat = ({ courseId, initialChatId = '', initialReplyDraft = '' }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id || null;

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newChatUser, setNewChatUser] = useState('');
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('normal');
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inboxFilter, setInboxFilter] = useState('all');
  const [toast, setToast] = useState({ open: false, text: '', chatId: '' });
  const [desktopPermission, setDesktopPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  );

  const socketUrl = useMemo(() => {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
    return base.replace(/\/api\/?$/, '');
  }, []);

  const socketRef = useRef(null);
  const selectedChatIdRef = useRef(selectedChatId);
  const messagesViewportRef = useRef(null);
  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);

  const isTeacher = user?.role === 'faculty' || user?.role === 'admin';

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const scrollToLatestMessage = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
      return;
    }

    if (messagesViewportRef.current) {
      messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
    }
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((chat) => chat._id === selectedChatId) || null,
    [conversations, selectedChatId]
  );

  const isUnansweredForTeacher = useCallback((chat) => {
    if (!isTeacher) return false;
    const senderId = chat.lastMessage?.sender?._id || chat.lastMessage?.sender;
    const fromOtherUser = senderId ? String(senderId) !== String(currentUserId) : false;
    return Boolean(chat.unreadCount > 0 && fromOtherUser);
  }, [isTeacher, currentUserId]);

  const visibleConversations = useMemo(() => {
    const filtered = conversations.filter((chat) => {
      if (inboxFilter === 'urgent') {
        return chat.lastMessage?.priority === 'urgent';
      }

      if (inboxFilter === 'needs-reply') {
        return isUnansweredForTeacher(chat);
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const urgentDelta = Number(b.lastMessage?.priority === 'urgent') - Number(a.lastMessage?.priority === 'urgent');
      if (urgentDelta !== 0) return urgentDelta;

      if (isTeacher) {
        const needsReplyDelta = Number(isUnansweredForTeacher(b)) - Number(isUnansweredForTeacher(a));
        if (needsReplyDelta !== 0) return needsReplyDelta;
      }

      return new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0);
    });
  }, [conversations, inboxFilter, isTeacher, isUnansweredForTeacher]);

  const urgentUnreadAlerts = useMemo(() => {
    return conversations.filter((chat) => {
      const senderId = chat.lastMessage?.sender?._id || chat.lastMessage?.sender;
      const fromOtherUser = senderId ? String(senderId) !== String(currentUserId) : false;
      return chat.lastMessage?.priority === 'urgent' && chat.unreadCount > 0 && fromOtherUser;
    });
  }, [conversations, currentUserId]);

  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await window.Notification.requestPermission();
    setDesktopPermission(permission);
  };

  const notifyDesktop = (chatTitle, message) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;

    const body = message.text || `${message.attachments?.length || 0} attachment(s)`;
    const senderName = message.sender?.name || 'Someone';
    const prefix = message.priority === 'urgent' ? '[URGENT] ' : '';

    // Use browser notifications when tab is not focused.
    new window.Notification(`${prefix}${chatTitle}`, {
      body: `${senderName}: ${body}`
    });
  };

  const refreshConversations = async () => {
    if (!courseId || !currentUserId) return;
    const response = await api.get(`/chats/course/${courseId}`);
    setConversations(response.data || []);
    if (!selectedChatId && response.data?.length) {
      setSelectedChatId(response.data[0]._id);
    }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) return;
    const response = await api.get(`/chats/${chatId}/messages`);
    setMessages(response.data.messages || []);
    setConversations((prev) => prev.map((chat) => (
      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
    )));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(socketUrl, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('chat:message', ({ chatId, message }) => {
      const activeChatId = selectedChatIdRef.current;
      let matchedChatTitle = 'Conversation';
      const senderId = message.sender?._id || message.sender;
      const fromOtherUser = String(senderId) !== String(currentUserId);

      setConversations((prev) => prev.map((chat) => {
        if (chat._id !== chatId) return chat;

        matchedChatTitle = chat.title || (chat.type === 'course' ? 'Course Room' : 'Direct Chat');

        const nextUnread = chatId === activeChatId ? 0 : chat.unreadCount + (fromOtherUser ? 1 : 0);
        return {
          ...chat,
          unreadCount: nextUnread,
          lastMessage: {
            text: message.text || `${message.attachments?.length || 0} attachment(s)`,
            sender: message.sender,
            priority: message.priority,
            createdAt: message.createdAt
          },
          lastActivityAt: message.createdAt
        };
      }));

      if (fromOtherUser) {
        const preview = message.text || `${message.attachments?.length || 0} attachment(s)`;
        const senderName = message.sender?.name || 'Someone';
        setToast({
          open: true,
          text: `${senderName}: ${preview}`,
          chatId
        });

        notifyDesktop(matchedChatTitle, message);
      }

      if (chatId !== activeChatId) return;

      setMessages((prev) => {
        const exists = prev.some((entry) => entry._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, socketUrl]);

  useEffect(() => {
    if (!courseId || !currentUserId) return;

    const bootstrap = async () => {
      setError('');
      try {
        const [conversationResponse, participantResponse] = await Promise.all([
          api.get(`/chats/course/${courseId}`),
          api.get(`/chats/course/${courseId}/options`)
        ]);

        const nextConversations = conversationResponse.data || [];
        setConversations(nextConversations);
        setParticipants(participantResponse.data || []);

        if (nextConversations.length) {
          const hasRequestedChat = initialChatId && nextConversations.some((chat) => chat._id === initialChatId);
          setSelectedChatId((prev) => {
            if (prev) return prev;
            if (hasRequestedChat) return initialChatId;
            return nextConversations[0]._id;
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chat');
      }
    };

    bootstrap();
  }, [courseId, currentUserId, initialChatId]);

  useEffect(() => {
    if (!initialChatId || !conversations.length) return;
    const exists = conversations.some((chat) => chat._id === initialChatId);
    if (exists) {
      setSelectedChatId(initialChatId);
    }
  }, [conversations, initialChatId]);

  useEffect(() => {
    if (!selectedChatId || !socketRef.current) return;
    socketRef.current.emit('joinChat', selectedChatId);

    loadMessages(selectedChatId).catch(() => {});

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveChat', selectedChatId);
      }
    };
  }, [selectedChatId]);

  useEffect(() => {
    if (!messages.length) return;
    scrollToLatestMessage(false);
  }, [messages, selectedChatId, scrollToLatestMessage]);

  useEffect(() => {
    if (!initialReplyDraft || !selectedChatId) return;
    setInput((prev) => (prev.trim() ? prev : initialReplyDraft));

    if (composerInputRef.current) {
      composerInputRef.current.focus();
    }
  }, [initialReplyDraft, selectedChatId]);

  const createDirectConversation = async () => {
    if (!newChatUser) return;
    setBusy(true);
    setError('');

    try {
      await api.post(`/chats/course/${courseId}/direct`, { participantId: newChatUser });
      await refreshConversations();
      setNewChatUser('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat');
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || !user || !selectedChatId) return;
    setBusy(true);
    setError('');

    try {
      let uploadedAttachments = [];
      if (attachments.length) {
        const formData = new FormData();
        attachments.forEach((file) => formData.append('files', file));
        const uploadRes = await api.post('/uploads/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploadedAttachments = (uploadRes.data.files || []).map((file) => ({
          name: file.originalname,
          url: file.url,
          mimeType: file.mimetype,
          size: file.size
        }));
      }

      await api.post(`/chats/${selectedChatId}/messages`, {
        text: input.trim(),
        priority,
        attachments: uploadedAttachments
      });

      setInput('');
      setPriority('normal');
      setAttachments([]);
      setConversations((prev) => [...prev].sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  const priorityColor = (value) => {
    if (value === 'urgent') return 'error';
    if (value === 'high') return 'warning';
    return 'default';
  };

  const openConversation = (chatId) => {
    setSelectedChatId(chatId);
    setToast((prev) => ({ ...prev, open: false }));
  };

  const fileNames = attachments.map((file) => file.name).join(', ');

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Communication Hub
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {desktopPermission !== 'granted' && desktopPermission !== 'unsupported' ? (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={<Button size="small" onClick={requestDesktopPermission}>Enable</Button>}
        >
          Enable desktop notifications to catch urgent messages even when this tab is in the background.
        </Alert>
      ) : null}

      {urgentUnreadAlerts.map((chat) => (
        <Alert
          key={`urgent-${chat._id}`}
          severity="error"
          sx={{ mb: 1 }}
          action={<Button color="inherit" size="small" onClick={() => openConversation(chat._id)}>Open</Button>}
        >
          Urgent unread message in {chat.title || (chat.type === 'course' ? 'Course Room' : 'Direct Chat')}.
        </Alert>
      ))}

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Paper sx={{ p: 2, width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">Conversations</Typography>

            {isTeacher && (
              <FormControl size="small" fullWidth>
                <InputLabel id="inbox-filter-label">Inbox Filter</InputLabel>
                <Select
                  labelId="inbox-filter-label"
                  value={inboxFilter}
                  label="Inbox Filter"
                  onChange={(event) => setInboxFilter(event.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="urgent">Urgent first</MenuItem>
                  <MenuItem value="needs-reply">Needs reply</MenuItem>
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1}>
              <FormControl size="small" fullWidth>
                <InputLabel id="new-chat-user-label">Start direct chat</InputLabel>
                <Select
                  labelId="new-chat-user-label"
                  value={newChatUser}
                  label="Start direct chat"
                  onChange={(event) => setNewChatUser(event.target.value)}
                >
                  {participants.map((participant) => (
                    <MenuItem key={participant._id} value={participant._id}>
                      {participant.name} ({participant.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={createDirectConversation} disabled={!newChatUser || busy}>
                Start
              </Button>
            </Stack>

            <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {visibleConversations.map((chat) => (
                <ListItem disablePadding key={chat._id}>
                  <ListItemButton selected={chat._id === selectedChatId} onClick={() => openConversation(chat._id)}>
                    <ListItemText
                      primary={chat.title || (chat.type === 'course' ? 'Course Room' : 'Direct Chat')}
                      secondary={chat.lastMessage?.text || 'No messages yet'}
                    />
                    <Stack spacing={0.4} alignItems="flex-end">
                      {chat.lastMessage?.priority === 'urgent' ? <Chip label="urgent" size="small" color="error" /> : null}
                      <Badge badgeContent={chat.unreadCount || 0} color="primary" />
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Stack spacing={1.5} sx={{ height: '100%' }}>
            <Typography variant="subtitle1">
              {selectedConversation?.title || 'Select a conversation'}
            </Typography>

            <Paper ref={messagesViewportRef} variant="outlined" sx={{ p: 1, flex: 1, overflowY: 'auto', maxHeight: 360 }}>
              <List>
                {messages.map((message) => {
                  const senderName = message.sender?.name || 'Unknown';
                  const isMine = String(message.sender?._id || message.sender) === String(currentUserId);
                  return (
                    <ListItem key={message._id} sx={{ alignItems: 'flex-start', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '85%', bgcolor: isMine ? 'primary.main' : 'grey.100', color: isMine ? 'primary.contrastText' : 'text.primary', p: 1.2, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{senderName}</Typography>
                          <Chip size="small" label={message.priority} color={priorityColor(message.priority)} />
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {new Date(message.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>
                        {message.text ? <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography> : null}
                        {(message.attachments || []).map((file) => (
                          <Typography variant="body2" key={`${message._id}-${file.url}`}>
                            <a href={file.url} target="_blank" rel="noreferrer">{file.name}</a>
                          </Typography>
                        ))}
                      </Box>
                    </ListItem>
                  );
                })}
                <Box ref={messagesEndRef} sx={{ height: 1 }} />
              </List>
            </Paper>

            <Stack spacing={1}>
              <TextField
                inputRef={composerInputRef}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                placeholder="Type message, ask questions, share links, post updates..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>

                <Button variant="outlined" component="label">
                  Attach files
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={(event) => setAttachments(Array.from(event.target.files || []))}
                  />
                </Button>

                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={busy || (!input.trim() && attachments.length === 0) || !selectedChatId}
                >
                  Send
                </Button>
              </Stack>
              {fileNames ? <Typography variant="caption">Selected: {fileNames}</Typography> : null}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        message={toast.text}
        action={toast.chatId ? <Button color="secondary" size="small" onClick={() => openConversation(toast.chatId)}>Open</Button> : null}
      />
    </Box>
  );
};

export default CourseChat;
