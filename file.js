
const mongoose = require('mongoose');
const fileScheme = new mongoose.Schema({
    title: {type: String, required: true},
    type: {type: String, required: true, default: 'folder'},
    userTgId: {type: String, required: true},
    addedBy: {type: String, required: true},
    seedrId: {type: Number, required: true},
},{timestamps: true})

module.exports = mongoose.model('File', fileScheme);
