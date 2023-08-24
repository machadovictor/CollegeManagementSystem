const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  programCode: {
    type: String,
    required: true
  },
  programDescription: {
    english: {
      type: String,
      required: true
    },
    french: {
      type: String,
      required: true
    }
  }
});

const Program = mongoose.model('Program', ProgramSchema);

module.exports = Program;