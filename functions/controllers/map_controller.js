const Route = require('../models/route_model');
const {  getDirections } = require('../services/mapbox');
const Account = require('../models/account_model');

const createRoute = async (req, res) => {
    try {
        const { startCoords, endCoords, waypoints } = req.body;


        // Ensure startCoords and endCoords are provided
        if (!startCoords || !endCoords) {
            return res.status(400).json({ message: 'Start and end coordinates are required' });
        }

        // Get directions between start and end coordinates
        const routeData = await getDirections(startCoords, endCoords, waypoints);


        res.status(200).json({ message: 'Route created successfully', route: routeData });
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({ message: 'Failed to create route', error: error.message });
    }
};

const saveRoute = async (req, res) => {
    try {
        const { 
            shipper_id, 
            route_name, 
            isActive, 
            route_direction, 
            start_location, 
            start_coordinates, 
            end_location, 
            end_coordinates, 
            isVirtual, 
            distance, 
            duration, 
            geometry 
        } = req.body;

        // Verify required fields
        if (!shipper_id || !route_name || !route_direction || !start_location || !start_coordinates || !end_location || !end_coordinates || !distance || !duration || !geometry) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const shipper = await Account.findOne({ account_id: shipper_id });

        if (!shipper || !shipper.shipper) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Convert start and end coordinates to appropriate format
        const start_coords = typeof start_coordinates.coordinates === 'string' ? start_coordinates.coordinates.split(',').map(Number) : start_coordinates.coordinates;
        const end_coords = typeof end_coordinates.coordinates === 'string' ? end_coordinates.coordinates.split(',').map(Number) : end_coordinates.coordinates;

        // Save route data to the database
        const newRoute = new Route({
            shipper_id,
            route_name,
            isActive,
            route_direction,
            start_location,
            start_coordinates: {
                type: "Point",
                coordinates: start_coords
            },
            end_location,
            end_coordinates: {
                type: "Point",
                coordinates: end_coords
            },
            isVirtual: isVirtual || false,
            distance,
            duration,
            geometry: geometry
        });


        await newRoute.save();

        shipper.shipper.routes.push(newRoute._id);
        await shipper.save();

        res.status(201).json({ message: 'Route created and added to shipper successfully', route: newRoute });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create route', error: error.message });
    }
};

const getShipperRoutes = async (req, res) => {
    try {
        const { shipper_id } = req.params;

        const shipperAccount = await Account.findOne({ account_id: shipper_id }).populate('shipper.routes');
        if (!shipperAccount) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        if (!shipperAccount.shipper.routes || shipperAccount.shipper.routes.length === 0) {
            return res.status(404).json({ message: 'Shipper does not have any saved routes' });
        }

        const routes = shipperAccount.shipper.routes;


        res.status(200).json({ message: 'Routes retrieved successfully', routes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve shipper routes', error: error.message });
    }
};

const getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.status(200).json({ message: 'Route retrieved successfully', route });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve route', error: error.message });
    }
};

const updateRouteById = async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        console.log(route);
        res.status(200).json({ message: 'Route updated successfully', route });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update route', error: error.message });
    }
};

const deleteRouteById = async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        
        // Remove the route ID from the Shipper's route list
        const shipper = await Account.findOne({ 'shipper.routes': req.params.id });
        if (shipper) {
            shipper.shipper.routes.pull(req.params.id);
            await shipper.save();
        }

        res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete route', error: error.message });
    }
};

module.exports = {
    createRoute,
    saveRoute,
    getShipperRoutes,
    getRouteById,
    updateRouteById,
    deleteRouteById
};
