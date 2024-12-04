const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const helmet = require("helmet");
require('dotenv').config();
const rateLimiter = require('./middleware/rateLimiter');


// Import the routes
const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');
const listRoutes = require('./routes/list');
const cardRoutes = require('./routes/card');
const invitationRoutes = require('./routes/invitation')


const app = express();
const port = process.env.PORT || 3000;

let dbUri;
switch (process.env.NODE_ENV) {
  case 'test':
    dbUri = process.env.MONGODB_URI_TEST;
    break;
  case 'development':
    dbUri = process.env.MONGODB_URI_DEV;
    break;
  default:
    dbUri = process.env.MONGODB_URI;
    break;
}

// Connect to MongoDB
mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => console.error('MongoDB connection error:', err));

// Enable trust proxy to allow proper IP identification
app.set('trust proxy', 1); 

// Middleware


app.use(cors());
app.use(express.json());
app.use(compression());
app.use(helmet());

app.use(passport.initialize()); 
require('./config/passport');


// Routes

// Apply register limiter specifically to the registration route
app.use('/users/register', rateLimiter.register);

// Apply API limiter to all other routes
app.use('/users', rateLimiter.api, userRoutes);
app.use('/boards', rateLimiter.api, boardRoutes);
app.use('/lists', rateLimiter.api, listRoutes);
app.use('/cards', rateLimiter.api, cardRoutes);
app.use('/invitations', rateLimiter.api, invitationRoutes);

// app.use('/users', userRoutes);
// app.use('/boards', boardRoutes);
// app.use('/lists', listRoutes);
// app.use('/cards', cardRoutes);
// app.use('/invitations', invitationRoutes);


// Every thrown error in the application or the previous middleware function calling `next` with an error as an argument will eventually go to this middleware function
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

//  app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

module.exports = app;