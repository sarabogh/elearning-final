# eLearning API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "role": "learner" // "learner", "faculty", or "admin"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner"
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner"
  }
}
```

---

### Get Profile
**GET** `/auth/profile`

Get current user's profile (requires authentication).

**Response (200):**
```json
{
  "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "learner",
  "profile": {
    "avatar": "url",
    "bio": "User bio",
    "title": "Student",
    "skills": ["JavaScript", "React"]
  },
  "enrolledCourses": [...],
  "createdCourses": [...]
}
```

---

### Update Profile
**PUT** `/auth/profile`

Update user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Jane Doe",
  "profile": {
    "bio": "Updated bio",
    "skills": ["Python", "Django"]
  }
}
```

**Response (200):** Updated user object

---

## Course Endpoints

### Get All Courses
**GET** `/courses`

Retrieve all published courses with pagination support.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
[
  {
    "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
    "title": "React Fundamentals",
    "description": "Learn React from scratch",
    "category": "Web Development",
    "level": "beginner",
    "instructor": {
      "_id": "63f7d8c4a1b2c3d4e5f6g7h9",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "enrolledStudents": [...],
    "averageRating": 4.5,
    "isPublished": true
  }
]
```

---

### Search & Filter Courses
**GET** `/courses/search/query`

Search and filter courses.

**Query Parameters:**
- `search` (optional): Search term for title/description
- `category` (optional): Filter by category
- `level` (optional): Filter by level (beginner, intermediate, advanced)
- `instructor` (optional): Filter by instructor ID

**Example:**
```
GET /courses/search/query?search=react&level=beginner&category=Web%20Development
```

**Response (200):** Array of matching courses

---

### Get Course by ID
**GET** `/courses/:id`

Get detailed information about a specific course.

**Response (200):**
```json
{
  "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
  "title": "React Fundamentals",
  "description": "Learn React from scratch",
  "instructor": {...},
  "lectures": [...],
  "assignments": [...],
  "tests": [...],
  "projects": [...],
  "enrolledStudents": [...],
  "ratings": [...],
  "averageRating": 4.5
}
```

---

### Create Course
**POST** `/courses`

Create a new course (admin/faculty only).

**Request Body:**
```json
{
  "title": "Advanced React",
  "description": "Advanced React patterns and best practices",
  "category": "Web Development",
  "level": "advanced",
  "duration": 20,
  "price": 49.99,
  "thumbnail": "image_url",
  "isPublished": true
}
```

**Response (201):** Created course object

---

### Update Course
**PUT** `/courses/:id`

Update course details (instructor/admin only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "price": 59.99
}
```

**Response (200):** Updated course object

---

### Delete Course
**DELETE** `/courses/:id`

Delete a course (admin only).

**Response (200):**
```json
{
  "message": "Course deleted"
}
```

---

### Enroll in Course
**POST** `/courses/:id/enroll`

Request enrollment in a course (learner only).

**Response (200):**
```json
{
  "message": "Enrollment request submitted"
}
```

---

### Approve Enrollment
**PUT** `/courses/:id/approve/:studentId`

Approve student enrollment (instructor/admin only).

**Response (200):**
```json
{
  "message": "Enrollment approved"
}
```

---

### Add Lecture
**POST** `/courses/:id/lectures`

Add lecture to course (instructor/admin only).

**Request Body:**
```json
{
  "title": "Introduction to React",
  "description": "Basic concepts of React",
  "videoUrl": "https://youtube.com/...",
  "duration": 45,
  "order": 1
}
```

**Response (201):** Updated course object

---

### Add Assignment
**POST** `/courses/:id/assignments`

Add assignment to course (instructor/admin only).

**Request Body:**
```json
{
  "title": "Build a Todo App",
  "description": "Create a functional todo application",
  "dueDate": "2024-04-15",
  "attachmentUrl": "pdf_url",
  "order": 1
}
```

**Response (201):** Updated course object

---

### Submit Course Rating
**POST** `/courses/:id/rate`

Submit rating and review for a course (learner only).

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent course! Highly recommended."
}
```

**Response (200):**
```json
{
  "message": "Rating submitted",
  "averageRating": 4.8
}
```

---

### Update Progress
**PUT** `/courses/:id/progress`

Update learner's course progress (learner only).

**Request Body:**
```json
{
  "lessonId": "63f7d8c4a1b2c3d4e5f6g7h8",
  "completed": true
}
```

**Response (200):**
```json
{
  "message": "Progress updated",
  "progress": 50
}
```

---

## User Endpoints

### Get All Users
**GET** `/users`

Get all users (admin only).

**Response (200):**
```json
[
  {
    "_id": "63f7d8c4a1b2c3d4e5f6g7h8",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner",
    "profile": {...},
    "enrolledCourses": [...],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Get User by ID
**GET** `/users/:id`

Get specific user details (authenticated users only).

**Response (200):** User object

---

## File Upload Endpoints

### Upload Single File
**POST** `/uploads/single`

Upload a single file (authenticated users only).

**Form Data:**
- `file` (required): File to upload

**Supported Types:**
- Images: JPEG, PNG, GIF
- Videos: MP4
- Documents: PDF, DOCX, PPTX

**Max Size:** 10MB

**Response (200):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "filename": "file-1234567890.pdf",
    "originalname": "document.pdf",
    "mimetype": "application/pdf",
    "size": 1024,
    "url": "http://localhost:5001/uploads/file-1234567890.pdf"
  }
}
```

---

### Upload Multiple Files
**POST** `/uploads/multiple`

Upload multiple files (authenticated users only).

**Form Data:**
- `files` (required): Files to upload (max 10 files)

**Response (200):**
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "filename": "file-1234567890.pdf",
      "originalname": "document.pdf",
      "url": "http://localhost:5001/uploads/file-1234567890.pdf"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    "Field is required",
    "Invalid format"
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized - Token required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied - Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## Socket.IO Events (Real-time Chat)

### Connect
```javascript
const socket = io('http://localhost:5001');
```

### Join Course Room
```javascript
socket.emit('joinRoom', 'course-courseId');
```

### Send Message
```javascript
socket.emit('chatMessage', {
  roomId: 'course-courseId',
  senderName: 'John',
  text: 'Hello everyone!',
  createdAt: new Date().toISOString()
});
```

### Receive Message
```javascript
socket.on('message', (data) => {
  console.log(`${data.senderName}: ${data.text}`);
});
```

---

## Rate Limiting
- API endpoints are rate-limited to 100 requests per 15 minutes per IP
- File uploads are limited to 10MB per file

---

## Authentication Notes
- JWT tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- All timestamps are in UTC/ISO 8601 format