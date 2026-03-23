# Quick Reference Guide

## 🚀 Start Application

**Open 2 terminals:**

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

Then visit: http://localhost:3000

---

## 🔧 Environment Setup

Create `server/.env`:
```env
NODE_ENV=development
MONGODB_URI=your_connection_string
JWT_SECRET=your_secret_key_here
PORT=5001
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/server.js` | Backend entry point |
| `client/src/App.js` | Frontend router |
| `server/routes/courses.js` | Course endpoints |
| `client/src/pages/CourseSearch.js` | Search functionality |
| `server/middleware/validation.js` | Input validation |
| `server/services/emailService.js` | Email notifications |

---

## 🔗 Important Endpoints

```
GET    /api/courses                  - List all courses
GET    /api/courses/search/query     - Search courses
POST   /api/courses                  - Create course (admin/faculty)
POST   /api/courses/:id/enroll       - Enroll in course
POST   /api/courses/:id/rate         - Submit rating
POST   /api/uploads/single           - Upload file
```

---

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| Learner | View courses, Enroll, Rate, Chat |
| Faculty | Create/Edit courses, Grade, Approve enrollments |
| Admin | All permissions, User management |

---

## 📊 Database Models

**User**: name, email, password, role, profile, enrolledCourses
**Course**: title, instructor, lectures, ratings, enrolledStudents
**Chat**: roomId, messages, participants

---

## 🧪 Testing

```bash
cd server
npm test
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5001 in use | Change PORT in .env |
| MongoDB connection error | Check MONGODB_URI |
| CORS error | Verify CORS_ORIGIN |
| Email not sending | Check EMAIL credentials |
| File upload fails | Create uploads/ folder |

---

## 📚 Full Documentation

- Complete API Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Setup & Deployment: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Project Overview: [README.md](./README.md)
- Completion Status: [COMPLETION_CHECKLIST.md](./COMPLETION_CHECKLIST.md)

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install` (server & client)
2. ✅ Configure .env file with your credentials
3. ✅ Create uploads folder: `mkdir server/uploads`
4. ✅ Start servers in 2 terminals
5. ✅ Test login/register at http://localhost:3000
6. ✅ Explore dashboards by role

---

## 💡 Pro Tips

- Use `npm run dev` for auto-reload in development
- Check browser console for frontend errors
- Check terminal for backend errors
- Use MongoDB Compass to view database
- Test API endpoints with Postman/Insomnia
- Use `npm test` to run test suite

---

## 🔐 Security Reminders

⚠️ **IMPORTANT:**
- Never commit .env with real credentials
- Change JWT_SECRET for production
- Use strong passwords
- Validate all inputs
- Keep dependencies updated

---

**For More Help:**
- Check SETUP_GUIDE.md for detailed setup
- See API_DOCUMENTATION.md for endpoint details
- Review COMPLETION_CHECKLIST.md for project status