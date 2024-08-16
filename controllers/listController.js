const { body, validationResult } = require('express-validator');
const List = require('../models/List');
const asyncHandler = require('express-async-handler');

// Get all lists within a specific board
exports.getLists = asyncHandler(async (req, res) => {
  const lists = await List.find({ boardId: req.params.boardId }).sort({ position: 1 });
  res.json(lists);
});

//create a list
exports.createList = [
  body('name').notEmpty().withMessage('Name is required').isString().trim().escape(),
  body('position').isInt().withMessage('Position must be an integer'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, position } = req.body;
    const list = await List.create({
      name,
      boardId: req.params.boardId,
      position,
    });
    res.status(201).json(list);
  }),
];


// Update a specific list
exports.updateList = [
  body('name').optional().isString().trim().escape(),
  body('position').optional().isInt().withMessage('Position must be an integer'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, position } = req.body;
    const list = await List.findByIdAndUpdate(id, { name, position }, { new: true });
    if (!list) {
      res.status(404).json({ message: 'List not found' });
    } else {
      res.json(list);
    }
  }),
];

// Delete a specific list and all associated cards
exports.deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const list = await List.findByIdAndDelete(id);
  if (!list) {
    res.status(404).json({ message: 'List not found' });
  } else {
    // Optionally, can also delete all associated cards here
    res.json({ message: 'List deleted' });
  }
});