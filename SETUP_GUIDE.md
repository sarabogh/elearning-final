# eLearning Project Setup & Implementation Guide

## Overview
This is a fully-featured MERN stack e-learning platform with real-time chat, file uploads, course management, and role-based access control.

---

## Quick Start

### Prerequisites
- Node.js v14+ and npm
- MongoDB Atlas account or local MongoDB
- Git
- (Optional) Gmail account for email notifications

### Installation

1. **Clone & Navigate**
```bash
cd c:\Users\Sara\Desktop\elearn final
```

2. **Install Server Dependencies**
```bash
cd server
npm install nodemailer
npm install
```

3. **Install Client Dependencies**
```bash
cd ../client
npm install
```

4. **Configure Environment Variables**

**Server (.env):**
```bash
cd server
cp .env.example .env
# Edit .env and fill in:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A strong secret key (change in production!)
# - EMAIL_USER & EMAIL_PASSWORD: Gmail/SMTP credentials
# - PORT: 5001 (optional)
```

5. **Create Uploads Directory**
```bash
mkdir server/uploads
```

6. **Start Development Servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

The app should now be running at `http://localhost:3000`

---

## Project Structure

```
elearn final/
├── server/
│   ├── config/
│   │   └── multer.js           # File upload configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   └── courseController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   └── validation.js       # Input validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   └── Chat.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── users.js
│   │   └── uploads.js          # File upload routes
│   ├── services/
│   │   └── emailService.js     # Email notifications
│   ├── __tests__/
│   │   └── routes.test.js      # API tests
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── CourseChat.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CourseDetails.js
│   │   │   ├── CreateCourse.js
│   │   │   ├── EditCourse.js
│   │   │   ├── Profile.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── FacultyDashboard.js
│   │   │   ├── LearnerDashboard.js
│   │   │   └── CourseSearch.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   └── public/
├── API_DOCUMENTATION.md        # Complete API reference
└── README.md
```

---

## Features Implemented

### ✅ Core Features

1. **Authentication & Authorization**
   - User registration with role selection (learner/faculty/admin)
   - Secure login with JWT tokens
   - Password validation (8+ chars, uppercase, lowercase, number, special char)
   - Role-based access control

2. **User Management**
   - Profile creation and editing
   - User dashboard (learner/faculty/admin specific)
   - Admin user listing and management
   - Faculty course management

3. **Course Management**
   - Course creation (admin/faculty)
   - Course publishing/editing
   - Lecture, assignment, test, and project management
   - Course enrollment with approval workflow
   - Course search and filtering by:
     - Title/description (search)
     - Category
     - Level (beginner/intermediate/advanced)
     - Instructor

4. **Ratings & Feedback**
   - 1-5 star rating system
   - Written reviews (up to 500 chars)
   - Average rating calculation
   - Rating validation

5. **Progress Tracking**
   - Lesson completion tracking
   - Progress percentage per course
   - Completion status

6. **Real-time Chat**
   - Socket.io integration
   - Course-specific chat rooms
   - Real-time messaging
   - User-friendly chat UI

7. **File Management**
   - Single/multiple file uploads
   - Supported formats: PDF, Images, Videos, Documents
   - 10MB file size limit
   - Automatic file serving via /uploads route

8. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Course data validation
   - Rating range validation
   - File type/size restrictions

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/search/query` - Search & filter courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Request enrollment
- `PUT /api/courses/:id/approve/:studentId` - Approve enrollment
- `POST /api/courses/:id/lectures` - Add lecture
- `POST /api/courses/:id/assignments` - Add assignment
- `POST /api/courses/:id/rate` - Submit rating
- `PUT /api/courses/:id/progress` - Update progress
- `PUT /api/courses/:id/grade/:studentId` - Grade student

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user details

### File Uploads
- `POST /api/uploads/single` - Upload single file
- `POST /api/uploads/multiple` - Upload multiple files
- `GET /uploads/:filename` - Serve uploaded file

---

## Environment Variables Guide

```env
# Node Environment
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars-long!!!
JWT_EXPIRY=24h
BCRYPT_ROUNDS=10

# Server
PORT=5001
CORS_ORIGIN=http://localhost:3000

