import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Rating,
  Tabs,
  Tab,
  Grid,
  Alert,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CourseChat from '../components/CourseChat';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Teacher form states
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', videoUrl: '', duration: 0 });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', attachmentUrl: '' });
  const [testForm, setTestForm] = useState({ title: '', description: '', totalPoints: 100, dueDate: '' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', requirements: '', dueDate: '', attachmentUrl: '' });

  // Grading state
  const [gradeInputs, setGradeInputs] = useState({});

  const fetchCourse = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      const gradeMap = {};
      (response.data.grades || []).forEach((g) => {
        gradeMap[g.student._id] = { grade: g.grade || '', feedback: g.feedback || '' };
      });
      setGradeInputs(gradeMap);
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleAddLecture = async () => {
    try {
      await api.post(`/courses/${id}/lectures`, lectureForm);
      setSuccessMessage('Lecture added successfully!');
      setLectureForm({ title: '', description: '', videoUrl: '', duration: 0 });
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleAddAssignment = async () => {
    try {
      await api.post(`/courses/${id}/assignments`, assignmentForm);
      setSuccessMessage('Assignment added!');
      setAssignmentForm({ title: '', description: '', dueDate: '', attachmentUrl: '' });
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleAddTest = async () => {
    try {
      await api.post(`/courses/${id}/tests`, testForm);
      setSuccessMessage('Test added!');
      setTestForm({ title: '', description: '', totalPoints: 100, dueDate: '' });
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleAddProject = async () => {
    try {
      await api.post(`/courses/${id}/projects`, projectForm);
      setSuccessMessage('Project added!');
      setProjectForm({ title: '', description: '', requirements: '', dueDate: '', attachmentUrl: '' });
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradeInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveGrade = async (studentId) => {
    const input = gradeInputs[studentId] || {};
    try {
      await api.put(`/courses/${id}/grade/${studentId}`, {
        grade: input.grade,
        feedback: input.feedback
      });
      setSuccessMessage('Grade saved!');
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleRatingSubmit = async () => {
    try {
      await api.post(`/courses/${id}/rate`, { rating, review });
      setSuccessMessage('Review submitted!');
      setRating(0);
      setReview('');
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      setSuccessMessage('Enrollment request submitted!');
      fetchCourse();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed: ' + error.response?.data?.message);
    }
  };

  if (!course) return <Typography>Loading...</Typography>;

  const currentUserId = user?._id || user?.id;
  const isInstructor = currentUserId && currentUserId === course.instructor._id;
  const isAdmin = user?.role === 'admin';
  const isTeacher = isInstructor || isAdmin;

  const userEnrollment = (user?.enrolledCourses || []).find(
    (enrolled) =>
      (enrolled.course && enrolled.course._id === course._id) ||
      enrolled.course === course._id
  );
  const isApproved = userEnrollment?.status === 'approved';
  const isPending = userEnrollment?.status === 'pending';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom>{course.title}</Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {course.category} • {course.level} • {course.duration} hours
          </Typography>
          <Typography variant="body1">Instructor: {course.instructor.name}</Typography>
          <Chip label={`${(course.averageRating || 0).toFixed(1)}/5 (${course.ratings?.length || 0} reviews)`} sx={{ mt: 1 }} />
        </Box>
        {isTeacher && (
          <Button variant="outlined" onClick={() => navigate(`/course/${id}/edit`)}>
            Edit Course
          </Button>
        )}
      </Box>

      <Typography variant="body1" paragraph>{course.description}</Typography>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {/* Enrollment Section */}
      {!user && <Alert severity="info" sx={{ mb: 2 }}>Log in to enroll and access content.</Alert>}

      {user && !isApproved && !isPending && user.role === 'learner' && (
        <Button variant="contained" onClick={handleEnroll} sx={{ mb: 2 }}>Request Enrollment</Button>
      )}

      {isPending && <Alert severity="warning" sx={{ mb: 2 }}>Enrollment pending approval.</Alert>}

      {isApproved && <Alert severity="success" sx={{ mb: 2 }}>Enrolled. Progress: {userEnrollment?.progress || 0}%</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)}>
          <Tab label="Lectures" />
          <Tab label="Assignments" />
          <Tab label="Tests" />
          <Tab label="Projects" />
          <Tab label="Chat" />
          <Tab label="Grades" />
          {isApproved && <Tab label="Reviews" />}
        </Tabs>
      </Paper>

      {/* Tab 0: Lectures */}
      {tab === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>Lectures</Typography>

          {isTeacher && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Add Lecture</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Title" value={lectureForm.title}
                    onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Description" multiline rows={3}value={lectureForm.description}
                    onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Video URL" value={lectureForm.videoUrl}
                    onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Duration (min)" type="number" value={lectureForm.duration}
                    onChange={(e) => setLectureForm({ ...lectureForm, duration: parseInt(e.target.value) || 0 })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddLecture}>Add Lecture</Button>
                </Grid>
              </Grid>
            </Card>
          )}

          <Box>
            {(course.lectures || []).length > 0 ? course.lectures.map((lecture, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{lecture.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{lecture.description}</Typography>
                  {lecture.duration && <Typography variant="caption">Duration: {lecture.duration} min</Typography>}
                </CardContent>
                {lecture.videoUrl && (
                  <CardActions>
                    <Button size="small" href={lecture.videoUrl} target="_blank">Watch</Button>
                  </CardActions>
                )}
              </Card>
            )) : <Typography>No lectures yet.</Typography>}
          </Box>
        </Box>
      )}

      {/* Tab 1: Assignments */}
      {tab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>Assignments</Typography>

          {isTeacher && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Add Assignment</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Title" value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Description" multiline rows={3} value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Attachment URL" value={assignmentForm.attachmentUrl}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, attachmentUrl: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddAssignment}>Add</Button>
                </Grid>
              </Grid>
            </Card>
          )}

          <Box>
            {(course.assignments || []).length > 0 ? course.assignments.map((assignment, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{assignment.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{assignment.description}</Typography>
                  {assignment.dueDate && <Typography variant="caption">Due: {new Date(assignment.dueDate).toLocaleDateString()}</Typography>}
                </CardContent>
                {assignment.attachmentUrl && <CardActions><Button size="small" href={assignment.attachmentUrl} target="_blank">View</Button></CardActions>}
              </Card>
            )) : <Typography>No assignments yet.</Typography>}
          </Box>
        </Box>
      )}

      {/* Tab 2: Tests */}
      {tab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>Tests</Typography>

          {isTeacher && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Add Test</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Title" value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Description" multiline rows={3} value={testForm.description}
                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Total Points" type="number" value={testForm.totalPoints}
                    onChange={(e) => setTestForm({ ...testForm, totalPoints: parseInt(e.target.value) || 100 })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={testForm.dueDate}
                    onChange={(e) => setTestForm({ ...testForm, dueDate: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddTest}>Add</Button>
                </Grid>
              </Grid>
            </Card>
          )}

          <Box>
            {(course.tests || []).length > 0 ? course.tests.map((test, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{test.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{test.description}</Typography>
                  <Typography variant="caption">Points: {test.totalPoints}</Typography>
                  {test.dueDate && <Typography variant="caption" display="block">Due: {new Date(test.dueDate).toLocaleDateString()}</Typography>}
                </CardContent>
              </Card>
            )) : <Typography>No tests yet.</Typography>}
          </Box>
        </Box>
      )}

      {/* Tab 3: Projects */}
      {tab === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>Projects</Typography>

          {isTeacher && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Add Project</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Title" value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Description" multiline rows={2} value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Requirements" multiline rows={2} value={projectForm.requirements}
                    onChange={(e) => setProjectForm({ ...projectForm, requirements: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={projectForm.dueDate}
                    onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Attachment URL" value={projectForm.attachmentUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, attachmentUrl: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddProject}>Add</Button>
                </Grid>
              </Grid>
            </Card>
          )}

          <Box>
            {(course.projects || []).length > 0 ? course.projects.map((project, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{project.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{project.description}</Typography>
                  {project.requirements && <Typography variant="body2" sx={{ mt: 1 }}>Requirements: {project.requirements}</Typography>}
                  {project.dueDate && <Typography variant="caption" display="block">Due: {new Date(project.dueDate).toLocaleDateString()}</Typography>}
                </CardContent>
                {project.attachmentUrl && <CardActions><Button size="small" href={project.attachmentUrl} target="_blank">View</Button></CardActions>}
              </Card>
            )) : <Typography>No projects yet.</Typography>}
          </Box>
        </Box>
      )}

      {/* Tab 4: Chat */}
      {tab === 4 && (
        <Box>
          <Typography variant="h5" gutterBottom>Chat & Discussion</Typography>
          {user && <CourseChat courseId={id} />}
        </Box>
      )}

      {/* Tab 5: Grades */}
      {tab === 5 && (
        <Box>
          <Typography variant="h5" gutterBottom>Grades</Typography>

          {isTeacher ? (
            <Box>
              {course.enrolledStudents.filter((s) => s.status === 'approved').length > 0 ? (
                course.enrolledStudents
                  .filter((s) => s.status === 'approved')
                  .map((enrollment) => {
                    const studentGrade = course.grades?.find((g) => g.student._id === enrollment.student._id);
                    const input = gradeInputs[enrollment.student._id] || { grade: '', feedback: '' };
                    return (
                      <Card key={enrollment.student._id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6">{enrollment.student.name}</Typography>
                          <Typography variant="body2" color="textSecondary">{enrollment.student.email}</Typography>
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={3}>
                              <TextField label="Grade" fullWidth size="small" value={input.grade}
                                onChange={(e) => handleGradeChange(enrollment.student._id, 'grade', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField label="Feedback" fullWidth size="small" multiline rows={2} value={input.feedback}
                                onChange={(e) => handleGradeChange(enrollment.student._id, 'feedback', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Button variant="contained" fullWidth onClick={() => handleSaveGrade(enrollment.student._id)}>Save</Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })
              ) : (
                <Typography>No approved students.</Typography>
              )}
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6">Your Grade</Typography>
                <Typography variant="h5" sx={{ mt: 2 }}>
                  {course.grades?.find((g) => g.student._id === currentUserId)?.grade || 'Not graded'}
                </Typography>
                {course.grades?.find((g) => g.student._id === currentUserId)?.feedback && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Feedback: {course.grades?.find((g) => g.student._id === currentUserId)?.feedback}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Tab 6: Reviews */}
      {tab === 6 && (
        <Box>
          <Typography variant="h5" gutterBottom>Reviews</Typography>

          {isApproved && !course.ratings?.find((r) => r.student._id === currentUserId) && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Leave a Review</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                <Rating value={rating} onChange={(e, val) => setRating(val)} size="large" />
              </Box>
              <TextField fullWidth label="Review" multiline rows={4} value={review}
                onChange={(e) => setReview(e.target.value)} sx={{ mb: 2 }} />
              <Button variant="contained" onClick={handleRatingSubmit} disabled={!rating}>Submit</Button>
            </Card>
          )}

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>All Reviews</Typography>
          {(course.ratings || []).length > 0 ? course.ratings.map((rat, idx) => (
            <Card key={idx} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">{rat.student.name}</Typography>
                  <Rating value={rat.rating} readOnly size="small" />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>{rat.review}</Typography>
              </CardContent>
            </Card>
          )) : <Typography>No reviews yet.</Typography>}
        </Box>
      )}
    </Container>
  );
};

export default CourseDetails;
