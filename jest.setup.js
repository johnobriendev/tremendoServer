jest.setTimeout(10000); // 10 second timeout

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGO_URI_TEST = 'mongodb://localhost:27017/kanban-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-key';