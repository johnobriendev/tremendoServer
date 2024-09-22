const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const helmet = require("helmet");
require('dotenv').config();


// Import the routes
const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');
const listRoutes = require('./routes/list');
const cardRoutes = require('./routes/card');


const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => console.error('MongoDB connection error:', err));

// Middleware

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});
// Apply rate limiter to all requests
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(helmet());

app.use(passport.initialize()); 
require('./config/passport');


// Routes
app.use('/users', userRoutes);
app.use('/boards', boardRoutes);
app.use('/lists', listRoutes);
app.use('/cards', cardRoutes);


// Every thrown error in the application or the previous middleware function calling `next` with an error as an argument will eventually go to this middleware function
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

 app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});