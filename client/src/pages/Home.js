import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to eLearning Platform
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Discover and learn from our wide range of courses
      </Typography>
      
      <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2 }}>
        Featured Courses
      </Typography>
      
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  {course.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {course.category} • {course.level}
                </Typography>
                <Typography variant="body2" component="p">
                  {course.description.substring(0, 100)}...
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Instructor: {course.instructor.name}
                </Typography>
                <Typography variant="body2">
                  Duration: {course.duration} hours
                </Typography>
                <Typography variant="body2">
                  Rating: {course.averageRating.toFixed(1)}/5
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to={`/course/${course._id}`}>
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;