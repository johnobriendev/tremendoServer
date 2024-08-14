// routes/boardRoutes.js
const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Get all boards
router.get('/', authenticateJWT, boardController.getBoards);

// Create a new board
router.post('/', authenticateJWT, boardController.createBoard);

// Get a specific board by ID
router.get('/:id', authenticateJWT, boardController.getBoardById);

// Update a specific board
router.put('/:id', authenticateJWT, boardController.updateBoard);

// Delete a specific board
router.delete('/:id', authenticateJWT, boardController.deleteBoard);

module.exports = router;