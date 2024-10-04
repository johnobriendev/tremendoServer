const { body, validationResult } = require('express-validator');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require("../models/Card");
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

    // // Create three default lists
    // const defaultLists = [
    //   { name: 'To Do', boardId: board._id, position: 1 },
    //   { name: 'In Progress', boardId: board._id, position: 2 },
    //   { name: 'Done', boardId: board._id, position: 3 }
    // ];

    // await List.insertMany(defaultLists);
    
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
