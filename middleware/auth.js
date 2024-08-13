const passport = require('passport');

exports.authenticateJWT = passport.authenticate('jwt', { session: false });
