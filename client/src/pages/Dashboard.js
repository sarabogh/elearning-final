import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Paper,
  Stack,
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const toDateInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [deadlineCourses, setDeadlineCourses] = useState([]);
  const [privateEvents, setPrivateEvents] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarEventDialog, setCalendarEventDialog] = useState({
    open: false,
    mode: 'create',
    eventId: '',
    form: {
      title: '',
      notes: '',
      color: '#2f855a',
      startAt: toDateInput(new Date()),
      endAt: ''
    }
  });
  const [calendarNotice, setCalendarNotice] = useState({ open: false, message: '' });
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCourses();
    fetchProfile();
  }, [navigate, user]);

  useEffect(() => {
    if (!user) return;
    fetchPrivateEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth, user]);

  useEffect(() => {
    const fetchDeadlineCourses = async () => {
      if (!user) {
        setDeadlineCourses([]);
        return;
      }

      const isTeacherRole = user.role === 'faculty' || user.role === 'admin';
      const baseIds = isTeacherRole
        ? (createdCourses || []).map((course) => String(course?._id || course)).filter(Boolean)
        : (enrolledCourses || [])
          .filter((entry) => !entry?.status || entry.status === 'approved')
          .map((entry) => String(entry?.course?._id || entry?.course))
          .filter(Boolean);

      const currentUserId = String(user._id || user.id || '');
      const fallbackIds = isTeacherRole
        ? (courses || [])
          .filter((course) => String(course?.instructor?._id || course?.instructor || '') === currentUserId)
          .map((course) => String(course._id))
        : (courses || [])
          .filter((course) =>
            (course.enrolledStudents || []).some((entry) => {
              const studentId = String(entry?.student?._id || entry?.student || '');
              const status = entry?.status || '';
              return studentId === currentUserId && status === 'approved';
            })
          )
          .map((course) => String(course._id));

      const uniqueIds = Array.from(new Set([...baseIds, ...fallbackIds]));

      if (!uniqueIds.length) {
        setDeadlineCourses([]);
        return;
      }

      const settled = await Promise.allSettled(uniqueIds.map((courseId) => api.get(`/courses/${courseId}`)));
      const successfulCourses = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value?.data)
        .filter(Boolean);

      if (successfulCourses.length) {
        setDeadlineCourses(successfulCourses);
        return;
      }

      setDeadlineCourses(courses.filter((course) => uniqueIds.includes(String(course._id))));
    };

    fetchDeadlineCourses();
  }, [user, enrolledCourses, createdCourses, courses]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setEnrolledCourses(response.data.enrolledCourses || []);
      setCreatedCourses(response.data.createdCourses || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPrivateEvents = async () => {
    try {
      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      const response = await api.get(
        `/calendar-events?start=${encodeURIComponent(monthStart.toISOString())}&end=${encodeURIComponent(monthEnd.toISOString())}`
      );
      setPrivateEvents(response.data || []);
    } catch (error) {
      setPrivateEvents([]);
    }
  };

  const openCreateReminderDialog = (date = new Date()) => {
    setCalendarEventDialog({
      open: true,
      mode: 'create',
      eventId: '',
      form: {
        title: '',
        notes: '',
        color: '#2f855a',
        startAt: toDateInput(date),
        endAt: ''
      }
    });
  };

  const openEditReminderDialog = (event) => {
    setCalendarEventDialog({
      open: true,
      mode: 'edit',
      eventId: event._id,
      form: {
        title: event.title || '',
        notes: event.notes || '',
        color: event.color || '#2f855a',
        startAt: toDateInput(event.startAt),
        endAt: toDateInput(event.endAt)
      }
    });
  };

  const closeReminderDialog = () => {
    setCalendarEventDialog((prev) => ({ ...prev, open: false }));
  };

  const saveReminder = async () => {
    const payload = {
      title: calendarEventDialog.form.title,
      notes: calendarEventDialog.form.notes,
      color: calendarEventDialog.form.color,
      startAt: calendarEventDialog.form.startAt ? new Date(calendarEventDialog.form.startAt).toISOString() : null,
      endAt: calendarEventDialog.form.endAt ? new Date(calendarEventDialog.form.endAt).toISOString() : null
    };

    if (!payload.title.trim() || !payload.startAt) {
      setCalendarNotice({ open: true, message: 'Title and date/time are required.' });
      return;
    }

    try {
      if (calendarEventDialog.mode === 'create') {
        await api.post('/calendar-events', payload);
        setCalendarNotice({ open: true, message: 'Reminder added.' });
      } else {
        await api.put(`/calendar-events/${calendarEventDialog.eventId}`, payload);
        setCalendarNotice({ open: true, message: 'Reminder updated.' });
      }
      closeReminderDialog();
      fetchPrivateEvents();
    } catch (error) {
      setCalendarNotice({ open: true, message: error.response?.data?.message || 'Could not save reminder.' });
    }
  };

  const deleteReminder = async () => {
    if (calendarEventDialog.mode !== 'edit') return;

    try {
      await api.delete(`/calendar-events/${calendarEventDialog.eventId}`);
      closeReminderDialog();
      setCalendarNotice({ open: true, message: 'Reminder deleted.' });
      fetchPrivateEvents();
    } catch (error) {
      setCalendarNotice({ open: true, message: error.response?.data?.message || 'Could not delete reminder.' });
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert('Enrollment request submitted!');
      fetchProfile();
    } catch (error) {
      alert('Enrollment failed: ' + error.response?.data?.message);
    }
  };

  if (!user) return <div>Loading...</div>;

  const isTeacher = user.role === 'faculty' || user.role === 'admin';

  const enrolledCount = enrolledCourses.length;
  const teachingCount = createdCourses.length;

  const roleCourses = deadlineCourses;

  const upcomingDeadlines = roleCourses
    .flatMap((course) => {
      const assignmentItems = (course.assignments || []).map((item) => ({
        id: `assignment-${item._id}`,
        sourceId: item._id,
        title: item.title,
        type: 'Assignment',
        dueDate: item.dueDate,
        courseTitle: course.title,
        courseId: course._id,
        tab: 1
      }));

      const testItems = (course.tests || []).map((item) => ({
        id: `test-${item._id}`,
        sourceId: item._id,
        title: item.title,
        type: 'Test',
        dueDate: item.dueDate,
        courseTitle: course.title,
        courseId: course._id,
        tab: 2
      }));

      const projectItems = (course.projects || []).map((item) => ({
        id: `project-${item._id}`,
        sourceId: item._id,
        title: item.title,
        type: 'Project',
        dueDate: item.dueDate,
        courseTitle: course.title,
        courseId: course._id,
        tab: 3
      }));

      return [...assignmentItems, ...testItems, ...projectItems];
    })
    .filter((item) => item.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const monthLabel = calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarGridStart = new Date(firstDayOfMonth);
  calendarGridStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarGridStart);
    day.setDate(calendarGridStart.getDate() + index);
    return day;
  });

  const coursePalette = ['#0b3f6b', '#c05621', '#2f855a', '#1f7ab6', '#b7791f', '#2b6cb0'];

  const getCourseColor = (courseId) => {
    if (!courseId) return '#0b3f6b';
    let hash = 0;
    for (let i = 0; i < courseId.length; i += 1) {
      hash = (hash << 5) - hash + courseId.charCodeAt(i);
      hash |= 0;
    }
    return coursePalette[Math.abs(hash) % coursePalette.length];
  };

  const calendarEntriesByDate = new Map();

  const pushCalendarEntry = (dateKey, entry) => {
    const existing = calendarEntriesByDate.get(dateKey) || [];
    existing.push(entry);
    calendarEntriesByDate.set(dateKey, existing);
  };

  upcomingDeadlines.forEach((item) => {
    const dueDate = new Date(item.dueDate);
    const dateKey = toStartOfDay(dueDate).toISOString();
    pushCalendarEntry(dateKey, {
      id: item.id,
      kind: 'deadline',
      title: item.title,
      subtitle: `${item.courseTitle} • ${item.type}`,
      dateLabel: `Due ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: getCourseColor(item.courseId),
      onClick: () => navigate(`/course/${item.courseId}?tab=${item.tab}`)
    });
  });

  privateEvents.forEach((event) => {
    const start = new Date(event.startAt);
    const dateKey = toStartOfDay(start).toISOString();
    pushCalendarEntry(dateKey, {
      id: `private-${event._id}`,
      kind: 'private',
      title: event.title,
      subtitle: 'Private reminder',
      dateLabel: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: event.color || '#2f855a',
      onClick: () => openEditReminderDialog(event)
    });
  });

  const uniqueCourseLegend = upcomingDeadlines.reduce((acc, item) => {
    if (!acc.some((entry) => entry.courseId === item.courseId)) {
      acc.push({
        courseId: item.courseId,
        courseTitle: item.courseTitle,
        color: getCourseColor(item.courseId)
      });
    }
    return acc;
  }, []);

  const changeCalendarMonth = (delta) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <Container maxWidth="lg" className="fade-in">
      <Box className="page-hero">
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user.name}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.94 }}>
          {isTeacher
            ? 'Manage classes, assess submissions, and guide learner progress.'
            : 'Track progress, submit work, and continue your learning journey.'}
        </Typography>
        <Box className="stat-grid">
          <Box className="stat-tile">
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              {isTeacher ? 'Classes Teaching' : 'Courses Enrolled'}
            </Typography>
            <Typography variant="h5">{isTeacher ? teachingCount : enrolledCount}</Typography>
          </Box>
          <Box className="stat-tile">
            <Typography variant="overline" sx={{ opacity: 0.9 }}>Role</Typography>
            <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>
        {isTeacher ? 'Classes You Teach' : 'Courses You’re Enrolled In'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {isTeacher ? (
            createdCourses.length === 0 ? (
              <Typography sx={{ mb: 2 }}>
                You haven’t created any courses yet. Start with the quick actions below.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {createdCourses.map((course) => (
                  <Grid item xs={12} sm={6} key={course._id}>
                    <Card className="course-card-hover">
                      <CardContent>
                        <Typography variant="h6">{course.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {course.category} • {course.level}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to={`/course/${course._id}`}>
                          View
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/course/${course._id}/edit`)}
                        >
                          Edit
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          ) : (
            enrolledCourses.length === 0 ? (
              <Typography sx={{ mb: 2 }}>
                You are not enrolled in any courses yet. Browse courses below.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {enrolledCourses.map((enrollment) => (
                  <Grid item xs={12} sm={6} key={enrollment.course._id}>
                    <Card className="course-card-hover">
                      <CardContent>
                        <Typography variant="h6">
                          {enrollment.course.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Progress: {enrollment.progress}%
                        </Typography>
                        <Chip
                          label={enrollment.completed ? 'Completed' : 'In Progress'}
                          color={enrollment.completed ? 'success' : 'primary'}
                          size="small"
                        />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          component={Link}
                          to={`/course/${enrollment.course._id}`}
                        >
                          Continue Learning
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(-1)}>Prev</Button>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{monthLabel}</Typography>
                <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(1)}>Next</Button>
              </Stack>
              <Button size="small" variant="contained" onClick={() => openCreateReminderDialog(new Date())}>Add Reminder</Button>
            </Stack>

            <Grid container spacing={0.8} sx={{ mb: 1 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Grid item xs={12 / 7} key={`head-${day}`}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 700 }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={0.8}>
              {calendarCells.map((cellDate) => {
                const dateKey = toStartOfDay(cellDate).toISOString();
                const dayEntries = calendarEntriesByDate.get(dateKey) || [];
                const isCurrentMonth = cellDate.getMonth() === calendarMonth.getMonth();
                const displayEntries = dayEntries.slice(0, 3);
                const hiddenCount = Math.max(0, dayEntries.length - displayEntries.length);

                return (
                  <Grid item xs={12 / 7} key={dateKey}>
                    <Box
                      sx={{
                        minHeight: 114,
                        borderRadius: 1.2,
                        border: '1px solid',
                        borderColor: dayEntries.some((entry) => entry.kind === 'deadline') ? 'primary.main' : 'divider',
                        p: 0.7,
                        backgroundColor: isCurrentMonth ? 'white' : 'rgba(15,76,129,0.05)',
                        opacity: isCurrentMonth ? 1 : 0.72
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{cellDate.getDate()}</Typography>
                        <Button size="small" sx={{ minWidth: 20, p: 0, lineHeight: 1 }} onClick={() => openCreateReminderDialog(cellDate)}>+</Button>
                      </Stack>

                      <Stack spacing={0.45}>
                        {displayEntries.map((entry) => (
                          <Button
                            key={entry.id}
                            size="small"
                            variant="outlined"
                            onClick={entry.onClick}
                            sx={{
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              p: 0.45,
                              borderColor: entry.color,
                              borderLeftWidth: 4,
                              color: 'text.primary',
                              backgroundColor: entry.kind === 'private' ? 'rgba(47,133,90,0.10)' : 'rgba(15,76,129,0.08)'
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {entry.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {entry.subtitle}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {entry.dateLabel}
                              </Typography>
                            </Box>
                          </Button>
                        ))}

                        {hiddenCount > 0 && (
                          <Typography variant="caption" color="text.secondary">+{hiddenCount} more</Typography>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Chip size="small" label="Deadlines" sx={{ backgroundColor: 'rgba(15,76,129,0.12)' }} />
              <Chip size="small" label="Private reminders" sx={{ backgroundColor: 'rgba(47,133,90,0.15)' }} />
            </Stack>

            {uniqueCourseLegend.length > 0 && (
              <Box sx={{ mt: 1.4, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Classes in this month
                </Typography>
                <Stack spacing={0.5}>
                  {uniqueCourseLegend.map((entry) => (
                    <Box key={entry.courseId} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color }} />
                      <Typography variant="caption" sx={{ lineHeight: 1.2 }}>{entry.courseTitle}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {isTeacher ? (
        <Box>
          <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>
            Faculty Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => navigate('/create-course')}
            >
              Create New Course
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/faculty-dashboard')}
            >
              Open Faculty Dashboard
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>
            Browse Available Courses
          </Typography>
          {courses.length === 0 ? (
            <Typography sx={{ mb: 2 }}>
              No courses are available right now. Check back soon.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Card className="course-card-hover">
                    <CardContent>
                      <Typography variant="h6">{course.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {course.category} • {course.level}
                      </Typography>
                      <Typography variant="body2">
                        Instructor: {course.instructor.name}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={Link}
                        to={`/course/${course._id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEnroll(course._id)}
                      >
                        Enroll
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Dialog open={calendarEventDialog.open} onClose={closeReminderDialog} fullWidth maxWidth="sm">
        <DialogTitle>{calendarEventDialog.mode === 'create' ? 'Add Private Reminder' : 'Edit Private Reminder'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.6}>
            <Alert severity="info">This reminder is private to your account and only appears on your calendar.</Alert>
            <TextField
              label="Title"
              fullWidth
              value={calendarEventDialog.form.title}
              onChange={(event) => setCalendarEventDialog((prev) => ({
                ...prev,
                form: { ...prev.form, title: event.target.value }
              }))}
            />
            <TextField
              label="Date & Time"
              fullWidth
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={calendarEventDialog.form.startAt}
              onChange={(event) => setCalendarEventDialog((prev) => ({
                ...prev,
                form: { ...prev.form, startAt: event.target.value }
              }))}
            />
            <TextField
              label="End (optional)"
              fullWidth
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={calendarEventDialog.form.endAt}
              onChange={(event) => setCalendarEventDialog((prev) => ({
                ...prev,
                form: { ...prev.form, endAt: event.target.value }
              }))}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={calendarEventDialog.form.notes}
              onChange={(event) => setCalendarEventDialog((prev) => ({
                ...prev,
                form: { ...prev.form, notes: event.target.value }
              }))}
            />
            <TextField
              label="Color"
              fullWidth
              value={calendarEventDialog.form.color}
              onChange={(event) => setCalendarEventDialog((prev) => ({
                ...prev,
                form: { ...prev.form, color: event.target.value }
              }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {calendarEventDialog.mode === 'edit' && (
            <Button color="error" onClick={deleteReminder}>Delete</Button>
          )}
          <Button onClick={closeReminderDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveReminder}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={calendarNotice.open}
        autoHideDuration={3500}
        onClose={() => setCalendarNotice({ open: false, message: '' })}
        message={calendarNotice.message}
      />
    </Container>
  );
};

export default Dashboard;
