const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateCourseSyllabus = (body) => {
  const errors = [];

  if (!body.title || body.title.trim().length < 3) {
    errors.push('Course title must be at least 3 characters long');
  }

  if (!body.description || body.description.trim().length < 10) {
    errors.push('Course description must be at least 10 characters long');
  }

  if (!body.category) {
    errors.push('Category is required');
  }

  if (!body.level || !['beginner', 'intermediate', 'advanced'].includes(body.level)) {
    errors.push('Level must be beginner, intermediate, or advanced');
  }

  if (!body.duration || body.duration <= 0) {
    errors.push('Duration must be a positive number');
  }

  if (body.price !== undefined && body.price < 0) {
    errors.push('Price cannot be negative');
  }

  return errors;
};

const validateLecture = (body) => {
  const errors = [];

  if (!body.title || body.title.trim().length < 3) {
    errors.push('Lecture title must be at least 3 characters long');
  }

  if (!body.videoUrl) {
    errors.push('Video URL is required');
  }

  if (body.duration && body.duration <= 0) {
    errors.push('Duration must be a positive number');
  }

  return errors;
};

const validateAssignment = (body) => {
  const errors = [];

  if (!body.title || body.title.trim().length < 3) {
    errors.push('Assignment title must be at least 3 characters long');
  }

  if (!body.description || body.description.trim().length < 10) {
    errors.push('Assignment description must be at least 10 characters long');
  }

  if (!body.dueDate) {
    errors.push('Due date is required');
  }

  return errors;
};

const validateRating = (body) => {
  const errors = [];

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (body.review && body.review.length > 500) {
    errors.push('Review must be 500 characters or less');
  }

  return errors;
};

// Middleware functions
const validateRegister = (req, res, next) => {
  const errors = [];

  if (!req.body.name || req.body.name.trim().length < 3) {
    errors.push('Name must be at least 3 characters long');
  }

  if (!req.body.email || !validateEmail(req.body.email)) {
    errors.push('Valid email is required');
  }

  if (!req.body.password || !validatePassword(req.body.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  if (!req.body.role || !['learner', 'faculty', 'admin'].includes(req.body.role)) {
    errors.push('Valid role is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const errors = [];

  if (!req.body.email || !validateEmail(req.body.email)) {
    errors.push('Valid email is required');
  }

  if (!req.body.password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const errors = [];

  if (req.body.name && req.body.name.trim().length < 3) {
    errors.push('Name must be at least 3 characters long');
  }

  if (req.body.email && !validateEmail(req.body.email)) {
    errors.push('Valid email is required');
  }

  if (req.body.profile && req.body.profile.bio && req.body.profile.bio.length > 500) {
    errors.push('Bio must be 500 characters or less');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateCourseSyllabus,
  validateLecture,
  validateAssignment,
  validateRating,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
};