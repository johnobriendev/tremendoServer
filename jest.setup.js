jest.setTimeout(10000); // 10 second timeout

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-key';