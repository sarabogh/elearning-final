import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Avatar,
  Box,
  TextField,
  Rating,
  Grid,
  Alert,
  Paper,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Divider,
  Stack,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Collapse,
  CircularProgress
} from '@mui/material';

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CourseChat from '../components/CourseChat';

const emptyAssignmentForm = {
  title: '',
  description: '',
  instructions: '',
  dueDate: '',
  attachmentUrl: '',
  submissionType: 'text',
  maxPoints: 100
};

const emptyProjectForm = {
  title: '',
  description: '',
  requirements: '',
  dueDate: '',
  attachmentUrl: '',
  submissionType: 'text',
  maxPoints: 100
};

const emptyTestForm = {
  title: '',
  description: '',
  dueDate: '',
  autoGrade: true,
  questions: []
};

const emptyLectureForm = {
  title: '',
  description: '',
  videoUrl: '',
  duration: 0
};

const emptyQuestionDraft = {
  question: '',
  options: '',
  correctAnswer: '',
  points: 1
};

const composerCardSx = { mb: 3, p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider' };
const composerSectionSx = { p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'rgba(11, 63, 107, 0.03)' };
const contentCardSx = { mb: 2, border: '1px solid', borderColor: 'divider' };
const lowerSectionSx = { px: 2, pb: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider', mt: 1 };
const sectionTitleSx = { mb: 1.5, fontWeight: 600 };

const getPersonInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const ComposerCard = ({ title, description, actionLabel, onAction, children }) => (
  <Card sx={composerCardSx}>
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {children}
      {actionLabel && onAction && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
        </Box>
      )}
    </Stack>
  </Card>
);

const ComposerSection = ({ title, helperText, children }) => (
  <Box sx={composerSectionSx}>
    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>{title}</Typography>
    {helperText && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {helperText}
      </Typography>
    )}
    {children}
  </Box>
);

