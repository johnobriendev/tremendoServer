// controllers/invitationController.js
const { validationResult, body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Board = require('../models/Board');
const User = require('../models/User');
const Invitation = require('../models/Invitation');


exports.inviteUser = [
  param('boardId').isMongoId().withMessage('Invalid board ID'),
  body('email').isEmail().withMessage('Invalid email address'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const { email } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to invite users to this board' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingInvitation = await Invitation.findOne({
      board: boardId,
      invitee: invitedUser._id,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    const newInvitation = new Invitation({
      board: boardId,
      inviter: req.user._id,
      invitee: invitedUser._id
    });

    await newInvitation.save();

    res.status(200).json({ message: 'Invitation sent successfully' });
  })
];




exports.getInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({ invitee: req.user._id, status: 'pending' })
    .populate('board', 'name')
    .populate('inviter', 'name email');

  res.status(200).json(invitations);
});

exports.respondToInvitation = [
  param('invitationId').isMongoId().withMessage('Invalid invitation ID'),
  body('accept').isBoolean().withMessage('Accept must be a boolean value'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const { invitationId } = req.params;
    const { accept } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }

    invitation.status = accept ? 'accepted' : 'rejected';
    await invitation.save();

    if (accept) {
      const board = await Board.findById(invitation.board);
      if (!board.collaborators.includes(req.user._id)) {
        board.collaborators.push(req.user._id);
        await board.save();
      }
    }

    res.status(200).json({ message: `Invitation ${accept ? 'accepted' : 'rejected'} successfully` });
  })
];