const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const instructorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lectures: [{
        lecture: {
            type: ObjectId,
            ref: 'Lecture'
        },
        date: {
            type: Date,
        }
    }]
});

module.exports = mongoose.model("Instructor", instructorSchema)