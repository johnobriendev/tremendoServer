const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');


const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, set: encrypt, get: decrypt },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const cardSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name: { type: String, required: true, set: encrypt, get: decrypt },
  description: { type: String, set: encrypt, get: decrypt },
  position: { type: Number, required: true },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
},
{
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;