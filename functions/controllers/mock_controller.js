const { faker } = require('@faker-js/faker/locale/vi');

const Account = require('../models/account_model');
const Order = require('../models/order_model');
const { generateAccountID, generateOrderID } = require('../utils/generate_id');

// Function to generate random coordinates within Hanoi
const getRandomHanoiCoordinates = () => {
    const latMin = 20.995; // approximate southern latitude of Hanoi
    const latMax = 21.035; // approximate northern latitude of Hanoi
    const longMin = 105.795; // approximate western longitude of Hanoi
    const longMax = 105.845; // approximate eastern longitude of Hanoi

    const latitude = Math.random() * (latMax - latMin) + latMin;
    const longitude = Math.random() * (longMax - longMin) + longMin;

    return [longitude, latitude];
};

// Function to generate mock accounts
const generateMockAccounts = async (req, res) => {
    const { numberOfAccounts } = req.body;
    const accounts = [];

    try {
        for (let i = 0; i < numberOfAccounts; i++) {
            const username = faker.internet.userName();
            const password = faker.internet.password();
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const phoneNumber = '+8412312312312';

            const account = new Account({
                account_id: `MOCK-${ await generateAccountID()}`,
                username: username,
                password: password,
                created_at: faker.date.past(),
                user: {
                    user_id: `MOCK-${ await generateAccountID()}`,
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    order_history: [],
                    notifications: []
                },
                wallet: {
                    user_id: `MOCK-${ await generateAccountID()}`,
                    balance: 500000,
                    transaction_history: []
                }
            });
            const savedAccount = await account.save();
            accounts.push(savedAccount);
        }

        res.status(200).json({
            message: `Generated ${numberOfAccounts} mock accounts successfully`,
            data: accounts
        });
    } catch (error) {
        console.error('Error generating mock accounts:', error);
        res.status(500).json({ message: 'Failed to generate mock accounts' });
    }
};

// Function to generate mock orders
const generateMockOrders = async (req, res) => {
    const { numberOfOrders } = req.body;
    const orders = [];

    try {
        // Fetch all mock accounts to use their IDs for the orders
        const mockAccounts = await Account.find({ account_id: /^MOCK-/ });
        if (mockAccounts.length === 0) {
            return res.status(400).json({ message: 'No mock accounts found to associate with orders' });
        }

        for (let i = 0; i < numberOfOrders; i++) {
            const randomAccount = mockAccounts[Math.floor(Math.random() * mockAccounts.length)];
            const senderId = randomAccount.account_id;
            const receiverName = faker.person.firstName();
            const receiverPhone = '+8412312312';
            const sendAddress = faker.address.streetAddress();
            const deliveryAddress = faker.address.streetAddress();

            const sendCoordinates = getRandomHanoiCoordinates();
            const deliveryCoordinates = getRandomHanoiCoordinates();

            const order = new Order({
                order_id: `MOCK-${ await generateOrderID()}`,
                sender_id: senderId,
                receiver_name: receiverName,
                receiver_phone: receiverPhone,
                send_address: sendAddress,
                delivery_address: deliveryAddress,
                status: 'waiting',
                create_time: faker.date.past(),
                order_lasting_time: faker.date.future(),
                shipper_route_id: null,
                order_geometry: [],
                distance: 0,
                packages: [],
                sender_paid: 0,
                shipping_price: 0,
                send_coordinates: { type: 'Point', coordinates: sendCoordinates },
                delivery_coordinates: { type: 'Point', coordinates: deliveryCoordinates },
                preferred_pickup_start_time: faker.date.future(),
                preferred_pickup_end_time: faker.date.future(),
                preferred_delivery_start_time: faker.date.future(),
                preferred_delivery_end_time: faker.date.future(),
                status_change_time: faker.date.recent(),
                feedback: {
                    rating: 5,
                    comment: '',
                    create_time: faker.date.past()
                }
            });
            const savedOrder = await order.save();
            orders.push(savedOrder);
        }

        res.status(200).json({
            message: `Generated ${numberOfOrders} mock orders successfully`,
            data: orders
        });
    } catch (error) {
        console.error('Error generating mock orders:', error);
        res.status(500).json({ message: 'Failed to generate mock orders' });
    }
};

// Function to delete all mock accounts
const deleteAllMockAccounts = async (req, res) => {
    try {
        const result = await Account.deleteMany({ account_id: /^MOCK-/ });
        res.status(200).json({
            message: `Deleted ${result.deletedCount} mock accounts successfully`
        });
    } catch (error) {
        console.error('Error deleting mock accounts:', error);
        res.status(500).json({ message: 'Failed to delete mock accounts' });
    }
};

// Function to delete all mock orders
const deleteAllMockOrders = async (req, res) => {
    try {
        const result = await Order.deleteMany({ order_id: /^MOCK-/ });
        res.status(200).json({
            message: `Deleted ${result.deletedCount} mock orders successfully`
        });
    } catch (error) {
        console.error('Error deleting mock orders:', error);
        res.status(500).json({ message: 'Failed to delete mock orders' });
    }
};

module.exports = {
    generateMockAccounts,
    generateMockOrders,
    deleteAllMockAccounts,
    deleteAllMockOrders
};
