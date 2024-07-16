const Account = require('../models/account_model');
const Role = require('../models/role_model');
const bcrypt = require('bcrypt');
const { hashPassword } = require('../utils/hash');


// Create a new role
const createRole = async (req, res) => {
    try {
        const { rolename } = req.body;

        // Check if role already exists
        const existingRole = await Role.findOne({ rolename });
        if (existingRole) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const newRole = new Role({ rolename });
        await newRole.save();

        res.status(201).json({ message: 'Role created successfully', role: newRole });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create role', error: error.message });
    }
};

// Get all roles
const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json({ message: 'Roles retrieved successfully', roles });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve roles', error: error.message });
    }
};

// Delete role by rolename
const deleteRoleByRolename = async (req, res) => {
    try {
        const { rolename } = req.params;

        const role = await Role.findOneAndDelete({ rolename });
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete role', error: error.message });
    }
};

// Set role for a user by user_id
const setUserRoleByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const { rolename } = req.body;

        const account = await Account.findOne({account_id: id});

        if (!account) {
            return res.status(404).json({ message: 'User not found' });
        }

        account.rolename = rolename;
        await account.save();

        // Check if the rolename is 'shipper' and create a Shipper document if true
        if (rolename === 'shipper' && !account.shipper) {
            const newShipper = {
                shipper_id: id,
                shipped_orders: [],
                routes: [],
                current_orders: [],
                max_distance_allowance: 2
            };

            account.shipper = newShipper;
            await account.save();
        }

        res.status(200).json({ message: 'User role updated successfully', account });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user role', error: error.message });
    }
};

module.exports = {
    createRole,
    getAllRoles,
    deleteRoleByRolename,
    setUserRoleByUserId
};
