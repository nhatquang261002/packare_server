const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    _id: false,
    package_name: {
        type: String,
        required: true
    },
    package_description: {
        type: String
    },
    package_price: {
        type: Number,
        required: true
    },
    package_image_url: {
        type: String
    }
});

const orderFeedbackSchema = new mongoose.Schema({
    _id: false,
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String
    },
    create_time: {
        type: Date,
        default: Date.now
    }
});

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        index: true,
        primaryKey: true,
        unique: true,
    },

    shipper_route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
    },

    order_geometry: [[Number]],

    distance: {
        type: Number,
    },

    packages: [packageSchema], // Array of Package subdocuments
    sender_id: {
        type: String,
        ref: 'User',
        index: true,
        required: true,
    },
    shipper_id: {
        type: String,
        index: true,
        ref: 'Shipper',
    },
    receiver_name: {
        type: String,
        required: true
    },
    receiver_phone: {
        type: String,
        required: true
    },
    sender_paid: {
        type: Number,
    },
    shipping_price: {
        type: Number,
    },
    send_address: {
        type: String,
        required: true
    },
    send_coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
    },
    delivery_address: {
        type: String,
        required: true
    },
    delivery_coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
    },
    create_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['waiting', 'verified', 'declined', 'shipper_accepted', 'start_shipping', 'cancelled', 'shipper_picked_up', 'delivered', 'completed'],
        index: true,
        default: 'waiting'
    },
    status_change_time: {
        type: Date
    },
    preferred_pickup_start_time: {
        type: Date
    },
    preferred_pickup_end_time: {
        type: Date
    },
    preferred_delivery_start_time: {
        type: Date
    },
    preferred_delivery_end_time: {
        type: Date
    },
    order_lasting_time: {
        type: Date,
        index: true
    },
    feedback: orderFeedbackSchema,
});

// Indexing for geospatial queries
orderSchema.index({ send_coordinates: '2dsphere', delivery_coordinates: '2dsphere' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
