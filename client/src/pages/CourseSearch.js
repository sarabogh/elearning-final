import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  MenuItem,
  Box,
  Typography,
  Chip,
  Rating,
  CircularProgress
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const CourseSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || ''
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'AI & Machine Learning',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
    'Other'
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);

      const response = await api.get(`/courses/search/query?${params}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: ''
    });
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Explore Courses
      </Typography>

      {/* Filter Section */}
      <Box sx={{ mb: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search courses"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description..."
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Level"
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All Levels</MenuItem>
              {levels.map(level => (
                <MenuItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results Count */}
      <Typography variant="body2" sx={{ mb: 2 }}>
        Found {courses.length} course{courses.length !== 1 ? 's' : ''}
      </Typography>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 ? (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {course.thumbnail && (
                  <Box
                    sx={{
                      height: 200,
                      backgroundImage: `url(${course.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" noWrap gutterBottom>
                    {course.title}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    by {course.instructor.name}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Rating value={Math.round(course.averageRating) / 1} readOnly size="small" />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      ({course.ratings?.length || 0} reviews)
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={course.category} size="small" />
                    <Chip
                      label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      size="small"
                      color={course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2">
                    <strong>${course.price || 'Free'}</strong>
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    onClick={() => handleViewCourse(course._id)}
                  >
                    View Course
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : !loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No courses found matching your filters.
          </Typography>
          <Button onClick={handleClearFilters} sx={{ mt: 2 }}>
            Clear filters and try again
          </Button>
        </Box>
      ) : null}
    </Container>
  );
};

export default CourseSearch;