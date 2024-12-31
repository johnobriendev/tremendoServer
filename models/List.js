const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');


const listSchema = new mongoose.Schema({
  name: { type: String, required: true, set: encrypt, get: decrypt  },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  position: { type: Number, required: true }, 
  color: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

const List = mongoose.model('List', listSchema);

module.exports = List;