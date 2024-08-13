const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');


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
app.use(cors());
app.use(express.json());

//Routes
app.use('/api', routes);


// Every thrown error in the application or the previous middleware function calling `next` with an error as an argument will eventually go to this middleware function
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

 app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});