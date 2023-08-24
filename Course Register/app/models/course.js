const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  programCode: {
    type: String,
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  courseDescription: {
    english: {
      type: String,
      required: true
    },
    french: {
      type: String,
      required: true
    }
  },
  courseDuration: {
    type: Number,
    required:true
  }
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;
