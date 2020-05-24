const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String,
    totalWin : Number
}, {strict: false});

module.exports = userSchema;
