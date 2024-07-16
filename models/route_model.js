const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    shipper_id: {
        type: String,
        ref: 'Shipper',
        index: true,
        required: true
    },
    route_name: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    route_direction: {
        type: String,
        enum: ['start_to_end', 'end_to_start', 'two_way'],
        required: true
    },
    start_location: {
        type: String,
        required: true
    },
    start_coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
    },
    end_location: {
        type: String,
        required: true
    },
    end_coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
    },
    distance: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    geometry: [[Number]]
    
});

// Indexing for geospatial queries
routeSchema.index({ start_coordinates: '2dsphere', end_coordinates: '2dsphere' });

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
