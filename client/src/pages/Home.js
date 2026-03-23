import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Chip, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [createdCourseIds, setCreatedCourseIds] = useState([]);
  const [calendarCourses, setCalendarCourses] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setEnrolledCourseIds([]);
        setCreatedCourseIds([]);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        setEnrolledCourseIds(
          (response.data.enrolledCourses || [])
            .map((entry) => entry?.course?._id || entry?.course)
            .filter(Boolean)
            .map((id) => String(id))
        );
        setCreatedCourseIds(
          (response.data.createdCourses || [])
            .map((course) => course?._id || course)
            .filter(Boolean)
            .map((id) => String(id))
        );
      } catch (error) {
        setEnrolledCourseIds([]);
        setCreatedCourseIds([]);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchCalendarCourses = async () => {
      if (!user) {
        setCalendarCourses([]);
        return;
      }

      const isTeacherRole = user.role === 'faculty' || user.role === 'admin';
      const currentUserId = String(user._id || user.id || '');

      const enrolledFromCourseList = courses
        .filter((course) =>
          (course.enrolledStudents || []).some((entry) => {
            const studentId = String(entry?.student?._id || entry?.student || '');
            const status = entry?.status || '';
            return studentId === currentUserId && status === 'approved';
          })
        )
        .map((course) => String(course._id));

      const teacherOwnedFromCourseList = courses
        .filter((course) => String(course?.instructor?._id || course?.instructor || '') === currentUserId)
        .map((course) => String(course._id));

      const targetCourseIds = isTeacherRole
        ? [...createdCourseIds, ...teacherOwnedFromCourseList]
        : [...enrolledCourseIds, ...enrolledFromCourseList];

      if (!targetCourseIds.length) {
        setCalendarCourses([]);
        return;
      }

      const uniqueIds = Array.from(new Set(targetCourseIds));

      try {
        const settled = await Promise.allSettled(uniqueIds.map((courseId) => api.get(`/courses/${courseId}`)));
        const successfulCourses = settled
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value?.data)
          .filter(Boolean);

        if (successfulCourses.length) {
          setCalendarCourses(successfulCourses);
          return;
        }

        // Fallback to list payload if all detail requests fail.
        setCalendarCourses(courses.filter((course) => uniqueIds.includes(String(course._id))));
      } catch (error) {
        setCalendarCourses(courses.filter((course) => uniqueIds.includes(String(course._id))));
      }
    };

    fetchCalendarCourses();
  }, [user, enrolledCourseIds, createdCourseIds, courses]);

  const totalCourses = courses.length;
  const averageRating =
    courses.length > 0
      ? (courses.reduce((sum, course) => sum + (Number(course.averageRating) || 0), 0) / courses.length).toFixed(1)
      : '0.0';

  const roleCourses = user
    ? calendarCourses
    : [];

  const allClassDeadlines = roleCourses
    .flatMap((course) => {
      const assignmentItems = (course.assignments || []).map((item) => ({
        id: `assignment-${item._id}`,
        title: item.title,
        type: 'Assignment',
        dueDate: item.dueDate,
        courseTitle: course.title,
        courseId: course._id,
        tab: 1
      }));

      const testItems = (course.tests || []).map((item) => ({
        id: `test-${item._id}`,
        title: item.title,
        type: 'Test',
        dueDate: item.dueDate,
        courseTitle: course.title,
        courseId: course._id,
        tab: 2
      }));

      const projectItems = (course.projects || []).map((item) => ({
        id: `project-${item._id}`,
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
  allClassDeadlines.forEach((item) => {
    const dueDate = new Date(item.dueDate);
    const dateKey = toStartOfDay(dueDate).toISOString();
    const existing = calendarEntriesByDate.get(dateKey) || [];
    existing.push({
      id: item.id,
      title: item.title,
      subtitle: `${item.courseTitle} • ${item.type}`,
      dateLabel: `Due ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: getCourseColor(item.courseId),
      onClick: () => navigate(`/course/${item.courseId}?tab=${item.tab}`)
    });
    calendarEntriesByDate.set(dateKey, existing);
  });

  const uniqueCourseLegend = allClassDeadlines.reduce((acc, item) => {
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
        <Typography variant="h3" component="h1" gutterBottom>
          Learn in a Real Campus-Style Flow
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 780, opacity: 0.95 }}>
          Structured courses, graded assessments, progress tracking, and collaborative discussion in one professional learning platform.
        </Typography>
        <Box className="stat-grid">
          <Box className="stat-tile">
            <Typography variant="overline" sx={{ opacity: 0.9 }}>Active Courses</Typography>
            <Typography variant="h5">{totalCourses}</Typography>
          </Box>
          <Box className="stat-tile">
            <Typography variant="overline" sx={{ opacity: 0.9 }}>Average Rating</Typography>
            <Typography variant="h5">{averageRating} / 5</Typography>
          </Box>
          <Box className="stat-tile">
            <Typography variant="overline" sx={{ opacity: 0.9 }}>Learning Paths</Typography>
            <Typography variant="h5">Beginner to Advanced</Typography>
          </Box>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h2">Featured Courses</Typography>
          <Typography color="text.secondary">Curated classes with lectures, tests, projects, and feedback.</Typography>
        </Box>
        <Button component={Link} to="/search" variant="contained">Browse Catalog</Button>
      </Stack>

      {user && (
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Typography variant="h6" component="h3" sx={{ mr: 1 }}>All Classes Deadline Calendar</Typography>
              <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(-1)}>Prev</Button>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{monthLabel}</Typography>
              <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(1)}>Next</Button>
            </Stack>
            <Chip size="small" label={`${allClassDeadlines.length} deadlines`} />
          </Stack>

          <Grid container spacing={0.8} sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs={12 / 7} key={`home-cal-head-${day}`}>
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
                      minHeight: 105,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: dayEntries.length ? 'primary.main' : 'divider',
                      p: 0.6,
                      backgroundColor: isCurrentMonth ? 'white' : 'rgba(15,76,129,0.05)',
                      opacity: isCurrentMonth ? 1 : 0.72
                    }}
                  >
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.45 }}>
                      {cellDate.getDate()}
                    </Typography>
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
                            p: 0.35,
                            borderColor: entry.color,
                            borderLeftWidth: 4,
                            color: 'text.primary',
                            backgroundColor: `${entry.color}1A`
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.subtitle}
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

          {uniqueCourseLegend.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: 'wrap' }}>
              {uniqueCourseLegend.map((entry) => (
                <Chip
                  key={entry.courseId}
                  size="small"
                  label={entry.courseTitle}
                  sx={{ border: '1px solid', borderColor: entry.color, backgroundColor: `${entry.color}1A` }}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
      
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card className="course-card-hover" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h5" component="h2">
                  {course.title}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip size="small" label={course.category} />
                  <Chip size="small" label={course.level} />
                  <Chip size="small" color="secondary" label={`${(course.averageRating || 0).toFixed(1)} ★`} />
                </Stack>
                <Typography variant="body2" component="p" color="text.secondary" sx={{ minHeight: 64 }}>
                  {course.description.substring(0, 100)}...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Instructor: {course.instructor.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {course.duration} hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assessments: lectures, assignments, tests, projects
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, mt: 'auto' }}>
                <Button fullWidth variant="contained" size="small" component={Link} to={`/course/${course._id}`}>
                  Open Course
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;