const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  name: { type: String, required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  position: { type: Number, required: true }, 
  color: { type: String, default: null },
}, {
  timestamps: true,
});

const List = mongoose.model('List', listSchema);

module.exports = List;