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
    instructions: String,
    submissionType: {
      type: String,
      enum: ['text', 'url', 'file'],
      default: 'text'
    },
    maxPoints: {
      type: Number,
      default: 100
    },
    dueDate: Date,
    attachmentUrl: String,
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      textAnswer: String,
      submissionUrl: String,
      status: {
        type: String,
        enum: ['submitted', 'graded'],
        default: 'submitted'
      },
      score: {
        type: Number,
        default: null
      },
      feedback: String,
      submittedAt: {
        type: Date,
        default: Date.now
      },
      gradedAt: Date
    }],
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
    autoGrade: {
      type: Boolean,
      default: true
    },
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      answers: [String],
      score: {
        type: Number,
        default: null
      },
      maxScore: {
        type: Number,
        default: 0
      },
      feedback: String,
      autoGraded: {
        type: Boolean,
        default: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      gradedAt: Date
    }],
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
    submissionType: {
      type: String,
      enum: ['text', 'url', 'file'],
      default: 'text'
    },
    maxPoints: {
      type: Number,
      default: 100
    },
    dueDate: Date,
    attachmentUrl: String,
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      textAnswer: String,
      submissionUrl: String,
      status: {
        type: String,
        enum: ['submitted', 'graded'],
        default: 'submitted'
      },
      score: {
        type: Number,
        default: null
      },
      feedback: String,
      submittedAt: {
        type: Date,
        default: Date.now
      },
      gradedAt: Date
    }],
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
    numericGrade: {
      type: Number,
      default: null
    },
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
  catalogStatus: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
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