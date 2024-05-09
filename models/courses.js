const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    lectures: [{
        type: ObjectId,
        ref: 'Lecture'
    }]
});

module.exports = mongoose.model("Course", courseSchema)