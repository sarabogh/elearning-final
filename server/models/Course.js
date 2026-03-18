const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnail: String,
  lectures: [{
    title: String,
    description: String,
    videoUrl: String,
    duration: Number, // in minutes
    order: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignments: [{
    title: String,
    description: String,
    dueDate: Date,
    attachmentUrl: String,
    order: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tests: [{
    title: String,
    description: String,
    questions: [{
      question: String,
      options: [String],
      correctAnswer: String,
      points: Number
    }],
    totalPoints: Number,
    dueDate: Date,
    order: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  projects: [{
    title: String,
    description: String,
    requirements: String,
    dueDate: Date,
    attachmentUrl: String,
    order: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  grades: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    grade: String,
    feedback: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);