const mongoose = require('mongoose');
const config = require('../secret_config');

// Connection URI
const uri = config.db.uri;

// Connect to MongoDB Atlas
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB Atlas: ', err));

module.exports = mongoose;
