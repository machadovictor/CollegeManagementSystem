const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    programCode: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    studentID: {
        type: String,
        required: true,
        unique: true
    }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
