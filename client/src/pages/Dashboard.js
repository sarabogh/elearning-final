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
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [tab, setTab] = useState(0);
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

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert('Enrollment request submitted!');
      fetchProfile();
    } catch (error) {
      alert('Enrollment failed: ' + error.response?.data?.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  if (!user) return <div>Loading...</div>;

  const isTeacher = user.role === 'faculty' || user.role === 'admin';

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user.name}!
      </Typography>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={isTeacher ? 'My Classes' : 'My Courses'} />
        <Tab label={isTeacher ? 'Create Class' : 'Find Courses'} />
      </Tabs>

      {tab === 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
            {isTeacher ? 'Classes You Teach' : 'Courses You’re Enrolled In'}
          </Typography>

          {isTeacher ? (
            createdCourses.length === 0 ? (
              <Typography sx={{ mb: 2 }}>
                You haven’t created any courses yet. Use the Create Class tab to get started.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {createdCourses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course._id}>
                    <Card>
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
                You are not enrolled in any courses yet. Use the Find Courses tab to enroll.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {enrolledCourses.map((enrollment) => (
                  <Grid item xs={12} sm={6} md={4} key={enrollment.course._id}>
                    <Card>
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
        </>
      )}

      {tab === 1 && (
        <>
          {isTeacher ? (
            <Box>
              <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
                Create a New Class
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/create-course')}
              >
                Create New Course
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
                Find and Enroll in New Courses
              </Typography>
              {courses.length === 0 ? (
                <Typography sx={{ mb: 2 }}>
                  No courses are available right now. Check back soon.
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {courses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course._id}>
                      <Card>
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
        </>
      )}
    </Container>
  );
};

export default Dashboard;