const app = require('./app');
const port = process.env.PORT || 3000;

// Starting the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});