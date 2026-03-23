import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);

  useEffect(() => {
    fetchMyCourses();
    fetchEnrollmentRequests();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await api.get('/courses');
      // Filter courses where current user is instructor
      const myCourses = response.data.filter(course => course.instructor._id === JSON.parse(localStorage.getItem('user'))._id);
      setCourses(myCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollmentRequests = async () => {
    try {
      const response = await api.get('/courses');
      const requests = [];
      response.data.forEach(course => {
        if (course.instructor._id === JSON.parse(localStorage.getItem('user'))._id) {
          course.enrolledStudents.forEach(enrollment => {
            if (enrollment.status === 'pending') {
              requests.push({
                courseId: course._id,
                courseTitle: course.title,
                student: enrollment.student,
                enrolledAt: enrollment.enrolledAt
              });
            }
          });
        }
      });
      setEnrollmentRequests(requests);
    } catch (error) {
      console.error('Error fetching enrollment requests:', error);
    }
  };

  const handleCreateCourse = () => {
    navigate('/create-course');
  };

  const handleEditCourse = (courseId) => {
    navigate(`/edit-course/${courseId}`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Faculty Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Courses
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Enrolled Students</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>{course.title}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>{course.enrolledStudents.filter(e => e.status === 'approved').length}</TableCell>
                        <TableCell>
                          <Chip
                            label={course.isPublished ? 'Published' : 'Draft'}
                            color={course.isPublished ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => handleViewCourse(course._id)}>View</Button>
                          <Button size="small" onClick={() => handleEditCourse(course._id)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
            <CardActions>
              <Button variant="contained" onClick={handleCreateCourse}>
                Create New Course
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Enrollment Requests
                </Typography>
                <Alert severity="info">
                  Student enrollment requests are pending admin approval. Faculty can view request volume here, but only admins can approve access to classes.
                </Alert>
              </Stack>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Requested At</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollmentRequests.map((request, index) => (
                      <TableRow key={index}>
                        <TableCell>{request.courseTitle}</TableCell>
                        <TableCell>{request.student.name} ({request.student.email})</TableCell>
                        <TableCell>{new Date(request.enrolledAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size="small" color="warning" label="Pending Admin Approval" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {enrollmentRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            No pending enrollment requests for your classes right now.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FacultyDashboard;