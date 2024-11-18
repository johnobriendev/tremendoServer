// models/Board.js
const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isPrivate: { type: Boolean, default: true},
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  backgroundColor: { type: String, default: '#ffffff' },
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;