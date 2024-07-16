// order_scheduler.js

const cron = require('node-cron');
const Order = require('../models/order_model');
const { cancelOrder } = require('../controllers/order_controller');

async function startOrderCancellationScheduler() {
    // Schedule a task to run every minute to cancel orders
    cron.schedule('* * * * *', async () => {
      console.log('Running order cancellation job...');
  
      try {
        const now = new Date();
  
        // Find all orders where order_lasting_time is less than or equal to the current time and status is not already cancelled
        const ordersToCancel = await Order.find({
          order_lasting_time: { $lte: now },
          status: { $nin: ['shipper_accepted', 'start_shipping', 'cancelled', 'shipper_picked_up', 'delivered', 'completed'] }
        });
  
        for (const order of ordersToCancel) {
          // Call the cancelOrder function
          // Mock response object to prevent "TypeError: Cannot read properties of undefined"
          const dummyResponse = {
            status: () => dummyResponse,
            json: () => dummyResponse
          };
  
          await cancelOrder({ params: { id: order._id } }, dummyResponse);
        }
      } catch (error) {
        console.error('Error cancelling orders:', error);
      }
    });
  }

module.exports = { startOrderCancellationScheduler };
