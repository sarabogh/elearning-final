import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack
} from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [rejectDialog, setRejectDialog] = useState({ open: false, courseId: null, reason: '' });
  const [notice, setNotice] = useState({ show: false, severity: 'success', message: '' });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchPendingCourses();
  }, []);

  const showNotice = (message, severity = 'success') => {
    setNotice({ show: true, severity, message });
    setTimeout(() => setNotice((prev) => ({ ...prev, show: false })), 4000);
  };

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

  const fetchPendingCourses = async () => {
    try {
      const response = await api.get('/courses/catalog/pending');
      setPendingCourses(response.data);
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const handleApproveEnrollment = async (courseId, studentId) => {
    try {
      await api.put(`/courses/${courseId}/approve/${studentId}`);
      showNotice('Enrollment approved.');
      fetchCourses();
    } catch (error) {
      showNotice(error.response?.data?.message || 'Failed to approve enrollment.', 'error');
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      await api.put(`/courses/${courseId}/catalog/approve`);
      showNotice('Course approved and published to catalog.');
      fetchPendingCourses();
    } catch (error) {
      showNotice(error.response?.data?.message || 'Failed to approve course.', 'error');
    }
  };

  const openRejectDialog = (courseId) => {
    setRejectDialog({ open: true, courseId, reason: '' });
  };

  const closeRejectDialog = () => {
    setRejectDialog({ open: false, courseId: null, reason: '' });
  };

  const handleRejectCourse = async () => {
    try {
      await api.put(`/courses/${rejectDialog.courseId}/catalog/reject`, {
        reason: rejectDialog.reason
      });
      showNotice('Course rejected. The instructor will see your feedback.');
      closeRejectDialog();
      fetchPendingCourses();
    } catch (error) {
      showNotice(error.response?.data?.message || 'Failed to reject course.', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {notice.show && (
        <Alert severity={notice.severity} sx={{ mb: 2 }}>
          {notice.message}
        </Alert>
      )}

      {/* ── Pending Course Approvals ── */}
      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        Pending Course Approvals
        {pendingCourses.length > 0 && (
          <Chip
            label={pendingCourses.length}
            color="warning"
            size="small"
            sx={{ ml: 1.5, verticalAlign: 'middle' }}
          />
        )}
      </Typography>

      {pendingCourses.length === 0 ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No courses awaiting approval.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course Title</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCourses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <Box
                      component={Link}
                      to={`/course/${course._id}`}
                      sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {course.title}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {course.instructor?.name}
                    <br />
                    <Typography variant="caption" color="text.secondary">{course.instructor?.email}</Typography>
                  </TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{course.level}</TableCell>
                  <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApproveCourse(course._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => openRejectDialog(course._id)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Enrollment Requests ── */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Course Enrollment Requests
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                .filter((student) => student.status === 'pending')
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

      {/* ── All Users ── */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        All Users
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
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

      {/* ── Reject Course Dialog ── */}
      <Dialog open={rejectDialog.open} onClose={closeRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Course</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide feedback so the instructor knows what to change before resubmitting.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason for rejection"
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectCourse}>
            Reject Course
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;