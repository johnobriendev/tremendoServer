const { body, param, validationResult } = require('express-validator');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require("../models/Card");
const Invitation = require('../models/Invitation');
const asyncHandler = require('express-async-handler');

// Get all boards for the authenticated user
exports.getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ owner: req.user._id });
  res.json(boards);
});

// Create a new board
exports.createBoard = [
  body('name').notEmpty().withMessage('Name is required').isString().trim(),
  body('description').optional().isString().trim().escape(),
  body('isPrivate').isBoolean().withMessage('isPrivate must be a boolean'),
  body('backgroundColor').optional().isString().trim().escape(),
  body('template').isIn(['kanban', 'weekly', 'blank']).withMessage('Invalid template'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate, backgroundColor,template } = req.body;
    const board = new Board({
      name,
      description,
      isPrivate,
      backgroundColor: backgroundColor || '#ffffff',
      owner: req.user._id
    });

    await board.save();
    
    let listsToCreate = [];

    switch (template) {
      case 'kanban':
        listsToCreate = [
          { name: 'To Do', boardId: board._id, position: 1 },
          { name: 'In Progress', boardId: board._id, position: 2 },
          { name: 'Done', boardId: board._id, position: 3 }
        ];
        break;
      case 'weekly':
        listsToCreate = [
          { name: 'Monday', boardId: board._id, position: 1 },
          { name: 'Tuesday', boardId: board._id, position: 2 },
          { name: 'Wednesday', boardId: board._id, position: 3 },
          { name: 'Thursday', boardId: board._id, position: 4 },
          { name: 'Friday', boardId: board._id, position: 5 },
          { name: 'Saturday', boardId: board._id, position: 6 },
          { name: 'Sunday', boardId: board._id, position: 7 }
        ];
        break;
      case 'blank':
        // No lists to create
        break;
    }

    if (listsToCreate.length > 0) {
      await List.insertMany(listsToCreate);
    }

    res.status(201).json(board);
  }),
];

// Get a specific board by ID
exports.getBoardById = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id);

  if (!board || board.owner.toString() !== req.user._id.toString()) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  res.json(board);
});

// Update a specific board
exports.updateBoard = [
  body('name').optional().isString().trim(),
  body('description').optional().isString().trim().escape(),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board || board.owner.toString() !== req.user._id.toString()) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    board.name = name || board.name;
    board.description = description || board.description;
    board.isPrivate = isPrivate !== undefined ? isPrivate : board.isPrivate;

    await board.save();
    res.json(board);
  }),
];


exports.deleteBoard = async (req, res) => {

  try {
    const board = await Board.findByIdAndDelete(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const lists = await List.find({ boardId: req.params.id });
    const listIds = lists.map(list => list._id);

    // Delete associated cards
    await Card.deleteMany({ listId: { $in: listIds } });

    // Delete associated lists
    await List.deleteMany({ boardId: req.params.id });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board' });
  }
};

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

exports.getAllBoards = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const ownedBoards = await Board.find({ owner: userId }).populate('owner', 'name email');
  const collaborativeBoards = await Board.find({ collaborators: userId }).populate('owner', 'name email');

  res.status(200).json({
    ownedBoards,
    collaborativeBoards
  });
});