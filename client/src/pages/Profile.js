import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatRoleLabel = (role) => {
  if (!role) return 'User';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const buildProfileData = (role, formData) => {
  const profileData = {
    avatar: formData.avatar || '',
    bio: formData.bio
  };

  if (role === 'faculty' || role === 'admin') {
    profileData.title = formData.title;
    profileData.degree = formData.degree;
  } else {
    profileData.skills = formData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    profileData.experience = formData.experience;
  }

  return profileData;
};

const Profile = () => {
  const { refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    bio: '',
    title: '',
    degree: '',
    skills: '',
    experience: ''
  });
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setFormData({
        name: response.data.name,
        avatar: response.data.profile?.avatar || '',
        bio: response.data.profile?.bio || '',
        title: response.data.profile?.title || '',
        degree: response.data.profile?.degree || '',
        skills: response.data.profile?.skills?.join(', ') || '',
        experience: response.data.profile?.experience || ''
      });
      setNotice({ type: '', message: '' });
    } catch (error) {
      setNotice({ type: 'error', message: 'Could not load your profile.' });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({ type: '', message: '' });

    try {
      await api.put('/auth/profile', {
        name: formData.name,
        profile: buildProfileData(user.role, formData)
      });

      await fetchProfile();
      await refreshUser();
      setNotice({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setNotice({ type: '', message: '' });

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const uploadResponse = await api.post('/uploads/single', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const avatarUrl = uploadResponse.data?.file?.url || '';
      const nextFormData = {
        ...formData,
        avatar: avatarUrl
      };

      await api.put('/auth/profile', {
        name: nextFormData.name,
        profile: buildProfileData(user.role, nextFormData)
      });

      setFormData(nextFormData);
      await fetchProfile();
      await refreshUser();
      setNotice({ type: 'success', message: 'Profile photo updated successfully.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.message || 'Could not upload profile photo.'
      });
    } finally {
      event.target.value = '';
      setAvatarUploading(false);
    }
  };

  const skillsPreview = useMemo(() => {
    return formData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 8);
  }, [formData.skills]);

  if (!user) {
    return (
      <Container maxWidth="lg" className="fade-in">
        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography>Loading profile...</Typography>
        </Paper>
      </Container>
    );
  }

  const isTeacher = user.role === 'faculty' || user.role === 'admin';
  const isAdmin = user.role === 'admin';
  const displayedAvatar = formData.avatar || user.profile?.avatar || '';
  const statCards = [
    {
      label: 'Enrolled Courses',
      value: user.enrolledCourses?.length || 0,
      tone: 'rgba(15, 76, 129, 0.08)'
    },
    {
      label: 'Created Courses',
      value: user.createdCourses?.length || 0,
      tone: 'rgba(47, 133, 90, 0.10)'
    },
    {
      label: 'Member Since',
      value: new Date(user.createdAt).toLocaleDateString(),
      tone: 'rgba(192, 86, 33, 0.10)'
    }
  ];

  return (
    <Container maxWidth="lg" className="fade-in" sx={{ pb: 5 }}>
      <Box className="page-hero">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={displayedAvatar}
            sx={{
              width: 76,
              height: 76,
              fontSize: 28,
              fontWeight: 800,
              bgcolor: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.28)'
            }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0.5 }}>
              {user.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={formatRoleLabel(user.role)}
                sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'white' }}
              />
              <Chip
                label={user.email}
                sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}
              />
            </Stack>
            <Typography sx={{ opacity: 0.94, maxWidth: 720 }}>
              {formData.bio || 'Add a concise bio so your profile looks complete and credible across the platform.'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {notice.message && (
        <Alert severity={notice.type || 'info'} sx={{ mb: 2.5 }}>
          {notice.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={2.5}>
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Profile Summary
              </Typography>
              <Stack spacing={1.25}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Display Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{formData.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Role</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatRoleLabel(user.role)}</Typography>
                </Box>
                {isTeacher ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{isAdmin ? 'Administrative Title' : 'Title'}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{formData.title || 'Not added yet'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{isAdmin ? 'Credentials' : 'Degree'}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{formData.degree || 'Not added yet'}</Typography>
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Top Skills</Typography>
                    <Stack direction="row" spacing={0.8} sx={{ mt: 0.8, flexWrap: 'wrap' }}>
                      {skillsPreview.length > 0 ? skillsPreview.map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      )) : <Typography variant="body2">No skills added yet</Typography>}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              {statCards.map((card) => (
                <Grid item xs={12} sm={4} md={12} key={card.label}>
                  <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', backgroundColor: card.tone }}>
                    <CardContent>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {card.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Edit Profile
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Keep your profile complete and consistent so it looks trustworthy throughout the platform.
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={displayedAvatar} sx={{ width: 56, height: 56 }}>
                        {getInitials(user.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Profile Photo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload a clear headshot or professional image.
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                      <input
                        hidden
                        accept="image/png,image/jpeg,image/gif"
                        type="file"
                        onChange={handleAvatarUpload}
                      />
                    </Button>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user.email}
                    disabled
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder={isTeacher
                      ? 'Summarize your teaching focus, background, and areas of expertise.'
                      : 'Share your learning goals, background, or professional interests.'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {isTeacher ? (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {isAdmin ? 'Administrative Details' : 'Instructor Details'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isAdmin
                          ? 'These details help your profile read like a platform leader rather than a generic account.'
                          : 'These details appear more professional when learners view your courses.'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={isAdmin ? 'Administrative Title' : 'Professional Title'}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder={isAdmin ? 'Program Director, Platform Administrator' : 'Professor, Lecturer, Senior Engineer'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={isAdmin ? 'Credentials / Background' : 'Degree / Credentials'}
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        placeholder={isAdmin ? 'MBA, EdD, Operations Leadership' : 'MSc Computer Science, PhD Education'}
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Learner Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add skills and experience so your profile looks complete and well-organized.
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="Python, public speaking, project management"
                        helperText="Separate each skill with a comma."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="Describe prior coursework, work experience, or goals relevant to your learning journey."
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                    <Button variant="outlined" onClick={fetchProfile} disabled={saving}>
                      Reset Changes
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;