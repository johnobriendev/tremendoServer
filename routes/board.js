// routes/boardRoutes.js
const express = require('express');
const boardController = require('../controllers/boardController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(authenticateJWT, boardController.getBoards)
  .post(authenticateJWT, boardController.createBoard);

router.route('/:id')
  .get(authenticateJWT, boardController.getBoardById)
  .put(authenticateJWT, boardController.updateBoard)
  .delete(authenticateJWT, boardController.deleteBoard);

module.exports = router;