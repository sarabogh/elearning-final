import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleApproveEnrollment = async (courseId, studentId) => {
    try {
      await api.put(`/courses/${courseId}/approve/${studentId}`);
      alert('Enrollment approved!');
      fetchCourses();
    } catch (error) {
      alert('Failed to approve enrollment: ' + error.response?.data?.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        All Users
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Enrolled Courses</TableCell>
              <TableCell>Created Courses</TableCell>
              <TableCell>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={user.role === 'admin' ? 'error' : user.role === 'faculty' ? 'primary' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{user.enrolledCourses?.length || 0}</TableCell>
                <TableCell>{user.createdCourses?.length || 0}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Course Enrollment Requests
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) =>
              course.enrolledStudents
                .filter(student => student.status === 'pending')
                .map((student) => (
                  <TableRow key={`${course._id}-${student.student._id}`}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{student.student.name}</TableCell>
                    <TableCell>
                      <Chip label="Pending" color="warning" size="small" />
                    </TableCell>
                    <TableCell>{new Date(student.enrolledAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleApproveEnrollment(course._id, student.student._id)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminDashboard;