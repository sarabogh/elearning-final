# eLearning Management System

## Project Description

This project is a comprehensive eLearning management system built using the MERN stack (MongoDB, Express.js, React, Node.js). It provides a secure and user-friendly platform for students (learners), instructors (faculties), and administrators to interact in an educational environment.

## Key Features

### User Roles and Authentication
- **Learners (Students)**: Can register, login, view courses, request course access, track progress, provide feedback and ratings, and participate in group chats.
- **Faculties (Instructors)**: Can register, login, view and update courses, manage learning materials, and participate in group chats.
- **Administrators**: Can add and update courses, view details of faculties and learners, and manage the system.

### Core Functionality
- **User Authentication & Authorization**: Secure registration and login system with role-based access control.
- **Profile Management**: Users can manage their profiles and customize settings.
- **Course Management**: 
  - Admins can create and update courses.
  - Faculties can update course content.
  - All users can view course details.
- **Content Management**: Support for diverse content types including documents, videos, and presentations.
- **Enrollment System**: Learners can request access to courses.
- **Progress Tracking**: Track student progress through courses.
- **Feedback & Ratings**: Learners can provide feedback and ratings for courses.
- **Group Chat**: Collaborative discussion features for users.

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer (for handling multimedia content)
- **Real-time Communication**: Socket.io (for group chat)
- **Version Control**: Git with GitHub/GitLab

## Prerequisites

Before starting, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)
- Git

## Project Setup and Development Process

### Step 1: Project Initialization
1. Create a new directory for the project
2. Initialize Git repository
3. Set up project structure with separate folders for client and server

### Step 2: Backend Setup (Node.js + Express.js)
1. Initialize Node.js project in the server folder
2. Install necessary dependencies (Express, Mongoose, JWT, bcrypt, etc.)
3. Set up MongoDB connection
4. Create basic server structure with routes and middleware

### Step 3: Frontend Setup (React)
1. Create React application in the client folder
2. Install required packages (React Router, Axios, etc.)
3. Set up basic component structure

### Step 4: Database Design
1. Design MongoDB schemas for:
   - Users (learners, faculties, admins)
   - Courses
   - Enrollments
   - Materials
   - Feedback/Ratings
   - Chat messages

### Step 5: Authentication System
1. Implement user registration and login
2. Set up JWT token generation and validation
3. Create middleware for authentication and authorization
4. Implement role-based access control

### Step 6: User Management
1. Create profile management features
2. Implement user settings customization
3. Add admin functionality to view user details

### Step 7: Course Management
1. Implement course creation (admin)
2. Add course update functionality (admin and faculty)
3. Create course viewing for all users
4. Implement course access requests

### Step 8: Content Management System
1. Set up file upload system for documents, videos, presentations
2. Implement content organization and storage
3. Create content viewing and management interfaces

### Step 9: Enrollment and Progress Tracking
1. Implement course enrollment requests
2. Create progress tracking mechanisms
3. Add enrollment management for admins/faculties

### Step 10: Feedback and Ratings
1. Implement feedback submission system
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