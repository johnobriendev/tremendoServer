const Board = require('../models/Board');
const asyncHandler = require('express-async-handler');

// Get all boards for the authenticated user
exports.getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ owner: req.user._id });
  res.json(boards);
});

// Create a new board
exports.createBoard = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;

  const board = new Board({
    name,
    description,
    isPrivate,
    owner: req.user._id
  });

  await board.save();
  res.status(201).json(board);
});

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
exports.updateBoard = asyncHandler(async (req, res) => {
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
});

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