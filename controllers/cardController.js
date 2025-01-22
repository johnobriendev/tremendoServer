const { body, validationResult } = require('express-validator');
const Card = require('../models/Card');
const asyncHandler = require('express-async-handler');

// Create a new card
exports.createCard = [
  body('listId').notEmpty().withMessage('List ID is required').isString().trim().escape(),
  body('name').notEmpty().withMessage('Name is required').isString().trim(),
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
  const cards = await Card.find({ boardId: req.params.boardId }).populate('comments.userId', 'name email');
  res.json(cards);
});

// Get a single card by ID
exports.getCardById = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id).populate('comments.userId', 'name email');
  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

exports.updateCard = [
  body('name').optional().isString().trim(),
  body('description').optional().isString().trim().escape(),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('listId').optional().isMongoId().withMessage('List ID must be a valid Mongo ID'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (req.body.name !== undefined) card.name = req.body.name;
    if (req.body.description !== undefined) card.description = req.body.description;
    if (req.body.position !== undefined) card.position = req.body.position;
    if (req.body.listId !== undefined) card.listId = req.body.listId;
    card.updatedAt = Date.now();

    await card.save();
    res.json(card);
  }),
];

exports.updateBatchCards = [
  body('cards').isArray().withMessage('Cards must be an array'),
  body('boardId').isMongoId().withMessage('Valid board ID is required'),
  
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cards, boardId } = req.body;

    // Start a database transaction to ensure all updates succeed or none do
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify all cards belong to the same board and user has access
      const cardsToUpdate = await Card.find({
        _id: { $in: cards.map(card => card._id) },
        boardId: boardId
      }).session(session);

      if (cardsToUpdate.length !== cards.length) {
        throw new Error('Some cards were not found or do not belong to the specified board');
      }

      // Perform all updates
      const updatePromises = cards.map(update => 
        Card.findByIdAndUpdate(
          update._id,
          {
            position: update.position,
            listId: update.listId,
            updatedAt: Date.now()
          },
          { 
            new: true,
            session 
          }
        )
      );

      const updatedCards = await Promise.all(updatePromises);
      await session.commitTransaction();
      res.json(updatedCards);

    } catch (error) {
      await session.abortTransaction();
      console.error('Batch update error:', error);
      res.status(500).json({ 
        message: 'Error updating cards',
        error: error.message 
      });
    } finally {
      session.endSession();
    }
  })
];


// Delete a card
exports.deleteCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const card = await Card.findByIdAndDelete(id);
  if (card) {
    res.json({ message: 'Card removed' });
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

exports.addComment = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  const { text } = req.body;
  
  card.comments.push({ 
    text,
    userId: req.user._id
  });

  await card.save();

  // Always populate user info
  const populatedCard = await Card.findById(card._id)
    .populate('comments.userId', 'name email');
  
  res.json(populatedCard);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  const comment = card.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (!comment.userId.equals(req.user._id) && !req.board.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  card.comments.pull({ _id: req.params.commentId });
  await card.save();

  // Always populate user info
  const populatedCard = await Card.findById(card._id)
    .populate('comments.userId', 'name email');
  
  res.json(populatedCard);
});

// // Add a comment to a card
// exports.addComment = asyncHandler(async (req, res) => {
//   const card = await Card.findById(req.params.id);
//   if (card) {
//     const { text } = req.body;
//     card.comments.push({ text });
//     await card.save();
//     res.json(card);
//   } else {
//     res.status(404).json({ message: 'Card not found' });
//   }
// });

// // Delete a comment from a card
// exports.deleteComment = asyncHandler(async (req, res) => {
//   const card = await Card.findById(req.params.cardId);
//   if (card) {
//     card.comments = card.comments.filter(comment => comment._id.toString() !== req.params.commentId);
//     await card.save();
//     res.json(card);
//   } else {
//     res.status(404).json({ message: 'Card not found' });
//   }
// });


// // Update a card
// exports.updateCard = [
//   body('name').optional().isString().trim(),
//   body('description').optional().isString().trim().escape(),
//   body('position').optional().isInt().withMessage('Position must be an integer'),
//   body('listId').optional().isMongoId().withMessage('List ID must be a valid Mongo ID'),

//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const card = await Card.findById(req.params.id);
//     if (!card) {
//       return res.status(404).json({ message: 'Card not found' });
//     }

//     const originalListId = card.listId;
//     const originalPosition = card.position;

//     if (req.body.name !== undefined) card.name = req.body.name;
//     if (req.body.description !== undefined) card.description = req.body.description;
//     if (req.body.position !== undefined) card.position = req.body.position;
//     if (req.body.listId !== undefined) card.listId = req.body.listId;
//     card.updatedAt = Date.now();

//     await card.save();

//     // If position or listId changed, reorder cards
//     if (req.body.position !== undefined || req.body.listId !== undefined) {
//       // Reorder cards in the original list
//       if (originalListId !== card.listId || originalPosition !== card.position) {
//         await reorderCards(originalListId);
//       }

//       // If the card moved to a different list, reorder cards in the new list too
//       if (originalListId !== card.listId) {
//         await reorderCards(card.listId);
//       }
//     }

//     res.json(card);
//   }),
// ];

// async function reorderCards(listId) {
//   const cardsInList = await Card.find({ listId }).sort('position');
//   for (let i = 0; i < cardsInList.length; i++) {
//     cardsInList[i].position = i + 1;
//     await cardsInList[i].save();
//   }
// }
