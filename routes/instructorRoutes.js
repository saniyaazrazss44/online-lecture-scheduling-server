const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Instructor = require('../models/instructors');
const Lecture = require('../models/lectures');
const Course = require('../models/courses');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyJwt = require('../middleware/authMiddleware')

router.use(bodyParser.json());

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username && !password) {
            return res.status(400).json({
                status: 400,
                message: "Please fill all the inputs"
            });
        }

        const instructor = await Instructor.findOne({ username: username });
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, instructor.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ username: instructor.username }, process.env.SECRET_KEY);

        res.status(200).json({
            status: 200,
            message: 'Login successful',
            instructorId: instructor._id,
            name: instructor.name,
            token: token
        });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
});

router.post('/listOfAssignedLectures', verifyJwt, async (req, res) => {
    try {
        const { instructorId } = req.body;

        const instructor = await Instructor.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        const lectureDetails = instructor.lectures.map(({ lecture, date }) => ({ lecture, date }));

        const lectureIds = lectureDetails.map(({ lecture }) => lecture);

        const assignedLectures = await Lecture.find({ '_id': { $in: lectureIds } });

        const assignedLecturesWithCourse = await Promise.all(assignedLectures.map(async lecture => {
            const course = await Course.findOne({ lectures: lecture._id });
            const { date } = lectureDetails.find(({ lecture: id }) => id.equals(lecture._id));
            return {
                lecture,
                course,
                date
            };
        }));

        res.status(200).json({
            status: 200,
            message: 'Details fetched',
            response: assignedLecturesWithCourse
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
})

module.exports = router;