const Account = require('../models/account_model');
const Settings = require('../models/settings_model');
const Order = require('../models/order_model');
const Route = require('../models/route_model');
const {  getDirections } = require('../services/mapbox');

const getOrders = async (req, res) => {
    try {
        // Find the shipper by shipper_id
        const shipperAccount = await Account.findOne({ 'shipper.shipper_id': req.params.id });
        
        if (!shipperAccount) { // Corrected: Change `!shipper` to `!shipperAccount`
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Extract the order IDs from current_orders array
        const orderIds = shipperAccount.shipper.current_orders;

        if(orderIds && orderIds.length > 0) {
            // Find orders from Order schema based on the extracted order IDs
            const currentOrders = await Order.find({ order_id: { $in: orderIds } });
            
            return res.status(200).json({ message: 'Current orders retrieved successfully', currentOrders });
        } else {
            // If current_orders array is empty or null, return an empty array
            return res.status(200).json({ message: 'No current orders found', currentOrders: [] });
        }
        
    } catch (error) {
        console.error('Error retrieving current orders:', error);
        return res.status(500).json({ message: 'Failed to retrieve current orders', error: error.message });
    }
}

const getShippingOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.query; // Get the status from query params

        // Validate that the status parameter is provided
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        // Find orders by status
        const orders = await Order.find({ status });

        // Check if orders are found
        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found with the given status' });
        }

        res.status(200).json({ message: 'Orders retrieved successfully', orders });
    } catch (error) {
        console.error('Error retrieving orders by status:', error);
        res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
    }
};





// Update a shipper's max_distance_allowance
const updateShipperMaxDistance = async (req, res) => {
    try {
      const { max_distance_allowance } = req.body;
      
      const shipper = await Account.findOneAndUpdate(
        { 'shipper.shipper_id': req.params.id }, 
        { 'shipper.max_distance_allowance': max_distance_allowance },
        { new: true }
      );
  
      if (!shipper) {
        return res.status(404).json({ message: 'Shipper not found' });
      }
  
      res.status(200).json({ message: 'Shipper max_distance_allowance updated successfully', shipper });
    } catch (error) {
      console.error('Error updating shipper max_distance_allowance:', error);
      res.status(500).json({ message: 'Failed to update shipper max_distance_allowance' });
    }
};

