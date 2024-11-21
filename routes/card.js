const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { authenticateJWT } = require('../middleware/auth');
const boardAuth = require('../middleware/boardAuth');

// Get all cards within a specific board
router.get('/:boardId/cards', authenticateJWT, cardController.getCards);

// Create a new card within a board
router.post('/:boardId/cards', authenticateJWT, cardController.createCard);

// Get a specific card
router.get('/:id', authenticateJWT, cardController.getCardById);

// Update a specific card
router.put('/:id', authenticateJWT, cardController.updateCard);

// Delete a specific card
router.delete('/:id', authenticateJWT, cardController.deleteCard);

// Add a comment to a specific card
router.post('/:id/comments', authenticateJWT, cardController.addComment);

// Delete a comment from a specific card
router.delete('/:cardId/comments/:commentId', authenticateJWT, cardController.deleteComment);

module.exports = router;