// routes/invitationRoutes.js
const express = require('express');
const invitationController = require('../controllers/invitationController');
const { authenticateJWT } = require('../middleware/auth');
const boardAuth = require('../middleware/boardAuth');

const router = express.Router();

// Invite a user to a board
router.post('/boards/:boardId/invite', authenticateJWT, invitationController.inviteUser);

// Get all pending invitations for the authenticated user
router.get('/', authenticateJWT, invitationController.getInvitations);

// Respond to an invitation (accept or reject)
router.post('/:invitationId/respond', authenticateJWT, invitationController.respondToInvitation);

module.exports = router;