const ContentCard = ({ title, description, chips, actions, extraContent, children }) => (
  <Card sx={contentCardSx}>
    <CardContent sx={{ pb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">{title}</Typography>
          {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>}
          {extraContent}
          {!!chips?.length && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {chips}
            </Stack>
          )}
        </Box>
        {!!actions?.length && <Stack direction="row" spacing={1}>{actions}</Stack>}
      </Box>
    </CardContent>
    {children}
  </Card>
);

const LowerSection = ({ title, children }) => (
  <Box sx={lowerSectionSx}>
    <Typography variant="subtitle2" sx={sectionTitleSx}>{title}</Typography>
    {children}
  </Box>
);

const SubmissionStatsGrid = ({ stats }) => (
  <Grid container spacing={1} sx={{ mb: 2 }}>
    <Grid item xs={6} sm={4}><Paper variant="outlined" sx={{ p: 1.1 }}><Typography variant="caption" color="text.secondary">Submitted</Typography><Typography variant="h6">{stats.total}</Typography></Paper></Grid>
    <Grid item xs={6} sm={4}><Paper variant="outlined" sx={{ p: 1.1 }}><Typography variant="caption" color="text.secondary">Graded</Typography><Typography variant="h6">{stats.graded}</Typography></Paper></Grid>
    <Grid item xs={6} sm={4}><Paper variant="outlined" sx={{ p: 1.1 }}><Typography variant="caption" color="text.secondary">Pending</Typography><Typography variant="h6">{stats.pending}</Typography></Paper></Grid>
    <Grid item xs={6} sm={4}><Paper variant="outlined" sx={{ p: 1.1 }}><Typography variant="caption" color="text.secondary">Highest</Typography><Typography variant="h6">{stats.highest === '-' ? '-' : `${stats.highest}/${stats.maxPoints}`}</Typography></Paper></Grid>
    <Grid item xs={6} sm={4}><Paper variant="outlined" sx={{ p: 1.1 }}><Typography variant="caption" color="text.secondary">Lowest</Typography><Typography variant="h6">{stats.lowest === '-' ? '-' : `${stats.lowest}/${stats.maxPoints}`}</Typography></Paper></Grid>
    <Grid item xs={12} sm={4}><Paper variant="outlined" sx={{ p: 1.1, borderColor: 'primary.main' }}><Typography variant="caption" color="text.secondary">Average</Typography><Typography variant="h6">{stats.average === '-' ? '-' : `${stats.average}/${stats.maxPoints}`}</Typography></Paper></Grid>
  </Grid>
);

const SubmissionListItem = ({ name, chips, action }) => (
  <Paper variant="outlined" sx={{ p: 1.2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{name}</Typography>
        <Stack direction="row" spacing={0.6} sx={{ mt: 0.4, flexWrap: 'wrap' }}>
          {chips}
        </Stack>
      </Box>
      {action}
    </Box>
  </Paper>
);

const LearnerSubmissionSection = ({
  submissionType,
  itemId,
  itemLabel,
  draft,
  onDraftChange,
  onFileUpload,
  onSubmit,
  uploadingKey,
  mySubmission,
  maxPoints
}) => (
  <LowerSection title="Your Submission">
    <Grid container spacing={1.5}>
      {submissionType === 'text' && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Text Answer"
            value={draft.textAnswer || ''}
            onChange={(e) => onDraftChange({ ...draft, textAnswer: e.target.value })}
          />
        </Grid>
      )}

      {(submissionType === 'url') && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Submission URL"
            value={draft.submissionUrl || ''}
            onChange={(e) => onDraftChange({ ...draft, submissionUrl: e.target.value })}
          />
        </Grid>
      )}

      {submissionType === 'file' && (
        <Grid item xs={12} sm={6}>
          <Button component="label" variant="outlined" fullWidth disabled={uploadingKey === `${itemLabel}-${itemId}`}>
            {uploadingKey === `${itemLabel}-${itemId}` ? 'Uploading...' : 'Upload File'}
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.ppt,.pptx"
              onChange={(e) => onFileUpload(e.target.files?.[0])}
            />
          </Button>
        </Grid>
      )}

      <Grid item xs={12}>
        <Button variant="contained" size="small" onClick={onSubmit}>Submit {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}</Button>
      </Grid>
    </Grid>

    {mySubmission && (
      <Alert severity={mySubmission.status === 'graded' ? 'success' : 'info'} sx={{ mt: 1.5, py: 1 }}>
        <Typography variant="caption">
          {mySubmission.status === 'graded'
            ? `Graded: ${mySubmission.score ?? '-'} / ${maxPoints}${mySubmission.feedback ? ` | Feedback: ${mySubmission.feedback}` : ''}`
            : 'Submitted and awaiting grading'}
        </Typography>
      </Alert>
    )}
  </LowerSection>
);

const QuestionDraftSection = ({ draft, onChange, questionCount, onAdd, countLabel = 'Questions', helperText }) => (
  <ComposerSection title="Question Builder" helperText={helperText}>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField fullWidth label="Question" value={draft.question} onChange={(e) => onChange({ ...draft, question: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Options (comma separated)" value={draft.options} onChange={(e) => onChange({ ...draft, options: e.target.value })} />
      </Grid>
      <Grid item xs={12} md={8}>
        <TextField fullWidth label="Correct Answer" value={draft.correctAnswer} onChange={(e) => onChange({ ...draft, correctAnswer: e.target.value })} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth type="number" label="Points" value={draft.points} onChange={(e) => onChange({ ...draft, points: parseInt(e.target.value, 10) || 1 })} />
      </Grid>
    </Grid>
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
      <Chip label={`${countLabel}: ${questionCount}`} color="primary" variant="outlined" />
      <Button variant="outlined" onClick={onAdd}>Add Question</Button>
    </Box>
  </ComposerSection>
);

const QuestionPreviewList = ({ questions, onRemove }) => (
  <>
    {!!questions.length && (
      <Stack spacing={1.5}>
        {questions.map((q, index) => (
          <Paper key={`${q.question}-${index}`} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Q{index + 1}: {q.question}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1, flexWrap: 'wrap' }}>
                  {q.options.map((option) => (
                    <Chip key={`${q.question}-${option}`} label={option} size="small" variant="outlined" />
                  ))}
                </Stack>
                <Typography variant="caption" display="block">Correct: {q.correctAnswer} | Points: {q.points}</Typography>
              </Box>
              <Button size="small" color="error" onClick={() => onRemove(index)}>Remove</Button>
            </Box>
          </Paper>
        ))}
      </Stack>
    )}
  </>
);

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const [lectureForm, setLectureForm] = useState(emptyLectureForm);
  const [lectureVideoMode, setLectureVideoMode] = useState('url');
  const [lectureUploading, setLectureUploading] = useState(false);
  const [lectureUploadedFile, setLectureUploadedFile] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [questionDraft, setQuestionDraft] = useState(emptyQuestionDraft);

  const [gradeInputs, setGradeInputs] = useState({});
  const [assignmentGradeInputs, setAssignmentGradeInputs] = useState({});
  const [projectGradeInputs, setProjectGradeInputs] = useState({});
  const [testGradeInputs, setTestGradeInputs] = useState({});

  const [assignmentSubmissionDrafts, setAssignmentSubmissionDrafts] = useState({});
  const [projectSubmissionDrafts, setProjectSubmissionDrafts] = useState({});
  const [testAnswerDrafts, setTestAnswerDrafts] = useState({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [editDialog, setEditDialog] = useState({ open: false, type: '', itemId: '', form: {} });
  const [editQuestionDraft, setEditQuestionDraft] = useState(emptyQuestionDraft);
  const [lectureDialog, setLectureDialog] = useState({ open: false, itemId: '', form: emptyLectureForm });
  const [focusedSubmissionStudentId, setFocusedSubmissionStudentId] = useState('');
  const [rubricLocks, setRubricLocks] = useState({});
  const [rubricSelections, setRubricSelections] = useState({});
  const [deadlinesExpanded, setDeadlinesExpanded] = useState(false);
  const [teacherListQuery, setTeacherListQuery] = useState({ lecture: '', assignment: '', test: '', project: '' });
  const [teacherListSort, setTeacherListSort] = useState({ lecture: 'newest', assignment: 'newest', test: 'newest', project: 'newest' });
  const [learnerListQuery, setLearnerListQuery] = useState({ lecture: '', assignment: '', test: '', project: '' });
  const [learnerListSort, setLearnerListSort] = useState({ lecture: 'newest', assignment: 'newest', test: 'newest', project: 'newest' });
  const [teacherSubmissionQuery, setTeacherSubmissionQuery] = useState('');
  const [teacherSubmissionSort, setTeacherSubmissionSort] = useState('name-asc');
  const [lectureWatchDetails, setLectureWatchDetails] = useState({ loading: false, students: [] });
  const [unlockedLectures, setUnlockedLectures] = useState(new Set());

  const currentUserId = user?._id || user?.id;

  const fetchCourse = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      const data = response.data;
      setCourse(data);

      const finalGradeMap = {};
      (data.grades || []).forEach((g) => {
        const sid = g.student?._id || g.student;
        finalGradeMap[sid] = { grade: g.grade || '', feedback: g.feedback || '' };
      });
      setGradeInputs(finalGradeMap);
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    const rawTab = searchParams.get('tab');
    if (rawTab === null) return;

    const requestedTab = Number(rawTab);
    if (!Number.isNaN(requestedTab) && requestedTab >= 0 && requestedTab <= 6) {
      setTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const replyText = searchParams.get('replyText');
    if (!replyText) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('replyText');
    navigate(
      {
        pathname: `/course/${id}`,
        search: nextParams.toString() ? `?${nextParams.toString()}` : ''
      },
      { replace: true }
    );
  }, [id, navigate, searchParams]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const safeRefreshUser = async () => {
    try {
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const uploadFileAndGetUrl = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data?.file?.url;
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      showSuccess('Enrollment request submitted!');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Enrollment failed'));
    }
  };

  const handleLectureFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLectureUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLectureForm(prev => ({ ...prev, videoUrl: res.data.file.url }));
      setLectureUploadedFile(file.name);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLectureUploading(false);
    }
  };

  const handleAddLecture = async () => {
    try {
      await api.post(`/courses/${id}/lectures`, lectureForm);
      setLectureForm(emptyLectureForm);
      setLectureVideoMode('url');
      setLectureUploadedFile(null);
      showSuccess('Lecture added successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not add lecture'));
    }
  };

  const openLectureEditor = (lecture) => {
    setLectureDialog({
      open: true,
      itemId: lecture._id,
      form: {
        title: lecture.title || '',
        description: lecture.description || '',
        videoUrl: lecture.videoUrl || '',
        duration: Number(lecture.duration) || 0
      }
    });
  };

  const closeLectureEditor = () => {
    setLectureDialog({ open: false, itemId: '', form: emptyLectureForm });
  };

  const saveLectureEdit = async () => {
    try {
      await api.put(`/courses/${id}/lectures/${lectureDialog.itemId}`, lectureDialog.form);
      closeLectureEditor();
      showSuccess('Lecture updated');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not update lecture'));
    }
  };

  const handleDeleteLecture = async (lectureId, title) => {
    const confirmed = window.confirm(`Delete lecture "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${id}/lectures/${lectureId}`);
      if (lectureDialog.itemId === lectureId) {
        closeLectureEditor();
      }
      showSuccess('Lecture deleted');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not delete lecture'));
    }
  };

  const isDirectVideoUrl = (url) => {
    if (!url) return false;
    try {
      const clean = url.split('?')[0].toLowerCase();
      return /\.(mp4|webm|ogg|mov)$/.test(clean);
    } catch { return false; }
  };

  const unlockLecture = (lectureId) => {
    setUnlockedLectures((prev) => new Set([...prev, lectureId]));
  };

  const handleVideoTimeUpdate = (e, lectureId) => {
    const { currentTime, duration } = e.target;
    if (duration && currentTime / duration >= 0.5) {
      unlockLecture(lectureId);
    }
  };

  const toggleLectureComplete = async (lectureId, completed) => {
    try {
      await api.put(`/courses/${id}/progress`, { lectureId, completed });
      await safeRefreshUser();
      showSuccess(completed ? 'Lecture marked complete' : 'Lecture marked incomplete');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not update progress'));
    }
  };

  const handleAddAssignment = async () => {
    try {
      await api.post(`/courses/${id}/assignments`, assignmentForm);
      setAssignmentForm(emptyAssignmentForm);
      showSuccess('Assignment created successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not create assignment'));
    }
  };

  const toLocalDateTimeInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openAssessmentEditor = (type, item) => {
    if (type === 'test') {
      setEditQuestionDraft(emptyQuestionDraft);
      setEditDialog({
        open: true,
        type,
        itemId: item._id,
        form: {
          title: item.title || '',
          description: item.description || '',
          dueDate: toLocalDateTimeInput(item.dueDate),
          autoGrade: item.autoGrade !== false,
          questions: (item.questions || []).map((question) => ({
            question: question.question || '',
            options: [...(question.options || [])],
            correctAnswer: question.correctAnswer || '',
            points: Number(question.points) || 1
          }))
        }
      });
      return;
    }

    const baseForm = {
      title: item.title || '',
      description: item.description || '',
      dueDate: toLocalDateTimeInput(item.dueDate),
      attachmentUrl: item.attachmentUrl || '',
      submissionType: item.submissionType || 'text',
      maxPoints: Number(item.maxPoints) || 100
    };

    const form = type === 'assignment'
      ? { ...baseForm, instructions: item.instructions || '' }
      : { ...baseForm, requirements: item.requirements || '' };

    setEditDialog({ open: true, type, itemId: item._id, form });
  };

  const closeAssessmentEditor = () => {
    setEditDialog({ open: false, type: '', itemId: '', form: {} });
    setEditQuestionDraft(emptyQuestionDraft);
  };

  const addQuestionToEditDraft = () => {
    const options = editQuestionDraft.options
      .split(',')
      .map((opt) => opt.trim())
      .filter(Boolean);

    if (!editQuestionDraft.question.trim() || !editQuestionDraft.correctAnswer.trim() || options.length < 2) {
      alert('Question, correct answer, and at least 2 options are required');
      return;
    }

    if (!options.includes(editQuestionDraft.correctAnswer.trim())) {
      alert('Correct answer must match one of the options exactly');
      return;
    }

    setEditDialog((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        questions: [
          ...(prev.form.questions || []),
          {
            question: editQuestionDraft.question.trim(),
            options,
            correctAnswer: editQuestionDraft.correctAnswer.trim(),
            points: Number(editQuestionDraft.points) || 1
          }
        ]
      }
    }));

    setEditQuestionDraft(emptyQuestionDraft);
  };

  const removeQuestionFromEditDraft = (index) => {
    setEditDialog((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        questions: (prev.form.questions || []).filter((_, idx) => idx !== index)
      }
    }));
  };

  const saveAssessmentEdit = async () => {
    const { type, itemId, form } = editDialog;
    if (!type || !itemId) return;

    try {
      if (type === 'assignment') {
        await api.put(`/courses/${id}/assignments/${itemId}`, {
          title: form.title,
          description: form.description,
          instructions: form.instructions,
          dueDate: form.dueDate || undefined,
          attachmentUrl: form.attachmentUrl,
          submissionType: form.submissionType,
          maxPoints: Number(form.maxPoints) || 100
        });
        showSuccess('Assignment updated');
      }

      if (type === 'project') {
        await api.put(`/courses/${id}/projects/${itemId}`, {
          title: form.title,
          description: form.description,
          requirements: form.requirements,
          dueDate: form.dueDate || undefined,
          attachmentUrl: form.attachmentUrl,
          submissionType: form.submissionType,
          maxPoints: Number(form.maxPoints) || 100
        });
        showSuccess('Project updated');
      }

      if (type === 'test') {
        if (!(form.questions || []).length) {
          alert('Add at least one question');
          return;
        }

        await api.put(`/courses/${id}/tests/${itemId}`, {
          title: form.title,
          description: form.description,
          dueDate: form.dueDate || undefined,
          autoGrade: form.autoGrade !== false,
          questions: form.questions || []
        });
        showSuccess('Test updated');
      }

      closeAssessmentEditor();
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not update assessment'));
    }
  };

  const addQuestionToTestDraft = () => {
    const options = questionDraft.options
      .split(',')
      .map((opt) => opt.trim())
      .filter(Boolean);

    if (!questionDraft.question.trim() || !questionDraft.correctAnswer.trim() || options.length < 2) {
      alert('Question, correct answer, and at least 2 options are required');
      return;
    }

    if (!options.includes(questionDraft.correctAnswer.trim())) {
      alert('Correct answer must match one of the options exactly');
      return;
    }

    setTestForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: questionDraft.question.trim(),
          options,
          correctAnswer: questionDraft.correctAnswer.trim(),
          points: Number(questionDraft.points) || 1
        }
      ]
    }));

    setQuestionDraft(emptyQuestionDraft);
  };

  const removeQuestionFromDraft = (index) => {
    setTestForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddTest = async () => {
    try {
      if (!testForm.questions.length) {
        alert('Add at least one question');
        return;
      }

      await api.post(`/courses/${id}/tests`, testForm);
      setTestForm(emptyTestForm);
      setQuestionDraft(emptyQuestionDraft);
      showSuccess('Test created successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not create test'));
    }
  };

  const handleAddProject = async () => {
    try {
      await api.post(`/courses/${id}/projects`, projectForm);
      setProjectForm(emptyProjectForm);
      showSuccess('Project created successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not create project'));
    }
  };

  const handleDeleteAssessment = async (type, itemId, title) => {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const confirmed = window.confirm(`Delete ${label.toLowerCase()} "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${id}/${type}s/${itemId}`);
      if (selectedAssessment?.item?._id === itemId) {
        closeAssessmentDetails();
      }
      if (editDialog.itemId === itemId) {
        closeAssessmentEditor();
      }
      showSuccess(`${label} deleted`);
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || `Could not delete ${type}`));
    }
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    try {
      const payload = assignmentSubmissionDrafts[assignmentId] || {};
      await api.post(`/courses/${id}/assignments/${assignmentId}/submit`, payload);
      await safeRefreshUser();
      showSuccess('Assignment submitted successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not submit assignment'));
    }
  };

  const handleProjectSubmit = async (projectId) => {
    try {
      const payload = projectSubmissionDrafts[projectId] || {};
      await api.post(`/courses/${id}/projects/${projectId}/submit`, payload);
      await safeRefreshUser();
      showSuccess('Project submitted successfully');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not submit project'));
    }
  };

  const handleSubmissionFileUpload = async (type, itemId, file) => {
    if (!file) return;
    const key = `${type}-${itemId}`;
    try {
      setUploadingKey(key);
      const fileUrl = await uploadFileAndGetUrl(file);

      if (type === 'assignment') {
        const draft = assignmentSubmissionDrafts[itemId] || { textAnswer: '', submissionUrl: '' };
        setAssignmentSubmissionDrafts((prev) => ({
          ...prev,
          [itemId]: { ...draft, submissionUrl: fileUrl }
        }));
      }

      if (type === 'project') {
        const draft = projectSubmissionDrafts[itemId] || { textAnswer: '', submissionUrl: '' };
        setProjectSubmissionDrafts((prev) => ({
          ...prev,
          [itemId]: { ...draft, submissionUrl: fileUrl }
        }));
      }

      showSuccess('File uploaded. Ready to submit.');
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not upload file'));
    } finally {
      setUploadingKey('');
    }
  };

  const handleTestAnswerChange = (testId, questionIndex, value) => {
    setTestAnswerDrafts((prev) => {
      const existing = prev[testId] || [];
      const copy = [...existing];
      copy[questionIndex] = value;
      return { ...prev, [testId]: copy };
    });
  };

  const handleTestSubmit = async (testId) => {
    try {
      const answers = testAnswerDrafts[testId] || [];
      const response = await api.post(`/courses/${id}/tests/${testId}/submit`, { answers });
      await safeRefreshUser();
      if (response.data?.autoGraded) {
        showSuccess(`Test submitted. Score: ${response.data.score}/${response.data.maxScore}`);
      } else {
        showSuccess('Test submitted. Awaiting manual grade.');
      }
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not submit test'));
    }
  };

  const handleSaveFinalGrade = async (studentId) => {
    const input = gradeInputs[studentId] || {};
    try {
      await api.put(`/courses/${id}/grade/${studentId}`, {
        grade: input.grade || '',
        feedback: input.feedback || ''
      });
      showSuccess('Final grade saved');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not save final grade'));
    }
  };

  const handleAssignmentGradeChange = (assignmentId, studentId, field, value) => {
    const key = `${assignmentId}-${studentId}`;
    setAssignmentGradeInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleProjectGradeChange = (projectId, studentId, field, value) => {
    const key = `${projectId}-${studentId}`;
    setProjectGradeInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleTestGradeChange = (testId, studentId, field, value) => {
    const key = `${testId}-${studentId}`;
    setTestGradeInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const gradeAssignmentSubmission = async (assignmentId, studentId) => {
    try {
      const payload = assignmentGradeInputs[`${assignmentId}-${studentId}`] || {};
      await api.put(`/courses/${id}/assignments/${assignmentId}/grade/${studentId}`, {
        score: payload.score ?? '',
        feedback: payload.feedback ?? ''
      });
      showSuccess('Assignment graded');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not grade assignment'));
    }
  };

  const gradeProjectSubmission = async (projectId, studentId) => {
    try {
      const payload = projectGradeInputs[`${projectId}-${studentId}`] || {};
      await api.put(`/courses/${id}/projects/${projectId}/grade/${studentId}`, {
        score: payload.score ?? '',
        feedback: payload.feedback ?? ''
      });
      showSuccess('Project graded');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not grade project'));
    }
  };

  const gradeTestSubmission = async (testId, studentId, maxScore) => {
    try {
      const payload = testGradeInputs[`${testId}-${studentId}`] || {};
      await api.put(`/courses/${id}/tests/${testId}/grade/${studentId}`, {
        score: payload.score ?? '',
        feedback: payload.feedback ?? ''
      });
      showSuccess(`Test graded (${payload.score ?? 0}/${maxScore || 0})`);
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not grade test'));
    }
  };

  const reopenSubmission = async (type, itemId, studentId) => {
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const confirmed = window.confirm(`Reopen this ${typeLabel.toLowerCase()} submission? The student will be able to resubmit and any existing grade will be removed.`);
    if (!confirmed) return;
    try {
      await api.delete(`/courses/${id}/${type}s/${itemId}/submissions/${studentId}`);
      showSuccess(`${typeLabel} submission reopened`);
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || `Could not reopen ${type}`));
    }
  };

  const handleRatingSubmit = async () => {
    try {
      await api.post(`/courses/${id}/rate`, { rating, review });
      setRating(0);
      setReview('');
      showSuccess('Review submitted');
      fetchCourse();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Could not submit review'));
    }
  };

  useEffect(() => {
    if (!detailDrawerOpen || !selectedAssessment) return;

    const submissions = selectedAssessment.item.submissions || [];
    if (!submissions.length) return;

    const targetExists = submissions.some((sub) => {
      const sid = sub.student?._id || sub.student;
      return sid === focusedSubmissionStudentId;
    });

    if (!focusedSubmissionStudentId || !targetExists) {
      const firstStudentId = submissions[0].student?._id || submissions[0].student;
      setFocusedSubmissionStudentId(firstStudentId);
    }
  }, [detailDrawerOpen, selectedAssessment, focusedSubmissionStudentId]);

  const detailType = searchParams.get('detailType') || '';
  const detailId = searchParams.get('detailId') || '';

  useEffect(() => {
    let cancelled = false;

    const loadLectureWatchDetails = async () => {
      if (!course || detailType !== 'lecture' || tab !== 0 || !detailId) {
        if (!cancelled) {
          setLectureWatchDetails({ loading: false, students: [] });
        }
        return;
      }

      const instructorId = course.instructor?._id || course.instructor;
      const canView = user?.role === 'admin' || (currentUserId && currentUserId === instructorId);
      if (!canView) {
        if (!cancelled) {
          setLectureWatchDetails({ loading: false, students: [] });
        }
        return;
      }

      const lecture = (course.lectures || []).find((item) => String(item._id) === String(detailId));
      if (!lecture) {
        if (!cancelled) {
          setLectureWatchDetails({ loading: false, students: [] });
        }
        return;
      }

      const approved = (course.enrolledStudents || []).filter((entry) => entry.status === 'approved');
      if (!approved.length) {
        if (!cancelled) {
          setLectureWatchDetails({ loading: false, students: [] });
        }
        return;
      }

      if (!cancelled) {
        setLectureWatchDetails({ loading: true, students: [] });
      }

      const results = await Promise.allSettled(
        approved.map(async (entry) => {
          const studentId = entry.student?._id || entry.student;
          const studentName = entry.student?.name || 'Student';
          const profile = await api.get(`/users/${studentId}`);
          const enrollment = (profile.data?.enrolledCourses || []).find((en) => {
            const enrolledCourseId = en.course?._id || en.course;
            return String(enrolledCourseId) === String(course._id);
          });
          const completedLessons = new Set((enrollment?.completedLessons || []).map((lessonId) => String(lessonId?._id || lessonId)));
          return completedLessons.has(String(lecture._id)) ? { id: String(studentId), name: studentName } : null;
        })
      );

      const watchedStudents = results
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => result.value)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!cancelled) {
        setLectureWatchDetails({ loading: false, students: watchedStudents });
      }
    };

    loadLectureWatchDetails();

    return () => {
      cancelled = true;
    };
  }, [course, detailType, tab, detailId, user?.role, currentUserId]);

  if (!course) return <Typography>Loading...</Typography>;

  const isInstructor = currentUserId && currentUserId === (course.instructor?._id || course.instructor);
  const isAdmin = user?.role === 'admin';
  const isTeacher = isInstructor || isAdmin;
  const instructorProfile = course.instructor?.profile || {};
  const instructorRole = course.instructor?.role || 'faculty';
  const instructorRoleLabel = instructorRole.charAt(0).toUpperCase() + instructorRole.slice(1);

  const enrollmentRecord = (course.enrolledStudents || []).find((entry) => {
    const sid = entry.student?._id || entry.student;
    return sid === currentUserId;
  });

  const isApproved = enrollmentRecord?.status === 'approved';
  const isPending = enrollmentRecord?.status === 'pending';
  const initialChatId = searchParams.get('chatId') || '';
  const initialReplyDraft = searchParams.get('replyText') || '';
 

  const userEnrollment = (user?.enrolledCourses || []).find(
    (enrolled) =>
      (enrolled.course && enrolled.course._id === course._id) ||
      enrolled.course === course._id
  );

  const completedLectureIds = new Set((userEnrollment?.completedLessons || []).map((x) => x.toString()));

  const getMyAssignmentSubmission = (assignment) => {
    return (assignment.submissions || []).find((sub) => (sub.student?._id || sub.student) === currentUserId);
  };

  const getMyProjectSubmission = (project) => {
    return (project.submissions || []).find((sub) => (sub.student?._id || sub.student) === currentUserId);
  };

  const getMyTestSubmission = (test) => {
    return (test.submissions || []).find((sub) => (sub.student?._id || sub.student) === currentUserId);
  };

  const approvedStudents = (course.enrolledStudents || []).filter((entry) => entry.status === 'approved');

  const tabItems = [
    { label: 'Lectures', count: (course.lectures || []).length },
    { label: 'Assignments', count: (course.assignments || []).length },
    { label: 'Tests', count: (course.tests || []).length },
    { label: 'Projects', count: (course.projects || []).length },
    { label: 'Chat', count: null },
    { label: 'Grades', count: approvedStudents.length },
    { label: 'Reviews', count: (course.ratings || []).length }
  ];

  const openAssessmentDetails = (type, item, studentId = '') => {
    setSelectedAssessment({ type, item });
    setFocusedSubmissionStudentId(studentId);
    setDetailDrawerOpen(true);
  };

  const closeAssessmentDetails = () => {
    setDetailDrawerOpen(false);
    setFocusedSubmissionStudentId('');
  };

  const navigateWithParams = (nextParams) => {
    navigate(
      {
        pathname: `/course/${id}`,
        search: nextParams.toString() ? `?${nextParams.toString()}` : ''
      }
    );
  };

  const openItemDetails = (type, itemId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', String(getTypeTabIndex(type)));
    nextParams.set('detailType', type);
    nextParams.set('detailId', itemId);
    navigateWithParams(nextParams);
  };

  const closeItemDetails = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', String(tab));
    nextParams.delete('detailType');
    nextParams.delete('detailId');
    navigateWithParams(nextParams);
  };

  const getItemDateValue = (item) => {
    const raw = item?.createdAt || item?.dueDate;
    if (!raw) return 0;
    const parsed = new Date(raw).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getTeacherFilteredItems = (type, sourceItems = []) => {
    const query = (teacherListQuery[type] || '').trim().toLowerCase();
    const sort = teacherListSort[type] || 'newest';

    const filtered = sourceItems.filter((item) => (item.title || '').toLowerCase().includes(query));
    const sorted = filtered.slice().sort((a, b) => {
      if (sort === 'name-asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'name-desc') return (b.title || '').localeCompare(a.title || '');
      if (sort === 'oldest') return getItemDateValue(a) - getItemDateValue(b);
      return getItemDateValue(b) - getItemDateValue(a);
    });

    return sorted;
  };

  const getTypeTabIndex = (type) => ({ lecture: 0, assignment: 1, test: 2, project: 3 }[type] ?? 0);
  const detailItemsByType = {
    lecture: course.lectures || [],
    assignment: course.assignments || [],
    test: course.tests || [],
    project: course.projects || []
  };
  const activeDetailItem = detailType && detailId
    ? (detailItemsByType[detailType] || []).find((item) => String(item._id) === String(detailId))
    : null;
  const isDetailActiveForCurrentTab = Boolean(activeDetailItem) && getTypeTabIndex(detailType) === tab;

  const getTeacherSubmissions = (item, maxPoints = 100) => {
    const query = teacherSubmissionQuery.trim().toLowerCase();
    return (item?.submissions || [])
      .filter((sub) => (sub.student?.name || String(sub.student || '')).toLowerCase().includes(query))
      .slice()
      .sort((a, b) => {
        const nameA = (a.student?.name || String(a.student || '')).toLowerCase();
        const nameB = (b.student?.name || String(b.student || '')).toLowerCase();
        const scoreA = Number(a.score ?? -1);
        const scoreB = Number(b.score ?? -1);
        if (teacherSubmissionSort === 'name-desc') return nameB.localeCompare(nameA);
        if (teacherSubmissionSort === 'score-desc') return scoreB - scoreA;
        if (teacherSubmissionSort === 'score-asc') return scoreA - scoreB;
        if (teacherSubmissionSort === 'status') {
          const gradedA = a.score !== null && a.score !== undefined && a.score !== '' ? 1 : 0;
          const gradedB = b.score !== null && b.score !== undefined && b.score !== '' ? 1 : 0;
          if (gradedA !== gradedB) return gradedA - gradedB;
          return nameA.localeCompare(nameB);
        }
        return nameA.localeCompare(nameB);
      })
      .map((sub) => ({
        ...sub,
        maxPoints
      }));
  };

  const getLearnerItemStatus = (type, item) => {
    if (type === 'lecture') {
      return { done: completedLectureIds.has(String(item._id)), submission: null };
    }
    if (type === 'assignment') {
      const sub = getMyAssignmentSubmission(item);
      return { done: Boolean(sub), submission: sub || null };
    }
    if (type === 'test') {
      const sub = getMyTestSubmission(item);
      return { done: Boolean(sub), submission: sub || null };
    }
    if (type === 'project') {
      const sub = getMyProjectSubmission(item);
      return { done: Boolean(sub), submission: sub || null };
    }
    return { done: false, submission: null };
  };

  const getLearnerFilteredItems = (type, items = []) => {
    const query = (learnerListQuery[type] || '').trim().toLowerCase();
    const sort = learnerListSort[type] || 'newest';
    const filtered = items.filter((item) => (item.title || '').toLowerCase().includes(query));
    if (sort === 'incomplete') return filtered.filter((item) => !getLearnerItemStatus(type, item).done);
    if (sort === 'complete') return filtered.filter((item) => getLearnerItemStatus(type, item).done);
    return filtered.slice().sort((a, b) => {
      if (sort === 'name-asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'name-desc') return (b.title || '').localeCompare(a.title || '');
      if (sort === 'oldest') return getItemDateValue(a) - getItemDateValue(b);
      return getItemDateValue(b) - getItemDateValue(a);
    });
  };

  const courseDeadlines = [
    ...(course.assignments || []).map((item) => ({
      id: `assignment-${item._id}`,
      type: 'Assignment',
      sourceType: 'assignment',
      sourceId: item._id,
      title: item.title,
      dueDate: item.dueDate,
      tabIndex: 1
    })),
    ...(course.tests || []).map((item) => ({
      id: `test-${item._id}`,
      type: 'Test',
      sourceType: 'test',
      sourceId: item._id,
      title: item.title,
      dueDate: item.dueDate,
      tabIndex: 2
    })),
    ...(course.projects || []).map((item) => ({
      id: `project-${item._id}`,
      type: 'Project',
      sourceType: 'project',
      sourceId: item._id,
      title: item.title,
      dueDate: item.dueDate,
      tabIndex: 3
    }))
  ]
    .filter((item) => item.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const drawerRubric = [
    {
      criterion: 'Task completion',
      weight: 35,
      levels: ['Exceeds expectations', 'Meets expectations', 'Developing', 'Needs revision']
    },
    {
      criterion: 'Accuracy & quality',
      weight: 30,
      levels: ['Excellent', 'Strong', 'Partial', 'Limited']
    },
    {
      criterion: 'Communication clarity',
      weight: 20,
      levels: ['Clear and structured', 'Mostly clear', 'Some confusion', 'Unclear']
    },
    {
      criterion: 'Timeliness',
      weight: 15,
      levels: ['On time', 'Slightly late', 'Late', 'Missing requirements']
    }
  ];

  const rubricPresetScores = [
    { label: 'Exceeds', percentage: 100 },
    { label: 'Meets', percentage: 85 },
    { label: 'Developing', percentage: 70 },
    { label: 'Needs Work', percentage: 50 }
  ];

  const monthLabel = calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarGridStart = new Date(firstDayOfMonth);
  calendarGridStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarGridStart);
    day.setDate(calendarGridStart.getDate() + index);
    return day;
  });

  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  const typeColor = {
    Assignment: '#1f7ab6',
    Test: '#c05621',
    Project: '#2f855a'
  };

  const courseCalendarEntriesByDate = new Map();
  courseDeadlines.forEach((item) => {
    const dueDate = new Date(item.dueDate);
    const dateKey = startOfDay(dueDate).toISOString();
    const existing = courseCalendarEntriesByDate.get(dateKey) || [];
    existing.push({
      id: item.id,
      title: item.title,
      subtitle: item.type,
      dateLabel: `Due ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: typeColor[item.type] || '#0f4c81',
      onClick: () => {
        setDeadlinesExpanded(false);
        navigate(`/course/${id}?tab=${item.tabIndex}`);
      }
    });
    courseCalendarEntriesByDate.set(dateKey, existing);
  });

  const changeCalendarMonth = (delta) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const applyRubricPreset = (type, itemId, studentId, percent, maxPoints) => {
    const score = Math.round(((maxPoints || 100) * percent) / 100);
    if (type === 'assignment') {
      handleAssignmentGradeChange(itemId, studentId, 'score', score);
    }
    if (type === 'project') {
      handleProjectGradeChange(itemId, studentId, 'score', score);
    }
  };

  const getSubmissionStats = (submissions, maxPoints = 100) => {
    const list = submissions || [];
    const graded = list.filter((sub) => sub.score !== null && sub.score !== undefined && sub.score !== '');
    const normalizedScores = graded
      .map((sub) => Number(sub.score))
      .filter((score) => !Number.isNaN(score));

    if (!normalizedScores.length) {
      return {
        total: list.length,
        graded: 0,
        pending: list.length,
        average: '-',
        highest: '-',
        lowest: '-',
        maxPoints
      };
    }

    const totalScore = normalizedScores.reduce((sum, score) => sum + score, 0);
    const average = (totalScore / normalizedScores.length).toFixed(1);

    return {
      total: list.length,
      graded: normalizedScores.length,
      pending: list.length - normalizedScores.length,
      average,
      highest: Math.max(...normalizedScores),
      lowest: Math.min(...normalizedScores),
      maxPoints
    };
  };

  const getDrawerSubmissions = () => {
    const submissions = selectedAssessment?.item?.submissions || [];
    return submissions
      .slice()
      .sort((a, b) => {
        const sidA = a.student?._id || a.student;
        const sidB = b.student?._id || b.student;
        if (sidA === focusedSubmissionStudentId) return -1;
        if (sidB === focusedSubmissionStudentId) return 1;
        return 0;
      });
  };

  const drawerSubmissions = getDrawerSubmissions();
  const activeDrawerIndex = drawerSubmissions.findIndex((sub) => {
    const sid = sub.student?._id || sub.student;
    return sid === focusedSubmissionStudentId;
  });
  const activeSubmission = activeDrawerIndex >= 0 ? drawerSubmissions[activeDrawerIndex] : null;

  const setActiveDrawerSubmissionByIndex = (index) => {
    if (index < 0 || index >= drawerSubmissions.length) return;
    const sid = drawerSubmissions[index].student?._id || drawerSubmissions[index].student;
    setFocusedSubmissionStudentId(sid);
  };

  const isRubricLocked = (key) => rubricLocks[key] !== false;

  const setRubricLockState = (key, locked) => {
    setRubricLocks((prev) => ({ ...prev, [key]: locked }));
  };

  const renderTeacherCreatedList = (type, items, options = {}) => {
    const listTitle = options.listTitle || `Created ${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const maxPointsField = options.maxPointsField || 'maxPoints';
    const infoLabel = options.infoLabel || '';

    const filteredItems = getTeacherFilteredItems(type, items);

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>{listTitle}</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                size="small"
                label={`Search ${type}s by name`}
                value={teacherListQuery[type] || ''}
                onChange={(e) => setTeacherListQuery((prev) => ({ ...prev, [type]: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                select
                label="Sort"
                value={teacherListSort[type] || 'newest'}
                onChange={(e) => setTeacherListSort((prev) => ({ ...prev, [type]: e.target.value }))}
              >
                <MenuItem value="newest">Date created (newest)</MenuItem>
                <MenuItem value="oldest">Date created (oldest)</MenuItem>
                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {filteredItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No {type}s found.</Typography>
          ) : (
            <Stack spacing={1.1}>
              {filteredItems.map((item) => (
                <Paper key={item._id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 240 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                          {item.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={0.8} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {infoLabel && item[infoLabel] ? <Chip size="small" label={item[infoLabel]} /> : null}
                        {type === 'test' ? (
                          <Chip
                            size="small"
                            color={item.autoGrade !== false ? 'success' : 'warning'}
                            variant={item.autoGrade !== false ? 'filled' : 'outlined'}
                            label={item.autoGrade !== false ? 'Auto Grade' : 'Manual Grade'}
                          />
                        ) : null}
                        {item[maxPointsField] ? <Chip size="small" label={`Max: ${item[maxPointsField]}`} /> : null}
                        {item.submissionType ? <Chip size="small" label={`Submit: ${item.submissionType}`} /> : null}
                        {item.dueDate ? <Chip size="small" label={`Due: ${new Date(item.dueDate).toLocaleString()}`} /> : null}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => openItemDetails(type, item._id)}>Details</Button>
                      <Button size="small" onClick={() => type === 'lecture' ? openLectureEditor(item) : openAssessmentEditor(type, item)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => type === 'lecture' ? handleDeleteLecture(item._id, item.title) : handleDeleteAssessment(type, item._id, item.title)}>Delete</Button>
                    </Stack>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTeacherDetailPage = () => {
    if (!isTeacher || !activeDetailItem) return null;
    if (getTypeTabIndex(detailType) !== tab) return null;

    const typeLabel = detailType.charAt(0).toUpperCase() + detailType.slice(1);
    const maxPoints = activeDetailItem.maxPoints || activeDetailItem.totalPoints || 100;
    const stats = getSubmissionStats(activeDetailItem.submissions || [], maxPoints);
    const submissions = getTeacherSubmissions(activeDetailItem, maxPoints);

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Button size="small" variant="text" onClick={closeItemDetails} sx={{ mb: 1 }}>Back to Created {typeLabel}s</Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{activeDetailItem.title}</Typography>
          {activeDetailItem.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, mb: 1.2 }}>
              {activeDetailItem.description}
            </Typography>
          )}

          {activeDetailItem.instructions && (
            <Typography variant="body2" sx={{ mb: 0.6 }}><strong>Instructions:</strong> {activeDetailItem.instructions}</Typography>
          )}
          {activeDetailItem.requirements && (
            <Typography variant="body2" sx={{ mb: 0.6 }}><strong>Requirements:</strong> {activeDetailItem.requirements}</Typography>
          )}

          <Stack direction="row" spacing={0.8} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
            {detailType !== 'lecture' && <Chip size="small" label={`Max: ${maxPoints}`} />}
            {activeDetailItem.submissionType && <Chip size="small" label={`Submit: ${activeDetailItem.submissionType}`} />}
            {activeDetailItem.dueDate && <Chip size="small" label={`Due: ${new Date(activeDetailItem.dueDate).toLocaleString()}`} />}
            {detailType === 'lecture' && activeDetailItem.duration ? <Chip size="small" label={`Duration: ${activeDetailItem.duration} min`} /> : null}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button size="small" onClick={() => detailType === 'lecture' ? openLectureEditor(activeDetailItem) : openAssessmentEditor(detailType, activeDetailItem)}>Edit</Button>
            <Button
              size="small"
              color="error"
              onClick={() => detailType === 'lecture'
                ? handleDeleteLecture(activeDetailItem._id, activeDetailItem.title)
                : handleDeleteAssessment(detailType, activeDetailItem._id, activeDetailItem.title)}
            >
              Delete
            </Button>
          </Stack>

          {detailType === 'lecture' ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Lecture Watch Activity</Typography>
              {lectureWatchDetails.loading ? (
                <Typography variant="body2" color="text.secondary">Loading watch details...</Typography>
              ) : (
                <>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.2, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Watched: ${lectureWatchDetails.students.length}`} color="success" />
                    <Chip size="small" label={`Not watched: ${Math.max(0, approvedStudents.length - lectureWatchDetails.students.length)}`} variant="outlined" />
                  </Stack>
                  {lectureWatchDetails.students.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No learners have marked this lecture as watched yet.</Typography>
                  ) : (
                    <Stack spacing={0.8}>
                      {lectureWatchDetails.students.map((student) => (
                        <Paper key={`lecture-watch-${student.id}`} variant="outlined" sx={{ p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.name}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </>
              )}
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Submissions Overview</Typography>
              <SubmissionStatsGrid stats={stats} />

              {(detailType === 'assignment' || detailType === 'project') && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Rubric</Typography>
                  <Stack spacing={0.8}>
                    {drawerRubric.map((row) => (
                      <Paper key={row.criterion} variant="outlined" sx={{ p: 1, borderStyle: 'dashed' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.criterion}</Typography>
                          <Typography variant="body2" color="text.secondary">{row.weight}%</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap' }}>
                          {row.levels.map((level) => <Chip key={`${row.criterion}-${level}`} size="small" label={level} variant="outlined" />)}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search student"
                    value={teacherSubmissionQuery}
                    onChange={(e) => setTeacherSubmissionQuery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Sort students"
                    value={teacherSubmissionSort}
                    onChange={(e) => setTeacherSubmissionSort(e.target.value)}
                  >
                    <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                    <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                    <MenuItem value="score-desc">Score (High-Low)</MenuItem>
                    <MenuItem value="score-asc">Score (Low-High)</MenuItem>
                    <MenuItem value="status">Pending first</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {submissions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No submissions yet.</Typography>
              ) : (
                <Stack spacing={1.1}>
                  {submissions.map((sub) => {
                    const sid = sub.student?._id || sub.student;
                    const name = sub.student?.name || sid;
                    const graded = sub.score !== null && sub.score !== undefined && sub.score !== '';

                    if (detailType === 'test') {
                      const testKey = `${activeDetailItem._id}-${sid}`;
                      const testDraft = testGradeInputs[testKey] || { score: sub.score ?? '', feedback: sub.feedback || '' };
                      const testIsGraded = sub.score !== null && sub.score !== undefined;

                      return (
                        <Paper key={`${activeDetailItem._id}-${sid}`} variant="outlined" sx={{ p: 1.2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{name}</Typography>
                            <Stack direction="row" spacing={0.8}>
                              <Chip size="small" label={testIsGraded ? `${sub.score}/${sub.maxScore || maxPoints}` : 'Pending'} color={testIsGraded ? 'success' : 'default'} variant={testIsGraded ? 'filled' : 'outlined'} />
                              <Chip size="small" label={sub.autoGraded ? 'Auto-graded' : 'Reviewed'} variant="outlined" />
                            </Stack>
                          </Box>
                          <Grid container spacing={1} sx={{ mt: 0.4 }}>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Score"
                                value={testDraft.score ?? ''}
                                onChange={(e) => handleTestGradeChange(activeDetailItem._id, sid, 'score', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Feedback"
                                value={testDraft.feedback ?? ''}
                                onChange={(e) => handleTestGradeChange(activeDetailItem._id, sid, 'feedback', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                sx={{ height: '100%' }}
                                onClick={() => gradeTestSubmission(activeDetailItem._id, sid, maxPoints)}
                              >
                                Save Grade
                              </Button>
                            </Grid>
                          </Grid>
                          {sub.answers?.length ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
                              Student answered {sub.answers.length} question{sub.answers.length === 1 ? '' : 's'}.
                            </Typography>
                          ) : null}
                          <Box sx={{ mt: 1 }}>
                            <Button size="small" color="warning" variant="outlined" onClick={() => reopenSubmission('test', activeDetailItem._id, sid)}>Reopen for Student</Button>
                          </Box>
                        </Paper>
                      );
                    }

                    const key = `${activeDetailItem._id}-${sid}`;
                    const draft = detailType === 'assignment'
                      ? (assignmentGradeInputs[key] || { score: sub.score ?? '', feedback: sub.feedback || '' })
                      : (projectGradeInputs[key] || { score: sub.score ?? '', feedback: sub.feedback || '' });
                    const locked = isRubricLocked(key);
                    const selectedRubric = rubricSelections[key] ?? '';
                    const canSave = !locked || Boolean(selectedRubric);

                    return (
                      <Paper key={`${activeDetailItem._id}-${sid}`} variant="outlined" sx={{ p: 1.2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.7 }}>{name}</Typography>
                        {sub.textAnswer && <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>{sub.textAnswer}</Typography>}
                        {sub.submissionUrl && <Typography variant="caption" display="block" sx={{ mb: 0.8 }}>{sub.submissionUrl}</Typography>}

                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Score"
                              value={draft.score ?? ''}
                              disabled={locked}
                              onChange={(e) => {
                                if (detailType === 'assignment') {
                                  handleAssignmentGradeChange(activeDetailItem._id, sid, 'score', e.target.value);
                                } else {
                                  handleProjectGradeChange(activeDetailItem._id, sid, 'score', e.target.value);
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              label="Rubric Level"
                              value={selectedRubric}
                              onChange={(e) => {
                                const value = e.target.value;
                                setRubricSelections((prev) => ({ ...prev, [key]: value }));
                                if (!value) return;
                                applyRubricPreset(detailType, activeDetailItem._id, sid, Number(value), maxPoints);
                              }}
                            >
                              <MenuItem value="">Select</MenuItem>
                              {rubricPresetScores.map((preset) => (
                                <MenuItem key={`${preset.label}-${preset.percentage}`} value={preset.percentage}>
                                  {preset.label} ({preset.percentage}%)
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Feedback"
                              value={draft.feedback ?? ''}
                              onChange={(e) => {
                                if (detailType === 'assignment') {
                                  handleAssignmentGradeChange(activeDetailItem._id, sid, 'feedback', e.target.value);
                                } else {
                                  handleProjectGradeChange(activeDetailItem._id, sid, 'feedback', e.target.value);
                                }
                              }}
                            />
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => setRubricLockState(key, !locked)}>
                            {locked ? 'Unlock Manual Score' : 'Lock to Rubric'}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!canSave}
                            onClick={() => {
                              if (detailType === 'assignment') {
                                gradeAssignmentSubmission(activeDetailItem._id, sid);
                              } else {
                                gradeProjectSubmission(activeDetailItem._id, sid);
                              }
                            }}
                          >
                            Save Grade
                          </Button>
                          <Button size="small" color="warning" variant="outlined" onClick={() => reopenSubmission(detailType, activeDetailItem._id, sid)}>Reopen for Student</Button>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLearnerItemList = (type, items) => {
    const filteredItems = getLearnerFilteredItems(type, items);
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <Box>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              size="small"
              label={`Search ${typeLabel}s`}
              value={learnerListQuery[type] || ''}
              onChange={(e) => setLearnerListQuery((prev) => ({ ...prev, [type]: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              select
              label="Filter / Sort"
              value={learnerListSort[type] || 'newest'}
              onChange={(e) => setLearnerListSort((prev) => ({ ...prev, [type]: e.target.value }))}
            >
              <MenuItem value="newest">Date (Newest)</MenuItem>
              <MenuItem value="oldest">Date (Oldest)</MenuItem>
              <MenuItem value="name-asc">Name (A–Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z–A)</MenuItem>
              <MenuItem value="incomplete">{type === 'lecture' ? 'Not Watched' : 'Not Submitted'}</MenuItem>
              <MenuItem value="complete">{type === 'lecture' ? 'Watched' : 'Submitted'}</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {filteredItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No {typeLabel.toLowerCase()}s found.</Typography>
        ) : (
          <Stack spacing={1.2}>
            {filteredItems.map((item) => {
              const { done, submission } = getLearnerItemStatus(type, item);
              const maxPoints = item.maxPoints || item.totalPoints;
              const isDue = item.dueDate && new Date(item.dueDate) < new Date() && !done;

              const getStatusLabel = () => {
                if (type === 'lecture') return done ? 'Watched' : 'Not watched';
                if (!done) return 'Not submitted';
                if (submission?.score !== null && submission?.score !== undefined && submission?.score !== '') return `Score: ${submission.score}/${maxPoints}`;
                return 'Submitted';
              };
              const getStatusColor = () => {
                if (!done) return 'default';
                if (type === 'lecture') return 'success';
                if (submission?.score !== null && submission?.score !== undefined && submission?.score !== '') return 'success';
                return 'info';
              };

              return (
                <Paper
                  key={item._id}
                  variant="outlined"
                  sx={{ p: 1.8, cursor: 'pointer', transition: 'border-color 0.15s', '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(15,76,129,0.03)' } }}
                  onClick={() => openItemDetails(type, item._id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{item.description}</Typography>
                      )}
                      {type === 'assignment' && item.instructions && (
                        <Typography variant="body2" sx={{ mt: 0.3 }}><strong>Instructions:</strong> {item.instructions}</Typography>
                      )}
                      {type === 'project' && item.requirements && (
                        <Typography variant="body2" sx={{ mt: 0.3 }}><strong>Requirements:</strong> {item.requirements}</Typography>
                      )}
                      <Stack direction="row" spacing={0.8} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {maxPoints ? <Chip size="small" label={`Max: ${maxPoints}`} /> : null}
                        {item.submissionType ? <Chip size="small" label={`Submit: ${item.submissionType}`} /> : null}
                        {type === 'test' && item.questions?.length ? <Chip size="small" label={`${item.questions.length} question${item.questions.length !== 1 ? 's' : ''}`} /> : null}
                        {type === 'lecture' && item.duration ? <Chip size="small" label={`${item.duration} min`} /> : null}
                        {item.dueDate ? <Chip size="small" label={`Due: ${new Date(item.dueDate).toLocaleString()}`} color={isDue ? 'error' : 'default'} variant={isDue ? 'filled' : 'outlined'} /> : null}
                      </Stack>
                    </Box>
                    <Chip size="small" label={getStatusLabel()} color={getStatusColor()} variant={done ? 'filled' : 'outlined'} />
                  </Box>
                  {submission?.feedback && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>Feedback: {submission.feedback}</Typography>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    );
  };

  const renderLearnerItemDetail = () => {
    if (isTeacher || !activeDetailItem) return null;
    if (getTypeTabIndex(detailType) !== tab) return null;

    const item = activeDetailItem;
    const typeLabel = detailType.charAt(0).toUpperCase() + detailType.slice(1);
    const maxPoints = item.maxPoints || item.totalPoints || 100;
    const { done, submission } = getLearnerItemStatus(detailType, item);
    const answerDraft = testAnswerDrafts[item._id] || [];
    const assignDraft = assignmentSubmissionDrafts[item._id] || { textAnswer: '', submissionUrl: '' };
    const projectDraft = projectSubmissionDrafts[item._id] || { textAnswer: '', submissionUrl: '' };

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Button size="small" variant="text" onClick={closeItemDetails} sx={{ mb: 1.5 }}>
            ← Back to {typeLabel}s
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{item.title}</Typography>
            <Chip
              label={done ? (detailType === 'lecture' ? 'Watched' : 'Submitted') : (detailType === 'lecture' ? 'Not watched' : 'Not submitted')}
              color={done ? 'success' : 'default'}
              variant={done ? 'filled' : 'outlined'}
            />
          </Box>

          {item.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{item.description}</Typography>
          )}
          {detailType === 'assignment' && item.instructions && (
            <Typography variant="body2" sx={{ mb: 0.6 }}><strong>Instructions:</strong> {item.instructions}</Typography>
          )}
          {detailType === 'project' && item.requirements && (
            <Typography variant="body2" sx={{ mb: 0.6 }}><strong>Requirements:</strong> {item.requirements}</Typography>
          )}

          <Stack direction="row" spacing={0.8} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {detailType !== 'lecture' && maxPoints ? <Chip size="small" label={`Max: ${maxPoints}`} /> : null}
            {item.submissionType ? <Chip size="small" label={`Submit: ${item.submissionType}`} /> : null}
            {detailType === 'test' ? <Chip size="small" label={item.autoGrade !== false ? 'Auto-graded' : 'Manual review'} /> : null}
            {detailType === 'test' && item.questions?.length ? <Chip size="small" label={`${item.questions.length} question${item.questions.length !== 1 ? 's' : ''}`} /> : null}
            {detailType === 'lecture' && item.duration ? <Chip size="small" label={`Duration: ${item.duration} min`} /> : null}
            {item.dueDate ? <Chip size="small" label={`Due: ${new Date(item.dueDate).toLocaleString()}`} /> : null}
          </Stack>

          {/* LECTURE */}
          {detailType === 'lecture' && (
            <Box>
              {item.videoUrl ? (
                isDirectVideoUrl(item.videoUrl) ? (
                  <Box sx={{ mb: 2 }}>
                    <video
                      controls
                      style={{ width: '100%', maxHeight: 360, borderRadius: 8, background: '#000' }}
                      onTimeUpdate={(e) => handleVideoTimeUpdate(e, item._id)}
                    >
                      <source src={item.videoUrl} />
                      Your browser does not support the video tag.
                    </video>
                    {!unlockedLectures.has(item._id) && !done && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Watch at least 50% of the video to mark it as complete.
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      href={item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => unlockLecture(item._id)}
                    >
                      Watch Lecture
                    </Button>
                    {!unlockedLectures.has(item._id) && !done && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Click "Watch Lecture" to unlock completion.
                      </Typography>
                    )}
                  </Box>
                )
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>No video available yet.</Alert>
              )}
              {isApproved && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={done ? 'Marked as watched' : 'Not watched yet'} color={done ? 'success' : 'default'} variant={done ? 'filled' : 'outlined'} size="small" />
                  {done ? (
                    <Button size="small" variant="outlined" onClick={() => toggleLectureComplete(item._id, false)}>
                      Mark Incomplete
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!unlockedLectures.has(item._id)}
                      onClick={() => toggleLectureComplete(item._id, true)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {/* ASSIGNMENT */}
          {detailType === 'assignment' && isApproved && (
            submission ? (
              <Box sx={{ mt: 1 }}>
                <Alert severity="warning" sx={{ mb: 1.5 }}>This assignment has been submitted and cannot be changed. Contact your instructor if you need to resubmit.</Alert>
                {submission.textAnswer && <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Your answer:</strong> {submission.textAnswer}</Typography>}
                {submission.submissionUrl && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Submitted:</strong> <a href={submission.submissionUrl} target="_blank" rel="noreferrer">{submission.submissionUrl}</a></Typography>}
                {(submission.score !== null && submission.score !== undefined && submission.score !== '') ? (
                  <Alert severity="success" sx={{ mt: 1 }}>Score: {submission.score} / {maxPoints}{submission.feedback ? ` — Feedback: ${submission.feedback}` : ''}</Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>Submitted — awaiting grade.</Alert>
                )}
              </Box>
            ) : (
              <LearnerSubmissionSection
                submissionType={item.submissionType}
                itemId={item._id}
                itemLabel="assignment"
                draft={assignDraft}
                onDraftChange={(nextDraft) => setAssignmentSubmissionDrafts((prev) => ({ ...prev, [item._id]: nextDraft }))}
                onFileUpload={(file) => handleSubmissionFileUpload('assignment', item._id, file)}
                onSubmit={() => handleAssignmentSubmit(item._id)}
                uploadingKey={uploadingKey}
                mySubmission={null}
                maxPoints={maxPoints}
              />
            )
          )}

          {/* PROJECT */}
          {detailType === 'project' && isApproved && (
            submission ? (
              <Box sx={{ mt: 1 }}>
                <Alert severity="warning" sx={{ mb: 1.5 }}>This project has been submitted and cannot be changed. Contact your instructor if you need to resubmit.</Alert>
                {submission.textAnswer && <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Your answer:</strong> {submission.textAnswer}</Typography>}
                {submission.submissionUrl && <Typography variant="body2" sx={{ mb: 0.8 }}><strong>Submitted:</strong> <a href={submission.submissionUrl} target="_blank" rel="noreferrer">{submission.submissionUrl}</a></Typography>}
                {(submission.score !== null && submission.score !== undefined && submission.score !== '') ? (
                  <Alert severity="success" sx={{ mt: 1 }}>Score: {submission.score} / {maxPoints}{submission.feedback ? ` — Feedback: ${submission.feedback}` : ''}</Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>Submitted — awaiting grade.</Alert>
                )}
              </Box>
            ) : (
              <LearnerSubmissionSection
                submissionType={item.submissionType}
                itemId={item._id}
                itemLabel="project"
                draft={projectDraft}
                onDraftChange={(nextDraft) => setProjectSubmissionDrafts((prev) => ({ ...prev, [item._id]: nextDraft }))}
                onFileUpload={(file) => handleSubmissionFileUpload('project', item._id, file)}
                onSubmit={() => handleProjectSubmit(item._id)}
                uploadingKey={uploadingKey}
                mySubmission={null}
                maxPoints={maxPoints}
              />
            )
          )}

          {/* TEST */}
          {detailType === 'test' && isApproved && (
            submission ? (
              <Box sx={{ mt: 1 }}>
                <Alert severity="warning" sx={{ mb: 1.5 }}>This test has been submitted and cannot be retaken. Contact your instructor if you need to retake it.</Alert>
                {(submission.score !== null && submission.score !== undefined) ? (
                  <Alert severity="success" sx={{ mt: 1 }}>Score: {submission.score} / {submission.maxScore || item.totalPoints || 0}{submission.feedback ? ` — Feedback: ${submission.feedback}` : ''}</Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>Submitted — awaiting manual grade.</Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Questions</Typography>
                {(item.questions || []).map((q, qIdx) => (
                  <Paper key={`${item._id}-q-${qIdx}`} sx={{ mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Q{qIdx + 1}. {q.question}</Typography>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      sx={{ mt: 1 }}
                      label="Select answer"
                      value={answerDraft[qIdx] || ''}
                      onChange={(e) => handleTestAnswerChange(item._id, qIdx, e.target.value)}
                    >
                      {(q.options || []).map((opt) => (
                        <MenuItem key={`${item._id}-${qIdx}-${opt}`} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  </Paper>
                ))}
                <Button variant="contained" size="small" onClick={() => handleTestSubmit(item._id)}>Submit Test</Button>
              </Box>
            )
          )}

          {!isApproved && (
            <Alert severity="warning" sx={{ mt: 1 }}>Enroll in this course to {detailType === 'lecture' ? 'track lecture progress' : 'submit your work'}.</Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }} className="fade-in">
      <Box className="page-hero">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h3" gutterBottom>{course.title}</Typography>
            <Typography variant="h6" sx={{ opacity: 0.95 }} gutterBottom>
              {course.category} • {course.level} • {course.duration} hours
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.96 }}>Instructor: {course.instructor?.name}</Typography>
            <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 760, opacity: 0.92 }}>
              {course.description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`${(course.averageRating || 0).toFixed(1)}/5 (${course.ratings?.length || 0} reviews)`}
                sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'white' }}
              />
              {isApproved && (
                <Chip
                  label={`Progress: ${userEnrollment?.progress || 0}%`}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'white' }}
                />
              )}
            </Stack>
          </Box>
          {isTeacher && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/course/${id}/edit`)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
            >
              Edit Course
            </Button>
          )}
        </Box>
      </Box>

      {course.instructor && (
        <Paper
          sx={{
            mb: 2.5,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(11, 63, 107, 0.03), rgba(31, 122, 182, 0.01))'
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={instructorProfile.avatar || ''}
                  sx={{ width: 68, height: 68, fontSize: 24, fontWeight: 800, bgcolor: 'primary.main' }}
                >
                  {getPersonInitials(course.instructor?.name)}
                </Avatar>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {instructorRole === 'admin' ? 'Course Lead' : 'Instructor'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {course.instructor?.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.6, flexWrap: 'wrap' }}>
                    <Chip size="small" label={instructorProfile.title || instructorRoleLabel} />
                    {instructorProfile.degree && <Chip size="small" label={instructorProfile.degree} variant="outlined" />}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                <Typography variant="caption" color="text.secondary">Contact</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{course.instructor?.email}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {instructorProfile.bio || 'This instructor has not added a public teaching bio yet.'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {!user && <Alert severity="info" sx={{ mb: 2 }}>Log in to enroll and access content.</Alert>}
      {user && !isApproved && !isPending && user.role === 'learner' && (
        <Button variant="contained" onClick={handleEnroll} sx={{ mb: 2 }}>Request Enrollment</Button>
      )}
      {isPending && <Alert severity="warning" sx={{ mb: 2 }}>Enrollment pending approval.</Alert>}
      {isApproved && <Alert severity="success" sx={{ mb: 2 }}>Enrollment approved. You can access all course activities.</Alert>}

      {/* Horizontal Navigation Tabs */}
      <Paper sx={{ mb: 0, borderRadius: '8px 8px 0 0' }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { height: 3 },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.95rem', minHeight: 44, px: 2 }
          }}
        >
          {tabItems.map((item, index) => (
            <Tab
              key={item.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{item.label}</span>
                  {item.count !== null && <Chip label={item.count} size="small" variant="filled" sx={{ height: 22 }} />}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Collapsible Upcoming Deadlines Section */}
      {courseDeadlines.length > 0 && (
        <Paper sx={{ mb: 3, borderRadius: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer' }} onClick={() => setDeadlinesExpanded(!deadlinesExpanded)}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Upcoming Deadlines</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={courseDeadlines.length} size="small" />
              <Typography sx={{ fontSize: '1.5rem', transform: deadlinesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>▼</Typography>
            </Box>
          </Box>
          <Collapse in={deadlinesExpanded} timeout="auto" unmountOnExit>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Paper variant="outlined" sx={{ p: 1.2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(-1)}>Prev</Button>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{monthLabel}</Typography>
                    <Button size="small" variant="outlined" onClick={() => changeCalendarMonth(1)}>Next</Button>
                  </Stack>
                  <Chip label="Tap deadline to open tab" size="small" variant="outlined" />
                </Stack>

                <Grid container spacing={0.6} sx={{ mb: 1 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs={12 / 7} key={`head-${day}`}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 700 }}>
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={0.6}>
                  {calendarCells.map((cellDate) => {
                    const dateKey = startOfDay(cellDate).toISOString();
                    const dayEntries = courseCalendarEntriesByDate.get(dateKey) || [];
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
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.4 }}>
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

                <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: 'wrap' }}>
                  <Chip size="small" label="Assignments" sx={{ backgroundColor: '#1f7ab61A' }} />
                  <Chip size="small" label="Tests" sx={{ backgroundColor: '#c056211A' }} />
                  <Chip size="small" label="Projects" sx={{ backgroundColor: '#2f855a1A' }} />
                </Stack>
              </Paper>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Full-width Content Area */}
      <Box>

      {tab === 0 && (
        <Box sx={{ pt: 2.5 }}>
          <Typography variant="h5" gutterBottom>Lectures</Typography>
          {isTeacher && (
            <ComposerCard
              title="Create Lecture"
              actionLabel="Create Lecture"
              onAction={handleAddLecture}
            >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Title" value={lectureForm.title} onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Duration (min)" type="number" value={lectureForm.duration} onChange={(e) => setLectureForm({ ...lectureForm, duration: parseInt(e.target.value, 10) || 0 })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Description" value={lectureForm.description} onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })} />
                  </Grid>
                </Grid>
                <ComposerSection title="Delivery Setup">
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    <Button size="small" variant={lectureVideoMode === 'url' ? 'contained' : 'outlined'} onClick={() => setLectureVideoMode('url')}>Link (URL)</Button>
                    <Button size="small" variant={lectureVideoMode === 'upload' ? 'contained' : 'outlined'} onClick={() => setLectureVideoMode('upload')}>Upload File</Button>
                  </Stack>
                  {lectureVideoMode === 'url' ? (
                    <TextField fullWidth label="Video URL" value={lectureForm.videoUrl} onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })} />
                  ) : (
                    <Box>
                      <input
                        type="file"
                        id="lecture-file-upload"
                        accept="video/mp4,video/webm,video/ogg,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleLectureFileUpload}
                      />
                      <Stack direction="row" spacing={2} alignItems="center">
                        <label htmlFor="lecture-file-upload">
                          <Button component="span" variant="outlined" disabled={lectureUploading}>Choose File</Button>
                        </label>
                        {lectureUploading && <CircularProgress size={20} />}
                        {lectureUploadedFile && !lectureUploading && (
                          <Typography variant="body2" color="success.main">✓ {lectureUploadedFile}</Typography>
                        )}
                        {!lectureUploadedFile && !lectureUploading && (
                          <Typography variant="body2" color="text.secondary">No file chosen</Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                </ComposerSection>
            </ComposerCard>
          )}

          {isTeacher && renderTeacherDetailPage()}

          {isTeacher && !isDetailActiveForCurrentTab && renderTeacherCreatedList('lecture', course.lectures || [], {
            listTitle: 'Created Lectures'
          })}

          {!isTeacher && isDetailActiveForCurrentTab && renderLearnerItemDetail()}
          {!isTeacher && !isDetailActiveForCurrentTab && renderLearnerItemList('lecture', course.lectures || [])}
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ pt: 2.5 }}>
          <Typography variant="h5" gutterBottom>Assignments</Typography>

          {isTeacher && (
            <ComposerCard
              title="Create Assignment"
              actionLabel="Create Assignment"
              onAction={handleAddAssignment}
            >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Title" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" label="Max Points" value={assignmentForm.maxPoints} onChange={(e) => setAssignmentForm({ ...assignmentForm, maxPoints: parseInt(e.target.value, 10) || 100 })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Description" value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
                  </Grid>
                </Grid>
                <ComposerSection title="Submission Setup">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField fullWidth multiline rows={4} label="Instructions" value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={2}>
                        <TextField fullWidth select label="Submission Type" value={assignmentForm.submissionType} onChange={(e) => setAssignmentForm({ ...assignmentForm, submissionType: e.target.value })}>
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="url">URL</MenuItem>
                          <MenuItem value="file">File</MenuItem>
                        </TextField>
                        <TextField fullWidth label="Reference Attachment URL" value={assignmentForm.attachmentUrl} onChange={(e) => setAssignmentForm({ ...assignmentForm, attachmentUrl: e.target.value })} />
                      </Stack>
                    </Grid>
                  </Grid>
                </ComposerSection>
            </ComposerCard>
          )}

          {isTeacher && renderTeacherDetailPage()}

          {isTeacher && !isDetailActiveForCurrentTab && renderTeacherCreatedList('assignment', course.assignments || [], {
            listTitle: 'Created Assignments'
          })}

          {!isTeacher && isDetailActiveForCurrentTab && renderLearnerItemDetail()}
          {!isTeacher && !isDetailActiveForCurrentTab && renderLearnerItemList('assignment', course.assignments || [])}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ pt: 2.5 }}>
          <Typography variant="h5" gutterBottom>Tests</Typography>

          {isTeacher && (
            <ComposerCard
              title="Create Test"
              actionLabel="Publish Test"
              onAction={handleAddTest}
            >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Title" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={testForm.dueDate} onChange={(e) => setTestForm({ ...testForm, dueDate: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth select label="Auto Grade" value={testForm.autoGrade ? 'yes' : 'no'} onChange={(e) => setTestForm({ ...testForm, autoGrade: e.target.value === 'yes' })}>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Description" value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} />
                  </Grid>
                </Grid>
                <QuestionDraftSection
                  draft={questionDraft}
                  onChange={setQuestionDraft}
                  questionCount={testForm.questions.length}
                  countLabel="Draft Questions"
                  onAdd={addQuestionToTestDraft}
                  helperText="Keep the correct answer exactly the same as one of the options."
                />
                <QuestionPreviewList questions={testForm.questions} onRemove={removeQuestionFromDraft} />
            </ComposerCard>
          )}

          {isTeacher && renderTeacherDetailPage()}

          {isTeacher && !isDetailActiveForCurrentTab && renderTeacherCreatedList('test', course.tests || [], {
            listTitle: 'Created Tests',
            maxPointsField: 'totalPoints'
          })}

          {!isTeacher && isDetailActiveForCurrentTab && renderLearnerItemDetail()}
          {!isTeacher && !isDetailActiveForCurrentTab && renderLearnerItemList('test', course.tests || [])}
        </Box>
      )}

      {tab === 3 && (
        <Box sx={{ pt: 2.5 }}>
          <Typography variant="h5" gutterBottom>Projects</Typography>

          {isTeacher && (
            <ComposerCard
              title="Create Project"
              actionLabel="Create Project"
              onAction={handleAddProject}
            >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Title" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" label="Max Points" value={projectForm.maxPoints} onChange={(e) => setProjectForm({ ...projectForm, maxPoints: parseInt(e.target.value, 10) || 100 })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                  </Grid>
                </Grid>
                <ComposerSection title="Submission Setup">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField fullWidth multiline rows={4} label="Requirements" value={projectForm.requirements} onChange={(e) => setProjectForm({ ...projectForm, requirements: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={2}>
                        <TextField fullWidth select label="Submission Type" value={projectForm.submissionType} onChange={(e) => setProjectForm({ ...projectForm, submissionType: e.target.value })}>
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="url">URL</MenuItem>
                          <MenuItem value="file">File</MenuItem>
                        </TextField>
                        <TextField fullWidth label="Reference Attachment URL" value={projectForm.attachmentUrl} onChange={(e) => setProjectForm({ ...projectForm, attachmentUrl: e.target.value })} />
                      </Stack>
                    </Grid>
                  </Grid>
                </ComposerSection>
            </ComposerCard>
          )}

          {isTeacher && renderTeacherDetailPage()}

          {isTeacher && !isDetailActiveForCurrentTab && renderTeacherCreatedList('project', course.projects || [], {
            listTitle: 'Created Projects'
          })}

          {!isTeacher && isDetailActiveForCurrentTab && renderLearnerItemDetail()}
          {!isTeacher && !isDetailActiveForCurrentTab && renderLearnerItemList('project', course.projects || [])}
        </Box>
      )}

      {tab === 4 && (
        <Box>
          <Typography variant="h5" gutterBottom>Chat & Discussion</Typography>
          {user ? <CourseChat courseId={id} initialChatId={initialChatId} initialReplyDraft={initialReplyDraft} /> : <Alert severity="info">Log in to join discussion.</Alert>}
        </Box>
      )}

      {tab === 5 && (
        <Box>
          <Typography variant="h5" gutterBottom>Grades</Typography>

          {isTeacher ? (
            <Box>
              {approvedStudents.length === 0 ? (
                <Typography>No approved students yet.</Typography>
              ) : (
                approvedStudents.map((entry) => {
                  const studentId = entry.student?._id || entry.student;
                  const studentName = entry.student?.name || studentId;
                  const studentEmail = entry.student?.email || '';
                  const finalGradeInput = gradeInputs[studentId] || { grade: '', feedback: '' };

                  return (
                    <Card key={studentId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6">{studentName}</Typography>
                        <Typography variant="body2" color="text.secondary">{studentEmail}</Typography>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Final Grade"
                              value={finalGradeInput.grade ?? ''}
                              onChange={(e) => setGradeInputs((prev) => ({
                                ...prev,
                                [studentId]: {
                                  ...finalGradeInput,
                                  grade: e.target.value
                                }
                              }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={7}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Final Feedback"
                              value={finalGradeInput.feedback ?? ''}
                              onChange={(e) => setGradeInputs((prev) => ({
                                ...prev,
                                [studentId]: {
                                  ...finalGradeInput,
                                  feedback: e.target.value
                                }
                              }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button fullWidth variant="contained" onClick={() => handleSaveFinalGrade(studentId)}>Save</Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          ) : (
            <Box>
              {(() => {
                const myGrade = course.grades?.find((g) => (g.student?._id || g.student) === currentUserId);
                return (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">Final Course Grade</Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>{myGrade?.grade || 'Not assigned'}</Typography>
                      {myGrade?.feedback && (
                        <Typography variant="body2" sx={{ mt: 1 }}>Feedback: {myGrade.feedback}</Typography>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {(course.lectures || []).length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>Lectures</Typography>
                    <Chip label={`${completedLectureIds.size} / ${course.lectures.length} watched`} color="info" variant="outlined" />
                  </CardContent>
                </Card>
              )}

              {(course.assignments || []).length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Assignments</Typography>
                    <Stack spacing={1}>
                      {course.assignments.map((assignment) => {
                        const sub = getMyAssignmentSubmission(assignment);
                        const isGraded = sub && sub.score !== null && sub.score !== undefined && sub.score !== '';
                        return (
                          <Paper key={assignment._id} variant="outlined" sx={{ p: 1.2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{assignment.title}</Typography>
                                {assignment.dueDate && <Typography variant="caption" color="text.secondary">Due: {new Date(assignment.dueDate).toLocaleString()}</Typography>}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                {isGraded ? (
                                  <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>{sub.score} / {assignment.maxPoints || 100}</Typography>
                                    {sub.feedback && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sub.feedback}</Typography>}
                                  </>
                                ) : sub ? (
                                  <Chip size="small" label="Awaiting grade" color="warning" variant="outlined" />
                                ) : (
                                  <Chip size="small" label="Not submitted" variant="outlined" />
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {(course.tests || []).length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Tests</Typography>
                    <Stack spacing={1}>
                      {course.tests.map((test) => {
                        const sub = getMyTestSubmission(test);
                        const isGraded = sub && sub.score !== null && sub.score !== undefined;
                        return (
                          <Paper key={test._id} variant="outlined" sx={{ p: 1.2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{test.title}</Typography>
                                {test.dueDate && <Typography variant="caption" color="text.secondary">Due: {new Date(test.dueDate).toLocaleString()}</Typography>}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                {isGraded ? (
                                  <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>{sub.score} / {sub.maxScore || test.totalPoints || 0}</Typography>
                                    {sub.feedback && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sub.feedback}</Typography>}
                                  </>
                                ) : sub ? (
                                  <Chip size="small" label="Awaiting grade" color="warning" variant="outlined" />
                                ) : (
                                  <Chip size="small" label="Not submitted" variant="outlined" />
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {(course.projects || []).length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Projects</Typography>
                    <Stack spacing={1}>
                      {course.projects.map((project) => {
                        const sub = getMyProjectSubmission(project);
                        const isGraded = sub && sub.score !== null && sub.score !== undefined && sub.score !== '';
                        return (
                          <Paper key={project._id} variant="outlined" sx={{ p: 1.2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{project.title}</Typography>
                                {project.dueDate && <Typography variant="caption" color="text.secondary">Due: {new Date(project.dueDate).toLocaleString()}</Typography>}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                {isGraded ? (
                                  <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>{sub.score} / {project.maxPoints || 100}</Typography>
                                    {sub.feedback && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sub.feedback}</Typography>}
                                  </>
                                ) : sub ? (
                                  <Chip size="small" label="Awaiting grade" color="warning" variant="outlined" />
                                ) : (
                                  <Chip size="small" label="Not submitted" variant="outlined" />
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>
      )}

      {tab === 6 && (
        <Box>
          <Typography variant="h5" gutterBottom>Reviews</Typography>

          {isApproved && !course.ratings?.find((r) => (r.student?._id || r.student) === currentUserId) && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Leave a Review</Typography>
              <Rating value={rating} onChange={(e, val) => setRating(val || 0)} size="large" sx={{ mb: 2 }} />
              <TextField fullWidth multiline rows={4} label="Review" value={review} onChange={(e) => setReview(e.target.value)} sx={{ mb: 2 }} />
              <Button variant="contained" onClick={handleRatingSubmit} disabled={!rating}>Submit</Button>
            </Card>
          )}

          {(course.ratings || []).length > 0 ? course.ratings.map((rat) => (
            <Card key={rat._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">{rat.student?.name || 'Learner'}</Typography>
                  <Rating value={rat.rating} readOnly size="small" />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>{rat.review}</Typography>
              </CardContent>
            </Card>
          )) : <Typography>No reviews yet.</Typography>}
        </Box>
      )}

      </Box>

      <Dialog
        open={lectureDialog.open}
        onClose={closeLectureEditor}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit Lecture</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Title"
                  value={lectureDialog.form.title || ''}
                  onChange={(e) => setLectureDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, title: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (min)"
                  value={lectureDialog.form.duration || 0}
                  onChange={(e) => setLectureDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, duration: parseInt(e.target.value, 10) || 0 }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={lectureDialog.form.description || ''}
                  onChange={(e) => setLectureDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, description: e.target.value }
                  }))}
                />
              </Grid>
            </Grid>
            <ComposerSection title="Delivery Setup">
              <TextField
                fullWidth
                label="Video URL"
                value={lectureDialog.form.videoUrl || ''}
                onChange={(e) => setLectureDialog((prev) => ({
                  ...prev,
                  form: { ...prev.form, videoUrl: e.target.value }
                }))}
              />
            </ComposerSection>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLectureEditor}>Cancel</Button>
          {!!lectureDialog.itemId && (
            <Button color="error" onClick={() => handleDeleteLecture(lectureDialog.itemId, lectureDialog.form.title || 'lecture')}>
              Delete
            </Button>
          )}
          <Button variant="contained" onClick={saveLectureEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialog.open}
        onClose={closeAssessmentEditor}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editDialog.type === 'assignment' && 'Edit Assignment'}
          {editDialog.type === 'project' && 'Edit Project'}
          {editDialog.type === 'test' && 'Edit Test'}
        </DialogTitle>
        <DialogContent dividers>
          {editDialog.type !== 'test' && (
            <Stack spacing={2.5} sx={{ mt: 0.2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editDialog.form.title || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, title: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Due Date"
                    InputLabelProps={{ shrink: true }}
                    value={editDialog.form.dueDate || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, dueDate: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Points"
                    value={editDialog.form.maxPoints || 100}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, maxPoints: parseInt(e.target.value, 10) || 100 }
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={editDialog.form.description || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, description: e.target.value }
                    }))}
                  />
                </Grid>
              </Grid>
              <ComposerSection title="Submission Setup">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label={editDialog.type === 'assignment' ? 'Instructions' : 'Requirements'}
                      value={editDialog.type === 'assignment' ? (editDialog.form.instructions || '') : (editDialog.form.requirements || '')}
                      onChange={(e) => setEditDialog((prev) => ({
                        ...prev,
                        form: {
                          ...prev.form,
                          [editDialog.type === 'assignment' ? 'instructions' : 'requirements']: e.target.value
                        }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        select
                        label="Submission Type"
                        value={editDialog.form.submissionType || 'text'}
                        onChange={(e) => setEditDialog((prev) => ({
                          ...prev,
                          form: { ...prev.form, submissionType: e.target.value }
                        }))}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="url">URL</MenuItem>
                        <MenuItem value="file">File</MenuItem>
                      </TextField>
                      <TextField
                        fullWidth
                        label="Reference Attachment URL"
                        value={editDialog.form.attachmentUrl || ''}
                        onChange={(e) => setEditDialog((prev) => ({
                          ...prev,
                          form: { ...prev.form, attachmentUrl: e.target.value }
                        }))}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </ComposerSection>
            </Stack>
          )}

          {editDialog.type === 'test' && (
            <Stack spacing={2.5} sx={{ mt: 0.2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editDialog.form.title || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, title: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Due Date"
                    InputLabelProps={{ shrink: true }}
                    value={editDialog.form.dueDate || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, dueDate: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Auto Grade"
                    value={editDialog.form.autoGrade !== false ? 'yes' : 'no'}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, autoGrade: e.target.value === 'yes' }
                    }))}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={editDialog.form.description || ''}
                    onChange={(e) => setEditDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, description: e.target.value }
                    }))}
                  />
                </Grid>
              </Grid>
              <QuestionDraftSection
                draft={editQuestionDraft}
                onChange={setEditQuestionDraft}
                questionCount={(editDialog.form.questions || []).length}
                onAdd={addQuestionToEditDraft}
              />
              <QuestionPreviewList questions={editDialog.form.questions || []} onRemove={removeQuestionFromEditDraft} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssessmentEditor}>Cancel</Button>
          {!!editDialog.type && !!editDialog.itemId && (
            <Button color="error" onClick={() => handleDeleteAssessment(editDialog.type, editDialog.itemId, editDialog.form.title || 'item')}>
              Delete
            </Button>
          )}
          <Button variant="contained" onClick={saveAssessmentEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={closeAssessmentDetails}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 2.5 } }}
      >
        {selectedAssessment && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              {selectedAssessment.type === 'assignment' ? 'Assignment Workspace' : 'Project Workspace'}
            </Typography>
            <Typography variant="h5" sx={{ mb: 1 }}>{selectedAssessment.item.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedAssessment.item.description || 'No description provided.'}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip size="small" label={`Max ${selectedAssessment.item.maxPoints || 100} pts`} />
              <Chip size="small" label={`Submission: ${selectedAssessment.item.submissionType || 'text'}`} />
              {selectedAssessment.item.dueDate && (
                <Chip size="small" label={`Due ${new Date(selectedAssessment.item.dueDate).toLocaleString()}`} />
              )}
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Rubric Preview</Typography>
              <Stack spacing={1}>
                {drawerRubric.map((row) => (
                  <Paper key={row.criterion} variant="outlined" sx={{ p: 1, borderStyle: 'dashed' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, mb: 0.6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.criterion}</Typography>
                      <Typography variant="body2" color="text.secondary">{row.weight}%</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap' }}>
                      {row.levels.map((level) => (
                        <Chip key={`${row.criterion}-${level}`} label={level} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            {isTeacher && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Grade Panel</Typography>
                {((selectedAssessment.item.submissions || []).length === 0) ? (
                  <Typography variant="body2" color="text.secondary">No submissions yet.</Typography>
                ) : (
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.2, flexWrap: 'wrap' }}>
                      {drawerSubmissions.map((sub) => {
                        const sid = sub.student?._id || sub.student;
                        return (
                          <Chip
                            key={`drawer-chip-${sid}`}
                            label={sub.student?.name || 'Student'}
                            color={sid === focusedSubmissionStudentId ? 'primary' : 'default'}
                            variant={sid === focusedSubmissionStudentId ? 'filled' : 'outlined'}
                            onClick={() => setFocusedSubmissionStudentId(sid)}
                          />
                        );
                      })}
                    </Stack>

                    {activeSubmission && (
                      (() => {
                        const sid = activeSubmission.student?._id || activeSubmission.student;
                        const key = `${selectedAssessment.item._id}-${sid}`;
                        const isAssignment = selectedAssessment.type === 'assignment';
                        const draft = isAssignment
                          ? (assignmentGradeInputs[key] || { score: activeSubmission.score ?? '', feedback: activeSubmission.feedback || '' })
                          : (projectGradeInputs[key] || { score: activeSubmission.score ?? '', feedback: activeSubmission.feedback || '' });

                        const locked = isRubricLocked(key);
                        const selectedRubric = rubricSelections[key] ?? '';
                        const canSave = !locked || Boolean(selectedRubric);

                        return (
                          <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'primary.main', backgroundColor: 'rgba(11, 63, 107, 0.06)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {activeSubmission.student?.name || 'Student Submission'}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  {activeDrawerIndex + 1} of {drawerSubmissions.length}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={activeDrawerIndex <= 0}
                                  onClick={() => setActiveDrawerSubmissionByIndex(activeDrawerIndex - 1)}
                                >
                                  Previous
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={activeDrawerIndex >= drawerSubmissions.length - 1}
                                  onClick={() => setActiveDrawerSubmissionByIndex(activeDrawerIndex + 1)}
                                >
                                  Next
                                </Button>
                              </Stack>
                            </Box>

                            {activeSubmission.textAnswer && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {activeSubmission.textAnswer}
                              </Typography>
                            )}
                            {activeSubmission.submissionUrl && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {activeSubmission.submissionUrl}
                              </Typography>
                            )}

                            <Grid container spacing={1.2} sx={{ mt: 0.8 }}>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label="Score"
                                  value={draft.score ?? ''}
                                  disabled={locked}
                                  onChange={(e) => {
                                    if (isAssignment) {
                                      handleAssignmentGradeChange(selectedAssessment.item._id, sid, 'score', e.target.value);
                                    } else {
                                      handleProjectGradeChange(selectedAssessment.item._id, sid, 'score', e.target.value);
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={8}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  select
                                  label="Rubric Level"
                                  value={selectedRubric}
                                  sx={{ mb: 1 }}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setRubricSelections((prev) => ({ ...prev, [key]: value }));
                                    if (!value) return;
                                    const percent = Number(value);
                                    applyRubricPreset(
                                      selectedAssessment.type,
                                      selectedAssessment.item._id,
                                      sid,
                                      percent,
                                      selectedAssessment.item.maxPoints || 100
                                    );
                                  }}
                                >
                                  <MenuItem value="">Select rubric level</MenuItem>
                                  {rubricPresetScores.map((preset) => (
                                    <MenuItem key={`${preset.label}-${preset.percentage}`} value={preset.percentage}>
                                      {preset.label} ({preset.percentage}%)
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Feedback"
                                  value={draft.feedback ?? ''}
                                  onChange={(e) => {
                                    if (isAssignment) {
                                      handleAssignmentGradeChange(selectedAssessment.item._id, sid, 'feedback', e.target.value);
                                    } else {
                                      handleProjectGradeChange(selectedAssessment.item._id, sid, 'feedback', e.target.value);
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>

                            <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setRubricLockState(key, !locked)}
                              >
                                {locked ? 'Unlock Manual Score' : 'Lock to Rubric'}
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={!canSave}
                                onClick={() => {
                                  if (isAssignment) {
                                    gradeAssignmentSubmission(selectedAssessment.item._id, sid);
                                  } else {
                                    gradeProjectSubmission(selectedAssessment.item._id, sid);
                                  }
                                }}
                              >
                                Save Grade
                              </Button>
                            </Stack>
                            {locked && !selectedRubric && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
                                Rubric lock is active. Select a rubric level before saving.
                              </Typography>
                            )}
                          </Paper>
                        );
                      })()
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Drawer>

    </Container>
  );
};

export default CourseDetails;
