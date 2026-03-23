import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCourses = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/courses');
      
      // Filter courses where user is enrolled
      const enrolledUserCourses = response.data.filter(course => {
        const enrollment = course.enrolledStudents.find(e => e.student._id === user._id);
        return enrollment;
      }).map(course => {
        const enrollment = course.enrolledStudents.find(e => e.student._id === user._id);
        return { ...course, enrollment };
      });

      const pending = enrolledUserCourses.filter(c => c.enrollment.status === 'pending');
      const approved = enrolledUserCourses.filter(c => c.enrollment.status === 'approved');

      setPendingRequests(pending);
      setEnrolledCourses(approved);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUserCourses();
  }, [fetchUserCourses]);

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
        Your learning dashboard
      </Typography>

      {pendingRequests.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {pendingRequests.length} enrollment request(s) pending approval.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Enrolled Courses */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Enrolled Courses ({enrolledCourses.length})
          </Typography>
          {enrolledCourses.length === 0 ? (
            <Alert severity="warning">
              You haven't enrolled in any courses yet. <Button onClick={() => navigate('/')}>Explore courses</Button>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {enrolledCourses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {course.instructor.name}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Progress</Typography>
                          <Typography variant="caption">{course.enrollment.progress || 0}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={course.enrollment.progress || 0} />
                      </Box>
                      <Chip
                        label={course.enrollment.completed ? 'Completed' : 'In Progress'}
                        color={course.enrollment.completed ? 'success' : 'primary'}
                        size="small"
                      />
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleViewCourse(course._id)}>
                        Continue Learning
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Pending Enrollment Requests */}
        {pendingRequests.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Pending Enrollment Requests
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Instructor</TableCell>
                    <TableCell>Requested On</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.instructor.name}</TableCell>
                      <TableCell>
                        {new Date(course.enrollment.enrolledAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip label="Pending" color="warning" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default LearnerDashboard;