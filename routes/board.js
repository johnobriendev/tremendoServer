// routes/boardRoutes.js
const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateJWT, boardController.getBoards);

router.get('/all', authenticateJWT, boardController.getAllBoards);

router.post('/', authenticateJWT, boardController.createBoard);

router.get('/:id', authenticateJWT, boardController.getBoardById);

router.put('/:id', authenticateJWT, boardController.updateBoard);

router.delete('/:id', authenticateJWT, boardController.deleteBoard);

module.exports = router;