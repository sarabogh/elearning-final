const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Enrollment notification
const sendEnrollmentNotification = async (tutorEmail, studentName, courseName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: tutorEmail,
    subject: `New Enrollment Request: ${courseName}`,
    html: `
      <h2>New Enrollment Request</h2>
      <p>Student <strong>${studentName}</strong> has requested access to your course <strong>${courseName}</strong>.</p>
      <p>Please log in to your dashboard to approve or reject this request.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Enrollment notification sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Course announcement
const sendCourseAnnouncement = async (studentEmails, courseTitle, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmails.join(','),
    subject: `Announcement: ${courseTitle}`,
    html: `
      <h2>Course Announcement</h2>
      <p><strong>Course:</strong> ${courseTitle}</p>
      <p>${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Announcement sent to students');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Password reset email
const sendPasswordReset = async (email, resetToken, resetUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Welcome email
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to eLearning Platform',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been successfully created.</p>
      <p>Start exploring courses and begin your learning journey with us.</p>
      <p>Happy learning!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendEnrollmentNotification,
  sendCourseAnnouncement,
  sendPasswordReset,
  sendWelcomeEmail
};