const recommendOrderForShipper = async (req, res) => {
    const { shipper_id, max_distance_allowance } = req.body;

    try {
        // Verify Shipper
        const shipper = await Account.findOne({ 'shipper.shipper_id': shipper_id });
        if (!shipper) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Fetch settings
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        const current_order_limit = settings.settings.find(item => item.key === 'current_order_limit').value;
        if (shipper.shipper.current_orders.length >= current_order_limit) {
            
            return res.status(404).json({ message: 'Current Order Limited' });
        }

        const recommend_order_limit = settings.settings.find(item => item.key === 'recommend_order_limit').value;

        let maxDistanceAllowance = shipper.shipper.max_distance_allowance ;

        // Find all active routes of the shipper
        const activeRoutes = await Route.find({ shipper_id: shipper_id, isActive: true });

        if (activeRoutes.length === 0) {
            return res.status(404).json({ message: 'No active routes found for this shipper' });
        }

        // Calculate Distances and Check Max Allowance
        const recommendedOrders = [];

        for (const currentRoute of activeRoutes) {
            // Determine route origin and destination based on route direction
            let origin, destination;
            let directionsToCheck = [];

            if (currentRoute.route_direction === 'start_to_end') {
                origin = currentRoute.start_coordinates;
                destination = currentRoute.end_coordinates;
                directionsToCheck.push({ origin, destination });
            } else if (currentRoute.route_direction === 'end_to_start') {
                origin = currentRoute.end_coordinates;
                destination = currentRoute.start_coordinates;
                directionsToCheck.push({ origin, destination });
            } else if (currentRoute.route_direction === 'two_way') {
                directionsToCheck.push(
                    { origin: currentRoute.start_coordinates, destination: currentRoute.end_coordinates },
                    { origin: currentRoute.end_coordinates, destination: currentRoute.start_coordinates }
                );
            } else {
                continue; // Skip if route direction is unknown
            }

            

            for (const { origin, destination } of directionsToCheck) {
                let routeOrigin = {
                    lat: origin.coordinates[1],
                    lng: origin.coordinates[0]
                };

                let routeDestination = {
                    lat: destination.coordinates[1],
                    lng: destination.coordinates[0]
                };

                // Calculate buffer for bounding box based on max_distance_allowance (assuming max_distance_allowance is in kilometers)
                // Convert max distance allowance from km to degrees for both latitude and longitude
                const bufferLat = max_distance_allowance * 2.5 / 111.12; // Latitude buffer in degrees
                const bufferLng = (max_distance_allowance * 2.5) / (111.12 * Math.cos(Math.min(routeOrigin.lat, routeDestination.lat) * (Math.PI / 180))); // Longitude buffer adjusted for latitude

                // Determine the bounding box extents
                const minLat = Math.min(routeOrigin.lat, routeDestination.lat) - bufferLat;
                const maxLat = Math.max(routeOrigin.lat, routeDestination.lat) + bufferLat;
                const minLng = Math.min(routeOrigin.lng, routeDestination.lng) - bufferLng;
                const maxLng = Math.max(routeOrigin.lng, routeDestination.lng) + bufferLng;

                // Create the bounding box polygon
                const boundingBox = {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [minLng, maxLat], // Northwest
                            [maxLng, maxLat], // Northeast
                            [maxLng, minLat], // Southeast
                            [minLng, minLat], // Southwest
                            [minLng, maxLat]  // Northwest (closing the loop)
                        ]
                    ]
                };

                // Find Nearby Orders using Expanded Bounding Box with status "verified"
                const nearbyOrders = await Order.find({
                    $and: [
                        {
                            send_coordinates: {
                                $geoWithin: {
                                    $geometry: boundingBox
                                }
                            }
                        },
                        {
                            delivery_coordinates: {
                                $geoWithin: {
                                    $geometry: boundingBox
                                }
                            }
                        },
                        {
                            status: 'verified'
                        }
                    ]
                });

                
                const shipperRouteDistance = currentRoute.distance;

                for (const order of nearbyOrders) {
     
                    if(recommendedOrders.length >= recommend_order_limit) {
                        break;
                    }
                    const orderSendCoordinates = {
                        lat: order.send_coordinates.coordinates[1],
                        lng: order.send_coordinates.coordinates[0]
                    };
                    const orderDeliveryCoordinates = {
                        lat: order.delivery_coordinates.coordinates[1],
                        lng: order.delivery_coordinates.coordinates[0]
                    };
                    const orderCoordinates = [orderSendCoordinates, orderDeliveryCoordinates];

                    // Check if order already exists in recommendedOrders
                    const existingOrderIndex = recommendedOrders.findIndex(item => item.order.order_id === order.order_id);
            
                    try {

                        // Get order's route distance from Goong API
                        const { distance, geometry } = await getDirections(routeOrigin, routeDestination, orderCoordinates);

                        // Initialize fields if they are not already initialized in the order object
                        if (!order.distance) {
                            order.distance = distance || null;
                        }
                
                        if (!order.shipper_route_id) {
                            order.shipper_route_id = currentRoute._id || null;
                        }
                
                        if (!order.order_geometry) {
                            order.order_geometry = geometry || null;
                        }

                        console.log(order.order_id);
                        console.log(distance);

                        // Calculate total combined distance, min is 0
                        const totalCombinedDistance = Math.max(0.0, (distance - shipperRouteDistance) / 1000);
                       console.log(totalCombinedDistance);
                       console.log(maxDistanceAllowance);
                        if (existingOrderIndex !== -1) {
                            // Order already exists in recommendedOrders, update variables
                            if (totalCombinedDistance < recommendedOrders[existingOrderIndex].distance && totalCombinedDistance < maxDistanceAllowance) {
                                // Update order details with more efficient route
                                recommendedOrders[existingOrderIndex].distance = totalCombinedDistance;
                                recommendedOrders[existingOrderIndex].orderRouteId = currentRoute._id;
                                recommendedOrders[existingOrderIndex].orderGeometry = geometry;
                            }
                        } else if (totalCombinedDistance < maxDistanceAllowance) {
                            // If order doesn't exist, add it to recommendedOrders
                            recommendedOrders.push({
                                order,
                                distance: totalCombinedDistance,
                                orderRouteId: currentRoute._id,
                                orderGeometry: geometry
                            });
                        }
                    } catch (error) {
                        console.error(`Error calculating distance for order ${order._id}:`, error);
                    }
                }
            }
        }

        res.status(200).json({ message: 'Recommended orders retrieved successfully', recommendedOrders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to recommend orders', error: error.message });
    }
};







module.exports = { getOrders, getShippingOrdersByStatus, updateShipperMaxDistance, recommendOrderForShipper };
