const { body, validationResult } = require('express-validator');
const Board = require('../models/Board');
const asyncHandler = require('express-async-handler');

// Get all boards for the authenticated user
exports.getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ owner: req.user._id });
  res.json(boards);
});

// Create a new board
exports.createBoard = [
  body('name').notEmpty().withMessage('Name is required').isString().trim().escape(),
  body('description').optional().isString().trim().escape(),
  body('isPrivate').isBoolean().withMessage('isPrivate must be a boolean'),
  body('backgroundColor').optional().isString().trim().escape(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate, backgroundColor } = req.body;
    const board = new Board({
      name,
      description,
      isPrivate,
      backgroundColor: backgroundColor || '#ffffff',
      owner: req.user._id
    });

    await board.save();
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
  body('name').optional().isString().trim().escape(),
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


// Delete a specific board
exports.deleteBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id);

  if (!board || board.owner.toString() !== req.user._id.toString()) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  await board.remove();
  res.json({ message: 'Board removed' });
});