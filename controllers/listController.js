const { body, validationResult } = require('express-validator');
const List = require('../models/List');
const Card = require("../models/Card");
const asyncHandler = require('express-async-handler');

// Get all lists within a specific board
exports.getLists = asyncHandler(async (req, res) => {
  const lists = await List.find({ boardId: req.params.boardId }).sort({ position: 1 });
  res.json(lists);
});

//create a list
exports.createList = [
  body('name').notEmpty().withMessage('Name is required').isString().trim(),
  body('position').isInt().withMessage('Position must be an integer'),
  body('color').optional().isString().trim(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, position, color } = req.body;
    const list = await List.create({
      name,
      boardId: req.params.boardId,
      position,
      color: color || null,
    });
    res.status(201).json(list);
  }),
];


// Update a specific list
exports.updateList = [
  body('name').optional().isString().trim(),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('color').optional().isString().trim(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, position, color } = req.body;
    const list = await List.findByIdAndUpdate(id, { name, position, color: color || null }, { new: true });
    if (!list) {
      res.status(404).json({ message: 'List not found' });
    } else {
      res.json(list);
    }
  }),
];


exports.updateListPositions = [
  body('lists').isArray().withMessage('Lists must be an array'),
  body('lists.*.id').isMongoId().withMessage('List ID must be a valid Mongo ID'),
  body('lists.*.position').isInt().withMessage('Position must be an integer'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lists } = req.body;

    try {
      await Promise.all(lists.map(async (listData) => {
        await List.findByIdAndUpdate(
          listData.id,
          { position: listData.position },
          { new: true, runValidators: true }
        );
      }));

      res.json({ message: 'List positions updated successfully' });
    } catch (error) {
      console.error('Error in updateListPositions:', error);
      res.status(500).json({ message: 'An error occurred while updating list positions', error: error.message });
    }
  })
];

// Delete a specific list and all associated cards
exports.deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const list = await List.findByIdAndDelete(id);
  if (!list) {
    res.status(404).json({ message: 'List not found' });
  } else {
   // Delete all associated cards
   await Card.deleteMany({ listId: id });

    res.json({ message: 'List deleted' });
  }
});