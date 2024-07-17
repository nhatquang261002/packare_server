const Order = require('../models/order_model');
const Settings = require('../models/settings_model');
const Account = require('../models/account_model');
const { getDirections } = require('../services/mapbox');
const { generateOrderID } = require('../utils/generate_id');
const {sendOrderStatusNotification} = require('../websocket/notification_service');

// Create a new order
const createOrder = async (req, res) => {
    try {
        const {
            sender_id,
            shipper_id,
            receiver_name,
            receiver_phone,
            shipping_price,
            sender_paid,
            send_address,
            send_coordinates,
            delivery_address,
            delivery_coordinates,
            preferred_pickup_start_time,
            preferred_pickup_end_time,
            preferred_delivery_start_time,
            preferred_delivery_end_time,
            order_lasting_time,
            packages
        } = req.body;


        // Verify required fields
        if (!sender_id || !receiver_name || !receiver_phone || !sender_paid || !send_address || !send_coordinates || !delivery_address || !delivery_coordinates || !preferred_pickup_start_time || !preferred_pickup_end_time || !preferred_delivery_start_time || !preferred_delivery_end_time || !order_lasting_time || !packages ) {
            return res.status(400).json({ message: 'Missing required fields or packages' });
        }


        // Check if sender has enough balance
        const senderAccount = await Account.findOne({ account_id: order.sender_id });

        // If sender account not found, return error
        if (!senderAccount) {
            return res.status(404).json({ message: 'Sender account not found' });
        }   

        // If sender balance is less than sender_paid, return error
        if (senderAccount.wallet.balance < order.sender_paid) {
            return res.status(400).json({ message: 'Insufficient balance in sender wallet' });
        }

        // Fetch settings
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        const order_percent_fee = settings.settings.find(item => item.key === 'order_percent_fee').value;

        const order_id = await generateOrderID();


        // Create new order
        const order = new Order({
            order_id: order_id,
            sender_id,
            shipper_id,
            receiver_name,
            receiver_phone,
            sender_paid: shipping_price,
            shipping_price: shipping_price * order_percent_fee,
            send_address,
            send_coordinates,
            delivery_address,
            delivery_coordinates,
            preferred_pickup_start_time,
            preferred_pickup_end_time,
            preferred_delivery_start_time,
            preferred_delivery_end_time,
            order_lasting_time,
            status: 'waiting', // Default status
            packages: packages
        });

        await order.save();

        sendOrderStatusNotification(order_id, 'waiting');

        res.status(200).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
}

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order by ID
        const order = await Order.findOne({ order_id: orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order retrieved successfully', order });
    } catch (error) {
        console.error('Error retrieving order by ID:', error);
        res.status(500).json({ message: 'Failed to retrieve order' });
    }
};

const verifyOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Find the order
        const order = await Order.findOne({ order_id: orderId });

        // If order not found, return 404
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if sender has enough balance
        const senderAccount = await Account.findOne({ account_id: order.sender_id });

        // If sender account not found, return error
        if (!senderAccount) {
            return res.status(404).json({ message: 'Sender account not found' });
        }

        // If sender balance is less than sender_paid, return error
        if (senderAccount.wallet.balance < order.sender_paid) {
            return res.status(400).json({ message: 'Insufficient balance in sender wallet' });
        }

        // Debit sender_paid from sender's wallet balance
        senderAccount.wallet.balance -= order.sender_paid;
        await senderAccount.save();

        // Update order status to verified
        order.status = 'verified';
        order.status_change_time = Date.now();
        await order.save();

        // Send notification
        sendOrderStatusNotification(orderId, 'verified');

        res.status(200).json({ message: 'Order verified successfully' });
    } catch (error) {
        console.error('Error verifying order:', error);
        res.status(500).json({ message: 'Failed to verify order' });
    }
};


const acceptOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { shipperId, shipperRouteId, orderGeometry, distance } = req.body;

        // Find the order
        const order = await Order.findOne({ order_id: orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order status is 'verified'
        if (order.status !== 'verified') {
            return res.status(400).json({ message: 'Order might be accepted by another shipper' });
        }

        // Update the order status and other details
        order.status = 'shipper_accepted';
        order.shipper_id = shipperId;
        order.status_change_time = Date.now();
        order.shipper_route_id = shipperRouteId;
        order.order_geometry = orderGeometry;
        order.distance = distance;

        await order.save();

        // Calculate the total package prices
        let totalPackagePrice = 0;
        order.packages.forEach((pkg) => {
            totalPackagePrice += pkg.package_price;
        });

        // Find the shipper's account
        const shipperAccount = await Account.findOne({ account_id: shipperId });

        if (!shipperAccount) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Check if the shipper's balance is sufficient
        if (shipperAccount.wallet.balance < totalPackagePrice) {
            return res.status(400).json({ message: 'Insufficient balance in shipper wallet' });
        }

        // Deduct the total package price from the shipper's wallet balance
        shipperAccount.wallet.balance -= totalPackagePrice;

        // Save the shipper's account with the updated balance
        await shipperAccount.save();

        // Add order_id to shipper's current_orders
        const updatedShipper = await Account.findOneAndUpdate(
            { account_id: shipperId },
            { $addToSet: { 'shipper.current_orders': orderId } },
            { new: true }
        );

        if (!updatedShipper) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Send notification
        sendOrderStatusNotification(orderId, 'order_accepted');

        res.status(200).json({ message: 'Order accepted successfully' });
    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ message: 'Failed to accept order' });
    }
};



// Decline an order
const declineOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Update order status to declined
        const order = await Order.findOneAndUpdate({ order_id: orderId }, { status: 'declined', status_change_time: Date.now() }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        sendOrderStatusNotification(orderId, 'declined');

        res.status(200).json({ message: 'Order declined successfully' });
    } catch (error) {
        console.error('Error declining order:', error);
        res.status(500).json({ message: 'Failed to decline order' });
    }
};

// Confirm pickup
const confirmPickup = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Update order status to driver_picked_up
        const order = await Order.findOneAndUpdate({ order_id: orderId }, { status: 'shipper_picked_up', status_change_time: Date.now() }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        sendOrderStatusNotification(orderId, 'shipper_picked_up');

        res.status(200).json({ message: 'Order pickup confirmed successfully' });
    } catch (error) {
        console.error('Error confirming pickup:', error);
        res.status(500).json({ message: 'Failed to confirm pickup' });
    }
};

// Confirm delivered
const confirmDelivered = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Update order status to delivered
        const order = await Order.findOneAndUpdate({ order_id: orderId }, { status: 'delivered', status_change_time: Date.now() }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the shipper associated with the order
        const shipper = await Account.findOne({ 'shipper.shipper_id': order.shipper_id });

        if (shipper) {
            // Remove the order ID from the shipper's current orders
            shipper.current_orders = shipper.current_orders.filter(id => id !== orderId);
            await shipper.save();
        }

        sendOrderStatusNotification(orderId, 'delivered');

        res.status(200).json({ message: 'Order delivered confirmed successfully'  });
    } catch (error) {
        console.error('Error confirming delivered:', error);
        res.status(500).json({ message: 'Failed to confirm delivered' });
    }
};

