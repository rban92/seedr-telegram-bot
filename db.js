require('dotenv').config();

const mongoose = require('mongoose');

const connect =  () => {
     mongoose.connect(process.env.MONGO_URI).then((res) => console.log('Database connected.')).catch(e => console.log('Failed to connect database'+ e));
}

module.exports = { connect }