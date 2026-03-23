import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Grid, Card, CardContent, Paper } from '@mui/material';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    title: '',
    degree: '',
    skills: '',
    experience: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setFormData({
        name: response.data.name,
        bio: response.data.profile?.bio || '',
        title: response.data.profile?.title || '',
        degree: response.data.profile?.degree || '',
        skills: response.data.profile?.skills?.join(', ') || '',
        experience: response.data.profile?.experience || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const profileData = {
        bio: formData.bio
      };

      if (user.role === 'faculty' || user.role === 'admin') {
        profileData.title = formData.title;
        profileData.degree = formData.degree;
      } else {
        profileData.skills = formData.skills.split(',').map(skill => skill.trim());
        profileData.experience = formData.experience;
      }

      const updateData = {
        name: formData.name,
        profile: profileData
      };
      await api.put('/auth/profile', updateData);
      alert('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      alert('Failed to update profile: ' + error.response?.data?.message);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Container maxWidth="md" className="fade-in">
      <Box className="page-hero">
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Workspace
        </Typography>
        <Typography sx={{ opacity: 0.94 }}>
          Manage your personal details and learning identity.
        </Typography>
      </Box>

      <Paper sx={{ p: 2.5 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
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
              label="Role"
              value={user.role}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
            />
          </Grid>
          {user.role === 'faculty' ? (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Professor, Lecturer"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  placeholder="e.g. M.S. Computer Science"
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Enter skills separated by commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Describe your experience..."
                />
              </Grid>
            </>
          )}
        </Grid>
        
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
        >
          Update Profile
        </Button>
      </Box>
      </Paper>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Your Statistics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Enrolled Courses
              </Typography>
              <Typography variant="h4">
                {user.enrolledCourses?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Created Courses
              </Typography>
              <Typography variant="h4">
                {user.createdCourses?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Member Since
              </Typography>
              <Typography variant="h6">
                {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;