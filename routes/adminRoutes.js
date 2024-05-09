const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Admin = require('../models/admin');
const Course = require('../models/courses');
const Instructor = require('../models/instructors');
const Lecture = require('../models/lectures');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyJwt = require('../middleware/authMiddleware')
const { ObjectId } = require('mongoose').Types;

router.use(bodyParser.json());

router.post('/create', async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne();
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const username = 'admin@123';
        const password = '12345';

        const hashedPassword = await bcrypt.hash(password, 10);

        const defaultAdmin = new Admin({
            username: username,
            password: hashedPassword
        });

        await defaultAdmin.save();

        res.status(200).json({
            status: 200,
            username: username,
            message: 'Default admin created successfully',
        })

    } catch (error) {
        console.error('Error creating default admin:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username && !password) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the inputs"
            });
        }

        const admin = await Admin.findOne({ username: username });
        if (!admin) {
            return res.status(404).json({
                status: 404,
                message: 'Admin not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 401,
                message: "Invalid Password"
            });
        }

        const token = jwt.sign({ username: admin.username }, process.env.SECRET_KEY);

        res.status(200).json({
            status: 200,
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post('/addInstructors', verifyJwt, async (req, res) => {
    try {

        const { name, username, password } = req.body;
        if (!name && !username && !password) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the inputs"
            });
        }

        const existingInstructor = await Instructor.findOne({ username: username });
        if (existingInstructor) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newInstructor = new Instructor({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newInstructor.save();

        res.status(200).json({
            status: 200,
            message: 'Instructor added successfully'
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.get('/listOfInstructors', verifyJwt, async (req, res) => {
    try {
        const instructors = await Instructor.find({}, '-password');

        res.status(200).json({ instructors: instructors });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post('/addCourses', verifyJwt, async (req, res) => {
    try {

        const { name, level, description, image } = req.body;
        if (!name && !level && !description && !image) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the fields"
            });
        }

        const newCourse = new Course({
            name: name,
            level: level,
            description: description,
            image: image
        });

        await newCourse.save();

        res.status(201).json({
            status: 201,
            message: 'Course created successfully'
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post('/courses/addLectures', verifyJwt, async (req, res) => {
    try {

        const { courseId, name } = req.body;
        if (!name && !courseId) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the details"
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const newLecture = new Lecture({ name: name });
        await newLecture.save();

        course.lectures.push(newLecture);
        await course.save();

        res.status(201).json({ message: 'Lecture added to course successfully' });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post('/courses/assignLectures', verifyJwt, async (req, res) => {
    try {
        const { courseId, instructorId, lectureId, date } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const instructor = await Instructor.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        const existingInstructor = await Instructor.findOne({ 'lectures.lecture': lectureId });
        if (existingInstructor) {
            return res.status(400).json({ message: 'This lecture is already assigned' });
        }

        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const existingLecture = instructor.lectures.find(lecture => {
            const lectureDate = new Date(lecture.date);
            return lectureDate >= startDate && lectureDate < endDate;
        });

        if (existingLecture) {
            return res.status(400).json({ message: 'Lecture already assigned for given date' });
        }

        instructor.lectures.push({ lecture: lectureId, date: new Date(date) });
        await instructor.save();

        res.status(200).json({ message: 'Lecture assigned to instructor successfully' });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.get('/courses/getListOfAllCourses', verifyJwt, async (req, res) => {
    try {
        const courses = await Course.find();

        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }

        for (let i = 0; i < courses.length; i++) {
            const lectureIds = courses[i].lectures;

            const lectures = await Lecture.find({ '_id': { $in: lectureIds } });

            courses[i].lectures = lectures;
        }

        res.status(200).json({ courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;