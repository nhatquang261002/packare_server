const mongoose = require('mongoose');

// Define schema for individual settings
const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    modified_at: {
        type: Date,
        default: Date.now
    }
});

// Define schema for system settings (a list of settings)
const settingsSchema = new mongoose.Schema({
    settings: [settingSchema] // Array of settings
});

// Create a model based on the schema
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
