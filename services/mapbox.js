const axios = require('axios');
const polyline = require('polyline');
const config = require('../secret_config');

const GOONG_TOKEN = config.goongToken.goongToken;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const getDirections = async (origin, destination, waypoints = []) => {
    try {

        // Format origin and destination as comma-separated strings
        const originString = `${origin.lat},${origin.lng}`;
        const destinationString = `${destination.lat},${destination.lng}`;


        // Construct the URL with origin, waypoints, destination, and API key
        let url = `https://rsapi.goong.io/Direction?origin=${originString}&destination=`;

        // Add waypoints to the URL if there are any
        if (waypoints.length > 0) {
            const waypointCoords = waypoints.map(waypoint => `${waypoint.lat},${waypoint.lng}`).join(';');
            url += `${waypointCoords}`;
        }

        if (waypoints.length > 0) {
            // Add the final destination to the URL with ";" if have waypoints
            url += `;${destinationString}`;
        } else {
            url += `${destinationString}`;
        }
       

        // Add vehicle type and API key
        url += `&vehicle=bike&api_key=${GOONG_TOKEN}`;

        console.log(url);

        await delay(200);

        // Send a GET request to the Goong Directions API
        const response = await axios.get(url);

        // Check if the response contains route data
        if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];

            // Extract total distance and duration from all legs
            let distance = 0;
            let duration = 0;

            route.legs.forEach(leg => {
                distance += leg.distance.value;
                duration += leg.duration.value;
            });


            // Extract geometry points from the overview polyline
            const geometry = polyline.decode(route.overview_polyline.points);


            // Return the route data including distance, duration, and geometry
            return {
                distance,
                duration,
                geometry
            };
        } else {
           console.log('Failed to retrieve route data');
        }
        
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    getDirections
};
