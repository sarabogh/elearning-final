import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const EditCourse = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: 1,
    price: 0,
    thumbnail: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !userData?.role) {
      navigate('/login');
      return;
    }

    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          category: response.data.category,
          level: response.data.level,
          duration: response.data.duration,
          price: response.data.price,
          thumbnail: response.data.thumbnail || ''
        });
      } catch (err) {
        setError('Could not load course');
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/courses/${id}`, formData);
      setSuccess('Course updated successfully!');
      setTimeout(() => navigate(`/course/${id}`), 750);
    } catch (err) {
      console.error('Update course error', err);
      setError(err.response?.data?.message || 'Could not update course');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await api.delete(`/courses/${id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete course error', err);
      setError(err.response?.data?.message || 'Could not delete course');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4">
          Edit Course
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            multiline
            minRows={3}
            id="description"
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="category"
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="level-label">Level</InputLabel>
            <Select
              labelId="level-label"
              id="level"
              name="level"
              value={formData.level}
              label="Level"
              onChange={handleChange}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            required
            fullWidth
            type="number"
            id="duration"
            label="Duration (hours)"
            name="duration"
            inputProps={{ min: 1 }}
            value={formData.duration}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            type="number"
            id="price"
            label="Price (USD)"
            name="price"
            inputProps={{ min: 0 }}
            value={formData.price}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="thumbnail"
            label="Thumbnail URL"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 1 }}
          >
            Save Changes
          </Button>
          <Button
            fullWidth
            color="error"
            variant="outlined"
            onClick={handleDelete}
          >
            Delete Course
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default EditCourse;
