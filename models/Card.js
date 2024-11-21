const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const cardSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name: { type: String, required: true },
  description: { type: String },
  position: { type: Number, required: true },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;