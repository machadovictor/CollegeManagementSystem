const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Program = require('./app/models/program'); //Program model: program.js
const Course = require('./app/models/course'); //Course model: course.js
const Student = require('./app/models/student'); //Student model: student.js
const Grades = require('./app/models/grades');

const app = express();
const port = process.env.PORT || 3000; // port on local host

app.use(express.static('public')); //Code to use css and images

//Connecting to MongoDB
mongoose.connect('mongodb://127.0.0.1/CDICourses', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'app','views')) //Using views
app.set('view engine', 'ejs'); //Using views

app.get('/', (req, res) => {
  res.render('index'); //When index is called, shows index.ejs
});

//Register Program Page
app.get('/register-program', (req, res) => {
  res.render('register-program', { registrationSuccess: false }); //When register-program is called, shows the page with no registration success message
});

// /register is the action name in register-program.ejs form
app.post('/register', async (req, res) => {
  const { programCode, englishDescription, frenchDescription } = req.body; //Declaring variables

  //try create a new program object: if all is right show the success message or show an error if anything is not 
  //right and go back to the page
  try {
    await Program.create({
      programCode,
      programDescription: {
        english: englishDescription,
        french: frenchDescription
      }
    });
    res.render('register-program',{ registrationSuccess:true });
  } catch (error) {
    console.error('Error creating course:', error);
    res.render('register-program', { registrationSuccess: false });
  }
});

app.get('/register-course', async (req, res) => {
  try {
    const programs = await Program.find({}, 'programCode'); // Search program codes
    const registrationSuccess = req.query.success === 'true'; // Verify if the query string indicates success
    res.render('register-course', { programs, registrationSuccess });
  } catch (error) {
    console.error('Error fetching program codes:', error);
    res.redirect('/');
  }
});

app.post('/register-course', async (req, res) => {
  const { programCode, courseCode, englishDescription, frenchDescription, courseDuration } = req.body;

  try {
      await Course.create({
          programCode,
          courseCode,
          courseDescription: {
              english: englishDescription,
              french: frenchDescription
          },
          courseDuration: parseInt(courseDuration)
      });
      const programs = await Program.find({}, 'programCode');
      res.render('register-course', { registrationSuccess: true, programs });
  } catch (error) {
      console.error('Error creating course:', error);
      const programs = await Program.find({}, 'programCode');
      res.render('register-course', { registrationSuccess: false, programs });
  }
});

//Student Register page
app.get('/register-student', async (req, res) => {
  try {
    const programs = await Program.find({}, 'programCode');
    const registrationSuccess = req.query.success === 'true';
    res.render('register-student', { programs, registrationSuccess });
  } catch (error) {
    console.error('Error fetching program codes:', error);
    res.redirect('/');
  }
});


app.post('/register-student', async (req, res) => {
  try {
      const { programCode, firstName, lastName, birthDate } = req.body;

      // Gerar o Student ID sequencial (exemplo: S0001, S0002, ...)
      const lastStudent = await Student.findOne({}, {}, { sort: { studentID: -1 } });
      const lastID = lastStudent ? parseInt(lastStudent.studentID.substr(1)) : 0;
      const studentID = `S${String(lastID + 1).padStart(4, '0')}`;
      const programs = await Program.find({}, 'programCode')
      // Criar e salvar o estudante no banco de dados
      const student = new Student({
          programCode,
          firstName,
          lastName,
          birthDate,
          studentID
      });
      await student.save();

      res.render('register-student', { programs, registrationSuccess: true });
  } catch (error) {
      console.error(error);
      const programs = await Program.find({}, 'programCode');
      res.render('register-student', { programs, registrationError: true });
  }
});


//Assign Grades page.
app.get('/assign-grades', async (req, res) => {
  try {
    // Retrieve students and courses from the database
    const students = await Student.find({}, 'studentID');
    const courses = await Course.find({}, 'courseCode courseDescription');
    
    res.render('assign-grades', { students, courses, success: req.query.success });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.redirect('/');
  }
});

app.get('/get-student-info', async (req, res) => {
  try {
    const studentID = req.query.studentID;
    const student = await Student.findOne({ studentID }).populate('programCode');

    if (student && student.programCode) {
      const program = await Program.findOne({ programCode: student.programCode });
      
      if (program) {
        res.json({
          firstName: student.firstName,
          lastName: student.lastName,
          programDescription: program.programDescription.english,
          programCode:student.programCode
        });
      } else {
        res.json(null);
      }
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching student information:', error);
    res.json(null);
  }
});


app.post('/save-grades', async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const midtermGrade = parseInt(req.body.midtermGrade);
    const finaltermGrade = parseInt(req.body.finaltermGrade);
    const projectGrade = parseInt(req.body.projectGrade);
    const participationGrade = parseInt(req.body.participationGrade);
    
    // Calculate GPA
    const totalGrades = midtermGrade + finaltermGrade + projectGrade + participationGrade;
    const maxTotalGrades = 100 * 4; // Assuming each grade has a maximum of 100
    const gpa = (totalGrades / maxTotalGrades) * 100;

    // Determine status based on GPA
    let status = 'Failed';
    if (gpa >= 60) {
      status = 'Approved';
    }
    
    // Save grades, GPA, and status to the database
    const student = await Student.findOne({ studentID });
    if (student) {
      const grades = {
        studentID,
        midtermGrade,
        finaltermGrade,
        projectGrade,
        participationGrade,
        gpa,
        status
      };
      await Grades.create(grades);
    }
    
    res.redirect('/assign-grades?success=true'); // Redirect to the assign-grades page
  } catch (error) {
    console.error('Error saving grades:', error);
    res.redirect('/assign-grades?success=false');
  }
});

app.get('/get-courses-by-program', async (req, res) => {
  try {
    const programCode = req.query.programCode;

    // Find courses with a specific programCode and send the response
    const courses = await Course.find({ programCode }, 'courseCode courseDescription');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by program:', error);
    res.json([]);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
