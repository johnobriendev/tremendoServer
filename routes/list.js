const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const { authenticateJWT } = require('../middleware/auth');
const boardAuth = require('../middleware/boardAuth');

// Get all lists within a specific board
router.get('/:boardId', authenticateJWT, listController.getLists);

// Create a new list within a board
router.post('/:boardId', authenticateJWT,  listController.createList);

// Update a specific list
router.put('/:id', authenticateJWT,  listController.updateList);

// Delete a specific list
router.delete('/:id', authenticateJWT,  listController.deleteList);

module.exports = router;