const { body, validationResult } = require('express-validator');
const Card = require('../models/Card');
const asyncHandler = require('express-async-handler');

// Create a new card
exports.createCard = [
  body('listId').notEmpty().withMessage('List ID is required').isString().trim().escape(),
  body('name').notEmpty().withMessage('Name is required').isString().trim().escape(),
  body('description').optional().isString().trim().escape(),
  body('position').isInt().withMessage('Position must be an integer'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { listId, name, description, position } = req.body;
    const { boardId } = req.params;
    const card = await Card.create({ boardId, listId, name, description, position });
    res.status(201).json(card);
  }),
];

// Get all cards
exports.getCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ boardId: req.params.boardId });
  res.json(cards);
});

// Get a single card by ID
exports.getCardById = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

// Update a card
exports.updateCard = [
  body('name').optional().isString().trim().escape(),
  body('description').optional().isString().trim().escape(),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('listId').optional().isMongoId().withMessage('List ID must be a valid Mongo ID'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const card = await Card.findById(req.params.id);
    if (card) {
      if (req.body.name !== undefined) card.name = req.body.name;
      if (req.body.description !== undefined) card.description = req.body.description;
      if (req.body.position !== undefined) card.position = req.body.position;
      if (req.body.listId !== undefined) card.listId = req.body.listId;
      // card.name = req.body.name || card.name;
      // card.description = req.body.description || card.description;
      // card.position = req.body.position || card.position;
      // card.listId = req.body.listId || card.listId;
      card.updatedAt = Date.now();
      await card.save();
      res.json(card);
    } else {
      res.status(404).json({ message: 'Card not found' });
    }
  }),
];

// Delete a card
exports.deleteCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (card) {
    await card.remove();
    res.json({ message: 'Card removed' });
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

// Add a comment to a card
exports.addComment = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (card) {
    const { text } = req.body;
    card.comments.push({ text });
    await card.save();
    res.json(card);
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

// Delete a comment from a card
exports.deleteComment = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.cardId);
  if (card) {
    card.comments = card.comments.filter(comment => comment._id.toString() !== req.params.commentId);
    await card.save();
    res.json(card);
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});