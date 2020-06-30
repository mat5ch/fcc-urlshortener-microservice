const mongoose = require('mongoose');

const URL_SCHEMA = new mongoose.Schema(
    { 
        original_url: { type: String, required: true },
        short_url: { type: Number, required: true },
    }
);

const URL_MODEL = mongoose.model('URL_SH', URL_SCHEMA);

module.exports = URL_MODEL;