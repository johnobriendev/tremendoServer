const Board = require('../models/Board');

const boardAuth = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString() && !board.collaborators.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = boardAuth;