// models/Board.js
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');


const boardSchema = new mongoose.Schema({
  name: { type: String, required: true, set: encrypt, get: decrypt },
  description: { type: String, default: '', set: encrypt, get: decrypt },
  isPrivate: { type: Boolean, default: true},
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  backgroundColor: { type: String, default: '#ffffff' },
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;