# File Uploads
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760        # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf,...

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password   # Google App Password, not regular password
```

### Gmail Setup for Email Features
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in EMAIL_PASSWORD

---

## Testing

### Run API Tests
```bash
cd server
npm test
```

Test coverage includes:
- User registration and login
- Course CRUD operations
- Enrollment workflow
- Rating submission
- File uploads
- Authorization checks

---

## Role-Based Features

### Learner Dashboard
- View enrolled courses
- Track progress
- Request course access
- Provide ratings & reviews
- Participate in course chat

### Faculty Dashboard
- Create and manage courses
- Add lectures, assignments, tests, projects
- Review enrollment requests
- Grade student assignments
- Monitor course ratings

### Admin Dashboard
- View all users (learners & faculty)
- View all courses
- Approve/manage enrollments
- Create courses
- Access system analytics

---

## Deployment Checklist

### Before Going Live

1. **Security**
   - [ ] Change JWT_SECRET to a strong random value
   - [ ] Never commit .env with real credentials
   - [ ] Enable HTTPS in production
   - [ ] Set NODE_ENV=production
   - [ ] Implement rate limiting
   - [ ] Add CORS whitelist for production domain

2. **Database**
   - [ ] Use MongoDB Atlas with IP whitelist
   - [ ] Set strong database passwords
   - [ ] Enable backups
   - [ ] Test MongoDB URI before deployment

3. **Email**
   - [ ] Use production email account
   - [ ] Test email sending functionality
   - [ ] Set up email templates
   - [ ] Configure email service

4. **File Storage**
   - [ ] Consider cloud storage (AWS S3, Azure Blob) for production
   - [ ] Implement file size limits
   - [ ] Add virus scanning for uploads
   - [ ] Set up automated backups

5. **Performance**
   - [ ] Enable caching headers
   - [ ] Compress assets (gzip)
   - [ ] Optimize database queries
   - [ ] Use CDN for static assets

### Deployment Platforms

**Frontend (Vercel/Netlify Premium):**
```bash
cd client
npm run build
# Deploy build/ folder
```

**Backend (Heroku/Railway/Render):**
```bash
# Make sure Procfile exists for Node.js
# Deploy from server/ directory
```

---

## Troubleshooting

### MongoDB Connection Issues
- Verify connection string in .env
- Check IP whitelist in MongoDB Atlas
- Ensure MongoDB is running (if local)
- Test connection with MongoDB Compass

### Port Already in Use
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Email Not Sending
- Verify EMAIL_USER and EMAIL_PASSWORD
- Check Gmail App Password generation
- Verify SMTP credentials
- Check firewall/antivirus blocking SMTP

### File Upload Issues
- Verify uploads/ directory exists
- Check file permissions
- Verify MAX_FILE_SIZE setting
- Check ALLOWED_FILE_TYPES setting

### CORS Errors
- Verify frontend URL in CORS_ORIGIN
- Check browser console for specific errors
- Ensure credentials: true for API calls if needed

---

## Future Enhancements

- [ ] Payment integration (Stripe/PayPal)
- [ ] Advanced analytics & reporting
- [ ] Video streaming optimization (HLS/DASH)
- [ ] Mobile app (React Native)
- [ ] AI-powered course recommendations
- [ ] Certification system
- [ ] Live video streaming for classes
- [ ] Code editor integration
- [ ] Progress gamification (badges, leaderboards)
- [ ] Advanced search with Elasticsearch
- [ ] Multilingual support

---

## Support & Resources

- **Git Commits**: Make meaningful commits with clear messages
- **API Docs**: See API_DOCUMENTATION.md for full endpoint reference
- **Tests**: Run tests before deployment
- **Logs**: Check console/server logs for debugging

---

## License
MIT License - Feel free to use this project for educational purposes.

---

## Important Notes

⚠️ **SECURITY WARNING**: The .env file contains sensitive credentials. 
- Never commit real credentials to Git
- Use .env.example for template only
- Rotate passwords regularly
- Use environment variables in production

✅ **Best Practices**:
- Keep dependencies updated
- Test thoroughly before deployment
- Monitor error logs in production
- Regular backups
- Document any customizations

---

Last Updated: March 22, 2026