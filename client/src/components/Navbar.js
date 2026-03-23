import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Stack,
  Switch,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationHasMore, setNotificationHasMore] = useState(false);
  const [notificationLoadingMore, setNotificationLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const socketUrl = useMemo(() => {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
    return base.replace(/\/api\/?$/, '');
  }, []);

  const notificationMenuOpen = Boolean(notificationAnchor);

  const notificationTypeMeta = (type) => {
    if (type === 'chat_message') return { icon: '💬', label: 'Chat' };
    if (type === 'enrollment_approved') return { icon: '✅', label: 'Enrollment' };
    if (type === 'grade_posted') return { icon: '📝', label: 'Grade' };
    if (type === 'deadline_changed') return { icon: '⏰', label: 'Deadline' };
    return { icon: '🔔', label: 'Update' };
  };

  const displayedNotifications = useMemo(() => {
    if (!unreadOnly) return notifications;
    return notifications.filter((item) => !item.read);
  }, [notifications, unreadOnly]);

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    if (!user) return;

    try {
      const response = await api.get(`/notifications?limit=15&page=${page}`);
      const nextItems = response.data.notifications || [];
      setNotifications((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setUnreadCount(response.data.unreadCount || 0);
      setNotificationHasMore(Boolean(response.data.hasMore));
      setNotificationPage(page);
    } catch (error) {
      if (!append) {
        setNotifications([]);
        setUnreadCount(0);
        setNotificationHasMore(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(1, false);
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!user) return undefined;

    const token = localStorage.getItem('token');
    const socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 15));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl, user]);

  const openNotifications = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const closeNotifications = () => {
    setNotificationAnchor(null);
  };

  const loadMoreNotifications = async () => {
    if (notificationLoadingMore || !notificationHasMore) return;
    setNotificationLoadingMore(true);
    await fetchNotifications(notificationPage + 1, true);
    setNotificationLoadingMore(false);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) => prev.map((item) => (
        item._id === notificationId ? { ...item, read: true } : item
      )));
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // Keep UI state unchanged on API failure.
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // Keep UI state unchanged on API failure.
    }
  };

  const handleNotificationOpen = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification._id);
    }

    closeNotifications();
    if (notification.courseId?._id || notification.courseId) {
      const courseId = notification.courseId?._id || notification.courseId;
      const chatId = notification.chatId?._id || notification.chatId;
      const tab = Number.isInteger(notification.targetTab) ? notification.targetTab : null;

      if (chatId) {
        navigate(`/course/${courseId}?tab=4&chatId=${chatId}`);
        return;
      }

      if (tab !== null) {
        navigate(`/course/${courseId}?tab=${tab}`);
        return;
      }

      navigate(`/course/${courseId}`);
    }
  };

  const handleNotificationReply = async (event, notification) => {
    event.stopPropagation();

    if (!notification.read) {
      await markNotificationRead(notification._id);
    }

    closeNotifications();

    const courseId = notification.courseId?._id || notification.courseId;
    const chatId = notification.chatId?._id || notification.chatId;
    if (!courseId || !chatId) return;

    const senderName = notification.sender?.name || '';
    const replyText = senderName ? `@${senderName} ` : '';
    const params = new URLSearchParams({
      tab: '4',
      chatId: String(chatId),
      replyText
    });

    navigate(`/course/${courseId}?${params.toString()}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: 'blur(12px)',
        background: 'linear-gradient(100deg, rgba(16, 42, 67, 0.92), rgba(15, 76, 129, 0.9))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.14)'
      }}
    >
      <Toolbar sx={{ display: 'flex', gap: 2, py: 1 }}>
        <Box component={Link} to="/" sx={{ textDecoration: 'none', color: 'white', flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            CampusFlow
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.86, letterSpacing: '0.03em' }}>
            Learning Management Platform
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {user ? (
            <>
              <Chip
                label={`${user.role?.toUpperCase() || 'USER'}: ${user.name}`}
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.34)',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: { xs: 'none', md: 'inline-flex' }
                }}
                variant="outlined"
              />
              <Button color="inherit" component={Link} to="/dashboard" sx={{ fontWeight: 700 }}>
                Home
              </Button>
              <Button color="inherit" component={Link} to="/search" sx={{ fontWeight: 700 }}>
                Catalog
              </Button>
              <Button color="inherit" component={Link} to="/profile" sx={{ fontWeight: 700 }}>
                Profile
              </Button>
              <IconButton color="inherit" onClick={openNotifications} size="small" sx={{ ml: 0.5 }}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <Typography component="span" sx={{ fontSize: 18 }}>🔔</Typography>
                </Badge>
              </IconButton>
              {user.role === 'admin' && (
                <Button color="inherit" component={Link} to="/admin" sx={{ fontWeight: 700 }}>
                  Admin
                </Button>
              )}
              {(user.role === 'admin' || user.role === 'faculty') && (
                <Button color="inherit" component={Link} to="/create-course" sx={{ fontWeight: 700 }}>
                  New Course
                </Button>
              )}
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: 2,
                  fontWeight: 700
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" sx={{ fontWeight: 700 }}>
                Login
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/register"
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: 2,
                  fontWeight: 700
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      <Menu
        anchorEl={notificationAnchor}
        open={notificationMenuOpen}
        onClose={closeNotifications}
        PaperProps={{ sx: { width: 360, maxWidth: '92vw' } }}
      >
        <MenuItem disabled>
          <ListItemText
            primary="Notifications"
            secondary={unreadCount ? `${unreadCount} unread` : 'All caught up'}
          />
          <ListItemSecondaryAction>
            <Button size="small" onClick={markAllNotificationsRead} disabled={!unreadCount}>
              Mark all read
            </Button>
          </ListItemSecondaryAction>
        </MenuItem>
        <MenuItem disabled sx={{ minHeight: 36 }}>
          <ListItemText primary="Unread only" />
          <ListItemSecondaryAction>
            <Switch
              size="small"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
            />
          </ListItemSecondaryAction>
        </MenuItem>
        <Divider />

        {!displayedNotifications.length && (
          <MenuItem disabled>
            <ListItemText primary={unreadOnly ? 'No unread notifications' : 'No notifications yet'} />
          </MenuItem>
        )}

        {displayedNotifications.map((notification) => {
          const typeMeta = notificationTypeMeta(notification.type);
          return (
          <MenuItem
            key={notification._id}
            onClick={() => handleNotificationOpen(notification)}
            sx={{
              alignItems: 'flex-start',
              borderLeft: '3px solid',
              borderColor: notification.priority === 'urgent' ? 'error.main' : 'transparent',
              backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
            }}
          >
            <ListItemText
              primary={`${typeMeta.icon} ${notification.title}`}
              secondary={`${notification.body} • ${new Date(notification.createdAt).toLocaleString()}`}
              primaryTypographyProps={{ fontWeight: notification.read ? 500 : 700 }}
            />
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ ml: 1 }}>
              <Chip
                size="small"
                label={typeMeta.label}
                color={notification.priority === 'urgent' ? 'error' : 'default'}
                variant={notification.read ? 'outlined' : 'filled'}
              />
              {notification.type === 'chat_message' && notification.chatId ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(event) => handleNotificationReply(event, notification)}
                >
                  Reply
                </Button>
              ) : null}
            </Stack>
          </MenuItem>
          );
        })}

        {notificationHasMore && (
          <MenuItem onClick={loadMoreNotifications} disabled={notificationLoadingMore}>
            <ListItemText
              primary={notificationLoadingMore ? 'Loading more...' : 'Load more notifications'}
              primaryTypographyProps={{ align: 'center' }}
            />
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default Navbar;