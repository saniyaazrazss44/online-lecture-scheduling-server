const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);