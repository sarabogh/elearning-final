/* eslint-disable no-console */
const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const CalendarEvent = require('../models/CalendarEvent');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

const TEST_EMAIL_REGEXES = [
  /^(faculty|learner)\.e2e\./i,
  /^routes\./i,
  /^authz\./i
];

const TEST_NAME_REGEXES = [
  /^e2e\b/i,
  /^routes\b/i,
  /^authz\b/i,
  /^test\b/i
];

const TEST_COURSE_TITLE_REGEX = /(e2e assessment course|reuse e2e course|routes current functionality|authz course)/i;

const isLikelyTestEmail = (email = '') => TEST_EMAIL_REGEXES.some((rx) => rx.test(email));
const isLikelyTestName = (name = '') => TEST_NAME_REGEXES.some((rx) => rx.test(name));

async function cleanupTestData() {
  await mongoose.connect(DB_URI);

  const allUsers = await User.find({}, '_id name email').lean();
  const testUsers = allUsers.filter((user) => isLikelyTestEmail(user.email) || isLikelyTestName(user.name));
  const testUserIds = testUsers.map((user) => user._id);

  const titledTestCourses = await Course.find({ title: TEST_COURSE_TITLE_REGEX }, '_id').lean();
  const instructorTestCourses = testUserIds.length
    ? await Course.find({ instructor: { $in: testUserIds } }, '_id').lean()
    : [];

  const testCourseIdSet = new Set([
    ...titledTestCourses.map((course) => String(course._id)),
    ...instructorTestCourses.map((course) => String(course._id))
  ]);
  const testCourseIds = Array.from(testCourseIdSet).map((id) => new mongoose.Types.ObjectId(id));

  let notificationsDeleted = 0;
  if (testUserIds.length || testCourseIds.length) {
    const notificationFilter = {
      $or: [
        ...(testUserIds.length ? [{ user: { $in: testUserIds } }, { sender: { $in: testUserIds } }] : []),
        ...(testCourseIds.length ? [{ courseId: { $in: testCourseIds } }] : [])
      ]
    };
    const notifRes = await Notification.deleteMany(notificationFilter);
    notificationsDeleted = notifRes.deletedCount || 0;
  }

  let chatsDeleted = 0;
  if (testUserIds.length || testCourseIds.length) {
    const chatFilter = {
      $or: [
        ...(testCourseIds.length ? [{ courseId: { $in: testCourseIds } }] : []),
        ...(testUserIds.length
          ? [
              { 'participants.user': { $in: testUserIds } },
              { 'messages.sender': { $in: testUserIds } },
              { 'lastMessage.sender': { $in: testUserIds } }
            ]
          : [])
      ]
    };
    const chatRes = await Chat.deleteMany(chatFilter);
    chatsDeleted = chatRes.deletedCount || 0;
  }

  let calendarEventsDeleted = 0;
  if (testUserIds.length) {
    const calendarRes = await CalendarEvent.deleteMany({ user: { $in: testUserIds } });
    calendarEventsDeleted = calendarRes.deletedCount || 0;
  }

  let coursesDeleted = 0;
  if (testCourseIds.length) {
    const courseDeleteRes = await Course.deleteMany({ _id: { $in: testCourseIds } });
    coursesDeleted = courseDeleteRes.deletedCount || 0;

    await User.updateMany(
      {},
      {
        $pull: {
          enrolledCourses: { course: { $in: testCourseIds } },
          createdCourses: { $in: testCourseIds }
        }
      }
    );
  }

  if (testUserIds.length) {
    await Course.updateMany(
      {},
      {
        $pull: {
          enrolledStudents: { student: { $in: testUserIds } },
          grades: { student: { $in: testUserIds } },
          ratings: { student: { $in: testUserIds } },
          'assignments.$[].submissions': { student: { $in: testUserIds } },
          'tests.$[].submissions': { student: { $in: testUserIds } },
          'projects.$[].submissions': { student: { $in: testUserIds } }
        }
      }
    );
  }

  let usersDeleted = 0;
  if (testUserIds.length) {
    const userDeleteRes = await User.deleteMany({ _id: { $in: testUserIds } });
    usersDeleted = userDeleteRes.deletedCount || 0;
  }

  console.log('Cleanup complete.');
  console.log(`Test users found: ${testUsers.length}`);
  console.log(`Users deleted: ${usersDeleted}`);
  console.log(`Courses deleted: ${coursesDeleted}`);
  console.log(`Notifications deleted: ${notificationsDeleted}`);
  console.log(`Chats deleted: ${chatsDeleted}`);
  console.log(`Calendar events deleted: ${calendarEventsDeleted}`);
}

cleanupTestData()
  .catch((error) => {
    console.error('Cleanup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });
