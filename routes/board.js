// routes/boardRoutes.js
const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateJWT } = require('../middleware/auth');
const boardAuth = require('../middleware/boardAuth');

const router = express.Router();

router.get('/', authenticateJWT, boardController.getBoards);

router.get('/all', authenticateJWT, boardController.getAllBoards);

router.post('/', authenticateJWT, boardController.createBoard);

router.get('/:id', authenticateJWT,  boardAuth.canAccessBoard, boardController.getBoardById);

router.put('/:id', authenticateJWT,  boardAuth.canAccessBoard, boardController.updateBoard);

router.delete('/:id', authenticateJWT, boardAuth.isOwner, boardController.deleteBoard);

router.get('/:id/details', authenticateJWT,  boardAuth.canAccessBoard, boardController.getBoardDetails);

module.exports = router;