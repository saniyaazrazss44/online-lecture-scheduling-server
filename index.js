const express = require('express')
const app = express()
const mongoose = require('mongoose');
const cors = require('cors')
require("dotenv").config()

const port = process.env.PORT || 3002

// Middleware
app.use(cors())

// Connect to MongoDB 
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
};

// health api
app.get('/health', (req, res) => {
    res.json({
        service: 'Online Lecture Scheduling App',
        status: 'Active',
        time: new Date(),
    })
})

// Import routes
const adminRoute = require("./routes/adminRoutes")
const instructorRoute = require("./routes/instructorRoutes")


app.use('/admin', adminRoute)
app.use('/instructor', instructorRoute)


// Start server
const startServer = async () => {
    await connectToDatabase();
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
};

startServer();