// Start shipping an order
const startShipping = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order and update its status to "start_shipping"
        const order = await Order.findOneAndUpdate(
            { order_id: orderId },
            { status: 'start_shipping', status_change_time: Date.now() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        sendOrderStatusNotification(orderId, 'start_shipping');

        res.status(200).json({ message: 'Order shipping started successfully' });
    } catch (error) {
        console.error('Error starting shipping for order:', error);
        res.status(500).json({ message: 'Failed to start shipping for order' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order
        const order = await Order.findOne({ order_id: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Store the shipper_id
        const shipperId = order.shipper_id;

        // Calculate the total package prices
        let totalPackagePrice = 0;
        order.packages.forEach((pkg) => {
            totalPackagePrice += pkg.package_price;
        });

        // Update the order directly
        order.status = 'cancelled';
        order.status_change_time = Date.now();
        order.shipper_id = null; // Clear shipper_id
        order.shipper_route_id = null;
        order.order_geometry = null;
        order.distance = null;

        await order.save();

        // Remove the canceled order's ID from the shipper's current_orders array
        if (shipperId) {
            const updatedShipper = await Account.findOneAndUpdate(
                { account_id: shipperId },
                { $pull: { 'shipper.current_orders': orderId } },
                { new: true }
            );

            if (!updatedShipper) {
                console.error('Shipper not found');
            }
        }

        // Refund the shipper's wallet balance
        if (shipperId) {
            const shipperAccount = await Account.findOne({ account_id: shipperId });
            if (shipperAccount) {
                shipperAccount.wallet.balance += totalPackagePrice;
                await shipperAccount.save();
            } else {
                console.error('Shipper account not found');
            }
        }
         // Refund the sender's wallet balance
         if (sender_id) {
            const senderAccount = await Account.findOne({ account_id: sender_id });
            if (senderAccount) {
                senderAccount.wallet.balance += sender_paid;
                await senderAccount.save();
            } else {
                return res.status(404).json({ message: 'Sender account not found' });
            }
        }

        // Send a cancellation notification
        sendOrderStatusNotification(orderId, 'cancelled');

        res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Failed to cancel order' });
    }
};




const completeOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order by ID and update its status to completed
        const order = await Order.findOneAndUpdate(
            { order_id: orderId },
            { status: 'completed', status_change_time: Date.now() },
            { new: true }
        );

        // If the order is not found, return a 404 error
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update user order history
        const userAccount = await Account.findOne({ account_id: order.sender_id });
        if (userAccount) {
            userAccount.user.order_history.push(orderId);
            await userAccount.save();
        } else {
            console.error('User account not found for order:', orderId);
        }

        // Update shipper's shipped orders and credit their wallet with shipping price and total package prices
        const shipperAccount = await Account.findOne({ account_id: order.shipper_id });
        if (shipperAccount) {
            shipperAccount.shipper.shipped_orders.push(orderId);
            const totalCost = order.shipping_price + order.packages.reduce((total, pkg) => total + pkg.package_price, 0);
            shipperAccount.wallet.balance += totalCost;
            await shipperAccount.save();
        } else {
            console.error('Shipper account not found for order:', orderId);
        }


        // Send a completion notification
        sendOrderStatusNotification(orderId, 'completed');

        // Return success message
        res.status(200).json({ message: 'Order completed successfully' });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ message: 'Failed to complete order' });
    }
};



// View order history
const viewOrderHistory = async (req, res) => {
    try {
        // Retrieve order history for the user
        const orders = await Order.find({ sender_id: req.user.userId });

        res.status(200).json({ message: 'Order history retrieved successfully', orders });
    } catch (error) {
        console.error('Error viewing order history:', error);
        res.status(500).json({ message: 'Failed to view order history' });
    }
};

// Update a package within an order
const updatePackage = async (req, res) => {
    try {
        const { orderId, packageId } = req.params;
        const { package_name, package_description, package_price, package_image_url } = req.body;

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find and update the package within the order
        const packageItem = order.packages.id(packageId);

        if (!packageItem) {
            return res.status(404).json({ message: 'Package not found' });
        }

        packageItem.package_name = package_name;
        packageItem.package_description = package_description;
        packageItem.package_price = package_price;
        packageItem.package_image_url = package_image_url;

        await order.save();

        res.status(200).json({ message: 'Package updated successfully' });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ message: 'Failed to update package' });
    }
};

