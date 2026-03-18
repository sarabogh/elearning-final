import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, List, ListItem, ListItemText, Paper, TextField, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const CourseChat = ({ courseId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const socketUrl = useMemo(() => {
    // Derive socket URL from API base URL in case ports differ
    // Example: http://localhost:5001/api -> http://localhost:5001
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
    return base.replace(/\/api\/?$/, '');
  }, []);

  const socketRef = React.useRef(null);

  useEffect(() => {
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('joinRoom', `course-${courseId}`);

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [courseId, socketUrl]);

  const sendMessage = () => {
    if (!input.trim() || !user || !socketRef.current) return;

    const payload = {
      roomId: `course-${courseId}`,
      senderName: user.name,
      text: input.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, payload]);
    setInput('');

    socketRef.current.emit('chatMessage', payload);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Course Chat
      </Typography>
      <Paper sx={{ maxHeight: 320, overflowY: 'auto', p: 2, mb: 2 }}>
        <List>
          {messages.map((message, index) => (
            <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <ListItemText
                primary={
                  <>
                    <strong>{message.senderName}</strong>
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </Typography>
                  </>
                }
                secondary={message.text}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Write a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="contained" onClick={sendMessage} disabled={!input.trim() || !user}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default CourseChat;
