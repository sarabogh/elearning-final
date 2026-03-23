# eLearning Management System

A comprehensive, production-ready e-learning platform built with the MERN stack (MongoDB, Express.js, React, Node.js). This system enables seamless learning experiences with course management, real-time collaboration, and secure authentication.

## 🌟 Key Features

### 👥 User Management
- **Three Role Types**: Learners, Faculties (Instructors), Administrators
- **Profile Management**: User profiles with bio, skills, and experience tracking
- **Secure Authentication**: JWT-based token system with bcryptjs password hashing
- **Email Notifications**: Enrollment confirmations, course announcements, password resets

### 📚 Course Management
- **Admin/Faculty Controls**: Create, update, and manage courses
- **Course Content**: Support for lectures, assignments, tests, and projects
- **Enrollment System**: Students request access, instructors approve
- **Course Search & Filtering**: Search by title, filter by category, level, or instructor
- **Published/Draft Modes**: Control course visibility

### ⭐ Ratings & Feedback
- **5-Star Rating System**: Students rate courses
- **Written Reviews**: Leave detailed feedback (up to 500 characters)
- **Average Ratings**: Automatically calculated course ratings
- **Review Display**: See what others think about courses

### 📊 Progress Tracking
- **Lesson Completion**: Track which lessons students completed
- **Progress Percentage**: Visual progress bar per course
- **Completion Status**: Know when courses are finished
- **Performance Data**: Admins can view student progress

### 💬 Real-Time Chat
- **Course Channels**: Dedicated chat rooms per course
- **Live Messaging**: Socket.io powered real-time communication
- **User-Friendly UI**: Clean chat interface with timestamps
- **Group Discussions**: Community learning environment

### 📁 File Management
- **Multi-Format Support**: Images, PDFs, Videos, Documents
- **Secure Uploads**: File type and size validation
- **Easy Sharing**: Share course materials with students
- **Direct Access**: Uploaded files accessible via /uploads route

### 🔒 Security Features
- **Input Validation**: Email format, password strength, file types
- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Endpoints protected by user role
- **CORS Configuration**: Cross-origin request protection
- **File Size Limits**: 10MB max per file

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
cd "c:\Users\Sara\Desktop\elearn final"
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Set up environment variables**
```bash
# In server/.env, configure:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

4. **Create uploads directory**
```bash
mkdir server/uploads
```

5. **Start the application**

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

Access the app at `http://localhost:3000`

---

## 📁 Project Structure

```
elearn-final/
├── server/                          # Backend API
│   ├── config/
│   │   └── multer.js               # File upload config
│   ├── controllers/                 # Business logic
│   │   ├── authController.js
│   │   └── courseController.js
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication
│   │   └── validation.js           # Input validation
│   ├── models/                      # Database schemas
│   │   ├── User.js
│   │   ├── Course.js
│   │   └── Chat.js
│   ├── routes/                      # API endpoints
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── users.js
│   │   └── uploads.js
│   ├── services/
│   │   └── emailService.js         # Email notifications
│   ├── __tests__/
│   │   └── routes.test.js          # API tests
│   └── server.js
│
├── client/                          # Frontend App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── CourseChat.js
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state management
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
│   │   └── services/
│   │       └── api.js              # Axios API client
│   └── public/
│
├── API_DOCUMENTATION.md             # Complete API reference
├── SETUP_GUIDE.md                   # Detailed setup & deployment
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/search/query` - Search & filter courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course (admin/faculty)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course (admin)
- `POST /api/courses/:id/enroll` - Enroll in course
- `PUT /api/courses/:id/approve/:studentId` - Approve enrollment
- `POST /api/courses/:id/lectures` - Add lecture
- `POST /api/courses/:id/assignments` - Add assignment
- `POST /api/courses/:id/tests` - Add test
- `POST /api/courses/:id/projects` - Add project
- `POST /api/courses/:id/rate` - Submit rating
- `PUT /api/courses/:id/progress` - Update progress

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user details

### File Uploads
- `POST /api/uploads/single` - Upload single file
- `POST /api/uploads/multiple` - Upload multiple files

**Full API Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **Material-UI 7.3.9** - UI components
- **React Router 7.13.1** - Navigation
- **Axios 1.13.6** - HTTP client
- **Socket.io Client 4.8.3** - Real-time communication

### Backend
- **Node.js & Express.js 5.2.1** - Server framework
- **MongoDB & Mongoose 9.3.1** - Database
- **JWT & bcryptjs** - Authentication
- **Multer 2.1.1** - File uploads
- **Socket.io 4.8.3** - Real-time chat
- **Nodemailer 6.9.7** - Email notifications

### Development
- **Nodemon** - Auto-reload
- **Jest** - Unit testing
- **Supertest** - API testing

---

## 🔐 Security Considerations

### Implemented
- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ File type/size restrictions
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Environment variable isolation