// Delete a package from an order
const deletePackage = async (req, res) => {
    try {
        const { orderId, packageId } = req.params;

        // Find the order
        const order = await Order.findOne({order_id: orderId});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Filter out the package with the specified packageId
        order.packages = order.packages.filter(pkg => pkg._id.toString() !== packageId);

        await order.save();

        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({ message: 'Failed to delete package' });
    }
};


const getOrderPackages = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order by ID
        const order = await Order.findOne({order_id: orderId});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Retrieve the packages from the order
        const packages = order.packages;

        if (!packages || packages.length === 0) {
            return res.status(404).json({ message: 'Packages not found' });
        }

        res.status(200).json({ message: 'Packages retrieved successfully', packages });
    } catch (error) {
        console.error('Error retrieving order packages:', error);
        res.status(500).json({ message: 'Failed to retrieve order packages' });
    }
};


// Provide order feedback
const orderFeedback = async (req, res) => {
    try {
        const { order_id, rating, comment } = req.body;

        // Find the corresponding order and update its feedback details
        const order = await Order.findOne({order_id: order_id});
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.feedback = {
            order_id,
            rating,
            comment
        };
        await order.save();

        res.status(200).json({ message: 'Feedback provided successfully' });
    } catch (error) {
        console.error('Error providing order feedback:', error);
        res.status(500).json({ message: 'Failed to provide feedback' });
    }
};

// Get all orders of a specific user
const getOrdersByUser = async (req, res) => {
    try {
        const userId = req.params.user_id;

        // Find orders matching sender_id
        const orders = await Order.find({ sender_id: userId});

        res.status(200).json({ message: 'Orders retrieved successfully', orders });
    } catch (error) {
        console.error('Error retrieving orders for user:', error);
        res.status(500).json({ message: 'Failed to retrieve orders' });
    }
};

// Function to calculate shipping price based on distance
const calculateShippingPrice = async (req, res) => {
    try {
        const { sendCoords, receiveCoords } = req.body;

        // Fetch settings
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        // Extract the value of the first_km_price key
        const firstKmPrice = settings.settings.find(item => item.key === 'first_km_price').value;

        // Extract the value of the next_half_km_price key
        const next_half_km_price = settings.settings.find(item => item.key === 'next_half_km_price').value;


         // Ensure sendCoords and receiveCoords are provided
         if (!sendCoords || !receiveCoords) {
            return res.status(400).json({ message: 'Send and receive coordinates are required' });
        }

        // Get directions from Mapbox to calculate distance
        const directions = await getDirections(
            sendCoords,
            receiveCoords
        );
        
        // Extract distance from directions
        const distanceInKm = directions.distance / 1000; // Convert meters to kilometers

        const initialPrice = firstKmPrice; // Initial price for the first km
        const additionalPricePerHalfKm = next_half_km_price; // Additional price for each 0.5 km beyond the first km

        // Calculate shipping price
        let shippingPrice = initialPrice; // Initialize with the initial price

        // Calculate additional price for each 0.5 km beyond the first kilometer
        const additionalDistance = Math.max(distanceInKm - 1, 0); // Exclude the first kilometer
        const additionalHalfKm = Math.ceil(additionalDistance * 2); // Convert additional km to additional 0.5 km
        const additionalCost = additionalHalfKm * additionalPricePerHalfKm;

        shippingPrice += additionalCost;


        res.status(200).json({
            message: 'Shipping price calculated successfully',
            distance: parseFloat(distanceInKm),
            shippingPrice: parseFloat(shippingPrice)
        });
    } catch (error) {
        console.error('Error calculating shipping price:', error);
        res.status(500).json({ message: 'Failed to calculate shipping price' });
    }
};


module.exports = {
    createOrder,
    orderFeedback,
    acceptOrder,
    verifyOrder,
    declineOrder,
    confirmPickup,
    confirmDelivered,
    completeOrder,
    viewOrderHistory,
    cancelOrder,
    updatePackage,
    deletePackage,
    getOrderPackages,
    getOrderById,
    orderFeedback,
    getOrdersByUser,
    calculateShippingPrice,
    startShipping,
};