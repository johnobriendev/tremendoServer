// middleware/boardAuth.js
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Invitation = require('../models/Invitation');

// Board access middleware
exports.canAccessBoard = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!board) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking board access' });
  }
};

// Board owner only middleware
exports.isOwner = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const board = await Board.findOne({
      _id: boardId,
      owner: req.user._id
    });

    if (!board) {
      return res.status(403).json({ message: 'Only board owner can perform this action' });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking board ownership' });
  }
};

// List access middleware
exports.canAccessList = async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const board = await Board.findOne({
      _id: list.boardId,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!board) {
      return res.status(403).json({ message: 'Not authorized to access this list' });
    }

    req.list = list;
    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking list access' });
  }
};

// Card access middleware
exports.canAccessCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const board = await Board.findOne({
      _id: card.boardId,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!board) {
      return res.status(403).json({ message: 'Not authorized to access this card' });
    }

    req.card = card;
    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking card access' });
  }
};

// Invitation verification middleware
exports.canManageInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (!invitation.invitee.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to manage this invitation' });
    }

    req.invitation = invitation;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking invitation access' });
  }
};

exports.canComment = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const board = await Board.findOne({
      _id: card.boardId,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!board) {
      return res.status(403).json({ message: 'Not authorized to comment on this card' });
    }

    req.card = card;
    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking comment authorization' });
  }
};


exports.canDeleteComment = async (req, res, next) => {
  try {
    const { cardId, commentId } = req.params;
    
    // Find the card and the specific comment
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Find the comment in the card's comments array
    const comment = card.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check board access
    const board = await Board.findOne({
      _id: card.boardId,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!board) {
      return res.status(403).json({ message: 'Not authorized to access this card' });
    }

    // If user is board owner, allow delete of any comment
    if (board.owner.equals(req.user._id)) {
      req.card = card;
      req.comment = comment;
      return next();
    }

    // If user is comment creator, allow delete
    // Note: You'll need to add a userId field to your comment schema for this to work
    if (comment.userId && comment.userId.equals(req.user._id)) {
      req.card = card;
      req.comment = comment;
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  } catch (error) {
    console.error('Error in canDeleteComment middleware:', error);
    res.status(500).json({ message: 'Error checking comment delete authorization' });
  }
};