### Production Recommendations
- [ ] Use HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add API key authentication for external services
- [ ] Use secure session storage
- [ ] Regular security audits
- [ ] Implement CSP headers
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS protection (React escapes by default)

---

## 📊 User Roles

### Learner
- Browse and search courses
- Request course enrollment
- View course materials
- Track progress
- Submit assignments
- Rate and review courses
- Participate in course chat

### Faculty (Instructor)
- Create and manage courses
- Add lessons, assignments, tests, projects
- Review enrollment requests
- Grade student assignments
- View student progress
- Monitor course ratings

### Administrator
- Manage all users (create, view, edit)
- Manage all courses
- Approve enrollments
- View system analytics
- System configuration

---

## 🧪 Testing

### Run Tests
```bash
cd server
npm test
```

Test coverage includes:
- User authentication
- Course CRUD operations
- Enrollment workflow
- Rating system
- File uploads
- Authorization checks
- Input validation

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup and deployment guide
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Full API reference
- **README.md** - This file

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📝 Environment Variables

### Server (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
PORT=5001
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=...
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

See `.env.example` for template.

---

## 🚀 Deployment

### Preparing for Production
1. Update environment variables
2. Set NODE_ENV=production
3. Add SSL certificates
4. Configure CDN for static files
5. Set up monitoring and logging
6. Test thoroughly

### Hosting Options
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, Render, AWS
- **Database**: MongoDB Atlas
- **Storage**: AWS S3, Azure Blob Storage

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment steps.

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check connection string in .env
- Ensure IP is whitelisted in MongoDB Atlas
- Verify network connectivity

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5001
kill -9 <PID>
```

### CORS Errors
- Verify CORS_ORIGIN environment variable
- Check frontend URL matches CORS config
- Restart server after env changes

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting.

---

## 📊 Database Schema

### User
- name, email, password (hashed)
- role (learner/faculty/admin)
- profile (bio, avatar, skills, experience)
- enrolledCourses, createdCourses
- timestamps

### Course
- title, description, category, level
- instructor (faculty reference)
- lectures, assignments, tests, projects
- enrolledStudents with status (pending/approved/rejected)
- ratings and averageRating
- grades
- isPublished flag

### Chat
- roomId, courseId reference
- messages with sender, text, timestamp
- participants
- timestamps

---

## 🌍 Future Features

- [ ] Payment integration (Stripe/PayPal)
- [ ] Live video conferencing
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered recommendations
- [ ] Certification system
- [ ] Code execution environment
- [ ] Multilingual support
- [ ] Accessibility improvements
- [ ] Advanced search with Elasticsearch

---

## 📄 License

MIT License - This project is open source and available under the MIT License.

---

## 👨‍💻 Author

Created as a comprehensive e-learning platform for educational institutions.

---

## ⚠️ Important Security Notes

1. **Never commit `.env`** with real credentials to Git
2. **Change JWT_SECRET** before production deployment
3. **Use HTTPS** in production
4. **Validate all inputs** on both client and server
5. **Keep dependencies updated** regularly
6. **Implement rate limiting** before going live
7. **Use strong passwords** for admin accounts
8. **Enable 2FA** for email services

---

## 📞 Support

For issues, questions, or suggestions, please refer to the documentation files or open an issue in the repository.

---

**Last Updated**: March 22, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
2. Add rating functionality
3. Create feedback viewing and management

### Step 11: Group Chat Feature
1. Set up Socket.io for real-time communication
2. Implement chat rooms and messaging
3. Add chat management and moderation

### Step 12: Testing and Deployment
1. Write unit and integration tests
2. Set up deployment configuration
3. Deploy to production environment

## Installation and Setup

### Clone the Repository
```bash
git clone <repository-url>
cd elearn-final
```

### Backend Setup
```bash
cd server
npm install
# Set up environment variables (create .env file)
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

### Database Setup
- Ensure MongoDB is running locally or configure MongoDB Atlas connection
- Update connection string in server configuration

## Environment Variables

Create a `.env` file in the server directory with:
```
MONGODB_URI=mongodb://localhost:27017/elearning
JWT_SECRET=your_jwt_secret
PORT=5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin/faculty)
- `GET /api/courses/:id` - Get course details

### Enrollment
- `POST /api/enrollments/request` - Request course access
- `GET /api/enrollments` - Get user enrollments

### Materials
- `POST /api/materials/upload` - Upload learning material
- `GET /api/materials/:courseId` - Get course materials

### Feedback
- `POST /api/feedback` - Submit feedback/rating
- `GET /api/feedback/:courseId` - Get course feedback

## Project Structure

```
elearn-final/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── server/                 # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
├── .gitignore
├── README.md
└── package.json           # Root package.json for scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MERN Stack documentation
- MongoDB documentation
- React documentation
- Express.js documentation