const mongoose = require('mongoose');

const gradesSchema = new mongoose.Schema({
  studentID: String,
  midtermGrade: Number,
  finaltermGrade: Number,
  projectGrade: Number,
  participationGrade: Number,
  gpa: Number,
  status: String
});

const Grades = mongoose.model('Grades', gradesSchema);

module.exports = Grades;

